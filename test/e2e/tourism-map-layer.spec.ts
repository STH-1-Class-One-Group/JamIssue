import { expect, test } from '@playwright/test';
import type { TourismPlaceItem } from '../../src/tourismTypes';
import { createE2EAppState, installApiFixtures } from './fixtures';

const cafeTourismPlace: TourismPlaceItem = {
  id: 'tourism-cafe-1',
  name: 'KTO 카페 장소',
  category: 'restaurant',
  primaryType: 'restaurant',
  subType: 'cafe',
  displayGroup: 'cafe',
  officialCategoryLabel: '음식점',
  curationStatus: 'raw_kto',
  ktoContentTypeId: '39',
  ktoContentTypeLabel: '음식점',
  ktoFacet: 'restaurant',
  district: '중구',
  address: null,
  roadAddress: '대전 중구 테스트로 1',
  summary: 'KTO 카페 장소 설명입니다.',
  description: null,
  latitude: 36.35,
  longitude: 127.38,
  imageUrl: null,
  sourcePageUrl: null,
  sourceUpdatedAt: null,
  sourceName: 'KTO 관광정보',
  hasDetail: true,
  detailKind: 'restaurant',
  isCurated: false,
  curatedPlace: null,
};

const lodgingTourismPlace: TourismPlaceItem = {
  ...cafeTourismPlace,
  id: 'tourism-lodging-1',
  name: 'KTO 숙박 장소',
  category: 'lodging',
  primaryType: 'lodging',
  subType: 'unknown',
  displayGroup: 'lodging',
  officialCategoryLabel: '숙박',
  ktoContentTypeId: '32',
  ktoContentTypeLabel: '숙박',
  ktoFacet: 'lodging',
  roadAddress: '대전 중구 숙박로 1',
};

function buildProductionLikeTourismPlaces(count: number): TourismPlaceItem[] {
  return Array.from({ length: count }, (_, index) => ({
    ...cafeTourismPlace,
    id: `tourism-production-${index + 1}`,
    name: `KTO production ${index + 1}`,
    displayGroup: index % 3 === 0 ? 'cafe' : index % 3 === 1 ? 'restaurant' : 'lodging',
    latitude: 36.2 + index * 0.0005,
    longitude: 127.2 + index * 0.0005,
  }));
}

test('UIUX-017 keeps KTO tourism map layer OFF by default and fetches all places after toggle', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace, lodgingTourismPlace],
  }));

  await page.goto('/');

  const tourismToggle = page.locator('[data-tourism-toggle="map"]');
  await expect(tourismToggle).toBeVisible();
  expect(tourismRequests).toEqual([]);

  await tourismToggle.click();

  await expect(tourismToggle).toHaveClass(/is-active/);
  await expect.poll(() => tourismRequests.length).toBe(1);
  expect(tourismRequests[0]).toContain('scope=all');
  expect(tourismRequests[0]).not.toContain('limit=');
  await page.locator('[data-map-filter-trigger="true"]').click();
  await expect(page.locator('[data-map-filter-key="cafe"]')).toBeVisible();
  await expect(page.locator('[data-map-filter-key="lodging"]')).toBeVisible();
});

test('UIUX-019 shows initial KTO loading feedback while the all-scope request is pending', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace, lodgingTourismPlace],
  }), { tourismPlacesDelayMs: 800 });

  await page.goto('/');

  await page.locator('[data-tourism-toggle="map"]').click();

  await expect(page.locator('[data-tourism-load-status="initial"]')).toBeVisible({ timeout: 400 });
  await page.screenshot({ timeout: 1000 });
  await expect.poll(() => tourismRequests.length).toBe(1);
  expect(tourismRequests[0]).toContain('scope=all');
  expect(tourismRequests[0]).not.toContain('limit=');
});

test('UIUX-018 filters KTO tourism map layer locally after the initial all-scope request', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace, lodgingTourismPlace],
  }));

  await page.goto('/');
  await page.locator('[data-tourism-toggle="map"]').click();
  await expect.poll(() => tourismRequests.length).toBe(1);

  await page.locator('[data-map-filter-trigger="true"]').click();
  await page.locator('[data-map-filter-key="cafe"]').click();

  await expect(page.locator('[data-map-filter-trigger="true"]')).toBeVisible();
  expect(tourismRequests).toHaveLength(1);
  expect(tourismRequests[0]).toContain('scope=all');
  expect(tourismRequests[0]).not.toContain('displayGroup=');
  expect(tourismRequests[0]).not.toContain('limit=');
});

test('UIUX-021 keeps KTO ON interaction responsive with production-like tourism data', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: buildProductionLikeTourismPlaces(383),
  }));

  await page.goto('/');

  const tourismToggle = page.locator('[data-tourism-toggle="map"]');
  await tourismToggle.click();

  await expect(tourismToggle).toHaveClass(/is-active/, { timeout: 300 });
  await page.screenshot({ timeout: 1000 });
  await expect.poll(() => tourismRequests.length).toBe(1);
  expect(tourismRequests[0]).toContain('scope=all');
  expect(await page.locator('[data-marker-hit-target="tourism"]').count()).toBeLessThanOrEqual(32);
});

test('UIUX-022 keeps KTO display group switching local and responsive', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: buildProductionLikeTourismPlaces(383),
  }));

  await page.goto('/');
  await page.locator('[data-tourism-toggle="map"]').click();
  await expect.poll(() => tourismRequests.length).toBe(1);

  const filterTrigger = page.locator('[data-map-filter-trigger="true"]');
  await filterTrigger.click();
  await page.locator('[data-map-filter-key="cafe"]').click();

  await expect(filterTrigger).toHaveAttribute('aria-expanded', 'false', { timeout: 300 });
  await page.screenshot({ timeout: 1000 });
  expect(tourismRequests).toHaveLength(1);
});

test('UIUX-023 keeps curated map usable when the KV snapshot is not ready', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace],
  }), { tourismPlacesSourceReady: false });

  await page.goto('/');
  await page.locator('[data-tourism-toggle="map"]').click();

  await expect(page.getByText('관광정보를 준비 중이에요. 잠시 후 다시 시도해 주세요.')).toBeVisible();
  await expect(page.locator('[data-marker-hit-target="tourism"]')).toHaveCount(0);
  await page.locator('[data-tab-key="feed"]').click();
  await expect(page.locator('[data-tab-key="feed"]')).toHaveAttribute('aria-current', 'page');
});

test('UIUX-024 handles KTO snapshot 503 without freezing map navigation', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace],
  }), { tourismPlacesStatus: 503 });

  await page.goto('/');
  await page.locator('[data-tourism-toggle="map"]').click();

  await expect(page.getByText('관광정보 스냅샷을 준비 중입니다.')).toBeVisible();
  await page.screenshot({ timeout: 1000 });
  await page.locator('[data-tab-key="course"]').click();
  await expect(page.locator('[data-tab-key="course"]')).toHaveAttribute('aria-current', 'page');
});

test('TSK-021 exposes map display preference without breaking KTO toggle flow', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [cafeTourismPlace, lodgingTourismPlace],
  }));

  await page.goto('/');
  await page.locator('.global-settings-menu__trigger').click();

  const curatedWithTourismSwitch = page.getByRole('switch', { name: '관광정보와 큐레이션 함께 보기' });
  await expect(curatedWithTourismSwitch).toBeChecked();
  await page.locator('[data-app-setting="show-curated-with-tourism"]').click();
  await expect(curatedWithTourismSwitch).not.toBeChecked();
  const settingsDrawer = page.getByRole('dialog', { name: '앱 설정' });
  await settingsDrawer.getByRole('button', { name: '앱 설정 닫기' }).click();
  await expect(settingsDrawer).toHaveCount(0);

  await page.locator('[data-tourism-toggle="map"]').click();

  await expect(page.locator('[data-tourism-toggle="map"]')).toHaveClass(/is-active/);
  await expect.poll(() => tourismRequests.length).toBe(1);
  expect(tourismRequests[0]).toContain('scope=all');
  expect(tourismRequests[0]).not.toContain('limit=');
});
