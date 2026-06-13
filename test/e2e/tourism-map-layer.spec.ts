import { expect, test } from '@playwright/test';
import type { TourismPlaceItem } from '../../src/tourismTypes';
import { createE2EAppState, installApiFixtures } from './fixtures';

const tourismPlace: TourismPlaceItem = {
  id: 'tourism-1',
  name: 'KTO 정보 장소',
  category: 'tourism',
  ktoContentTypeId: '12',
  ktoContentTypeLabel: '관광지',
  ktoFacet: 'tourism',
  district: '중구',
  address: null,
  roadAddress: '대전 중구 테스트로 1',
  summary: 'KTO 정보성 장소입니다.',
  description: null,
  latitude: 36.35,
  longitude: 127.38,
  imageUrl: null,
  sourcePageUrl: 'https://example.com',
  sourceUpdatedAt: null,
  sourceName: 'KTO',
  isCurated: false,
  curatedPlace: null,
};

test('UIUX-017 keeps KTO tourism map layer OFF by default and fetches only after toggle', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({
    authenticated: false,
    tourismPlaces: [tourismPlace],
  }));

  await page.goto('/');

  const tourismToggle = page.locator('[data-tourism-toggle="map"]');
  await expect(tourismToggle).toBeVisible();
  expect(tourismRequests).toEqual([]);

  await tourismToggle.click();

  await expect(tourismToggle).toHaveClass(/is-active/);
  await expect.poll(() => tourismRequests.length).toBe(1);
});
