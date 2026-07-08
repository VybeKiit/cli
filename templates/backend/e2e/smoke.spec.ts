import { expect, test } from '@playwright/test';

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { ok: boolean; status: string };
  expect(body.ok).toBe(true);
  expect(body.status).toBe('healthy');
});
