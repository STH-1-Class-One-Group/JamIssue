import { useAppMapStore } from '../store/app-map-store';
import { useAuthStore } from '../store/auth-store';
import { useAppUIStore } from '../store/app-ui-store';
import { useMyPageStore } from '../store/my-page-store';
import { useReviewUIStore } from '../store/review-ui-store';

export function useAppDomainState() {
  const myPageTab = useMyPageStore((state) => state.myPageTab);
  const setMyPageTab = useMyPageStore((state) => state.setMyPageTab);
  const feedPlaceFilterId = useReviewUIStore((state) => state.feedPlaceFilterId);
  const setFeedPlaceFilterId = useReviewUIStore((state) => state.setFeedPlaceFilterId);
  const activeCategory = useAppMapStore((state) => state.activeCategory);
  const setActiveCategory = useAppMapStore((state) => state.setActiveCategory);
  const activeCommentReviewId = useReviewUIStore((state) => state.activeCommentReviewId);
  const setActiveCommentReviewId = useReviewUIStore((state) => state.setActiveCommentReviewId);
  const highlightedCommentId = useReviewUIStore((state) => state.highlightedCommentId);
  const setHighlightedCommentId = useReviewUIStore((state) => state.setHighlightedCommentId);
  const highlightedReviewId = useReviewUIStore((state) => state.highlightedReviewId);
  const setHighlightedReviewId = useReviewUIStore((state) => state.setHighlightedReviewId);
  const highlightedRouteId = useReviewUIStore((state) => state.highlightedRouteId);
  const setHighlightedRouteId = useReviewUIStore((state) => state.setHighlightedRouteId);
  const selectedRoutePreview = useAppMapStore((state) => state.selectedRoutePreview);
  const setSelectedRoutePreview = useAppMapStore((state) => state.setSelectedRoutePreview);
  const returnView = useAppUIStore((state) => state.returnView);
  const setReturnView = useAppUIStore((state) => state.setReturnView);
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const providers = useAuthStore((state) => state.providers);

  return {
    myPageTab,
    setMyPageTab,
    feedPlaceFilterId,
    setFeedPlaceFilterId,
    activeCategory,
    setActiveCategory,
    activeCommentReviewId,
    setActiveCommentReviewId,
    highlightedCommentId,
    setHighlightedCommentId,
    highlightedReviewId,
    setHighlightedReviewId,
    highlightedRouteId,
    setHighlightedRouteId,
    selectedRoutePreview,
    setSelectedRoutePreview,
    returnView,
    setReturnView,
    sessionUser,
    providers,
  };
}
