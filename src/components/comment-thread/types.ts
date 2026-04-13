import type { Comment } from '../../types';

export interface CommentThreadProps {
  comments: Comment[];
  canWriteComment: boolean;
  currentUserId?: string | null;
  submittingReviewId: string | null;
  mutatingCommentId: string | null;
  highlightedCommentId: string | null;
  reviewId: string;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onRequestLogin: () => void;
}

export interface CommentThreadActionProps {
  canWriteComment: boolean;
  currentUserId?: string | null;
  submittingReviewId: string | null;
  mutatingCommentId: string | null;
  highlightedCommentId: string | null;
  reviewId: string;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onRequestLogin: () => void;
}

export interface CommentComposerProps {
  canWriteComment: boolean;
  placeholder: string;
  reviewId: string;
  submittingReviewId: string | null;
  onRequestLogin: () => void;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  parentId?: string;
  onSubmitted?: () => void;
}

export interface CommentItemProps extends CommentThreadActionProps {
  comment: Comment;
  isReply?: boolean;
}
