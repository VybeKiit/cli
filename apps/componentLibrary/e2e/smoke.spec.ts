import { expect, test } from '@playwright/test';

const PREVIEW_SAMPLES: Array<{ namespace: string; name: string }> = [
  { namespace: 'bundui', name: 'button-default' },
  { namespace: 'magicui', name: 'magic-card' },
  { namespace: 'kokonutui', name: 'command-button' },
  { namespace: 'aceternity', name: 'background-beams' },
  { namespace: 'ai-elements', name: 'message' },
  { namespace: 'kibo', name: 'announcement' },
  { namespace: 'untitled', name: 'app-store-buttons-outline' },
  { namespace: 'gluestack', name: 'index.web' },
];

const FIXED_SAMPLES: Array<{ namespace: string; name: string }> = [
  { namespace: 'kokonutui', name: 'bento-grid' },
  { namespace: 'kokonutui', name: 'ai-prompt' },
  { namespace: 'bundui', name: 'drawer' },
  { namespace: 'kibo', name: 'glimpse' },
  { namespace: 'aceternity', name: 'layout-grid' },
  { namespace: 'aceternity', name: 'animated-testimonials' },
  { namespace: 'blocks-21st', name: 'be-ui-button' },
  { namespace: 'magicui', name: 'logo-trust-grid' },
];

test('catalog home lists categories sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Component Library' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hero & landing/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Logos & icons/i })).toBeVisible();
});

test('category filter deep link', async ({ page }) => {
  await page.goto('/?category=form');
  await expect(page.getByText(/Showing \d+ of/)).toBeVisible();
  await expect(page.locator('a[href*="/components/"]').first()).toBeVisible();
});

test('grouped sections on All view', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Hero & landing/i })).toBeVisible();
});

test('pagination bar appears when infinite scroll is off', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('vybekiit-ui-library-infinite-scroll', 'false');
  });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Catalog pagination' })).toBeVisible();
  await expect(page.getByText(/Page 1 \/ \d+/)).toBeVisible();
});

test('favicon is served', async ({ request }) => {
  const response = await request.get('/icon.svg');
  expect(response.status()).toBe(200);
});

test('catalog card shows copy prompt and select controls', async ({ page }) => {
  await page.goto('/?tab=components&library=bundui', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  const card = page.locator('article[data-tour="component-card"]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('button', { name: 'Copy agent prompt' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Select for agent prompt' })).toBeVisible();
});

test('component detail shows copy prompt control', async ({ page }) => {
  await page.goto('/components/bundui/button-default');
  await expect(
    page.locator('header').getByRole('button', { name: 'Copy agent prompt' }),
  ).toBeVisible();
});

test('multi-select tray appears after checking a component', async ({ page }) => {
  await page.goto('/?tab=components&library=bundui');
  const card = page.locator('article').filter({ hasText: 'button-default' }).first();
  await card.getByRole('button', { name: 'Select for agent prompt' }).click();
  await expect(page.getByText(/1 component selected/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy combined prompt' })).toBeVisible();
});

test('first-run tutorial opens automatically for new visitors', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem('vybekiit-ui-library-tutorial-v1'));
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Welcome to the VybeKiit UI Library')).toBeVisible();
});

test('grid layout picker is available in header', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('vybekiit-ui-library-tutorial-v1', 'true');
  });
  await page.goto('/');
  const layoutButton = page.getByRole('button', { name: 'Catalog grid layout' });
  await expect(layoutButton).toBeVisible();
  await layoutButton.click({ force: true });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Catalog grid layout' })).toBeVisible();
});

test('catalog card lazy-loads preview thumbnail', async ({ page }) => {
  await page.goto('/?tab=components&library=bundui', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  const card = page
    .locator('article')
    .filter({ has: page.locator('a[href="/components/bundui/button-default"]') })
    .first();
  await card.scrollIntoViewIfNeeded();
  const frame = card.frameLocator('iframe[title="Preview button-default"]');
  await expect(frame.locator('body')).not.toBeEmpty({ timeout: 45_000 });
});

test('component detail lazy-loads live preview iframe', async ({ page }) => {
  await page.goto('/components/bundui/button-default');
  const frame = page.frameLocator('iframe[title="Preview button-default"]');
  await expect(frame.getByRole('button').first()).toBeVisible({ timeout: 45_000 });
});

test('detail page shows viewport and size controls', async ({ page }) => {
  await page.goto('/components/bundui/button-default');
  await expect(page.getByRole('button', { name: 'Desktop' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'L', exact: true })).toBeVisible();
});

test('21st.dev library filter lists curated blocks', async ({ page }) => {
  await page.goto('/?tab=components&library=blocks-21st');
  await expect(page.getByText(/Showing \d+ of/)).toBeVisible();
  await expect(
    page.locator('a[href="/components/blocks-21st/be-ui-button"]').first(),
  ).toBeVisible();
});

test('device mockup chrome on mobile viewport', async ({ page }) => {
  await page.goto('/components/blocks-21st/be-ui-button');
  await expect(page.getByRole('button', { name: 'Desktop' })).toBeVisible({ timeout: 45_000 });
  await page.getByRole('button', { name: 'Mobile' }).click();
  await expect(page.locator('[aria-label="iPhone mockup (15-pro)"]')).toBeVisible({
    timeout: 15_000,
  });
});

test('related section renders component cards', async ({ page }) => {
  await page.goto('/components/magicui/orbiting-circles');
  await expect(page.getByRole('heading', { name: /More in/i })).toBeVisible();
  const related = page.locator('section').filter({ hasText: 'More in' });
  await expect(related.locator('iframe').first()).toBeVisible({ timeout: 45_000 });
});

for (const sample of PREVIEW_SAMPLES) {
  test(`preview renders for ${sample.namespace}/${sample.name}`, async ({ page }) => {
    await page.goto(`/embed/${sample.namespace}/${encodeURIComponent(sample.name)}?theme=light`);
    await expect(page.locator('body')).not.toContainText('Preview unavailable', {
      timeout: 45_000,
    });
    await expect(page.locator('body')).not.toContainText('No preview available', {
      timeout: 45_000,
    });
  });
}

for (const sample of FIXED_SAMPLES) {
  test(`fixed preview renders for ${sample.namespace}/${sample.name}`, async ({ page }) => {
    await page.goto(`/embed/${sample.namespace}/${encodeURIComponent(sample.name)}?theme=light`);
    await expect(page.locator('body')).not.toContainText('Live preview is coming soon', {
      timeout: 60_000,
    });
    await expect(page.locator('body')).not.toContainText('could not render in isolation', {
      timeout: 60_000,
    });
    await expect(page.locator('body')).not.toContainText('needs extra packages', {
      timeout: 60_000,
    });
  });
}
