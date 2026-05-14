import { expect, test, type Page } from '@playwright/test';

const emptyAuth = {
  isAuthenticated: false,
  user: null,
  providers: [
    { key: 'naver', label: 'Naver', isEnabled: false, loginUrl: null },
    { key: 'kakao', label: 'Kakao', isEnabled: false, loginUrl: null },
  ],
};

const stampState = {
  collectedPlaceIds: [],
  logs: [],
  travelSessions: [],
};

async function installApiFixtures(page: Page) {
  await page.route('**/app-config.js', async (route) => {
    await route.fulfill({
      contentType: 'text/javascript; charset=utf-8',
      body: `window.__JAMISSUE_CONFIG__ = ${JSON.stringify({
        apiBaseUrl: 'http://127.0.0.1:4173',
        naverMapClientId: '',
        supabaseUrl: '',
        supabaseAnonKey: '',
      })};`,
    });
  });

  await page.route('**/api/map-bootstrap', async (route) => {
    await route.fulfill({
      json: {
        auth: emptyAuth,
        places: [],
        stamps: stampState,
        hasRealData: true,
      },
    });
  });

  await page.route('**/api/courses/curated', async (route) => {
    await route.fulfill({ json: { courses: [] } });
  });

  await page.route('**/api/banner/events', async (route) => {
    await route.fulfill({
      json: {
        sourceReady: false,
        sourceName: null,
        importedAt: null,
        items: [],
      },
    });
  });

  await page.route('**/api/festivals', async (route) => {
    await route.fulfill({ json: [] });
  });
}

test('mobile app shell exposes primary tabs from the built bundle', async ({ page }) => {
  await installApiFixtures(page);

  await page.goto('/');

  await expect(page.getByRole('button', { name: '지도' })).toBeVisible();
  await expect(page.getByRole('button', { name: '행사' })).toBeVisible();
  await expect(page.getByRole('button', { name: '피드' })).toBeVisible();
  await expect(page.getByRole('button', { name: '코스' })).toBeVisible();
  await expect(page.getByRole('button', { name: '마이' })).toBeVisible();
});
