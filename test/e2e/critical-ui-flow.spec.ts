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
  await expect(page.getByRole('heading', { name: '테스트 카페', exact: true })).toBeVisible();

  const bottomNav = page.getByRole('navigation', { name: '하단 네비게이션' });
  const beforeFocus = await requireBoundingBox(bottomNav);
  const reviewBody = page.getByLabel('오늘의 기록');
  await reviewBody.scrollIntoViewIfNeeded();
  await reviewBody.focus();
  const afterFocus = await requireBoundingBox(bottomNav);

  expect(Math.abs(afterFocus.y - beforeFocus.y)).toBeLessThan(2);

  const createdBody = '모바일 작성 E2E 확인입니다.';
  await reviewBody.fill(createdBody);
  await page.locator('.review-composer button[type="submit"]').click();

  await expect(page.locator('.place-drawer__feed-preview')).toContainText(createdBody);
});

test('UIUX-010 supports feed comment creation, like toggle, and place CTA', async ({ page }) => {
  const state = createE2EAppState({ reviews: [e2eReview] });
  await installApiFixtures(page, state);

  await page.goto('/?tab=feed');

  await expect(page.getByText(e2eReview.body)).toBeVisible();
  await page.getByRole('button', { name: '댓글 0개 보기' }).click();
  await expect(page.getByRole('region', { name: '댓글 시트' })).toBeVisible();

  const commentBody = '댓글 작성 E2E 확인';
  await page.getByPlaceholder('댓글 내용을 적어 보세요.').fill(commentBody);
  await page.getByRole('button', { name: '등록' }).click();
  await expect(page.locator('.feed-comment-sheet')).toContainText(commentBody);

  await page.locator('.feed-comment-sheet__close').click();
  await page.locator('article[data-review-id="review-1"] .review-action-button[aria-pressed="false"]').click();
  await expect(page.locator('article[data-review-id="review-1"] .review-action-button[aria-pressed="true"]')).toContainText('3');

  await page.getByRole('button', { name: '장소 보기' }).click();
  await expect(page.locator('.place-drawer--partial')).toBeVisible();
  await expect(page.getByRole('heading', { name: '테스트 카페', exact: true })).toBeVisible();
});

test('UIUX-011 and UIUX-012 keep course sorting and my-page authenticated state usable', async ({ page }) => {
  const state = createE2EAppState({ reviews: [e2eReview] });
  await installApiFixtures(page, state);

  await page.goto('/?tab=course');

  await expect(page.getByText('좋아요 많은 산책 코스')).toBeVisible();
  await page.getByRole('button', { name: '최신순' }).click();
  await expect(page.getByText('최신 등록 산책 코스')).toBeVisible();

  await page.getByRole('button', { name: '마이' }).click();
  await expect(page.getByRole('heading', { name: '테스터님의 기록' })).toBeVisible();
  const myPageTabs = page.locator('.my-page-primary-tabs');
  await expect(myPageTabs.getByRole('button', { name: '스탬프' })).toBeVisible();
  await expect(myPageTabs.getByRole('button', { name: '피드' })).toBeVisible();
  await expect(myPageTabs.getByRole('button', { name: '댓글' })).toBeVisible();
  await expect(myPageTabs.getByRole('button', { name: '코스' })).toBeVisible();
});
