import { useCallback } from 'react';
import {
  createComment,
  deleteComment,
  updateComment,
} from '../api/reviewsClient';
import { countCommentsInThread } from '../lib/reviews';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import type { UseAppReviewActionsParams } from './useAppReviewActions.types';

export function useAppReviewCommentActions({
  activeTab,
  sessionUser,
  setNotice,
  goToTab,
  refreshMyPageForUser,
  patchReviewCollections,
  syncReviewComments,
  formatErrorMessage,
}: UseAppReviewActionsParams) {
  const setCommentSubmittingReviewId = useAppPageRuntimeStore((state) => state.setCommentSubmittingReviewId);
  const setCommentMutatingId = useAppPageRuntimeStore((state) => state.setCommentMutatingId);

  const handleCreateComment = useCallback(async (reviewId: string, body: string, parentId?: string) => {
    if (!sessionUser) {
      goToTab('my');
      setNotice('댓글을 남기려면 먼저 로그인해 주세요.');
      return;
    }

    setCommentSubmittingReviewId(reviewId);
    try {
      const updatedComments = await createComment(reviewId, { body, parentId: parentId ?? null });
      syncReviewComments(reviewId, updatedComments);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        commentCount: countCommentsInThread(updatedComments),
      }));
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentSubmittingReviewId(null);
    }
  }, [sessionUser, goToTab, setNotice, setCommentSubmittingReviewId, syncReviewComments, patchReviewCollections, formatErrorMessage]);

  const handleUpdateComment = useCallback(async (reviewId: string, commentId: string, body: string) => {
    if (!sessionUser) {
      goToTab('my');
      setNotice('댓글을 수정하려면 먼저 로그인해 주세요.');
      return;
    }

    setCommentMutatingId(commentId);
    try {
      const updatedComments = await updateComment(reviewId, commentId, { body });
      syncReviewComments(reviewId, updatedComments);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        commentCount: countCommentsInThread(updatedComments),
      }));
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentMutatingId(null);
    }
  }, [sessionUser, goToTab, setNotice, setCommentMutatingId, syncReviewComments, patchReviewCollections, activeTab, refreshMyPageForUser, formatErrorMessage]);

  const handleDeleteComment = useCallback(async (reviewId: string, commentId: string) => {
    if (!sessionUser) {
      goToTab('my');
      setNotice('댓글을 삭제하려면 먼저 로그인해 주세요.');
      return;
    }

    setCommentMutatingId(commentId);
    try {
      const updatedComments = await deleteComment(reviewId, commentId);
      syncReviewComments(reviewId, updatedComments);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        commentCount: countCommentsInThread(updatedComments),
      }));
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentMutatingId(null);
    }
  }, [sessionUser, goToTab, setNotice, setCommentMutatingId, syncReviewComments, patchReviewCollections, activeTab, refreshMyPageForUser, formatErrorMessage]);

  return {
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
