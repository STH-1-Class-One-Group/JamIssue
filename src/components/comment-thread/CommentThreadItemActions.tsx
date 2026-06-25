import { ActionButton } from '../ui-kit';

interface CommentThreadItemActionsProps {
  canWriteComment: boolean;
  isMine: boolean;
  editing: boolean;
  isMutating: boolean;
  onReplyToggle: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
  onCancelEditing: () => void;
}

export function CommentThreadItemActions({
  canWriteComment,
  isMine,
  editing,
  isMutating,
  onReplyToggle,
  onStartEditing,
  onDelete,
  onCancelEditing,
}: CommentThreadItemActionsProps) {
  return (
    <div className="comment-thread__actions">
      {canWriteComment && (
        <ActionButton type="button" size="sm" variant="ghost" className="comment-thread__reply-toggle" onClick={onReplyToggle}>
          답글 쓰기
        </ActionButton>
      )}
      {isMine && !editing && (
        <>
          <ActionButton type="button" size="sm" variant="ghost" className="comment-thread__reply-toggle" onClick={onStartEditing}>
            수정
          </ActionButton>
          <ActionButton type="button" size="sm" variant="ghost" className="comment-thread__reply-toggle" onClick={onDelete} disabled={isMutating}>
            삭제
          </ActionButton>
        </>
      )}
      {isMine && editing && (
        <ActionButton type="button" size="sm" variant="ghost" className="comment-thread__reply-toggle" onClick={onCancelEditing}>
          취소
        </ActionButton>
      )}
    </div>
  );
}
