import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppDataState } from '../../src/hooks/useAppDataState';
import { useAppPageRuntimeState } from '../../src/hooks/useAppPageRuntimeState';
import { useAppShellRuntimeState } from '../../src/hooks/useAppShellRuntimeState';
import { useAuthDomainState } from '../../src/hooks/useAuthDomainState';
import { useMapDomainState } from '../../src/hooks/useMapDomainState';
import { useMyPageDomainState } from '../../src/hooks/useMyPageDomainState';
import { useReturnViewDomainState } from '../../src/hooks/useReturnViewDomainState';
import { useReviewDomainState } from '../../src/hooks/useReviewDomainState';
import { useAppMapStore } from '../../src/store/app-map-store';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
import { useAppShellRuntimeStore } from '../../src/store/app-shell-runtime-store';
import { useAppUIStore } from '../../src/store/app-ui-store';
import { useAuthStore } from '../../src/store/auth-store';
import { useMyPageStore } from '../../src/store/my-page-store';
import { useReviewUIStore } from '../../src/store/review-ui-store';
import type { AuthProvider, Place, Review, ReviewMood, RoutePreview, SessionUser, UserRoute } from '../../src/types';

const reviewMood = 'test-mood' as ReviewMood;

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const providers: AuthProvider[] = [
  { key: 'kakao', label: 'Kakao', isEnabled: true, loginUrl: '/login' },
];

const routePreview: RoutePreview = {
  id: 'route-preview-1',
  title: 'Preview',
  subtitle: 'subtitle',
  mood: 'walk',
  placeIds: ['place-1'],
  placeNames: ['Place 1'],
};

const placeFixture: Place = {
  id: 'place-1',
  name: 'Place 1',
  district: 'District',
  category: 'restaurant',
  jamColor: '#111111',
  accentColor: '#222222',
  latitude: 36.35,
  longitude: 127.38,
  summary: 'summary',
  description: 'description',
  vibeTags: [],
  visitTime: '1h',
  routeHint: 'hint',
  stampReward: 'reward',
  heroLabel: 'hero',
};

const reviewFixture: Review = {
  id: 'review-1',
  userId: 'user-1',
  placeId: 'place-1',
  placeName: 'Place 1',
  author: 'tester',
  body: 'body',
  mood: reviewMood,
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
};

const routeFixture: UserRoute = {
  id: 'route-1',
  authorId: 'user-1',
  author: 'tester',
  title: 'Route 1',
  description: 'description',
  mood: 'walk',
  likeCount: 0,
  likedByMe: false,
  createdAt: '2026-05-14T00:00:00Z',
  placeIds: ['place-1'],
  placeNames: ['Place 1'],
  isUserGenerated: true,
  travelSessionId: 'session-1',
};

beforeEach(() => {
  useAppMapStore.setState({ activeCategory: 'all', selectedRoutePreview: null });
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
    profileSaving: false,
    profileError: null,
    myPageError: null,
    isLoggingOut: false,
    feedNextCursor: null,
    feedHasMore: false,
    feedLoadingMore: false,
    myCommentsNextCursor: null,
    myCommentsHasMore: false,
    myCommentsLoadingMore: false,
    myCommentsLoadedOnce: false,
  });
  useAppShellRuntimeStore.setState({
    bootstrapStatus: 'idle',
    bootstrapError: null,
    notice: null,
    currentPosition: null,
    mapLocationStatus: 'idle',
    mapLocationMessage: null,
    mapLocationFocusKey: 0,
    stampActionStatus: 'idle',
  });
  useAppUIStore.setState({ returnView: null });
  useAuthStore.setState({ sessionUser: null, providers: [] });
  useMyPageStore.setState({ myPageTab: 'stamps' });
  useReviewUIStore.setState({
    feedPlaceFilterId: null,
    activeCommentReviewId: null,
    highlightedCommentId: null,
    highlightedReviewId: null,
    highlightedRouteId: null,
  });
});

describe('domain state hooks', () => {
  it('exposes auth, map, review, my-page, and return-view store slices', () => {
    const auth = renderHook(() => useAuthDomainState());
    const map = renderHook(() => useMapDomainState());
    const review = renderHook(() => useReviewDomainState());
    const myPage = renderHook(() => useMyPageDomainState());
    const returnView = renderHook(() => useReturnViewDomainState());

    act(() => {
      useAuthStore.getState().setSessionUser(sessionUser);
      useAuthStore.getState().setProviders(providers);
      map.result.current.setActiveCategory('culture');
      map.result.current.setSelectedRoutePreview(routePreview);
      review.result.current.setFeedPlaceFilterId('place-1');
      review.result.current.setActiveCommentReviewId('review-1');
      review.result.current.setHighlightedCommentId('comment-1');
      review.result.current.setHighlightedReviewId('review-1');
      review.result.current.setHighlightedRouteId('route-1');
      myPage.result.current.setMyPageTab('comments');
      returnView.result.current.setReturnView({
        tab: 'feed',
        myPageTab: 'comments',
        activeCommentReviewId: 'review-1',
        highlightedCommentId: 'comment-1',
        highlightedReviewId: 'review-1',
        placeId: 'place-1',
        festivalId: null,
        drawerState: 'full',
        feedPlaceFilterId: 'place-1',
      });
    });

    expect(auth.result.current).toMatchObject({ sessionUser, providers });
    expect(map.result.current).toMatchObject({ activeCategory: 'culture', selectedRoutePreview: routePreview });
    expect(review.result.current).toMatchObject({
      feedPlaceFilterId: 'place-1',
      activeCommentReviewId: 'review-1',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      highlightedRouteId: 'route-1',
    });
    expect(myPage.result.current.myPageTab).toBe('comments');
    expect(returnView.result.current.returnView).toMatchObject({ tab: 'feed', placeId: 'place-1' });
  });

  it('exposes shell runtime and page runtime setters', () => {
    const shell = renderHook(() => useAppShellRuntimeState());
    const page = renderHook(() => useAppPageRuntimeState());

    act(() => {
      shell.result.current.setNotice('notice');
      shell.result.current.setCurrentPosition({ latitude: 36.35, longitude: 127.38 });
      shell.result.current.setMapLocationStatus('ready');
      shell.result.current.setMapLocationMessage('map-ready');
      shell.result.current.setMapLocationFocusKey((current) => current + 1);
      shell.result.current.setStampActionStatus('loading');
      shell.result.current.setStampActionMessage('stamp-loading');
      page.result.current.setRouteSubmitting(true);
      page.result.current.setRouteError('route-error');
      page.result.current.setRouteLikeUpdatingId('route-1');
      page.result.current.setProfileSaving(true);
      page.result.current.setProfileError('profile-error');
      page.result.current.setMyPageError('my-page-error');
      page.result.current.setIsLoggingOut(true);
      useAppPageRuntimeStore.getState().setFeedHasMore(true);
      useAppPageRuntimeStore.getState().setFeedLoadingMore(true);
      useAppPageRuntimeStore.getState().setMyCommentsHasMore(true);
      useAppPageRuntimeStore.getState().setMyCommentsLoadingMore(true);
      useAppPageRuntimeStore.getState().setMyCommentsLoadedOnce(true);
    });

    expect(shell.result.current).toMatchObject({
      notice: 'notice',
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      mapLocationStatus: 'ready',
      mapLocationMessage: 'map-ready',
      mapLocationFocusKey: 1,
      stampActionStatus: 'loading',
      stampActionMessage: 'stamp-loading',
      bootstrapStatus: 'idle',
      bootstrapError: null,
    });
    expect(page.result.current).toMatchObject({
      routeSubmitting: true,
      routeError: 'route-error',
      routeLikeUpdatingId: 'route-1',
      profileSaving: true,
      profileError: 'profile-error',
      myPageError: 'my-page-error',
      isLoggingOut: true,
      feedHasMore: true,
      feedLoadingMore: true,
      myCommentsHasMore: true,
      myCommentsLoadingMore: true,
      myCommentsLoadedOnce: true,
    });
  });
});

describe('useAppDataState', () => {
  it('manages bootstrap data, review collections, and community route caches', () => {
    const { result } = renderHook(({ selectedPlaceId }) => useAppDataState(selectedPlaceId), {
      initialProps: { selectedPlaceId: 'place-1' },
    });

    act(() => {
      result.current.setPlaces([placeFixture]);
      result.current.setFestivals([]);
      result.current.setCourses([]);
      result.current.setStampState({
        collectedPlaceIds: ['place-1'],
        logs: [],
        travelSessions: [],
      });
      result.current.setHasRealData(false);
      result.current.setMyPage(null);
      result.current.setAdminSummary(null);
      result.current.setAdminBusyPlaceId('place-1');
      result.current.setAdminLoading(true);
      result.current.upsertReviewCollections(reviewFixture);
      result.current.patchReviewCollections('review-1', (review) => ({
        ...review,
        likeCount: review.likeCount + 1,
        likedByMe: true,
      }));
      result.current.replaceCommunityRoutes([routeFixture], 'latest');
      result.current.patchCommunityRoutes('route-1', (route) => ({
        ...route,
        likeCount: route.likeCount + 1,
        likedByMe: true,
      }));
      result.current.setCommunityRouteSort('latest');
    });

    expect(result.current).toMatchObject({
      places: [placeFixture],
      stampState: { collectedPlaceIds: ['place-1'] },
      hasRealData: false,
      adminBusyPlaceId: 'place-1',
      adminLoading: true,
      communityRouteSort: 'latest',
    });
    expect(result.current.reviews).toMatchObject([{ id: 'review-1', likeCount: 1, likedByMe: true }]);
    expect(result.current.selectedPlaceReviews).toMatchObject([{ id: 'review-1', likeCount: 1, likedByMe: true }]);
    expect(result.current.placeReviewsCacheRef.current['place-1']).toMatchObject([
      { id: 'review-1', likeCount: 1, likedByMe: true },
    ]);
    expect(result.current.communityRoutesCacheRef.current.latest).toMatchObject([
      { id: 'route-1', likeCount: 1, likedByMe: true },
    ]);

    act(() => {
      result.current.resetReviewCaches();
    });

    expect(result.current.selectedPlaceReviews).toEqual([]);
    expect(result.current.placeReviewsCacheRef.current).toEqual({});
    expect(result.current.feedLoadedRef.current).toBe(false);
    expect(result.current.coursesLoadedRef.current).toBe(false);
  });
});
