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

test('TSK-019-05 applies each forced season to semantic tokens without changing navigation structure', async ({ page }) => {
  const snapshots: Array<Awaited<ReturnType<typeof readThemeSnapshot>>> = [];

  for (const season of seasons) {
    await installApiFixtures(page, createE2EAppState({
      authenticated: false,
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
  }

  expect(new Set(snapshots.map((snapshot) => snapshot.dataSeasonTheme))).toEqual(new Set(seasons));
  expect(new Set(snapshots.map((snapshot) => snapshot.accent)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.navPill)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.progressFill)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.surfaceApp)).size).toBe(seasons.length);
  expect(new Set(snapshots.map((snapshot) => snapshot.activePillBackground)).size).toBeGreaterThan(1);
  expect(new Set(snapshots.map((snapshot) => snapshot.filterButtonBackground)).size).toBeGreaterThan(1);
});

test('TSK-019-05 keeps production-only season switcher controls out of the service UI', async ({ page }) => {
  await installApiFixtures(page, createE2EAppState({ authenticated: false }));

  await page.goto('/?seasonTheme=winter');
  await waitForAppReady(page);

  await expect(page.locator('[data-season-switcher]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /spring|summer|autumn|winter|봄|여름|가을|겨울/i })).toHaveCount(0);
});
