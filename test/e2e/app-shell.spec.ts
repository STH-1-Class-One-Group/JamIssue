import { expect, test, type Locator } from '@playwright/test';
import { createE2EAppState, installApiFixtures } from './fixtures';

const unreadNotifications = [
  {
    id: 'notification-feed-1',
    type: 'review-like',
    title: '피드 작성이 완료되었습니다.',
    body: '컨트라스 피드를 남겼어요.',
    createdAt: '03. 30. 18:05',
    isRead: false,
    reviewId: 'review-1',
    commentId: null,
    routeId: null,
    actorName: 'code305',
  },
  {
    id: 'notification-feed-2',
    type: 'review-comment',
    title: '피드 작성이 완료되었습니다.',
    body: '오타 피드를 남겼어요.',
    createdAt: '03. 30. 17:37',
    isRead: false,
    reviewId: 'review-1',
    commentId: 'comment-1',
    routeId: null,
    actorName: 'code305',
  },
] as const;

async function requireBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }
  return box;
}

async function expectElementCenterToResolveInside(locator: Locator, closestSelector: string) {
  const hitResult = await locator.evaluate((element, selector) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      className: target instanceof HTMLElement ? target.className : null,
      isTargetHit: Boolean(target?.closest(selector)),
      tagName: target?.tagName ?? null,
      text: target?.textContent?.slice(0, 80) ?? null,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, closestSelector);
  expect(hitResult.isTargetHit, JSON.stringify(hitResult)).toBe(true);
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
  await expect(bottomNavItems.locator('.bottom-nav__icon-frame')).toHaveCount(5);
  await expect(bottomNavItems.locator('.bottom-nav__label')).toHaveCount(5);
  await expect(bottomNav.locator('[aria-current="page"] .bottom-nav__active-pill')).toHaveCount(1);

  const shellBox = await requireBoundingBox(phoneShell);
  const navBox = await requireBoundingBox(bottomNav);
  await expect(phoneShell).toHaveCSS('border-radius', '0px');
  await expect(phoneShell).toHaveCSS('border-top-width', '0px');
  await expect(phoneShell).toHaveCSS('box-shadow', 'none');
  expect(shellBox.width).toBeGreaterThanOrEqual(389);
  expect(shellBox.height).toBeGreaterThanOrEqual(843);
  expect(navBox.x).toBeGreaterThanOrEqual(shellBox.x - 1);
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(shellBox.x + shellBox.width + 1);
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(shellBox.y + shellBox.height + 1);
  expect(navBox.height).toBeLessThanOrEqual(88);

  const itemBoxes = await bottomNavItems.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  const widest = Math.max(...itemBoxes);
  const narrowest = Math.min(...itemBoxes);
  expect(widest - narrowest).toBeLessThan(2);

  const activeItem = bottomNav.locator('[aria-current="page"]');
  const activeItemBox = await requireBoundingBox(activeItem);
  const activePillBox = await requireBoundingBox(activeItem.locator('.bottom-nav__active-pill'));
  expect(activePillBox.width).toBeLessThan(activeItemBox.width * 0.74);
});

test('TSK-016-09 restores a centered phone preview shell only on desktop hover viewports', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    hasTouch: false,
    isMobile: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

  const phoneShell = page.locator('[data-app-shell="phone"]');
  const bottomNav = page.locator('.bottom-nav');

  await expect(phoneShell).toBeVisible();
  await expect(phoneShell).not.toHaveCSS('border-radius', '0px');
  await expect(phoneShell).not.toHaveCSS('box-shadow', 'none');

  const shellBox = await requireBoundingBox(phoneShell);
  const navBox = await requireBoundingBox(bottomNav);
  expect(shellBox.width).toBeGreaterThanOrEqual(420);
  expect(shellBox.width).toBeLessThanOrEqual(432);
  expect(Math.abs(shellBox.x + shellBox.width / 2 - 640)).toBeLessThanOrEqual(2);
  expect(shellBox.height).toBeLessThanOrEqual(920);
  expect(shellBox.height).toBeLessThan(900);
  expect(navBox.x).toBeGreaterThanOrEqual(shellBox.x - 1);
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(shellBox.x + shellBox.width + 1);
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(shellBox.y + shellBox.height + 1);
  await context.close();
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

test('TSK-021-08 opens notifications in the left information drawer', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ notifications: [...unreadNotifications] }));

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  const floatingNav = appCapsule.locator('[data-map-floating-nav="root"]');
  await expect(appCapsule).toBeVisible();
  await expect(floatingNav).toBeVisible();

  await appCapsule.getByRole('button', { name: '보조 메뉴 열기' }).click();

  const notificationDrawer = page.getByRole('dialog', { name: '보조 메뉴' });
  await expect(notificationDrawer.getByRole('menuitem', { name: /알림/ })).toBeVisible();
  await notificationDrawer.getByRole('menuitem', { name: /알림/ }).click();
  const notificationPanel = page.locator('.global-notification-panel');
  await expect(notificationDrawer).toBeVisible();
  await expect(notificationPanel).toBeVisible();
  await expect(floatingNav.locator('.global-notification-panel')).toHaveCount(0);
  await expect(notificationPanel.locator('.notification-item.is-unread')).toHaveCount(2);

  const markAllButton = notificationPanel.getByRole('button', { name: '모두 읽음' });
  await expect(markAllButton).toBeEnabled();
  await markAllButton.click();
  await expect(notificationPanel.locator('.notification-item.is-unread')).toHaveCount(0);
  await expect(markAllButton).toBeDisabled();

  const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
  const capsuleBox = await requireBoundingBox(appCapsule);
  const bottomNavBox = await requireBoundingBox(page.locator('.bottom-nav'));
  const drawerPanelBox = await requireBoundingBox(page.locator('.side-drawer__panel'));
  const panelBox = await requireBoundingBox(notificationPanel);
  expect(drawerPanelBox.x).toBeGreaterThanOrEqual(phoneShellBox.x + 6);
  expect(drawerPanelBox.x).toBeLessThan(phoneShellBox.x + phoneShellBox.width / 2);
  expect(drawerPanelBox.x + drawerPanelBox.width).toBeLessThanOrEqual(phoneShellBox.x + phoneShellBox.width - 6);
  expect(drawerPanelBox.y).toBeGreaterThanOrEqual(capsuleBox.y + capsuleBox.height);
  expect(drawerPanelBox.y + drawerPanelBox.height).toBeLessThanOrEqual(bottomNavBox.y + 1);
  expect(panelBox.x).toBeGreaterThanOrEqual(drawerPanelBox.x);
  expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(drawerPanelBox.x + drawerPanelBox.width + 1);

  const isPanelTopHitTarget = await notificationPanel.evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + Math.min(24, rect.width / 2), rect.top + Math.min(24, rect.height / 2));
    return Boolean(target?.closest('.global-notification-panel'));
  });
  expect(isPanelTopHitTarget).toBe(true);
});

test('TSK-021-08 keeps the left notification drawer usable across target mobile widths', async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await installApiFixtures(page, createE2EAppState());

    await page.goto('/');

    const appCapsule = page.locator('[data-app-capsule="root"]');
    await expect(appCapsule).toBeVisible();

    await appCapsule.getByRole('button', { name: '보조 메뉴 열기' }).click();

    const notificationDrawer = page.getByRole('dialog', { name: '보조 메뉴' });
    await notificationDrawer.getByRole('menuitem', { name: /알림/ }).click();
    const notificationPanel = page.locator('.global-notification-panel');
    await expect(notificationDrawer).toBeVisible();
    await expect(notificationPanel).toBeVisible();
    await expectElementCenterToResolveInside(notificationPanel, '.global-notification-panel');

    const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
    const capsuleBox = await requireBoundingBox(appCapsule);
    const bottomNavBox = await requireBoundingBox(page.locator('.bottom-nav'));
    const drawerPanelBox = await requireBoundingBox(page.locator('.side-drawer__panel'));
    expect(drawerPanelBox.x).toBeGreaterThanOrEqual(phoneShellBox.x + 6);
    expect(drawerPanelBox.x + drawerPanelBox.width).toBeLessThanOrEqual(phoneShellBox.x + phoneShellBox.width - 6);
    expect(drawerPanelBox.y).toBeGreaterThanOrEqual(capsuleBox.y + capsuleBox.height);
    expect(drawerPanelBox.y + drawerPanelBox.height).toBeLessThanOrEqual(bottomNavBox.y + 1);
  }
});

test('TSK-021-09 opens the right settings drawer without freezing shell hit targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  await expect(appCapsule).toBeVisible();
  await expect(page.locator('.global-settings-menu__menu')).toHaveCount(0);

  await appCapsule.getByRole('button', { name: '앱 설정 열기' }).click();

  const settingsDrawer = page.getByRole('dialog', { name: '앱 설정' });
  await expect(settingsDrawer).toBeVisible({ timeout: 300 });
  await expect(page.locator('.global-settings-menu__menu')).toHaveCount(0);
  await expect(settingsDrawer.getByText('계정 관리')).toBeVisible();
  await expect(settingsDrawer.getByText('지도 표시')).toBeVisible();
  const mapDisplaySwitch = settingsDrawer.locator('[data-app-setting="show-curated-with-tourism"]');
  const mapDisplayTrack = mapDisplaySwitch.locator('.toggle-switch__track');
  await expect(mapDisplaySwitch).toBeVisible();
  await expectElementCenterToResolveInside(mapDisplayTrack, '.app-settings-drawer__panel');

  const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
  const capsuleBox = await requireBoundingBox(appCapsule);
  const bottomNavBox = await requireBoundingBox(page.locator('.bottom-nav'));
  const settingsPanelBox = await requireBoundingBox(page.locator('.app-settings-drawer__panel'));
  expect(settingsPanelBox.y).toBeGreaterThanOrEqual(capsuleBox.y + capsuleBox.height);
  expect(settingsPanelBox.y + settingsPanelBox.height).toBeLessThanOrEqual(bottomNavBox.y + 1);
  expect(settingsPanelBox.x).toBeGreaterThanOrEqual(phoneShellBox.x + 6);
  expect(settingsPanelBox.x + settingsPanelBox.width / 2).toBeGreaterThan(phoneShellBox.x + phoneShellBox.width / 2);
  expect(settingsPanelBox.x + settingsPanelBox.width).toBeLessThanOrEqual(phoneShellBox.x + phoneShellBox.width - 6);

  await settingsDrawer.getByRole('button', { name: '앱 설정 닫기' }).click();
  await expect(settingsDrawer).toHaveCount(0);

  const feedTab = page.locator('[data-tab-key="feed"]');
  await expectElementCenterToResolveInside(feedTab, '.bottom-nav');
  await feedTab.click();
  await expect(feedTab).toHaveAttribute('aria-current', 'page');
});

test('TSK-021-09 keeps the right settings drawer hittable inside desktop phone preview', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    hasTouch: false,
    isMobile: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await installApiFixtures(page, createE2EAppState());

  await page.goto('/');
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });

  const appCapsule = page.locator('[data-app-capsule="root"]');
  await expect(appCapsule).toBeVisible();
  await appCapsule.getByRole('button', { name: '앱 설정 열기' }).click();

  const settingsDrawer = page.getByRole('dialog', { name: '앱 설정' });
  const mapDisplaySwitch = settingsDrawer.locator('[data-app-setting="show-curated-with-tourism"]');
  const mapDisplayTrack = mapDisplaySwitch.locator('.toggle-switch__track');
  await expect(settingsDrawer).toBeVisible({ timeout: 300 });
  await expect(mapDisplaySwitch).toBeVisible();
  await expectElementCenterToResolveInside(mapDisplayTrack, '.app-settings-drawer__panel');

  const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
  const capsuleBox = await requireBoundingBox(appCapsule);
  const bottomNavBox = await requireBoundingBox(page.locator('.bottom-nav'));
  const settingsPanelBox = await requireBoundingBox(page.locator('.app-settings-drawer__panel'));
  expect(settingsPanelBox.y).toBeGreaterThanOrEqual(capsuleBox.y + capsuleBox.height);
  expect(settingsPanelBox.y + settingsPanelBox.height).toBeLessThanOrEqual(bottomNavBox.y + 1);
  expect(settingsPanelBox.x + settingsPanelBox.width / 2).toBeGreaterThan(phoneShellBox.x + phoneShellBox.width / 2);
  expect(settingsPanelBox.x + settingsPanelBox.width).toBeLessThanOrEqual(phoneShellBox.x + phoneShellBox.width - 6);

  await settingsDrawer.getByRole('button', { name: '앱 설정 닫기' }).click();
  await expect(settingsDrawer).toHaveCount(0);
  await context.close();
});

test('TSK-021-06 opens general secondary SideDrawer items without duplicating primary navigation', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/');

  const appCapsule = page.locator('[data-app-capsule="root"]');
  await expect(appCapsule).toBeVisible();

  await appCapsule.getByRole('button', { name: '보조 메뉴 열기' }).click();

  const sideDrawer = page.getByRole('dialog', { name: '보조 메뉴' });
  await expect(sideDrawer).toBeVisible();
  await expect(sideDrawer.getByRole('menuitem', { name: /이용 안내/ })).toBeVisible();
  await sideDrawer.getByRole('menuitem', { name: /이용 안내/ }).click();
  await expect(sideDrawer.getByLabel('이용 안내 상세')).toContainText('하단 탭은 주요 화면 이동');
  await expect(sideDrawer.getByRole('menuitem', { name: /^지도$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^행사$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^피드$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^코스$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^마이$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^설정$/ })).toHaveCount(0);
  await expect(sideDrawer.getByRole('menuitem', { name: /^로그아웃$/ })).toHaveCount(0);

  const drawerBox = await requireBoundingBox(sideDrawer);
  const phoneShellBox = await requireBoundingBox(page.locator('[data-app-shell="phone"]'));
  expect(drawerBox.x).toBeGreaterThanOrEqual(phoneShellBox.x - 1);
  expect(drawerBox.x + drawerBox.width).toBeLessThan(phoneShellBox.x + phoneShellBox.width);

  await page.getByRole('button', { name: '보조 메뉴 닫기' }).last().click();
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
    const drawerBottomGap = bottomNavBox.y - (drawerBox.y + drawerBox.height);
    expect(drawerBottomGap).toBeGreaterThanOrEqual(-1);
    expect(drawerBottomGap).toBeLessThanOrEqual(2);
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
  await expect(floatingNav.getByRole('switch', { name: '관광정보' })).toBeChecked({ timeout: 400 });
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
