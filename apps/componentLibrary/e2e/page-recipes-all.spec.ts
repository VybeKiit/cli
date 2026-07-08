import { expect, type Page, type Response, test } from '@playwright/test';
import { PAGE_RECIPES } from '../src/data/pageRecipes';

const appErrorText = 'Application error';
const nextErrorText = 'Unhandled Runtime Error';

interface BrowserHealth {
  readonly criticalResourceFailures: string[];
  readonly runtimeErrors: string[];
}

const criticalResourceTypes = new Set(['document', 'script', 'stylesheet', 'fetch', 'xhr']);
const criticalRequestFailureResourceTypes = new Set(['document', 'script', 'stylesheet']);
const routeLoad = { timeout: 60_000, waitUntil: 'domcontentloaded' } as const;

const isLocalRouteUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  } catch {
    return url.startsWith('/');
  }
};

const isCriticalResponseFailure = (response: Response): boolean => {
  if (response.status() < 400) {
    return false;
  }

  const request = response.request();
  if (!criticalResourceTypes.has(request.resourceType())) {
    return false;
  }

  const url = response.url();
  if (!isLocalRouteUrl(url)) {
    return false;
  }

  return url.includes('/_next/') || url.includes('/pages') || url.includes('/embed/pages');
};

const collectBrowserHealth = (page: Page): BrowserHealth => {
  const criticalResourceFailures: string[] = [];
  const runtimeErrors: string[] = [];

  page.on('response', (response) => {
    if (isCriticalResponseFailure(response)) {
      criticalResourceFailures.push(
        `${response.status()} ${response.request().resourceType()}: ${response.url()}`,
      );
    }
  });

  page.on('requestfailed', (request) => {
    if (
      criticalRequestFailureResourceTypes.has(request.resourceType()) &&
      isLocalRouteUrl(request.url())
    ) {
      criticalResourceFailures.push(
        `requestfailed ${request.resourceType()}: ${request.url()} ${
          request.failure()?.errorText ?? 'unknown error'
        }`,
      );
    }
  });

  page.on('pageerror', (error) => {
    runtimeErrors.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(`console.error: ${message.text()}`);
    }
  });

  return { criticalResourceFailures, runtimeErrors };
};

const expectHealthyRoute = async (page: Page, route: string) => {
  const response = await page.goto(route, routeLoad);

  expect(response, `${route} should return a response`).not.toBeNull();
  expect(response?.status(), `${route} should not return an error status`).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText(appErrorText);
  await expect(page.locator('body')).not.toContainText(nextErrorText);
};

const expectVisibleRender = async (page: Page, route: string) => {
  const main = page.locator('main').first();

  await expect(main, `${route} should render a visible main surface`).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  const mainBox = await main.boundingBox();
  const screenshot = await page.screenshot({ caret: 'initial', fullPage: false });

  expect(mainBox, `${route} should have a measurable main surface`).not.toBeNull();
  expect(mainBox?.width ?? 0, `${route} should render visible page width`).toBeGreaterThan(200);
  expect(mainBox?.height ?? 0, `${route} should render visible page height`).toBeGreaterThan(100);
  expect(bodyText.trim().length, `${route} should render readable body text`).toBeGreaterThan(20);
  expect(screenshot.length, `${route} should produce a non-empty screenshot`).toBeGreaterThan(
    10_000,
  );
};

const expectNoBrowserHealthErrors = (browserHealth: BrowserHealth, route: string) => {
  expect(
    browserHealth.criticalResourceFailures,
    `${route} should not return failed app shell or Next asset responses`,
  ).toEqual([]);
  expect(browserHealth.runtimeErrors, `${route} should not emit browser runtime errors`).toEqual(
    [],
  );
};

test.describe('all page recipe routes', () => {
  for (const recipe of PAGE_RECIPES) {
    test(`detail route renders ${recipe.slug}`, async ({ page }) => {
      const route = `/pages/${recipe.slug}`;
      const browserHealth = collectBrowserHealth(page);

      await expectHealthyRoute(page, route);
      await expectVisibleRender(page, route);
      await expect(page.getByRole('heading', { name: recipe.title })).toBeVisible();
      await expect(page.getByText(recipe.targetRoute, { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Install notes' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Source' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Full preview' })).toHaveAttribute(
        'href',
        `/embed/pages/${recipe.slug}`,
      );
      expectNoBrowserHealthErrors(browserHealth, route);
    });

    test(`embed route renders ${recipe.slug}`, async ({ page }) => {
      const route = `/embed/pages/${recipe.slug}`;
      const browserHealth = collectBrowserHealth(page);

      await expectHealthyRoute(page, route);
      await expectVisibleRender(page, route);
      expectNoBrowserHealthErrors(browserHealth, route);
    });
  }
});

test('pages catalog lists every page recipe', async ({ page }) => {
  const browserHealth = collectBrowserHealth(page);

  await expectHealthyRoute(page, '/pages');
  await expect(page.locator('main[data-page-recipes-ready="true"]')).toBeVisible();
  await expectVisibleRender(page, '/pages');
  await expect(page.getByRole('heading', { name: 'Page Recipes' })).toBeVisible();

  await Promise.all(
    PAGE_RECIPES.map((recipe) =>
      expect(page.getByRole('heading', { name: recipe.title })).toBeVisible(),
    ),
  );

  expectNoBrowserHealthErrors(browserHealth, '/pages');
});
