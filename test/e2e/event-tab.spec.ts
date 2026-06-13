import { expect, test } from '@playwright/test';
import { createE2EAppState, installApiFixtures } from './fixtures';

test('UIUX-016 keeps the event tab festival-only and does not request tourism places', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });

  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');
  await page.locator('[data-tab-key="event"]').click();

  const eventSurface = page.locator('[data-page-surface="event"]');

  await expect(eventSurface).toBeVisible();
  await expect(eventSurface.locator('.sheet-card')).toBeVisible();
  await expect(eventSurface.locator('[role="tab"], [data-tourism-segment]')).toHaveCount(0);
  expect(tourismRequests).toEqual([]);
});
