import { expect, test, type Locator } from '@playwright/test';
import { createE2EAppState, installApiFixtures } from './fixtures';

async function requireBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }
  return box;
}

async function expectElementCenterToResolveInside(locator: Locator, closestSelector: string) {
  const isTargetHit = await locator.evaluate((element, selector) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return Boolean(target?.closest(selector));
  }, closestSelector);
  expect(isTargetHit).toBe(true);
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
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const contentSlot = page.locator('[data-app-shell-slot="content"]');
  const bottomTabSlot = page.locator('[data-app-shell-slot="bottom-tab"]');
  const bottomNav = page.locator('.bottom-nav');
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

  const bottomNav = page.locator('.bottom-nav');
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
    await expect(page.locator('[data-app-shell-slot="header"]')).toHaveCount(0);
    await expect(page.locator(`[data-app-capsule-center-tab="${tabKey}"]`)).toBeVisible();
  }

  await bottomNav.locator('[data-tab-key="map"]').click();
  await expect(bottomNav.locator('[data-tab-key="map"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.map-stage')).toBeVisible();
});

test('UIUX-014 keeps tab content surfaces accessible inside the app shell', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');

  const bottomNav = page.locator('.bottom-nav');

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
  const appCapsule = page.locator('[data-app-capsule="root"]');
  const floatingNav = appCapsule.locator('[data-map-floating-nav="root"]');
  const contentBox = await requireBoundingBox(page.locator('[data-app-shell-slot="content"]'));

  await expect(phoneShell).toHaveClass(/app-shell--header-hidden/);
  await expect(phoneShell).toHaveClass(/app-shell--no-subnav/);
  await expect(page.locator('[data-app-shell-slot="header"]')).toHaveCount(0);
  await expect(page.locator('[data-app-shell-slot="sub-nav"]')).toHaveCount(0);
  await expect(appCapsule).toBeVisible();
  await expect(floatingNav).toBeVisible();
  await expect(page.locator('.map-filter-strip')).toHaveCount(0);
  await expect(floatingNav.locator('.map-floating-nav__filter-icon')).toBeVisible();
  await expect(floatingNav.locator('.map-floating-nav__filter-label')).toBeVisible();
  await expect(floatingNav.locator('.map-floating-nav__filter-caret')).toBeVisible();

  const navBox = await requireBoundingBox(appCapsule);
  expect(navBox.height).toBeGreaterThanOrEqual(42);
  expect(navBox.height).toBeLessThanOrEqual(48);
  expect(contentBox.y).toBeLessThanOrEqual(navBox.y + 1);

  await floatingNav.locator('.map-floating-nav__filter-btn').click();
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

  await expect(phoneShell).toHaveClass(/app-shell--header-hidden/);
  await expect(phoneShell).toHaveClass(/app-shell--no-subnav/);
  await expect(page.locator('[data-app-shell-slot="sub-nav"]')).toHaveCount(0);
  await expect(page.locator('[data-app-shell-slot="header"]')).toHaveCount(0);
  await expect(appCapsule).toBeVisible();
  await expect(appCapsule.locator('[data-app-capsule-center-tab="my"]')).toBeVisible();
});

test('UIUX-024 keeps notification panel above the floating capsule overlay layer', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  const floatingNav = appCapsule.locator('[data-map-floating-nav="root"]');
  await expect(appCapsule).toBeVisible();
  await expect(floatingNav).toBeVisible();

  await appCapsule.locator('.global-settings-menu__trigger').click();
  await appCapsule.locator('.global-settings-menu__item').first().click();

  const notificationPanel = page.locator('.global-notification-panel');
  await expect(notificationPanel).toBeVisible();
  await expect(floatingNav.locator('.global-notification-panel')).toHaveCount(0);

  const navBox = await requireBoundingBox(appCapsule);
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

test('TSK-016-06 keeps notification panel above the capsule across target mobile widths', async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await installApiFixtures(page, createE2EAppState());

    await page.goto('/');

    const appCapsule = page.locator('[data-app-capsule="root"]');
    await expect(appCapsule).toBeVisible();

    await appCapsule.locator('.global-settings-menu__trigger').click();
    await appCapsule.locator('.global-settings-menu__item').first().click();

    const notificationPanel = page.locator('.global-notification-panel');
    await expect(notificationPanel).toBeVisible();
    await expectElementCenterToResolveInside(notificationPanel, '.global-notification-panel');

    const capsuleBox = await requireBoundingBox(appCapsule);
    const panelBox = await requireBoundingBox(notificationPanel);
    expect(panelBox.y).toBeGreaterThanOrEqual(capsuleBox.y + capsuleBox.height - 1);
  }
});

test('TSK-016-04 opens and closes the SideDrawer shell from the AppCapsule menu action', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  await expect(appCapsule).toBeVisible();

  await appCapsule.getByRole('button', { name: '메뉴 열기' }).click();

  const sideDrawer = page.getByRole('dialog', { name: '사이드 메뉴' });
  await expect(sideDrawer).toBeVisible();
  await expect(page.getByText('메뉴 준비 중')).toHaveCount(0);
  await expect(page.locator('[data-side-drawer-slot="content"]')).toBeEmpty();

  const drawerBox = await requireBoundingBox(sideDrawer);
  const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
  expect(drawerBox.x).toBeGreaterThanOrEqual(phoneShellBox.x - 1);
  expect(drawerBox.x + drawerBox.width).toBeLessThan(phoneShellBox.x + phoneShellBox.width);

  await page.getByRole('button', { name: '메뉴 닫기' }).last().click();
  await expect(sideDrawer).toHaveCount(0);
});

test('TSK-016-05 opens SpeedDialFAB and runs a map action without blocking shell controls', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

  const speedDial = page.locator('[data-speed-dial-fab="root"]');
  await expect(speedDial).toBeVisible();

  await speedDial.getByRole('button', { name: '지도 빠른 작업 열기' }).click();
  await expect(speedDial.getByRole('menuitem', { name: '내 위치 찾기' })).toBeVisible();

  await speedDial.getByRole('menuitem', { name: '내 위치 찾기' }).click();
  await expect(speedDial.getByRole('menuitem', { name: '내 위치 찾기' })).toHaveCount(0);

  await page.locator('[data-tab-key="feed"]').click();
  await expect(page.locator('[data-tab-key="feed"]')).toHaveAttribute('aria-current', 'page');

  await page.locator('[data-tab-key="map"]').click();
  await expect(page.locator('[data-speed-dial-fab="root"]')).toBeVisible();
});

test('TSK-016-06 keeps FAB hidden and bottom navigation hittable while map drawers are open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installApiFixtures(page, createE2EAppState());

  for (const drawerState of ['peek', 'half', 'full']) {
    await page.goto(`/?tab=map&place=place-1&drawer=${drawerState}`);
    await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

    const drawer = page.locator(`[data-map-sheet-state="${drawerState}"]`);
    const bottomNav = page.getByRole('navigation', { name: '하단 네비게이션' });

    await expect(drawer).toBeVisible();
    await expect(page.locator('[data-speed-dial-fab="root"]')).toHaveCount(0);
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toHaveCSS('pointer-events', 'auto');
    await expect(bottomNav).toHaveCSS('opacity', '1');

    const drawerBox = await requireBoundingBox(drawer);
    const bottomNavBox = await requireBoundingBox(bottomNav);
    expect(bottomNavBox.y - (drawerBox.y + drawerBox.height)).toBeGreaterThanOrEqual(10);
    await expectElementCenterToResolveInside(bottomNav.locator('[data-tab-key="feed"]'), '.bottom-nav');
  }
});

test('TSK-016-06 keeps KTO toggle and filter responsive after overlay layering changes', async ({ page }) => {
  const tourismRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/tourism/places')) {
      tourismRequests.push(url);
    }
  });
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  const floatingNav = appCapsule.locator('[data-map-floating-nav="root"]');
  await expect(appCapsule).toBeVisible();
  await expect(floatingNav).toBeVisible();

  await floatingNav.locator('[data-tourism-toggle="map"]').click();
  await expect(floatingNav.locator('[data-tourism-toggle="map"]')).toHaveAttribute('aria-pressed', 'true', { timeout: 400 });
  await expect.poll(() => tourismRequests.length).toBe(1);
  expect(tourismRequests[0]).toContain('scope=all');

  await floatingNav.locator('.map-floating-nav__filter-btn').click();
  await expect(floatingNav.locator('.map-floating-nav__dropdown')).toBeVisible({ timeout: 400 });
  await page.screenshot({ timeout: 1000 });
});

test('UIUX-023 keeps the floating capsule single-line across target mobile widths', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const appCapsule = page.locator('[data-app-capsule="root"]');
    const floatingNav = appCapsule.locator('[data-map-floating-nav="root"]');
    await expect(appCapsule).toBeVisible();
    await expect(floatingNav).toBeVisible();

    const navBox = await requireBoundingBox(appCapsule);
    expect(navBox.height).toBeGreaterThanOrEqual(42);
    expect(navBox.height).toBeLessThanOrEqual(48);

    const hasHorizontalOverflow = await appCapsule.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);
  }
});
