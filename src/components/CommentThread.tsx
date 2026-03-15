import { FormEvent, useState } from 'react';
import type { Comment } from '../types';

interface CommentThreadProps {
  reviewId: string;
  comments: Comment[];
  canWrite: boolean;
  submitting: boolean;
  onSubmit: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onRequestLogin: () => void;
}

interface CommentNodeProps {
  comment: Comment;
  reviewId: string;
  canWrite: boolean;
  submitting: boolean;
  onSubmit: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onRequestLogin: () => void;
}

function CommentNode({ comment, reviewId, canWrite, submitting, onSubmit, onRequestLogin }: CommentNodeProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) {
      onRequestLogin();
      return;
    }

    const trimmed = replyBody.trim();
    if (!trimmed) {
      return;
    }

    await onSubmit(reviewId, trimmed, comment.id);
    setReplyBody('');
    setIsReplyOpen(false);
  }

  return (
    <li className="comment-thread__item">
      <div className="comment-thread__bubble">
        <div className="comment-thread__meta">
          <strong>{comment.author}</strong>
          <span>{comment.createdAt}</span>
        </div>
        <p>{comment.body}</p>
        <button type="button" className="text-button" onClick={() => setIsReplyOpen((current) => !current)}>
          답글
        </button>
      </div>
      {isReplyOpen && (
        <form className="comment-thread__reply" onSubmit={handleReplySubmit}>
          <input value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="짧게 답글 남기기" />
          <button type="submit" className="text-button" disabled={submitting}>
            {submitting ? '저장 중...' : '등록'}
          </button>
        </form>
      )}
      {comment.replies.length > 0 && (
        <ul className="comment-thread__list is-nested">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} reviewId={reviewId} canWrite={canWrite} submitting={submitting} onSubmit={onSubmit} onRequestLogin={onRequestLogin} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({ reviewId, comments, canWrite, submitting, onSubmit, onRequestLogin }: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="comment-thread__empty">아직 댓글이 없어요. 첫 반응을 남겨 보세요.</p>;
  }

  return (
    <ul className="comment-thread__list">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} reviewId={reviewId} canWrite={canWrite} submitting={submitting} onSubmit={onSubmit} onRequestLogin={onRequestLogin} />
      ))}
    </ul>
  );
}