import { expect, test } from '@playwright/test';
import { createE2EAppState, installApiFixtures } from './fixtures';

test('mobile app shell exposes primary tabs from the built bundle', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  await expect(page.getByRole('button', { name: '지도' })).toBeVisible();
  await expect(page.getByRole('button', { name: '행사' })).toBeVisible();
  await expect(page.getByRole('button', { name: '피드' })).toBeVisible();
  await expect(page.getByRole('button', { name: '코스' })).toBeVisible();
  await expect(page.getByRole('button', { name: '마이' })).toBeVisible();
});
