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

  for (const tabKey of ['map', 'event', 'feed', 'course', 'my']) {
    await expect(page.locator(`[data-tab-key="${tabKey}"]`)).toBeVisible();
  }
});

test('UIUX-024 shows the splash once on initial entry and does not replay on tab changes', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  await expect(page.getByTestId('app-splash')).toBeVisible();
  await expect(page.locator('.app-splash__mark-image')).toBeVisible();
  await expect(page.locator('.app-splash__mark', { hasText: /^J$/ })).toHaveCount(0);
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

  await page.locator('[data-tab-key="feed"]').click();
  await page.locator('[data-tab-key="map"]').click();

  await expect(page.getByTestId('app-splash')).toHaveCount(0);
});

test('UIUX-001 keeps shell slots and five-tab bar inside the phone shell', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const contentSlot = page.locator('[data-app-shell-slot="content"]');
  const bottomTabSlot = page.locator('[data-app-shell-slot="bottom-tab"]');
  const bottomNav = page.getByRole('navigation');
  const bottomNavItems = bottomNav.locator('.bottom-nav__item');

  await expect(phoneShell).toBeVisible();
  await expect(contentSlot).toBeVisible();
  await expect(bottomTabSlot).toBeAttached();
  await expect(bottomNavItems).toHaveCount(5);
  await expect(bottomNavItems.locator('.bottom-nav__icon')).toHaveCount(5);
  await expect(bottomNavItems.locator('.bottom-nav__label')).toHaveCount(5);
  await expect(bottomNav.locator('[aria-current="page"] .bottom-nav__active-pill')).toHaveCount(1);

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

test('UIUX-023 replaces the map header and subnav with a one-line floating capsule', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const floatingNav = page.locator('[data-map-floating-nav="root"]');
  const contentBox = await requireBoundingBox(page.locator('[data-app-shell-slot="content"]'));

  await expect(phoneShell).toHaveClass(/app-shell--header-hidden/);
  await expect(phoneShell).toHaveClass(/app-shell--no-subnav/);
  await expect(page.locator('[data-app-shell-slot="header"]')).toHaveCount(0);
  await expect(page.locator('[data-app-shell-slot="sub-nav"]')).toHaveCount(0);
  await expect(floatingNav).toBeVisible();
  await expect(page.locator('.map-filter-strip')).toHaveCount(0);
  await expect(floatingNav.locator('.map-floating-nav__filter-icon')).toBeVisible();
  await expect(floatingNav.locator('.map-floating-nav__filter-label')).toHaveText('전체');
  await expect(floatingNav.locator('.map-floating-nav__filter-caret')).toBeVisible();

  const navBox = await requireBoundingBox(floatingNav);
  expect(navBox.height).toBeGreaterThanOrEqual(42);
  expect(navBox.height).toBeLessThanOrEqual(48);
  expect(contentBox.y).toBeLessThanOrEqual(navBox.y + 1);

  await floatingNav.getByRole('button', { name: /전체 필터 열기/ }).click();
  const dropdown = floatingNav.locator('.map-floating-nav__dropdown');
  await expect(dropdown).toBeVisible({ timeout: 400 });
  await expect(dropdown.locator('.map-floating-nav__dropdown-icon').first()).toBeVisible();
  await page.screenshot({ timeout: 1000 });
  expect(tourismRequests).toEqual([]);
  const dropdownBox = await requireBoundingBox(dropdown);
  expect(dropdownBox.width).toBeGreaterThanOrEqual(108);
  expect(dropdownBox.width).toBeLessThanOrEqual(118);

  await dropdown.getByRole('menuitem').nth(1).click();
  await expect(dropdown).toHaveCount(0);

  await page.locator('[data-tab-key="my"]').click();

  await expect(phoneShell).toHaveClass(/app-shell--no-subnav/);
  await expect(page.locator('[data-app-shell-slot="sub-nav"]')).toHaveCount(0);
  await expect(page.locator('[data-app-shell-slot="header"]')).toBeVisible();
});

test('UIUX-024 keeps notification panel above the floating capsule overlay layer', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');

  const floatingNav = page.locator('[data-map-floating-nav="root"]');
  await expect(floatingNav).toBeVisible();

  await floatingNav.locator('.global-settings-menu__trigger').click();
  await floatingNav.locator('.global-settings-menu__item').first().click();

  const notificationPanel = page.locator('.global-notification-panel');
  await expect(notificationPanel).toBeVisible();
  await expect(floatingNav.locator('.global-notification-panel')).toHaveCount(0);

  const navBox = await requireBoundingBox(floatingNav);
  const panelBox = await requireBoundingBox(notificationPanel);
  expect(panelBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(navBox.x + navBox.width + 1);

  const isPanelTopHitTarget = await notificationPanel.evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + Math.min(24, rect.width / 2), rect.top + Math.min(24, rect.height / 2));
    return Boolean(target?.closest('.global-notification-panel'));
  });
  expect(isPanelTopHitTarget).toBe(true);
});

test('UIUX-023 keeps the floating capsule single-line across target mobile widths', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const floatingNav = page.locator('[data-map-floating-nav="root"]');
    await expect(floatingNav).toBeVisible();

    const navBox = await requireBoundingBox(floatingNav);
    expect(navBox.height).toBeGreaterThanOrEqual(42);
    expect(navBox.height).toBeLessThanOrEqual(48);

    const hasHorizontalOverflow = await floatingNav.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);
  }
});
