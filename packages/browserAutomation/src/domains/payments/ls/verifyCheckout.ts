import type { Locator, Page } from 'playwright';
import { createWebhookViaApi, deleteWebhookViaApi } from './api/provision';

/** Standard Stripe/Lemon Squeezy test card — only valid in TEST mode, never a real charge. */
const DEFAULT_TEST_CARD = { number: '4242 4242 4242 4242', expiry: '12 / 34', cvc: '123' } as const;

/** Default US billing used to satisfy the hosted checkout's required address fields. */
const DEFAULT_BILLING = {
  name: 'Test Buyer',
  addressLine1: '548 Market St',
  city: 'San Francisco',
  state: 'California',
  zip: '94104',
} as const;

/** Inputs for a money-pipeline UI verification. */
export type MoneyPipelineCheck = {
  /** The buyer app's checkout page, e.g. `http://localhost:3010/checkout`. */
  readonly checkoutUrl: string;
  /** GitHub username field (the kit gate key). */
  readonly githubUsername?: string;
  /** Buyer email. */
  readonly email?: string;
  /** Overrides the built-in test card. */
  readonly testCard?: { number: string; expiry: string; cvc: string };
  /** Overrides the built-in billing address. */
  readonly billing?: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
  };
};

/** How far the flow got, and whether it confirmed. */
export type MoneyPipelineResult = {
  readonly ok: boolean;
  readonly stage: 'form' | 'hosted-checkout' | 'payment' | 'confirmed';
  readonly message: string;
};

/**
 * Fail-closed test-mode assertion: read `meta.test_mode` from Lemon Squeezy's
 * `/v1/users/me` (the same signal fresh-squeezy uses) so a verifier never fake-charges
 * a LIVE store.
 *
 * @param apiKey - Lemon Squeezy API key from the buyer's environment.
 * @returns Whether the key is in test mode, with a human-readable reason.
 * @example
 * const { testMode } = await assertLemonSqueezyTestMode(process.env.LEMONSQUEEZY_API_KEY ?? '');
 */
export const assertLemonSqueezyTestMode = async (
  apiKey: string,
): Promise<{ testMode: boolean; message: string }> => {
  const res = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.api+json' },
  });
  const json = (await res.json()) as { meta?: { test_mode?: boolean } };
  const testMode = json.meta?.test_mode === true;
  return {
    testMode,
    message: testMode
      ? 'Lemon Squeezy key is in TEST mode — safe to run the fake purchase.'
      : 'Lemon Squeezy key is LIVE — refusing to run (a real card would be charged).',
  };
};

/** Whether the webhook leg of the money pipeline can be provisioned. */
export type WebhookCheckResult = { readonly ok: boolean; readonly message: string };

/**
 * Prove the money pipeline's webhook leg works by creating a Lemon Squeezy webhook and
 * immediately deleting it (a non-destructive smoke test). Without a webhook, a paid order
 * never reaches the buyer's `/api/webhook`, so fulfillment/invite never fires — the exact
 * gap that leaves a vibe coder stuck after a successful payment.
 *
 * @param params - API key, store id, target webhook URL, and optional event list.
 * @returns Whether webhook creation succeeded, with a message.
 * @example
 * const r = await verifyWebhookCreation({ apiKey, storeId: '270009', url: 'https://app.example/api/webhook' });
 */
export const verifyWebhookCreation = async (params: {
  readonly apiKey: string;
  readonly storeId: string;
  readonly url: string;
  readonly events?: readonly string[];
}): Promise<WebhookCheckResult> => {
  let webhookId: string | undefined;
  try {
    const created = await createWebhookViaApi({
      apiKey: params.apiKey,
      storeId: params.storeId,
      url: params.url,
      events: params.events ?? ['order_created', 'order_refunded'],
      testMode: true,
    });
    webhookId = created.id;
    return {
      ok: true,
      message: `Webhook creation works — LS accepted a webhook for ${created.url} (order_created + order_refunded); cleaned up.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Webhook creation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    if (webhookId !== undefined) {
      await deleteWebhookViaApi(params.apiKey, webhookId).catch(() => undefined);
    }
  }
};

/**
 * Fill the first locator that resolves.
 *
 * @param locFns - Ordered locator factories to try (main page, then iframes, etc.).
 * @param value - Value to fill.
 * @returns Whether any locator accepted the value.
 */
const fillFirst = async (locFns: ReadonlyArray<() => Locator>, value: string): Promise<boolean> => {
  for (const make of locFns) {
    try {
      await make().fill(value, { timeout: 3500 });
      return true;
    } catch {
      // try the next candidate
    }
  }
  return false;
};

/**
 * Select a US state in Lemon Squeezy's hosted checkout, which renders a `vue-select`
 * combobox (`#state input.vs__search`) whose options load asynchronously.
 *
 * @param page - Playwright page on the hosted checkout.
 * @param state - State name, e.g. "California".
 */
const selectHostedCheckoutState = async (page: Page, state: string): Promise<void> => {
  const input = page.locator('#state input.vs__search').first();
  if ((await input.count()) === 0) {
    return; // not every hosted checkout requires a state
  }
  await input.click({ timeout: 6000 }).catch(() => undefined);
  // vue-select shows "Loading..." first — wait for real options before filtering.
  await page
    .locator('#state li.vs__dropdown-option')
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => undefined);
  await input.fill('').catch(() => undefined);
  await input.type(state, { delay: 70 });
  const option = page
    .locator('#state li.vs__dropdown-option', { hasText: new RegExp(state, 'i') })
    .first();
  try {
    await option.waitFor({ state: 'visible', timeout: 8000 });
    await option.click({ timeout: 3000 });
  } catch {
    await input.press('Enter').catch(() => undefined);
  }
  await page.waitForTimeout(1200);
};

/**
 * Drive a buyer's checkout end to end with real UI automation and assert the order
 * completes — a generic money-pipeline smoke test a vibe coder can run to prove their
 * kit takes payments. Fills the kit's GitHub/email form, follows the redirect to the
 * Lemon Squeezy hosted checkout, enters the test card + billing, pays, and verifies the
 * "order complete" confirmation. **Test mode only** — guard with
 * {@link assertLemonSqueezyTestMode} first so no real card is charged.
 *
 * Selectors match Lemon Squeezy's 2026-07 hosted checkout (card fields that may be in an
 * iframe, an unlabeled cardholder field, a `vue-select` state picker, a "Pay $…" button).
 *
 * @param page - Playwright page attached to a browser (e.g. via CDP).
 * @param params - Checkout URL and buyer/card/billing details.
 * @returns Whether the pipeline confirmed, the stage reached, and a message.
 * @example
 * const result = await verifyMoneyPipeline(page, { checkoutUrl: 'http://localhost:3010/checkout' });
 */
export const verifyMoneyPipeline = async (
  page: Page,
  params: MoneyPipelineCheck,
): Promise<MoneyPipelineResult> => {
  const card = params.testCard ?? DEFAULT_TEST_CARD;
  const billing = params.billing ?? DEFAULT_BILLING;
  const github = params.githubUsername ?? 'octocat';
  const email = params.email ?? 'money-pipeline-test@example.com';

  // 1. Kit checkout form -> POST /api/checkout -> hosted-checkout redirect.
  await page.goto(params.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('load', { timeout: 20_000 }).catch(() => undefined);

  // Submit the form's own submit button (inside the form that holds #githubUsername), so a nav
  // CTA is never clicked by mistake; fall back to Enter.
  const form = page
    .locator('form')
    .filter({ has: page.locator('#githubUsername') })
    .first();
  const submitForm = async (): Promise<void> => {
    for (const make of [
      () => form.locator('button[type="submit"]').first(),
      () => form.getByRole('button').last(),
    ]) {
      try {
        await make().click({ timeout: 6000 });
        return;
      } catch {
        // try the next candidate
      }
    }
    await page
      .locator('#email')
      .press('Enter')
      .catch(() => undefined);
  };

  // 2. Lemon Squeezy hosted checkout. In dev, the first submit can race React hydration (a
  // native GET reloads the page); retry the fill + submit until the redirect lands.
  let onHostedCheckout = false;
  for (let attempt = 0; attempt < 3 && !onHostedCheckout; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 2500 : 3500);
    await page
      .locator('#githubUsername')
      .fill(github, { timeout: 10_000 })
      .catch(() => undefined);
    await page
      .locator('#email')
      .fill(email, { timeout: 10_000 })
      .catch(() => undefined);
    await submitForm();
    onHostedCheckout = await page
      .waitForURL(/lemonsqueezy\.com/, { timeout: attempt === 2 ? 40_000 : 10_000 })
      .then(() => true)
      .catch(() => false);
  }
  if (!onHostedCheckout) {
    return {
      ok: false,
      stage: 'form',
      message: `No hosted-checkout redirect (still ${page.url()}).`,
    };
  }
  await page.waitForTimeout(6000);

  // 3. Card (fields can be in an iframe), cardholder, billing address.
  const frames = page.frames().filter((frame) => frame !== page.mainFrame());
  await fillFirst(
    [
      () => page.getByPlaceholder(/1234 1234|card number/i),
      ...frames.map((frame) => () => frame.getByPlaceholder(/1234 1234|card number/i)),
    ],
    card.number,
  );
  await fillFirst(
    [
      () => page.getByPlaceholder(/MM ?\/ ?YY/i),
      ...frames.map((frame) => () => frame.getByPlaceholder(/MM ?\/ ?YY/i)),
    ],
    card.expiry,
  );
  await fillFirst(
    [
      () => page.getByPlaceholder(/CVC|security/i),
      ...frames.map((frame) => () => frame.getByPlaceholder(/CVC/i)),
    ],
    card.cvc,
  );
  await fillFirst(
    [() => page.getByPlaceholder(/John More Doe/i), () => page.getByLabel(/cardholder name/i)],
    billing.name,
  );
  await fillFirst([() => page.getByPlaceholder(/address line 1/i)], billing.addressLine1);
  await fillFirst([() => page.getByPlaceholder(/^city$/i)], billing.city);
  await fillFirst([() => page.getByPlaceholder(/^zip$/i)], billing.zip);
  await selectHostedCheckoutState(page, billing.state).catch(() => undefined);

  // 4. Pay. Retry with a forced click — the vue-select menu can transiently cover the button.
  const pay = page.getByRole('button', { name: /pay \$/i }).last();
  await pay.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => undefined);
  let paid = await pay
    .click({ timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!paid) {
    await page.waitForTimeout(1500);
    paid = await pay
      .click({ timeout: 8000, force: true })
      .then(() => true)
      .catch(() => false);
  }
  if (!paid) {
    return {
      ok: false,
      stage: 'hosted-checkout',
      message: 'Filled the checkout but could not click Pay.',
    };
  }

  // 5. Order confirmation.
  try {
    await page.waitForFunction(
      '/thanks for your order|payment was successful|order is complete|your order/i.test(document.body.innerText)',
      undefined,
      { timeout: 60_000 },
    );
  } catch {
    return {
      ok: false,
      stage: 'payment',
      message: `Paid but no order confirmation appeared (url ${page.url()}).`,
    };
  }
  return {
    ok: true,
    stage: 'confirmed',
    message: 'Order confirmed — the money pipeline works end to end (test mode).',
  };
};
