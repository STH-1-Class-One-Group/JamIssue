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
