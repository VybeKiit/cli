import {
  angularSafeFill,
  pacedDispatchClick,
  resolvePaceMs,
} from '@vybekiit/browser-automation/core/pace';
import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { mergeOAuthUris } from '@vybekiit/browser-automation/domains/google/oauthUris';
import type { Locator, Page } from 'playwright';

/** Selectors that prove the Auth Platform client form has painted. */
const FORM_FIELD_SELECTOR =
  'input[formcontrolname="displayName"], input[formcontrolname="uri"], input[formcontrolname="typeControl"]';

/**
 * Wait for the Google Auth Platform client form; hard-reload if main stays empty.
 *
 * The redesigned Console often leaves `main` blank for several seconds. If fields are
 * still missing after a static window, reload up to `maxReloads` times.
 *
 * @param page - Playwright page on a client create/edit URL.
 * @param options - Reload budget and static empty threshold.
 * @returns The same page once form fields are visible.
 * @example
 * await waitForAuthPlatformForm(page);
 */
export const waitForAuthPlatformForm = async (
  page: Page,
  options?: {
    readonly maxReloads?: number;
    readonly staticMs?: number;
    readonly fieldTimeoutMs?: number;
  },
): Promise<Page> => {
  const maxReloads = options?.maxReloads === undefined ? 3 : options.maxReloads;
  const staticMs = options?.staticMs === undefined ? 3000 : options.staticMs;
  const fieldTimeoutMs = options?.fieldTimeoutMs === undefined ? 12_000 : options.fieldTimeoutMs;

  for (let attempt = 0; attempt <= maxReloads; attempt++) {
    const field = page.locator(FORM_FIELD_SELECTOR).first();
    const visible = await field
      .waitFor({ state: 'visible', timeout: fieldTimeoutMs })
      .then(() => true)
      .catch(() => false);
    if (visible) return page;

    if (attempt >= maxReloads) break;

    const mainText = await page
      .locator('main')
      .innerText()
      .catch(() => '');
    const bodyText = await page
      .locator('body')
      .innerText()
      .catch(() => '');
    const looksEmpty = mainText.trim().length < 40 && bodyText.trim().length < 200;
    // Always reload once fields missed — empty main is the common case; also recovers stuck shells.
    if (looksEmpty || attempt < maxReloads) {
      await page.waitForTimeout(staticMs);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(resolvePaceMs());
    }
  }

  throw new Error(
    'Google Auth Platform client form did not load (no name/URI fields). Retry — if the Console stays blank, hard-reload the tab and re-run google oauth.',
  );
};

/**
 * Scope to one of the two URI stacks (JS origins vs redirect URIs).
 *
 * Both sections render `input[formcontrolname="uri"]`; without a container scope,
 * callback paths get written into origins (which reject paths).
 *
 * @param page - Playwright page.
 * @param kind - Which URI section to target.
 * @returns Locator for the section container (falls back to body).
 */
export const uriSection = (page: Page, kind: 'origins' | 'redirects'): Locator => {
  if (kind === 'origins') {
    const section = page
      .locator('.cfc-form-stack-container, [class*="form-stack"], section, div')
      .filter({ hasText: /javascript origins|authori[sz]ed javascript origins/i })
      .filter({ hasNot: page.locator('text=/redirect uris/i') })
      .first();
    return section;
  }
  return page
    .locator('.cfc-form-stack-container, [class*="form-stack"], section, div')
    .filter({ hasText: /redirect uris|authori[sz]ed redirect uris/i })
    .filter({ hasNot: page.locator('text=/javascript origins/i') })
    .first();
};

/**
 * Resolve a writable scope for URI inputs (section when present, else page).
 *
 * @param page - Playwright page.
 * @param kind - URI section kind.
 * @returns Scope locator used for Add URI + inputs.
 */
const resolveUriScope = async (page: Page, kind: 'origins' | 'redirects'): Promise<Locator> => {
  const section = uriSection(page, kind);
  if ((await section.count()) > 0) return section;
  return page.locator('body');
};

/**
 * Read non-empty values from URI inputs inside a scope.
 *
 * @param scope - Section or body locator.
 * @returns Current non-empty URI strings.
 */
const readUriInputs = async (scope: Locator): Promise<string[]> => {
  const inputs = scope.locator('input[formcontrolname="uri"]');
  const count = await inputs.count();
  const values: string[] = [];
  for (let i = 0; i < count; i++) {
    const value = (
      await inputs
        .nth(i)
        .inputValue()
        .catch(() => '')
    ).trim();
    if (value.length > 0) values.push(value);
  }
  return values;
};

/**
 * Ensure at least `needed` URI input rows exist via "Add URI".
 *
 * @param scope - Section scope.
 * @param needed - Desired row count.
 */
const ensureUriRows = async (scope: Locator, needed: number): Promise<void> => {
  const addUri = scope.getByRole('button', { name: /add uri/i }).first();
  for (let guard = 0; guard < needed + 4; guard++) {
    const count = await scope.locator('input[formcontrolname="uri"]').count();
    if (count >= needed) return;
    if ((await addUri.count()) === 0) return;
    await pacedDispatchClick(addUri);
  }
};

/**
 * Remove trailing empty URI rows so Save is not blocked by "review invalid fields".
 *
 * @param scope - Section scope.
 * @param keepCount - Number of filled rows to preserve from the start.
 */
const clearExtraEmptyUriRows = async (scope: Locator, keepCount: number): Promise<void> => {
  for (let guard = 0; guard < 12; guard++) {
    const inputs = scope.locator('input[formcontrolname="uri"]');
    const count = await inputs.count();
    if (count <= keepCount) return;

    let removed = false;
    for (let i = count - 1; i >= keepCount; i--) {
      const value = (
        await inputs
          .nth(i)
          .inputValue()
          .catch(() => '')
      ).trim();
      if (value.length > 0) continue;
      const row = inputs.nth(i).locator('xpath=ancestor::*[.//button][1]');
      const remove = row.getByRole('button', { name: /delete|remove|clear/i }).first();
      if ((await remove.count()) > 0) {
        await pacedDispatchClick(remove);
        removed = true;
        break;
      }
    }
    if (!removed) {
      // Clear leftover empties by writing a placeholder then removing is unreliable —
      // leave filled rows only; empty trailing without remove control is a soft warn.
      return;
    }
  }
};

/**
 * Idempotently fill a URI section (merge existing + desired, Angular-safe write).
 *
 * @param page - Playwright page.
 * @param kind - Origins or redirects stack.
 * @param desired - URIs the agent wants registered.
 * @param log - Verb logger.
 * @returns The merged list actually written to the form.
 */
export const fillUriSection = async (
  page: Page,
  kind: 'origins' | 'redirects',
  desired: readonly string[],
  log: Pick<VerbLogger, 'log' | 'warn'> = { log: () => {}, warn: () => {} },
): Promise<string[]> => {
  if (desired.length === 0) return [];

  const scope = await resolveUriScope(page, kind);
  const existing = await readUriInputs(scope);
  const merged = mergeOAuthUris(existing, desired);

  await ensureUriRows(scope, merged.length);

  const inputs = scope.locator('input[formcontrolname="uri"]');
  const count = await inputs.count();
  if (count < merged.length) {
    log.warn(
      `[google] only ${count} ${kind} field(s) for ${merged.length} URI(s) — add the rest manually if needed`,
    );
  }

  for (let i = 0; i < merged.length && i < count; i++) {
    const uri = merged[i]!;
    await angularSafeFill(inputs.nth(i), uri);
  }

  await clearExtraEmptyUriRows(scope, Math.min(merged.length, count));

  // Re-read to confirm what the form holds (filled prefix).
  const applied = (await readUriInputs(scope)).slice(0, merged.length);
  log.log(`[google] ${kind} applied: ${applied.join(', ') || '(none)'}`);
  return applied.length > 0 ? applied : merged.slice(0, count);
};

/**
 * Fill Authorized JavaScript origins (idempotent merge).
 *
 * @param page - Playwright page.
 * @param origins - Origins to register.
 * @param log - Verb logger.
 * @returns Origins written to the form.
 */
export const fillJsOrigins = async (
  page: Page,
  origins: readonly string[],
  log: Pick<VerbLogger, 'log' | 'warn'> = { log: () => {}, warn: () => {} },
): Promise<string[]> => fillUriSection(page, 'origins', origins, log);

/**
 * Fill Authorized redirect URIs (idempotent merge).
 *
 * @param page - Playwright page.
 * @param redirects - Redirect URIs to register.
 * @param log - Verb logger.
 * @returns Redirects written to the form.
 */
export const fillRedirectUris = async (
  page: Page,
  redirects: readonly string[],
  log: Pick<VerbLogger, 'log' | 'warn'> = { log: () => {}, warn: () => {} },
): Promise<string[]> => fillUriSection(page, 'redirects', redirects, log);

/**
 * Click Save on the client form when enabled; refuse if empty required URI inputs remain.
 *
 * @param page - Playwright page.
 * @param log - Verb logger.
 */
export const saveAuthPlatformClientForm = async (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'> = { log: () => {}, warn: () => {} },
): Promise<void> => {
  // Empty required URI rows leave Save disabled with "review invalid fields".
  const allUriInputs = page.locator('input[formcontrolname="uri"]');
  const uriCount = await allUriInputs.count();
  for (let i = 0; i < uriCount; i++) {
    const value = (
      await allUriInputs
        .nth(i)
        .inputValue()
        .catch(() => '')
    ).trim();
    if (value.length === 0) {
      log.warn(`[google] empty URI row at index ${i} — attempting clear before save`);
    }
  }

  const save = page.getByRole('button', { name: /^save$/i }).first();
  if ((await save.count()) === 0) {
    throw new Error(
      'Could not find the "Save" button on the OAuth client form — finish the form manually and re-run.',
    );
  }

  const disabled = await save.isDisabled().catch(() => false);
  if (disabled) {
    throw new Error(
      'OAuth client Save is disabled (review invalid fields). Check empty URI rows and re-run google oauth.',
    );
  }

  await pacedDispatchClick(save);
  await page.waitForTimeout(resolvePaceMs());
  log.log('[google] client form saved');
};
