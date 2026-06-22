import { expect, test } from '@playwright/test';
import { createE2EAppState, e2eReview, installApiFixtures } from './fixtures';

const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;

type SeasonTheme = typeof seasons[number];

async function waitForAppReady(page: Parameters<typeof installApiFixtures>[0]) {
  await expect(page.getByTestId('app-splash')).toHaveCount(0, { timeout: 2200 });
}

async function readThemeSnapshot(page: Parameters<typeof installApiFixtures>[0]) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const rootStyle = getComputedStyle(root);
    const activePill = document.querySelector<HTMLElement>('.bottom-nav__item.is-active .bottom-nav__active-pill');
    const filterButton = document.querySelector<HTMLElement>('.map-floating-nav__filter-btn');

    if (!activePill || !filterButton) {
      throw new Error('Expected seasonal theme probe elements to be present.');
    }

    return {
      dataSeasonTheme: root.dataset.seasonTheme,
      accent: rootStyle.getPropertyValue('--color-accent').trim(),
      navPill: rootStyle.getPropertyValue('--nav-pill-active').trim(),
      progressFill: rootStyle.getPropertyValue('--progress-fill').trim(),
      surfaceApp: rootStyle.getPropertyValue('--surface-app').trim(),
      activePillBackground: getComputedStyle(activePill).backgroundColor,
      filterButtonBackground: getComputedStyle(filterButton).backgroundColor,
    };
  });
}

async function readContentThemeSnapshot(page: Parameters<typeof installApiFixtures>[0]) {
  return page.evaluate(() => {
    const pageStage = document.querySelector<HTMLElement>('.page-stage');
    const reviewCard = document.querySelector<HTMLElement>('.review-card');

    if (!pageStage || !reviewCard) {
      throw new Error('Expected seasonal content probe elements to be present.');
    }

    const pageStageStyle = getComputedStyle(pageStage);
    const reviewCardStyle = getComputedStyle(reviewCard);

    return {
      pageStageBackground: pageStageStyle.backgroundImage || pageStageStyle.backgroundColor,
      reviewCardBackground: reviewCardStyle.backgroundColor,
      reviewCardBorderColor: reviewCardStyle.borderColor,
    };
  });
}

async function readMyPageActionThemeSnapshot(page: Parameters<typeof installApiFixtures>[0]) {
  return page.evaluate(() => {
    const accountAction = document.querySelector<HTMLElement>('.settings-card__avatar-action');

    if (!accountAction) {
      throw new Error('Expected app settings account action button to be present.');
    }

    const actionStyle = getComputedStyle(accountAction);

    return {
      accountActionBackground: actionStyle.backgroundColor,
      accountActionBorderColor: actionStyle.borderColor,
    };
  });
}

async function readSettingsMenuFeedbackSnapshot(page: Parameters<typeof installApiFixtures>[0]) {
  return page.evaluate(() => {
    const trigger = document.querySelector<HTMLElement>('.global-settings-menu__trigger');
    const menuItem = document.querySelector<HTMLElement>('.app-settings-drawer__feedback');

    if (!trigger || !menuItem) {
      throw new Error('Expected settings trigger and drawer feedback link to be present.');
    }

    const triggerStyle = getComputedStyle(trigger);
    const itemStyle = getComputedStyle(menuItem);

    return {
      triggerBackground: triggerStyle.backgroundColor,
      triggerBorderColor: triggerStyle.borderColor,
      menuItemBackground: itemStyle.backgroundColor,
      menuItemBorderColor: itemStyle.borderColor,
    };
  });
}

async function readFeedMoodThemeSnapshot(page: Parameters<typeof installApiFixtures>[0]) {
  return page.evaluate(() => {
    const mood = document.querySelector<HTMLElement>('.review-card__mood-inline');

    if (!mood) {
      throw new Error('Expected feed mood label to be present.');
    }

    return {
      moodColor: getComputedStyle(mood).color,
    };
  });
}

test('TSK-019-05 applies each forced season to semantic tokens without changing navigation structure', async ({ page }) => {
  const snapshots: Array<Awaited<ReturnType<typeof readThemeSnapshot>>> = [];
  const contentSnapshots: Array<Awaited<ReturnType<typeof readContentThemeSnapshot>>> = [];
  const myPageActionSnapshots: Array<Awaited<ReturnType<typeof readMyPageActionThemeSnapshot>>> = [];
  const settingsFeedbackSnapshots: Array<Awaited<ReturnType<typeof readSettingsMenuFeedbackSnapshot>>> = [];
  const feedMoodSnapshots: Array<Awaited<ReturnType<typeof readFeedMoodThemeSnapshot>>> = [];

  for (const season of seasons) {
    await installApiFixtures(page, createE2EAppState({
      authenticated: true,
      reviews: [e2eReview],
    }));

    await page.goto(`/?seasonTheme=${season satisfies SeasonTheme}`);
    await waitForAppReady(page);

    await expect(page.locator('html')).toHaveAttribute('data-season-theme', season);

    const tabKeys = await page.locator('.bottom-nav__item').evaluateAll((items) => (
      items.map((item) => item.getAttribute('data-tab-key'))
    ));
    expect(tabKeys).toEqual(['map', 'event', 'feed', 'course', 'my']);

    await expect(page.locator('[data-app-capsule="root"]')).toBeVisible();
    await expect(page.locator('.bottom-nav__item')).toHaveCount(5);
    await expect(page.locator('.bottom-nav__item.is-active .bottom-nav__active-pill')).toBeVisible();
    await expect(page.locator('.map-floating-nav__filter-btn')).toBeVisible();

    snapshots.push(await readThemeSnapshot(page));

    await page.locator('.bottom-nav__item[data-tab-key="feed"]').click();
    await expect(page.locator('.review-card')).toHaveCount(1);
    feedMoodSnapshots.push(await readFeedMoodThemeSnapshot(page));
    contentSnapshots.push(await readContentThemeSnapshot(page));

    await page.locator('.bottom-nav__item[data-tab-key="my"]').click();
    await expect(page.locator('.account-action-row .secondary-button')).toHaveCount(0);

    const settingsTrigger = page.locator('.global-settings-menu__trigger');
    await settingsTrigger.click();
    await expect(settingsTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('dialog', { name: '앱 설정' })).toBeVisible();
    await expect(page.getByRole('region', { name: '프로필 사진 설정' })).toBeVisible();
    await page.locator('.settings-card__avatar-action').first().hover();
    myPageActionSnapshots.push(await readMyPageActionThemeSnapshot(page));
    await expect(page.getByRole('dialog', { name: '앱 설정' }).getByRole('button', { name: '로그아웃' })).toBeVisible();

    await page.locator('.app-settings-drawer__feedback').first().hover();
    settingsFeedbackSnapshots.push(await readSettingsMenuFeedbackSnapshot(page));
  }

  expect(new Set(snapshots.map((snapshot) => snapshot.dataSeasonTheme))).toEqual(new Set(seasons));
  expect(new Set(snapshots.map((snapshot) => snapshot.accent)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.navPill)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.progressFill)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.surfaceApp)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.activePillBackground)).size).toBeGreaterThan(1);
  expect(new Set(snapshots.map((snapshot) => snapshot.filterButtonBackground)).size).toBeGreaterThan(1);
  expect(new Set(contentSnapshots.map((snapshot) => snapshot.reviewCardBorderColor)).size).toBeGreaterThan(1);
  expect(new Set(myPageActionSnapshots.map((snapshot) => snapshot.accountActionBackground)).size).toBeGreaterThan(1);
  expect(new Set(myPageActionSnapshots.map((snapshot) => snapshot.accountActionBorderColor)).size).toBeGreaterThan(1);
  expect(new Set(feedMoodSnapshots.map((snapshot) => snapshot.moodColor)).size).toBeGreaterThan(1);
  expect(new Set(settingsFeedbackSnapshots.map((snapshot) => snapshot.triggerBackground)).size).toBeGreaterThan(1);
  expect(new Set(settingsFeedbackSnapshots.map((snapshot) => snapshot.menuItemBackground)).size).toBeGreaterThan(1);
  expect(new Set(settingsFeedbackSnapshots.map((snapshot) => snapshot.menuItemBorderColor)).size).toBeGreaterThan(1);
});

test('TSK-019-05 keeps production-only season switcher controls out of the service UI', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/?seasonTheme=winter');
  await waitForAppReady(page);

  await expect(page.locator('[data-season-switcher]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /spring|summer|autumn|winter|봄|여름|가을|겨울/i })).toHaveCount(0);
});
