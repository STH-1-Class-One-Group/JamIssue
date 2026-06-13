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

test('UIUX-013 keeps five-tab IA and hides map stage on non-map tabs', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const bottomNav = page.getByRole('navigation');
  const tabKeys = await bottomNav.locator('.bottom-nav__item').evaluateAll((items) => (
    items.map((item) => item.getAttribute('data-tab-key'))
  ));
  expect(tabKeys).toEqual(['map', 'event', 'feed', 'course', 'my']);

  await expect(page.locator('.map-stage')).toBeVisible();

  for (const tabKey of ['event', 'feed', 'course', 'my']) {
    await bottomNav.locator(`[data-tab-key="${tabKey}"]`).click();
    await expect(bottomNav.locator(`[data-tab-key="${tabKey}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.map-stage')).toHaveCount(0);
    await expect(page.locator('.page-stage')).toBeVisible();
  }

  await bottomNav.locator('[data-tab-key="map"]').click();
  await expect(bottomNav.locator('[data-tab-key="map"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.map-stage')).toBeVisible();
});

test('UIUX-014 keeps tab content surfaces accessible inside the app shell', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');

  const bottomNav = page.getByRole('navigation');

  for (const tabKey of ['event', 'feed', 'course', 'my']) {
    await bottomNav.locator(`[data-tab-key="${tabKey}"]`).click();
    const surface = page.locator(`[data-page-surface="${tabKey}"]`);
    await expect(surface).toBeVisible();
    await expect(surface).toHaveClass(/page-panel--scrollable/);

    const surfaceBox = await requireBoundingBox(surface);
    const contentSlotBox = await requireBoundingBox(page.locator('[data-app-shell-slot="content"]'));
    expect(surfaceBox.x).toBeGreaterThanOrEqual(contentSlotBox.x - 1);
    expect(surfaceBox.x + surfaceBox.width).toBeLessThanOrEqual(contentSlotBox.x + contentSlotBox.width + 1);
  }
});

test('UIUX-015 moves map filters into the app shell sub navigation flow', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const subNavSlot = page.locator('[data-app-shell-slot="sub-nav"]');
  const filterStrip = subNavSlot.locator('.map-filter-strip');

  await expect(phoneShell).toHaveClass(/app-shell--with-subnav/);
  await expect(subNavSlot).toBeVisible();
  await expect(filterStrip).toBeVisible();
  await expect(page.locator('.map-stage > .map-filter-strip')).toHaveCount(0);

  const headerBox = await requireBoundingBox(page.locator('[data-app-shell-slot="header"]'));
  const subNavBox = await requireBoundingBox(subNavSlot);
  const contentBox = await requireBoundingBox(page.locator('[data-app-shell-slot="content"]'));

  expect(subNavBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
  expect(contentBox.y).toBeGreaterThanOrEqual(subNavBox.y + subNavBox.height - 1);

  await page.locator('[data-tab-key="my"]').click();

  await expect(phoneShell).toHaveClass(/app-shell--no-subnav/);
  await expect(page.locator('[data-app-shell-slot="sub-nav"]')).toHaveCount(0);
});
