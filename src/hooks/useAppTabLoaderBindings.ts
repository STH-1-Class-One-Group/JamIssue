import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';

export function useAppTabLoaderBindings() {
  const setFeedHasMore = useAppPageRuntimeStore((state) => state.setFeedHasMore);
  const setFeedNextCursor = useAppPageRuntimeStore((state) => state.setFeedNextCursor);
  const setMyPageError = useAppPageRuntimeStore((state) => state.setMyPageError);

  return {
    setFeedHasMore,
    setFeedNextCursor,
    setMyPageError,
  };
}
