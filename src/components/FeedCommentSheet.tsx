import { useEffect, useRef, useState } from 'react';
import { CommentThread } from './CommentThread';
import type { Review, ReviewMood } from '../types';

interface FeedCommentSheetProps {
  review: Review | null;
  isOpen: boolean;
  canWriteComment: boolean;
  currentUserId?: string | null;
  submittingReviewId: string | null;
  mutatingCommentId: string | null;
  deletingReviewId: string | null;
  updatingReviewId: string | null;
  highlightedCommentId: string | null;
  onClose: () => void;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood }) => Promise<void>;
  onRequestLogin: () => void;
}

const moodOptions: ReviewMood[] = ['혼자서', '친구랑', '데이트', '야경 맛집'];

export function FeedCommentSheet({
  review,
  isOpen,
  canWriteComment,
  currentUserId = null,
  submittingReviewId,
  mutatingCommentId,
  deletingReviewId,
  updatingReviewId,
  highlightedCommentId,
  onClose,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onDeleteReview,
  onUpdateReview,
  onRequestLogin,
}: FeedCommentSheetProps) {
  const dragStartYRef = useRef<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingBody, setEditingBody] = useState('');
  const [editingMood, setEditingMood] = useState<ReviewMood>('혼자서');

  useEffect(() => {
    if (!review) {
      setEditing(false);
      setEditingBody('');
      setEditingMood('혼자서');
      return;
    }

    setEditing(false);
    setEditingBody(review.body);
    setEditingMood(review.mood);
  }, [review]);

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) {
      return;
    }
    const delta = event.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    if (delta > 72) {
      onClose();
    }
  }

  async function handleSubmitReviewUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review || editingBody.trim().length < 4) {
      return;
    }
    await onUpdateReview(review.id, { body: editingBody.trim(), mood: editingMood });
    setEditing(false);
  }

  const sheetClassName = `feed-comment-sheet${isOpen ? ' feed-comment-sheet--open' : ' feed-comment-sheet--closed'}`;
  const isMine = review ? review.userId === currentUserId : false;

  return (
    <section className={sheetClassName} aria-label="댓글 시트" aria-hidden={!isOpen}>
      <button
        type="button"
        className="feed-comment-sheet__handle"
        aria-label="시트 닫기"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={onClose}
      >
        <span />
      </button>

      <div className="feed-comment-sheet__content">
        {review && (
          <>
            <div className="feed-comment-sheet__header">
              <div className="feed-comment-sheet__title-group">
                <strong className="feed-comment-sheet__place">{review.placeName}</strong>
                <p className="feed-comment-sheet__meta">
                  {review.author} · {review.visitLabel} · {review.visitedAt}
                </p>
              </div>
              <div className="feed-comment-sheet__header-actions">
                {isMine && (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setEditing((current) => !current)}
                      disabled={updatingReviewId === review.id || deletingReviewId === review.id}
                    >
                      {editing ? '수정 취소' : '피드 수정'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button feed-comment-sheet__delete"
                      onClick={() => void onDeleteReview(review.id)}
                      disabled={deletingReviewId === review.id || updatingReviewId === review.id}
                    >
                      {deletingReviewId === review.id ? '삭제 중' : '피드 삭제'}
                    </button>
                  </>
                )}
                <button type="button" className="feed-comment-sheet__close" onClick={onClose} aria-label="닫기">
                  ×
                </button>
              </div>
            </div>

            {editing ? (
              <form className="route-builder-form stack-gap" onSubmit={handleSubmitReviewUpdate}>
                <div className="chip-row compact-gap">
                  {moodOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={option === editingMood ? 'chip is-active' : 'chip'}
                      onClick={() => setEditingMood(option)}
                      disabled={updatingReviewId === review.id}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <label className="route-builder-field">
                  <span>피드 내용</span>
                  <textarea
                    rows={4}
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    placeholder="오늘 기록을 다시 다듬어 보세요."
                    disabled={updatingReviewId === review.id}
                  />
                </label>

                <div className="chip-row compact-gap">
                  <button
                    type="submit"
                    className="primary-button route-submit-button"
                    disabled={updatingReviewId === review.id || editingBody.trim().length < 4}
                  >
                    {updatingReviewId === review.id ? '수정 중' : '수정 저장'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditing(false);
                      setEditingBody(review.body);
                      setEditingMood(review.mood);
                    }}
                    disabled={updatingReviewId === review.id}
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <p className="feed-comment-sheet__body">{review.body}</p>
            )}

            <div className="feed-comment-sheet__divider" />

            <CommentThread
              comments={review.comments}
              canWriteComment={canWriteComment}
              currentUserId={currentUserId}
              submittingReviewId={submittingReviewId}
              mutatingCommentId={mutatingCommentId}
              highlightedCommentId={highlightedCommentId}
              reviewId={review.id}
              onSubmitComment={onSubmitComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onRequestLogin={onRequestLogin}
            />
          </>
        )}
      </div>
    </section>
  );
}
