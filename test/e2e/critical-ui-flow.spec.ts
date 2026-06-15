import { expect, test, type Locator } from '@playwright/test';
import {
  createE2EAppState,
  e2eReview,
  installApiFixtures,
} from './fixtures';

async function requireBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }
  return box;
}

test('UIUX-009 keeps drawer and bottom navigation anchored while writing a review', async ({ page }) => {
  const state = createE2EAppState();
  await installApiFixtures(page, state);

  await page.goto('/?tab=map&place=place-1&drawer=full');

  await expect(page.locator('.place-drawer--full')).toBeVisible();
  await expect(page.locator('[data-map-sheet-state="full"]')).toBeVisible();

  const bottomNav = page.getByRole('navigation');
  const beforeFocus = await requireBoundingBox(bottomNav);
  await expect(bottomNav).toHaveCSS('pointer-events', 'auto');
  await expect(bottomNav).toHaveCSS('opacity', '1');

  const reviewBody = page.locator('.review-composer textarea');
  await reviewBody.scrollIntoViewIfNeeded();
  await reviewBody.focus();
  const afterFocus = await requireBoundingBox(bottomNav);

  expect(Math.abs(afterFocus.y - beforeFocus.y)).toBeLessThan(2);

  const createdBody = '모바일 작성 E2E 확인입니다';
  await reviewBody.fill(createdBody);
  await page.locator('.review-composer button[type="submit"]').click();

  await expect(page.locator('.place-drawer__feed-preview')).toContainText(createdBody);
});

test('UIUX-020 keeps map bottom drawer full until explicit minimize while preserving bottom navigation', async ({ page }) => {
  const state = createE2EAppState();
  await installApiFixtures(page, state);

  await page.goto('/?tab=map&place=place-1&drawer=partial');

  const drawer = page.locator('.place-drawer');
  const handle = page.locator('.place-drawer__handle');
  const bottomNav = page.getByRole('navigation');

  await expect(page.locator('[data-map-sheet-state="peek"]')).toBeVisible();

  await handle.click();
  await expect(page.locator('[data-map-sheet-state="full"]')).toBeVisible();
  await expect(bottomNav).toHaveCSS('pointer-events', 'auto');
  await expect(bottomNav).toHaveCSS('opacity', '1');

  const fullBox = await requireBoundingBox(drawer);
  const contentBox = await requireBoundingBox(page.locator('[data-app-shell-slot="content"]'));
  const bottomNavBox = await requireBoundingBox(bottomNav);
  expect(fullBox.y).toBeLessThanOrEqual(contentBox.y + 1);
  expect(bottomNavBox.y - (fullBox.y + fullBox.height)).toBeGreaterThanOrEqual(12);

  await handle.click();
  await expect(page.locator('[data-map-sheet-state="full"]')).toBeVisible();

  await page.getByRole('button', { name: '시트 최소화' }).click();
  await expect(page.locator('[data-map-sheet-state="peek"]')).toBeVisible();
});

test('UIUX-010 supports feed comment creation, like toggle, and place CTA', async ({ page }) => {
  const state = createE2EAppState({ reviews: [e2eReview] });
  await installApiFixtures(page, state);

  await page.goto('/?tab=feed');

  await expect(page.getByText(e2eReview.body)).toBeVisible();
  await page.locator('article[data-review-id="review-1"] .review-action-button').nth(1).click();
  await expect(page.locator('.feed-comment-sheet--open')).toBeVisible();

  const commentBody = '댓글 작성 E2E 확인';
  await page.locator('.feed-comment-sheet input').fill(commentBody);
  await page.locator('.feed-comment-sheet button[type="submit"]').click();
  await expect(page.locator('.feed-comment-sheet')).toContainText(commentBody);

  await page.locator('.feed-comment-sheet__close').click();
  await page.locator('article[data-review-id="review-1"] .review-action-button[aria-pressed="false"]').click();
  await expect(page.locator('article[data-review-id="review-1"] .review-action-button[aria-pressed="true"]')).toContainText('3');

  await page.locator('article[data-review-id="review-1"] .review-link-button').click();
  const peekDrawer = page.locator('[data-map-sheet-state="peek"]');
  await expect(peekDrawer).toBeVisible();
  const bottomNav = page.getByRole('navigation');
  const drawerBox = await requireBoundingBox(peekDrawer);
  const bottomNavBox = await requireBoundingBox(bottomNav);
  expect(bottomNavBox.y - (drawerBox.y + drawerBox.height)).toBeGreaterThanOrEqual(12);
});

test('UIUX-011 and UIUX-012 keep course sorting and my-page authenticated state usable', async ({ page }) => {
  const state = createE2EAppState({ reviews: [e2eReview] });
  await installApiFixtures(page, state);

  await page.goto('/?tab=course');

  const sortButtons = page.locator('[data-page-surface="course"] .chip-row button');
  await expect(sortButtons.first()).toBeVisible();
  await sortButtons.nth(1).click();
  await expect(sortButtons.nth(1)).toHaveClass(/is-active/);

  await page.getByRole('button', { name: '마이' }).click();
  await expect(page.locator('.my-page-primary-tabs')).toBeVisible();
  await expect(page.locator('.my-page-primary-tabs button')).toHaveCount(4);
});
