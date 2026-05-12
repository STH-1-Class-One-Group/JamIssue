import type { SessionUser } from '../../types/auth';
import type { Review, StampLog } from '../../types/review';
import type { MyPageResponse } from '../../types/my-page';

export function getKnownMyReviews({
  reviews,
  selectedPlaceReviews,
  myPageReviews,
  sessionUser,
}: {
  reviews: Review[];
  selectedPlaceReviews: Review[];
  myPageReviews: MyPageResponse['reviews'] | undefined;
  sessionUser: SessionUser | null;
}) {
  if (!sessionUser) {
    return [];
  }

  const reviewMap = new Map<string, Review>();
  // ⚡ Bolt: Performance Optimization
  // Avoid O(N) array allocations using spread syntax [...a, ...b] just to populate a Map.
  // Instead, process each list sequentially to maintain identical behavior with lower overhead.
  const addReview = (review: Review) => {
    if (review.userId === sessionUser.id) {
      reviewMap.set(review.id, review);
    }
  };

  for (const review of reviews) addReview(review);
  for (const review of selectedPlaceReviews) addReview(review);
  if (myPageReviews) {
    for (const review of myPageReviews) addReview(review);
  }

  return [...reviewMap.values()];
}

export function getHasCreatedReviewToday({
  knownMyReviews,
  sessionUser,
  todayStamp,
}: {
  knownMyReviews: Review[];
  sessionUser: SessionUser | null;
  todayStamp: StampLog | null;
}) {
  if (!sessionUser || !todayStamp) {
    return false;
  }

  return knownMyReviews.some((review) => (
    review.placeId === todayStamp.placeId
    && (review.stampId === todayStamp.id || review.visitedAt.startsWith(todayStamp.stampedDate))
  ));
}

export function getReviewProofMessage({
  sessionUser,
  hasCreatedReviewToday,
  todayStamp,
}: {
  sessionUser: SessionUser | null;
  hasCreatedReviewToday: boolean;
  todayStamp: StampLog | null;
}) {
  if (!sessionUser) {
    return '로그인하면 오늘 방문 인증 뒤에만 리뷰를 남길 수 있어요.';
  }
  if (hasCreatedReviewToday) {
    return '오늘은 이미 이 장소 리뷰를 작성했어요. 리뷰는 하루에 하나만 남길 수 있어요.';
  }
  if (todayStamp) {
    return `${todayStamp.visitLabel} 방문 스탬프가 확인됐어요. 오늘 리뷰 한 개를 작성할 수 있어요.`;
  }
  return '오늘 방문 스탬프를 먼저 찍으면 리뷰를 작성할 수 있어요.';
}
