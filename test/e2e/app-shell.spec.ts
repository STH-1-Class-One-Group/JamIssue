import { expect, test, type Locator } from '@playwright/test';
import { createE2EAppState, installApiFixtures } from './fixtures';

async function requireBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }
  return box;
}

test('mobile app shell exposes primary tabs from the built bundle', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  await expect(page.getByRole('button', { name: '지도' })).toBeVisible();
  await expect(page.getByRole('button', { name: '행사' })).toBeVisible();
  await expect(page.getByRole('button', { name: '피드' })).toBeVisible();
  await expect(page.getByRole('button', { name: '코스' })).toBeVisible();
  await expect(page.getByRole('button', { name: '마이' })).toBeVisible();
});

test('UIUX-001 keeps shell slots and five-tab bar inside the phone shell', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const contentSlot = page.locator('[data-app-shell-slot="content"]');
  const headerActions = page.locator('[data-app-shell-slot="header-actions"]');
  const bottomTabSlot = page.locator('[data-app-shell-slot="bottom-tab"]');
  const bottomNav = page.getByRole('navigation', { name: '하단 네비게이션' });
  const bottomNavItems = bottomNav.locator('.bottom-nav__item');

  await expect(phoneShell).toBeVisible();
  await expect(contentSlot).toBeVisible();
  await expect(headerActions).toBeVisible();
  await expect(bottomTabSlot).toBeAttached();
  await expect(bottomNavItems).toHaveCount(5);

  const shellBox = await requireBoundingBox(phoneShell);
  const navBox = await requireBoundingBox(bottomNav);
  expect(navBox.x).toBeGreaterThanOrEqual(shellBox.x - 1);
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(shellBox.x + shellBox.width + 1);
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(shellBox.y + shellBox.height + 1);

  const itemBoxes = await bottomNavItems.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  const widest = Math.max(...itemBoxes);
  const narrowest = Math.min(...itemBoxes);
  expect(widest - narrowest).toBeLessThan(2);
});
