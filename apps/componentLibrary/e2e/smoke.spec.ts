import { expect, type Page, test } from '@playwright/test';

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

const routeLoad = { timeout: 60_000, waitUntil: 'domcontentloaded' } as const;

// "Hero & landing" -> match the category button regardless of casing.
const HERO_AND_LANDING_CATEGORY_NAME = /Hero & landing/i;

// "Logos & icons" -> match the category button regardless of casing.
const LOGOS_AND_ICONS_CATEGORY_NAME = /Logos & icons/i;

const QUICK_WIN_SURFACE_LINKS: Array<{ readonly label: string; readonly href: string }> = [
  { label: 'User settings', href: '/extension-saas/user-settings' },
  { label: 'Products', href: '/extension-saas/products' },
  { label: 'Cart', href: '/extension-saas/cart' },
  { label: 'Orders', href: '/extension-saas/orders' },
  { label: 'Support', href: '/extension-saas/support' },
  { label: 'Integrations', href: '/extension-saas/integrations' },
  { label: 'Status', href: '/extension-saas/status' },
  { label: 'Changelog', href: '/extension-saas/changelog' },
];

const QUICK_WIN_RECIPE_SAMPLES: Array<{
  readonly slug: string;
  readonly title: string;
  readonly heading: string;
  readonly targetRoute: string;
}> = [
  {
    slug: 'user-settings',
    title: 'User settings page',
    heading: 'Settings',
    targetRoute: '/settings/profile',
  },
  {
    slug: 'product-grid',
    title: 'Product grid page',
    heading: 'Product catalog',
    targetRoute: '/products',
  },
  {
    slug: 'cart',
    title: 'Cart page',
    heading: 'Your cart',
    targetRoute: '/cart',
  },
  {
    slug: 'support-center',
    title: 'Support center page',
    heading: 'Support center',
    targetRoute: '/support',
  },
  {
    slug: 'integrations',
    title: 'Integrations page',
    heading: 'Integrations',
    targetRoute: '/integrations',
  },
  {
    slug: 'status',
    title: 'Status page',
    heading: 'Service status',
    targetRoute: '/status',
  },
  {
    slug: 'changelog',
    title: 'Changelog page',
    heading: 'Product updates',
    targetRoute: '/changelog',
  },
];

/**
 * Open the Page recipe browser after its client-side controls hydrate.
 *
 * @param page - Playwright page under test.
 * @returns A promise that resolves after the browser is ready.
 * @example
 * await gotoPageRecipes(page);
 */
const gotoPageRecipes = async (page: Page): Promise<void> => {
  await page.goto('/pages', routeLoad);
  await expect(page.locator('main[data-page-recipes-ready="true"]')).toBeVisible({
    timeout: routeLoad.timeout,
  });
};

/**
 * Open a template surface route after the nested preview browser hydrates.
 *
 * @param page - Playwright page under test.
 * @param path - Template surface path to open.
 * @returns A promise that resolves after the surface browser is ready.
 * @example
 * await gotoTemplateSurface(page, '/extension-saas');
 */
const gotoTemplateSurface = async (page: Page, path: string): Promise<void> => {
  await page.goto(path, routeLoad);
  await expect(page.locator('main[data-template-surface-ready="true"]')).toBeVisible({
    timeout: routeLoad.timeout,
  });
};

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
  await expect(page.getByRole('link', { name: 'Website SaaS' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mobile SaaS' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Extension SaaS' })).toBeVisible();
  await expect(page.getByRole('button', { name: HERO_AND_LANDING_CATEGORY_NAME })).toBeVisible();
  await expect(page.getByRole('button', { name: LOGOS_AND_ICONS_CATEGORY_NAME })).toBeVisible();
});

test('template surface route renders live SaaS previews', async ({ page }) => {
  await gotoTemplateSurface(page, '/extension-saas');
  await expect(page.getByRole('heading', { name: 'Extension SaaS template' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playable nested app' })).toBeVisible();
  await expect(page.getByText('Popup 380 x 600')).toBeVisible();
  await expect(page.getByText('Side panel 430 x 760').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Files', exact: true })).toHaveAttribute(
    'href',
    '/extension-saas/files',
  );
  await expect(page.getByRole('link', { name: 'Teams', exact: true })).toHaveAttribute(
    'href',
    '/extension-saas/teams',
  );
  await expect(page.getByRole('link', { name: 'Billing', exact: true })).toHaveAttribute(
    'href',
    '/extension-saas/billing',
  );
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toHaveAttribute(
    'href',
    '/extension-saas/settings',
  );
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveAttribute(
    'href',
    '/extension-saas/admin',
  );
  for (const route of QUICK_WIN_SURFACE_LINKS) {
    await expect(page.getByRole('link', { name: route.label, exact: true })).toHaveAttribute(
      'href',
      route.href,
    );
  }
  await expect(page.locator('iframe')).toHaveCount(4);
  await expect(page.locator('iframe').first()).toBeVisible();
  const playableApp = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Playable nested app' }),
  });
  await expect(playableApp.getByText('65%')).toBeVisible();
  await playableApp.getByRole('button', { name: 'Decrease preview zoom' }).click();
  await expect(playableApp.getByText('55%')).toBeVisible();

  await page.getByRole('link', { name: 'Teams', exact: true }).click();
  await expect(page).toHaveURL('/extension-saas/teams');
  await expect(page.getByText('/extension-saas/teams')).toBeVisible();
  const teamsFrame = page.frameLocator('iframe[title="Extension SaaS Teams nested preview"]');
  // Maya is the sole Owner and cannot be demoted — use Noah (Editor) for a real role change.
  const roleSelect = teamsFrame.getByRole('combobox', { name: 'Change role for Noah Green' });
  await expect(roleSelect).toBeVisible();
  await roleSelect.click();
  await expect(teamsFrame.getByRole('option', { name: 'Admin' })).toBeVisible();
  await teamsFrame.getByRole('option', { name: 'Admin' }).click();
  await expect(roleSelect).toContainText('Admin');
  await expect(page.getByRole('link', { name: 'Website SaaS' })).toBeVisible();
});

test('admin panel recipe renders a combined control center', async ({ page }) => {
  await page.goto('/pages/admin-panel', routeLoad);
  await expect(page.getByRole('heading', { name: 'Admin panel page' })).toBeVisible();
  await expect(page.getByText('/admin')).toBeVisible();

  await page.goto('/embed/pages/admin-panel', routeLoad);
  await expect(page.getByRole('heading', { name: 'Admin command center' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
  await expect(page.getByText('Billing risk', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Audit log' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Review queue/ })).toBeVisible();
});

test('quick-win page recipes render across SaaS categories', async ({ page }) => {
  for (const recipe of QUICK_WIN_RECIPE_SAMPLES) {
    await page.goto(`/pages/${recipe.slug}`, routeLoad);
    await expect(page.getByRole('heading', { name: recipe.title })).toBeVisible();
    // exact: true — "/products" also appears inside install-note copy and source.
    await expect(page.getByText(recipe.targetRoute, { exact: true })).toBeVisible();

    await page.goto(`/embed/pages/${recipe.slug}`, routeLoad);
    await expect(page.getByRole('heading', { name: recipe.heading })).toBeVisible();
    await expect(page.getByRole('button').first()).toBeVisible();
  }
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

test('pages tab lists source-backed page recipes with responsive previews', async ({
  context,
  page,
}) => {
  await gotoPageRecipes(page);
  await expect(page.getByRole('heading', { name: 'Page Recipes' })).toBeVisible();
  await expect(page.getByRole('link', { name: /All Pages/ })).toBeVisible();

  const authCard = page.locator('article').filter({ hasText: 'Auth page' }).first();
  await expect(authCard).toBeVisible();
  await expect(authCard.getByText('/login')).toBeVisible();
  await expect(authCard.getByRole('button', { name: 'Copy Page recipe source' })).toBeVisible();
  await expect(
    authCard.getByRole('button', { name: 'Copy Page recipe install prompt' }),
  ).toBeVisible();
  const fullPreviewLink = authCard.getByRole('link', { name: 'Full preview' });
  await expect(fullPreviewLink).toHaveAttribute('href', '/embed/pages/auth');
  await expect(fullPreviewLink).toHaveAttribute('target', '_blank');
  await expect(authCard.locator('iframe[title="Auth page Desktop preview"]')).toBeVisible();
  await expect(authCard.locator('iframe[title="Auth page Tablet preview"]')).toBeVisible();
  await expect(authCard.locator('iframe[title="Auth page Mobile preview"]')).toBeVisible();
  await expect(authCard.getByRole('img', { name: 'Mobile preview' })).toBeVisible();
  await expect(authCard.getByRole('img', { name: 'Tablet preview' })).toBeVisible();
  await expect(authCard.getByRole('img', { name: 'Desktop preview' })).toBeVisible();
  await expect(
    authCard.getByText('Mobile (default iPhone 12 Pro Max 428 x 926)', { exact: true }),
  ).toBeVisible();

  const mobileFrame = authCard.locator('figure').filter({ hasText: 'Mobile' }).first();
  const tabletFrame = authCard.locator('figure').filter({ hasText: 'Tablet' }).first();
  const desktopFrame = authCard.locator('figure').filter({ hasText: 'Desktop' }).first();
  const mobileBox = await mobileFrame.boundingBox();
  const tabletBox = await tabletFrame.boundingBox();
  const desktopBox = await desktopFrame.boundingBox();

  if (!(mobileBox && tabletBox && desktopBox)) {
    throw new Error('Page recipe responsive preview frames must be measurable.');
  }

  expect(Math.abs(mobileBox.y - tabletBox.y)).toBeLessThanOrEqual(2);
  expect(desktopBox.y).toBeGreaterThan(mobileBox.y + 24);
  expect(desktopBox.width).toBeGreaterThan(mobileBox.width + tabletBox.width - 16);

  const [previewPage] = await Promise.all([context.waitForEvent('page'), fullPreviewLink.click()]);
  await previewPage.waitForLoadState('domcontentloaded');
  await expect(previewPage).toHaveURL('/embed/pages/auth');
  await expect(page).toHaveURL('/pages');
  await previewPage.close();
});

test('page recipe search filters legal recipes from the search input', async ({ page }) => {
  await gotoPageRecipes(page);

  await page.getByPlaceholder('Search page recipes').fill('privacy');

  await expect(page.locator('article').filter({ hasText: 'Privacy policy page' })).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator('article').filter({ hasText: 'Auth page' })).toBeHidden();
});

test('page recipe mobile preview can switch official and custom device sizes', async ({ page }) => {
  await gotoPageRecipes(page);

  const authCard = page.locator('article').filter({ hasText: 'Auth page' }).first();
  const mobileFrame = authCard.locator('figure').filter({ hasText: 'Mobile' }).first();
  const presetSelect = mobileFrame.getByLabel('Mobile viewport preset');

  await expect(presetSelect).toBeVisible();
  await expect(mobileFrame.getByText('428 x 926', { exact: true })).toBeVisible();

  await presetSelect.selectOption('iphone-17-pro-max');
  await expect(mobileFrame.getByText('440 x 956', { exact: true })).toBeVisible();

  await presetSelect.selectOption('custom');
  await mobileFrame.getByLabel('Custom mobile width').fill('412');
  await mobileFrame.getByLabel('Custom mobile height').fill('915');

  await expect(mobileFrame.getByText('412 x 915', { exact: true })).toBeVisible();
});

test('legal page recipes include Google OAuth-ready defaults', async ({ page }) => {
  await gotoPageRecipes(page);

  const termsCard = page.locator('article').filter({ hasText: 'Terms of service page' }).first();
  const privacyCard = page.locator('article').filter({ hasText: 'Privacy policy page' }).first();

  await expect(termsCard).toBeVisible();
  await expect(termsCard.getByText('/terms')).toBeVisible();
  await expect(privacyCard).toBeVisible();
  await expect(privacyCard.getByText('/privacy')).toBeVisible();

  await page.goto('/embed/pages/privacy-policy');
  await expect(page.getByText('Example Company', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('support@example.com', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Google OAuth consent', { exact: true }).first()).toBeVisible();

  await page.goto('/embed/pages/terms-of-service');
  await expect(page.getByText('Example Company', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText('Optional company registration ID', { exact: true }).first(),
  ).toBeVisible();
});

test('pages desktop layout keeps content clear of expanded sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoPageRecipes(page);

  const sidebarBox = await page.locator('[data-sidebar="sidebar"]').first().boundingBox();
  const headingBox = await page.getByRole('heading', { name: 'Page Recipes' }).boundingBox();

  if (!(sidebarBox && headingBox)) {
    throw new Error('Sidebar and page heading must be measurable for layout overlap checks.');
  }

  expect(headingBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width + 16);
});

test('page recipe sidebar group navigation opens filtered pages route', async ({ page }) => {
  await page.goto('/pages/auth', routeLoad);
  await page.getByRole('link', { name: /Payments/ }).click();
  await expect(page).toHaveURL('/pages?group=payments');
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'Pricing page' }).first()).toBeVisible();
});

test('page recipe detail route exposes install notes source and full preview', async ({ page }) => {
  await page.goto('/pages/auth', routeLoad);
  await expect(page.getByRole('heading', { name: 'Auth page' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Install notes' })).toBeVisible();
  await expect(
    page.getByText(
      'Run the onboarding skill to set SUPABASE_URL and SUPABASE_ANON_KEY, then create the @vybekiit/auth client.',
    ),
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
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  // exact: true — "Show password" also matches a loose "Password" label query.
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use a magic link instead' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
});

test('page recipe copy actions write source and prompt to clipboard', async ({ page }) => {
  // In-page clipboard mock — parallel workers race on the real OS clipboard in CI.
  await page.addInitScript(() => {
    const store = { text: '' };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          store.text = text;
        },
        readText: async () => store.text,
      },
    });
  });

  await page.goto('/pages/auth', routeLoad);

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
