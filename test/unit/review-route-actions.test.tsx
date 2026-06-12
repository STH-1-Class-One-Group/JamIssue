import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Place } from '../../src/types/core';
import type { SessionUser } from '../../src/types/auth';
import type { Comment, Review, UserRoute } from '../../src/types/review';
import type { MyPageResponse } from '../../src/types/my-page';
import type { UseAppReviewActionsParams } from '../../src/hooks/useAppReviewActions.types';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
import { useReviewUIStore } from '../../src/store/review-ui-store';
import { useAppReviewCrudActions } from '../../src/hooks/useAppReviewCrudActions';
import { useAppReviewCommentActions } from '../../src/hooks/useAppReviewCommentActions';
import { useAppReviewLikeActions } from '../../src/hooks/useAppReviewLikeActions';
import { createPublishRouteHandler } from '../../src/hooks/app-route-actions/publishRouteAction';
import { createToggleRouteLikeHandler } from '../../src/hooks/app-route-actions/routeLikeAction';
import { useAppPagePaginationActions } from '../../src/hooks/useAppPagePaginationActions';

const apiMocks = vi.hoisted(() => ({
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  uploadReviewImage: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  toggleReviewLike: vi.fn(),
  getReviewFeedPage: vi.fn(),
  createUserRoute: vi.fn(),
  toggleCommunityRouteLike: vi.fn(),
  getMyCommentsPage: vi.fn(),
}));

vi.mock('../../src/api/reviewsClient', () => ({
  createReview: apiMocks.createReview,
  updateReview: apiMocks.updateReview,
  deleteReview: apiMocks.deleteReview,
  uploadReviewImage: apiMocks.uploadReviewImage,
  createComment: apiMocks.createComment,
  updateComment: apiMocks.updateComment,
  deleteComment: apiMocks.deleteComment,
  toggleReviewLike: apiMocks.toggleReviewLike,
  getReviewFeedPage: apiMocks.getReviewFeedPage,
}));

vi.mock('../../src/api/routesClient', () => ({
  createUserRoute: apiMocks.createUserRoute,
  toggleCommunityRouteLike: apiMocks.toggleCommunityRouteLike,
}));

vi.mock('../../src/api/myClient', () => ({
  getMyCommentsPage: apiMocks.getMyCommentsPage,
}));

const TEST_REVIEW_MOOD = 'test-mood' as Review['mood'];

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#f4a',
    accentColor: '#333',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    totalVisitCount: 0,
    ...overrides,
  };
}

function commentFixture(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    userId: 'user-1',
    author: 'author',
    body: 'comment',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-05-14',
    replies: [],
    ...overrides,
  };
}

function reviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'author',
    body: 'body',
    mood: TEST_REVIEW_MOOD,
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: null,
    thumbnailUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

function routeFixture(overrides: Partial<UserRoute> = {}): UserRoute {
  return {
    id: 'route-1',
    authorId: 'user-1',
    author: 'author',
    title: 'Route',
    description: 'Description',
    mood: 'mood',
    likeCount: 0,
    likedByMe: false,
    createdAt: '2026-05-14',
    placeIds: ['place-1'],
    placeNames: ['Place 1'],
    isUserGenerated: true,
    travelSessionId: 'session-1',
    ...overrides,
  };
}

function myPageFixture(overrides: Partial<MyPageResponse> = {}): MyPageResponse {
  return {
    user: sessionUser,
    stats: {
      reviewCount: 1,
      stampCount: 0,
      uniquePlaceCount: 0,
      totalPlaceCount: 0,
      routeCount: 0,
    },
    reviews: [reviewFixture()],
    comments: [],
    notifications: [],
    unreadNotificationCount: 0,
    stampLogs: [],
    travelSessions: [],
    visitedPlaces: [],
    unvisitedPlaces: [],
    collectedPlaces: [],
    routes: [],
    ...overrides,
  };
}

function createReviewActionParams(overrides: Partial<UseAppReviewActionsParams> = {}): UseAppReviewActionsParams {
  return {
    activeTab: 'feed',
    sessionUser,
    selectedPlace: placeFixture(),
    reviews: [reviewFixture()],
    selectedPlaceReviews: [],
    myPage: myPageFixture(),
    activeCommentReviewId: null,
    highlightedReviewId: null,
    setSelectedPlaceReviews: vi.fn() as Dispatch<SetStateAction<Review[]>>,
    setReviews: vi.fn() as Dispatch<SetStateAction<Review[]>>,
    setMyPage: vi.fn() as Dispatch<SetStateAction<MyPageResponse | null>>,
    setNotice: vi.fn(),
    goToTab: vi.fn(),
    commitRouteState: vi.fn(),
    refreshMyPageForUser: vi.fn().mockResolvedValue(myPageFixture()),
    patchReviewCollections: vi.fn(),
    upsertReviewCollections: vi.fn(),
    placeReviewsCacheRef: { current: {} } as MutableRefObject<Record<string, Review[]>>,
    handleCloseReviewComments: vi.fn(),
    syncReviewComments: vi.fn(),
    clearReviewComments: vi.fn(),
    formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    ...overrides,
  };
}

function resetRuntimeStores() {
  useAppPageRuntimeStore.setState({
    reviewSubmitting: false,
    reviewError: null,
    reviewLikeUpdatingId: null,
    commentSubmittingReviewId: null,
    commentMutatingId: null,
    deletingReviewId: null,
    routeSubmitting: false,
    routeError: null,
    routeLikeUpdatingId: null,
    feedNextCursor: null,
    feedHasMore: false,
    feedLoadingMore: false,
    myCommentsNextCursor: null,
    myCommentsHasMore: false,
    myCommentsLoadingMore: false,
    myCommentsLoadedOnce: false,
  });
  useReviewUIStore.setState({
    highlightedReviewId: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRuntimeStores();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetRuntimeStores();
});

describe('review CRUD actions', () => {
  test('review creation redirects unauthenticated users and creates authenticated reviews with optional upload', async () => {
    const unauthenticatedParams = createReviewActionParams({ sessionUser: null });
    const unauthenticated = renderHook(() => useAppReviewCrudActions(unauthenticatedParams));

    await act(async () => {
      await unauthenticated.result.current.handleCreateReview({
        stampId: 'stamp-1',
        body: ' body ',
        mood: TEST_REVIEW_MOOD,
        file: null,
      });
    });
    expect(unauthenticatedParams.goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.createReview).not.toHaveBeenCalled();

    const createdReview = reviewFixture({ id: 'created-review', imageUrl: '/image.jpg' });
    apiMocks.uploadReviewImage.mockResolvedValue({ url: '/image.jpg' });
    apiMocks.createReview.mockResolvedValue(createdReview);
    const params = createReviewActionParams();
    const { result } = renderHook(() => useAppReviewCrudActions(params));
    const image = new File(['x'], 'review.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleCreateReview({
        stampId: 'stamp-1',
        body: ' body ',
        mood: TEST_REVIEW_MOOD,
        file: image,
      });
    });

    expect(apiMocks.uploadReviewImage).toHaveBeenCalledWith(image);
    expect(apiMocks.createReview).toHaveBeenCalledWith({
      placeId: 'place-1',
      stampId: 'stamp-1',
      body: 'body',
      mood: TEST_REVIEW_MOOD,
      imageUrl: '/image.jpg',
    });
    expect(params.upsertReviewCollections).toHaveBeenCalledWith(createdReview);
    expect(params.refreshMyPageForUser).toHaveBeenCalledWith(sessionUser);
    expect(params.commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'full' },
      'replace',
    );
    expect(useAppPageRuntimeStore.getState().reviewSubmitting).toBe(false);
  });

  test('review creation redirects when no place is selected and records API failures', async () => {
    const noPlaceParams = createReviewActionParams({ selectedPlace: null });
    const noPlace = renderHook(() => useAppReviewCrudActions(noPlaceParams));

    await act(async () => {
      await noPlace.result.current.handleCreateReview({
        stampId: 'stamp-1',
        body: 'body',
        mood: TEST_REVIEW_MOOD,
        file: null,
      });
    });

    expect(noPlaceParams.goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.createReview).not.toHaveBeenCalled();

    apiMocks.createReview.mockRejectedValueOnce(new Error('create failed'));
    const params = createReviewActionParams();
    const { result } = renderHook(() => useAppReviewCrudActions(params));

    await act(async () => {
      await result.current.handleCreateReview({
        stampId: 'stamp-1',
        body: ' body ',
        mood: TEST_REVIEW_MOOD,
        file: null,
      });
    });

    expect(apiMocks.createReview).toHaveBeenCalledWith({
      placeId: 'place-1',
      stampId: 'stamp-1',
      body: 'body',
      mood: TEST_REVIEW_MOOD,
      imageUrl: null,
    });
    expect(useAppPageRuntimeStore.getState().reviewError).toBe('create failed');
    expect(useAppPageRuntimeStore.getState().reviewSubmitting).toBe(false);
  });

  test('review update patches collections and my page comment snippets', async () => {
    const updatedReview = reviewFixture({ id: 'review-1', body: 'updated', imageUrl: null });
    apiMocks.updateReview.mockResolvedValue(updatedReview);
    const setMyPage = vi.fn();
    const params = createReviewActionParams({ setMyPage });
    const { result } = renderHook(() => useAppReviewCrudActions(params));

    await act(async () => {
      await result.current.handleUpdateReview('review-1', {
        body: ' updated ',
        mood: TEST_REVIEW_MOOD,
        removeImage: true,
      });
    });

    expect(apiMocks.updateReview).toHaveBeenCalledWith('review-1', {
      body: 'updated',
      mood: TEST_REVIEW_MOOD,
      imageUrl: null,
    });
    expect(params.patchReviewCollections).toHaveBeenCalledWith('review-1', expect.any(Function));
    expect(setMyPage).toHaveBeenCalledWith(expect.any(Function));
    expect(params.setNotice).toHaveBeenCalled();
  });

  test('review update redirects anonymous users and supports replacing images', async () => {
    const anonymousParams = createReviewActionParams({ sessionUser: null });
    const anonymous = renderHook(() => useAppReviewCrudActions(anonymousParams));

    await act(async () => {
      await anonymous.result.current.handleUpdateReview('review-1', {
        body: 'updated',
        mood: TEST_REVIEW_MOOD,
      });
    });

    expect(anonymousParams.goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.updateReview).not.toHaveBeenCalled();

    const image = new File(['x'], 'replacement.jpg', { type: 'image/jpeg' });
    const updatedReview = reviewFixture({ id: 'review-1', imageUrl: '/replacement.jpg' });
    apiMocks.uploadReviewImage.mockResolvedValueOnce({ url: '/replacement.jpg' });
    apiMocks.updateReview.mockResolvedValueOnce(updatedReview);
    const params = createReviewActionParams({ setMyPage: vi.fn() });
    const { result } = renderHook(() => useAppReviewCrudActions(params));

    await act(async () => {
      await result.current.handleUpdateReview('review-1', {
        body: ' updated ',
        mood: TEST_REVIEW_MOOD,
        file: image,
      });
    });

    expect(apiMocks.uploadReviewImage).toHaveBeenCalledWith(image);
    expect(apiMocks.updateReview).toHaveBeenCalledWith('review-1', {
      body: 'updated',
      mood: TEST_REVIEW_MOOD,
      imageUrl: '/replacement.jpg',
    });
  });

  test('review delete respects confirmation, clears caches, and refreshes my page when needed', async () => {
    const setReviews = vi.fn();
    const setSelectedPlaceReviews = vi.fn();
    const setMyPage = vi.fn();
    const handleCloseReviewComments = vi.fn();
    const placeReviewsCacheRef = {
      current: {
        'place-1': [reviewFixture(), reviewFixture({ id: 'other-review' })],
      },
    };
    const params = createReviewActionParams({
      activeTab: 'my',
      activeCommentReviewId: 'review-1',
      highlightedReviewId: 'review-1',
      setReviews,
      setSelectedPlaceReviews,
      setMyPage,
      handleCloseReviewComments,
      placeReviewsCacheRef,
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    apiMocks.deleteReview.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAppReviewCrudActions(params));

    await act(async () => {
      await result.current.handleDeleteReview('review-1');
    });
    expect(apiMocks.deleteReview).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleDeleteReview('review-1');
    });

    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(apiMocks.deleteReview).toHaveBeenCalledWith('review-1');
    expect(params.clearReviewComments).toHaveBeenCalledWith('review-1');
    expect(setReviews).toHaveBeenCalledWith(expect.any(Function));
    expect(setSelectedPlaceReviews).toHaveBeenCalledWith(expect.any(Function));
    expect(placeReviewsCacheRef.current['place-1']).toEqual([expect.objectContaining({ id: 'other-review' })]);
    expect(setMyPage).toHaveBeenCalledWith(expect.any(Function));
    expect(handleCloseReviewComments).toHaveBeenCalled();
    expect(useReviewUIStore.getState().highlightedReviewId).toBeNull();
    expect(params.refreshMyPageForUser).toHaveBeenCalledWith(sessionUser, true);
    expect(useAppPageRuntimeStore.getState().deletingReviewId).toBeNull();
  });

  test('review delete redirects anonymous users and reports deletion failures', async () => {
    const anonymousParams = createReviewActionParams({ sessionUser: null });
    const anonymous = renderHook(() => useAppReviewCrudActions(anonymousParams));

    await act(async () => {
      await anonymous.result.current.handleDeleteReview('review-1');
    });

    expect(anonymousParams.goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.deleteReview).not.toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMocks.deleteReview.mockRejectedValueOnce(new Error('delete failed'));
    const params = createReviewActionParams();
    const { result } = renderHook(() => useAppReviewCrudActions(params));

    await act(async () => {
      await result.current.handleDeleteReview('review-1');
    });

    expect(params.setNotice).toHaveBeenCalledWith('delete failed');
    expect(useAppPageRuntimeStore.getState().deletingReviewId).toBeNull();
  });
});

describe('review comment and like actions', () => {
  test('comment actions synchronize comment threads and refresh my page for my-tab mutations', async () => {
    const updatedComments = [commentFixture(), commentFixture({ id: 'reply-1', parentId: 'comment-1' })];
    apiMocks.createComment.mockResolvedValueOnce(updatedComments);
    apiMocks.updateComment.mockResolvedValueOnce(updatedComments);
    apiMocks.deleteComment.mockResolvedValueOnce(updatedComments);
    const params = createReviewActionParams({ activeTab: 'my' });
    const { result } = renderHook(() => useAppReviewCommentActions(params));

    await act(async () => {
      await result.current.handleCreateComment('review-1', 'new comment');
    });
    expect(apiMocks.createComment).toHaveBeenCalledWith('review-1', { body: 'new comment', parentId: null });
    expect(params.syncReviewComments).toHaveBeenCalledWith('review-1', updatedComments);
    expect(params.patchReviewCollections).toHaveBeenCalledWith('review-1', expect.any(Function));

    await act(async () => {
      await result.current.handleUpdateComment('review-1', 'comment-1', 'updated comment');
    });
    expect(apiMocks.updateComment).toHaveBeenCalledWith('review-1', 'comment-1', { body: 'updated comment' });
    expect(params.refreshMyPageForUser).toHaveBeenCalledWith(sessionUser, true);

    await act(async () => {
      await result.current.handleDeleteComment('review-1', 'comment-1');
    });
    expect(apiMocks.deleteComment).toHaveBeenCalledWith('review-1', 'comment-1');
    expect(useAppPageRuntimeStore.getState().commentSubmittingReviewId).toBeNull();
    expect(useAppPageRuntimeStore.getState().commentMutatingId).toBeNull();
  });

  test('review like action applies optimistic updates and reverts on failure', async () => {
    const review = reviewFixture({ likeCount: 2, likedByMe: false });
    const patchReviewCollections = vi.fn();
    apiMocks.toggleReviewLike.mockResolvedValueOnce({ reviewId: 'review-1', likeCount: 3, likedByMe: true });
    const params = createReviewActionParams({
      reviews: [review],
      patchReviewCollections,
    });
    const { result } = renderHook(() => useAppReviewLikeActions(params));

    await act(async () => {
      await result.current.handleToggleReviewLike('review-1');
    });

    expect(patchReviewCollections).toHaveBeenNthCalledWith(1, 'review-1', expect.any(Function));
    expect(patchReviewCollections).toHaveBeenNthCalledWith(2, 'review-1', expect.any(Function));
    expect(useAppPageRuntimeStore.getState().reviewLikeUpdatingId).toBeNull();

    apiMocks.toggleReviewLike.mockRejectedValueOnce(new Error('network'));
    await act(async () => {
      await result.current.handleToggleReviewLike('review-1');
    });
    expect(params.setNotice).toHaveBeenCalledWith('network');
    expect(patchReviewCollections).toHaveBeenCalledTimes(4);
  });

  test('comment actions redirect anonymous users and report mutation failures without refreshing my page', async () => {
    const anonymousParams = createReviewActionParams({ sessionUser: null });
    const anonymous = renderHook(() => useAppReviewCommentActions(anonymousParams));

    await act(async () => {
      await anonymous.result.current.handleCreateComment('review-1', 'body', 'parent-1');
      await anonymous.result.current.handleUpdateComment('review-1', 'comment-1', 'body');
      await anonymous.result.current.handleDeleteComment('review-1', 'comment-1');
    });

    expect(anonymousParams.goToTab).toHaveBeenCalledTimes(3);
    expect(apiMocks.createComment).not.toHaveBeenCalled();
    expect(apiMocks.updateComment).not.toHaveBeenCalled();
    expect(apiMocks.deleteComment).not.toHaveBeenCalled();

    apiMocks.createComment.mockRejectedValueOnce(new Error('create failed'));
    apiMocks.updateComment.mockRejectedValueOnce(new Error('update failed'));
    apiMocks.deleteComment.mockRejectedValueOnce(new Error('delete failed'));
    const params = createReviewActionParams({ activeTab: 'feed' });
    const { result } = renderHook(() => useAppReviewCommentActions(params));

    await act(async () => {
      await result.current.handleCreateComment('review-1', 'body', 'parent-1');
      await result.current.handleUpdateComment('review-1', 'comment-1', 'body');
      await result.current.handleDeleteComment('review-1', 'comment-1');
    });

    expect(apiMocks.createComment).toHaveBeenCalledWith('review-1', { body: 'body', parentId: 'parent-1' });
    expect(params.setNotice).toHaveBeenCalledWith('create failed');
    expect(params.setNotice).toHaveBeenCalledWith('update failed');
    expect(params.setNotice).toHaveBeenCalledWith('delete failed');
    expect(params.refreshMyPageForUser).not.toHaveBeenCalled();
    expect(useAppPageRuntimeStore.getState().commentSubmittingReviewId).toBeNull();
    expect(useAppPageRuntimeStore.getState().commentMutatingId).toBeNull();
  });

  test('review like action redirects anonymous users and falls back to selected or my-page reviews', async () => {
    const anonymousParams = createReviewActionParams({ sessionUser: null });
    const anonymous = renderHook(() => useAppReviewLikeActions(anonymousParams));

    await act(async () => {
      await anonymous.result.current.handleToggleReviewLike('review-1');
    });

    expect(anonymousParams.goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.toggleReviewLike).not.toHaveBeenCalled();

    const patchFromSelected = vi.fn();
    apiMocks.toggleReviewLike.mockResolvedValueOnce({ reviewId: 'selected-review', likeCount: 0, likedByMe: false });
    const selectedParams = createReviewActionParams({
      reviews: [],
      selectedPlaceReviews: [reviewFixture({ id: 'selected-review', likeCount: 0, likedByMe: true })],
      patchReviewCollections: patchFromSelected,
    });
    const selected = renderHook(() => useAppReviewLikeActions(selectedParams));
    await act(async () => {
      await selected.result.current.handleToggleReviewLike('selected-review');
    });
    const selectedOptimistic = patchFromSelected.mock.calls[0]?.[1] as (review: Review) => Review;
    expect(selectedOptimistic(reviewFixture({ id: 'selected-review', likeCount: 0, likedByMe: true }))).toMatchObject({
      likeCount: 0,
      likedByMe: false,
    });

    const patchFromMyPage = vi.fn();
    apiMocks.toggleReviewLike.mockResolvedValueOnce({ reviewId: 'my-review', likeCount: 1, likedByMe: true });
    const myPageParams = createReviewActionParams({
      reviews: [],
      selectedPlaceReviews: [],
      myPage: myPageFixture({ reviews: [reviewFixture({ id: 'my-review', likeCount: 0, likedByMe: false })] }),
      patchReviewCollections: patchFromMyPage,
    });
    const myPageHook = renderHook(() => useAppReviewLikeActions(myPageParams));
    await act(async () => {
      await myPageHook.result.current.handleToggleReviewLike('my-review');
    });
    expect(patchFromMyPage).toHaveBeenCalledTimes(2);
  });
});

describe('route publishing and pagination actions', () => {
  test('route publishing updates route cache and my page state', async () => {
    const createdRoute = routeFixture({ id: 'created-route' });
    apiMocks.createUserRoute.mockResolvedValue(createdRoute);
    const setMyPage = vi.fn();
    const communityRoutesCacheRef = { current: { latest: [routeFixture({ id: 'old-route' })], popular: [routeFixture({ id: 'popular-route' })] } };
    const handler = createPublishRouteHandler({
      sessionUser,
      setRouteSubmitting: useAppPageRuntimeStore.getState().setRouteSubmitting,
      setRouteError: useAppPageRuntimeStore.getState().setRouteError,
      setNotice: vi.fn(),
      setMyPageTab: vi.fn(),
      setMyPage,
      communityRoutesCacheRef,
      refreshMyPageForUser: vi.fn().mockResolvedValue(myPageFixture()),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab: vi.fn(),
    });

    await handler({
      travelSessionId: 'session-1',
      title: 'Title',
      description: 'Description',
      mood: 'mood',
    });

    expect(apiMocks.createUserRoute).toHaveBeenCalledWith({
      travelSessionId: 'session-1',
      title: 'Title',
      description: 'Description',
      mood: 'mood',
      isPublic: true,
    });
    expect(communityRoutesCacheRef.current.latest?.[0]).toBe(createdRoute);
    expect(communityRoutesCacheRef.current.popular).toBeUndefined();
    expect(setMyPage).toHaveBeenCalledWith(expect.any(Function));
    const updateMyPage = setMyPage.mock.calls[0][0] as (current: MyPageResponse | null) => MyPageResponse | null;
    expect(updateMyPage(null)).toBeNull();
    expect(updateMyPage(myPageFixture({
      stats: { ...myPageFixture().stats, routeCount: 0 },
      routes: [],
      travelSessions: [{ id: 'session-1', publishedRouteId: null }],
    }))).toMatchObject({
      stats: { routeCount: 1 },
      routes: [createdRoute],
      travelSessions: [{ id: 'session-1', publishedRouteId: 'created-route' }],
    });
    expect(updateMyPage(myPageFixture({
      stats: { ...myPageFixture().stats, routeCount: 1 },
      routes: [createdRoute],
      travelSessions: [{ id: 'session-1', publishedRouteId: null }],
    }))?.stats.routeCount).toBe(1);
    expect(useAppPageRuntimeStore.getState().routeSubmitting).toBe(false);
  });

  test('route publishing redirects anonymous users and reports API failures', async () => {
    const goToTab = vi.fn();
    const setNotice = vi.fn();
    const setMyPageTab = vi.fn();
    const setMyPage = vi.fn();
    const communityRoutesCacheRef = { current: {} };
    const anonymous = createPublishRouteHandler({
      sessionUser: null,
      setRouteSubmitting: useAppPageRuntimeStore.getState().setRouteSubmitting,
      setRouteError: useAppPageRuntimeStore.getState().setRouteError,
      setNotice,
      setMyPageTab,
      setMyPage,
      communityRoutesCacheRef,
      refreshMyPageForUser: vi.fn().mockResolvedValue(null),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab,
    });

    await anonymous({
      travelSessionId: 'session-1',
      title: 'Title',
      description: 'Description',
      mood: 'mood',
    });
    expect(goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.createUserRoute).not.toHaveBeenCalled();
    expect(useAppPageRuntimeStore.getState().routeError).not.toBeNull();

    apiMocks.createUserRoute.mockRejectedValueOnce(new Error('route failed'));
    const authenticated = createPublishRouteHandler({
      sessionUser,
      setRouteSubmitting: useAppPageRuntimeStore.getState().setRouteSubmitting,
      setRouteError: useAppPageRuntimeStore.getState().setRouteError,
      setNotice,
      setMyPageTab,
      setMyPage,
      communityRoutesCacheRef,
      refreshMyPageForUser: vi.fn().mockResolvedValue(null),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab,
    });

    await authenticated({
      travelSessionId: 'session-1',
      title: 'Title',
      description: 'Description',
      mood: 'mood',
    });

    expect(useAppPageRuntimeStore.getState().routeError).toBe('route failed');
    expect(useAppPageRuntimeStore.getState().routeSubmitting).toBe(false);
  });

  test('route like action redirects anonymous users and patches authenticated route state', async () => {
    const goToTab = vi.fn();
    const setNotice = vi.fn();
    const patchCommunityRoutes = vi.fn();
    const setMyPage = vi.fn();
    const anonymous = createToggleRouteLikeHandler({
      sessionUser: null,
      setNotice,
      setRouteLikeUpdatingId: useAppPageRuntimeStore.getState().setRouteLikeUpdatingId,
      setMyPage,
      patchCommunityRoutes,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab,
    });

    await anonymous('route-1');
    expect(goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.toggleCommunityRouteLike).not.toHaveBeenCalled();

    apiMocks.toggleCommunityRouteLike.mockResolvedValue({ routeId: 'route-1', likeCount: 4, likedByMe: true });
    const authenticated = createToggleRouteLikeHandler({
      sessionUser,
      setNotice,
      setRouteLikeUpdatingId: useAppPageRuntimeStore.getState().setRouteLikeUpdatingId,
      setMyPage,
      patchCommunityRoutes,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab,
    });

    await authenticated('route-1');
    expect(patchCommunityRoutes).toHaveBeenCalledWith('route-1', expect.any(Function));
    expect(setMyPage).toHaveBeenCalledWith(expect.any(Function));
    const patchRoute = patchCommunityRoutes.mock.calls[0][1] as (route: UserRoute) => UserRoute;
    expect(patchRoute(routeFixture({ likeCount: 1, likedByMe: false }))).toMatchObject({
      likeCount: 4,
      likedByMe: true,
    });
    const updateMyPage = setMyPage.mock.calls[0][0] as (current: MyPageResponse | null) => MyPageResponse | null;
    expect(updateMyPage(null)).toBeNull();
    expect(updateMyPage(myPageFixture({
      routes: [
        routeFixture({ id: 'route-1', likeCount: 1, likedByMe: false }),
        routeFixture({ id: 'route-2', likeCount: 2, likedByMe: false }),
      ],
    }))?.routes).toEqual([
      expect.objectContaining({ id: 'route-1', likeCount: 4, likedByMe: true }),
      expect.objectContaining({ id: 'route-2', likeCount: 2, likedByMe: false }),
    ]);
    expect(useAppPageRuntimeStore.getState().routeLikeUpdatingId).toBeNull();
  });

  test('route like action reports failures and clears the updating guard', async () => {
    const setNotice = vi.fn();
    apiMocks.toggleCommunityRouteLike.mockRejectedValueOnce(new Error('like failed'));
    const handler = createToggleRouteLikeHandler({
      sessionUser,
      setNotice,
      setRouteLikeUpdatingId: useAppPageRuntimeStore.getState().setRouteLikeUpdatingId,
      setMyPage: vi.fn(),
      patchCommunityRoutes: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
      goToTab: vi.fn(),
    });

    await handler('route-1');

    expect(setNotice).toHaveBeenCalledWith('like failed');
    expect(useAppPageRuntimeStore.getState().routeLikeUpdatingId).toBeNull();
  });

  test('pagination actions append unique feed reviews and load my comments pages', async () => {
    const existingReview = reviewFixture({ id: 'review-1' });
    const newReview = reviewFixture({ id: 'review-2' });
    const setReviews = vi.fn();
    const setMyPage = vi.fn();
    const reportBackgroundError = vi.fn();
    useAppPageRuntimeStore.setState({
      feedHasMore: true,
      feedNextCursor: 'feed-cursor',
      myCommentsHasMore: true,
      myCommentsNextCursor: 'comment-cursor',
    });
    apiMocks.getReviewFeedPage.mockResolvedValue({
      items: [existingReview, newReview],
      nextCursor: null,
    });
    apiMocks.getMyCommentsPage.mockResolvedValue({
      items: [{
        id: 'my-comment-1',
        reviewId: 'review-1',
        placeId: 'place-1',
        placeName: 'Place 1',
        body: 'comment',
        isDeleted: false,
        parentId: null,
        createdAt: '2026-05-14',
        reviewBody: 'body',
      }],
      nextCursor: null,
    });

    const { result } = renderHook(() => useAppPagePaginationActions({
      sessionUser,
      myPage: myPageFixture(),
      setReviews,
      setMyPage,
      reportBackgroundError,
    }));

    await act(async () => {
      await result.current.loadMoreFeedReviews();
    });
    expect(apiMocks.getReviewFeedPage).toHaveBeenCalledWith({ cursor: 'feed-cursor', limit: expect.any(Number) });
    expect(setReviews).toHaveBeenCalledWith(expect.any(Function));
    expect(useAppPageRuntimeStore.getState().feedHasMore).toBe(false);

    await act(async () => {
      await result.current.loadMoreMyComments();
    });
    expect(apiMocks.getMyCommentsPage).toHaveBeenCalledWith({ cursor: 'comment-cursor', limit: expect.any(Number) });
    expect(setMyPage).toHaveBeenCalledWith(expect.any(Function));
    expect(useAppPageRuntimeStore.getState().myCommentsHasMore).toBe(false);
    expect(reportBackgroundError).not.toHaveBeenCalled();
  });
});
