import { expect, test } from '@playwright/test';

const PREVIEW_SAMPLES: Array<{ namespace: string; name: string }> = [
  { namespace: 'magicui', name: 'android' },
  { namespace: 'kokonutui', name: 'card-flip' },
  { namespace: 'aceternity', name: 'background-beams' },
  { namespace: 'ai-elements', name: 'message' },
  { namespace: 'kibo', name: 'announcement' },
];

const FIXED_SAMPLES: Array<{ namespace: string; name: string }> = [
  { namespace: 'kokonutui', name: 'bento-grid' },
  { namespace: 'kokonutui', name: 'card-flip' },
  { namespace: 'magicui', name: 'android' },
  { namespace: 'kibo', name: 'glimpse' },
  { namespace: 'aceternity', name: 'layout-grid' },
  { namespace: 'aceternity', name: 'animated-testimonials' },
  { namespace: 'magicui', name: 'orbiting-circles' },
  { namespace: 'magicui', name: 'logo-trust-grid' },
];

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === 'first-run tutorial opens automatically for new visitors') {
    return;
  }
  await page.addInitScript(() => {
    window.localStorage.setItem('vybekiit-ui-library-tutorial-v1', 'true');
  });
});

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
  await expect(page.getByRole('heading', { name: /VybeKiit mascots/i })).toBeVisible();
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

test('pages tab lists source-backed page recipes with responsive previews', async ({ page }) => {
  await page.goto('/pages');
  await expect(page.getByRole('heading', { name: 'Page Recipes' })).toBeVisible();
  await expect(page.getByRole('button', { name: /All Pages/ })).toBeVisible();

  const authCard = page.locator('article').filter({ hasText: 'Auth page' }).first();
  await expect(authCard).toBeVisible();
  await expect(authCard.getByText('/login')).toBeVisible();
  await expect(authCard.getByRole('button', { name: 'Copy Page recipe source' })).toBeVisible();
  await expect(
    authCard.getByRole('button', { name: 'Copy Page recipe install prompt' }),
  ).toBeVisible();
  await expect(authCard.locator('iframe[title="Auth page Desktop preview"]')).toBeVisible();
  await expect(authCard.locator('iframe[title="Auth page Tablet preview"]')).toBeVisible();
  await expect(authCard.locator('iframe[title="Auth page Mobile preview"]')).toBeVisible();
});

test('pages desktop layout keeps content clear of expanded sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pages');

  const sidebarBox = await page.locator('[data-sidebar="sidebar"]').first().boundingBox();
  const headingBox = await page.getByRole('heading', { name: 'Page Recipes' }).boundingBox();

  if (!(sidebarBox && headingBox)) {
    throw new Error('Sidebar and page heading must be measurable for layout overlap checks.');
  }

  expect(headingBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width + 16);
});

test('page recipe sidebar group navigation opens filtered pages route', async ({ page }) => {
  await page.goto('/pages/auth');
  await page.getByRole('button', { name: /Payments/ }).click();
  await expect(page).toHaveURL('/pages?group=payments');
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'Pricing page' }).first()).toBeVisible();
});

test('page recipe detail route exposes install notes source and full preview', async ({ page }) => {
  await page.goto('/pages/auth');
  await expect(page.getByRole('heading', { name: 'Auth page' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Install notes' })).toBeVisible();
  await expect(
    page.getByText('Connect the form to the active Supabase auth provider.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Source' })).toBeVisible();
  await expect(page.getByText('export const AuthPage')).toBeVisible();
  await expect(page.getByRole('link', { name: /Full preview/ })).toHaveAttribute(
    'href',
    '/embed/pages/auth',
  );
});

test('page recipe embed route renders the runnable recipe component', async ({ page }) => {
  await page.goto('/embed/pages/auth');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
});

test('page recipe copy actions write source and prompt to clipboard', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/pages/auth');

  await page.getByRole('button', { name: 'Copy Page recipe source' }).click();
  await expect(page.getByRole('button', { name: 'Page source copied' })).toBeVisible();
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain(
    'export const AuthPage',
  );

  await page.getByRole('button', { name: 'Copy Page recipe install prompt' }).click();
  await expect(page.getByRole('button', { name: 'Page prompt copied' })).toBeVisible();
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain(
    'Install this VybeKiit Page recipe in my app.',
  );
});

test('multi-select tray appears after checking a component', async ({ page }) => {
  await page.goto('/?library=magicui');
  const card = page
    .locator('article')
    .filter({ has: page.locator('a[href="/components/magicui/android"]') })
    .first();
  await expect(card).toBeVisible();
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
  await page.goto('/');
  const layoutButton = page.getByRole('button', { name: 'Catalog grid layout' });
  await expect(layoutButton).toBeVisible();
  await layoutButton.click({ force: true });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Catalog grid layout' })).toBeVisible();
});

test('catalog card lazy-loads preview thumbnail', async ({ page }) => {
  await page.goto('/?library=magicui', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  const card = page
    .locator('article')
    .filter({ has: page.locator('a[href="/components/magicui/android"]') })
    .first();
  await card.scrollIntoViewIfNeeded();
  const frame = card.frameLocator('iframe[title="Preview android"]');
  await expect(frame.locator('body')).not.toBeEmpty({ timeout: 45_000 });
});

test('component detail lazy-loads live preview iframe', async ({ page }) => {
  await page.goto('/components/magicui/orbiting-circles');
  const frame = page.frameLocator('iframe[title="Preview orbiting-circles"]');
  await expect(frame.locator('body')).not.toBeEmpty({ timeout: 45_000 });
});

test('detail page shows viewport and size controls', async ({ page }) => {
  await page.goto('/components/magicui/orbiting-circles');
  await expect(page.getByRole('button', { name: 'Desktop' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'L', exact: true })).toBeVisible();
});

test('Magic UI library filter lists curated blocks', async ({ page }) => {
  await page.goto('/?tab=components&library=magicui');
  await expect(page.getByText(/Showing \d+ of/)).toBeVisible();
  await expect(page.locator('a[href="/components/magicui/android"]').first()).toBeVisible();
});

test('device mockup chrome on mobile viewport', async ({ page }) => {
  await page.goto('/components/magicui/orbiting-circles');
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
  await expect(related.locator('article').first()).toBeVisible();
  await expect(related.locator('a[href^="/components/"]').first()).toBeVisible();
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
