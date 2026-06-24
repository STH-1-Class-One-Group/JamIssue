import type { RefObject } from 'react';
import type { MyPageResponse } from '../../types/my-page';
import { ActivityCollectionShell } from '../my-page-activity-view/ActivityCollectionShell';
import { normalizeActivityDateKey } from '../my-page-activity-view/activityDate';
import type { ActivityEntry, ActivityViewMode } from '../my-page-activity-view/activityViewTypes';

type MyComment = NonNullable<MyPageResponse>['comments'][number];

interface MyCommentsTabSectionProps {
  comments: MyComment[];
  commentsHasMore: boolean;
  commentsLoadingMore: boolean;
  commentsLoadMoreRef: RefObject<HTMLDivElement | null>;
  viewMode: ActivityViewMode;
  onOpenPlace: (placeId: string) => void;
  onOpenComment: (reviewId: string, commentId: string) => void;
  onViewModeChange: (mode: ActivityViewMode) => void;
}

export function MyCommentsTabSection({
  comments,
  commentsHasMore,
  commentsLoadingMore,
  commentsLoadMoreRef,
  viewMode,
  onOpenPlace,
  onOpenComment,
  onViewModeChange,
}: MyCommentsTabSectionProps) {
  const entries: ActivityEntry[] = comments.map((comment) => ({
    id: comment.id,
    kind: 'comment',
    dateKey: normalizeActivityDateKey(comment.createdAt),
    title: comment.placeName,
    meta: comment.createdAt,
    renderListItem: () => (
      <article className="review-card review-card--comment-log">
        <div className="review-card__top review-card__top--comment-log">
          <div className="review-card__title-block review-card__title-block--comment-log">
            <p className="review-card__label review-card__label--comment-log">내 댓글</p>
            <p className="review-card__body review-card__body--comment-log">{comment.body}</p>
            <p className="review-card__meta-line">{comment.parentId ? '답글 남김' : '댓글 남김'} · {comment.createdAt}</p>
            <button type="button" className="review-card__place-anchor" onClick={() => onOpenPlace(comment.placeId)}>
              <strong>{comment.placeName}</strong>
            </button>
          </div>
        </div>
        <p className="review-card__context-line">피드 원문 · {comment.reviewBody}</p>
        <button type="button" className="review-card__place-link" onClick={() => onOpenComment(comment.reviewId, comment.id)}>
          내 댓글 보기
        </button>
      </article>
    ),
  }));
  const loadMoreSlot = commentsHasMore ? (
    <div ref={commentsLoadMoreRef as RefObject<HTMLDivElement>} className="feed-tab__load-sentinel" aria-hidden="true">
      {commentsLoadingMore ? '불러오는 중...' : ''}
    </div>
  ) : null;

  return (
    <ActivityCollectionShell
      entries={entries}
      emptyState={<p className="empty-copy">아직 작성한 댓글이 없어요.</p>}
      loadMoreSlot={loadMoreSlot}
      mode={viewMode}
      onModeChange={onViewModeChange}
    />
  );
}
