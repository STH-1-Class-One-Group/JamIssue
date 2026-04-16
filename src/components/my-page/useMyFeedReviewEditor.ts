import { useState } from 'react';
import type { ReviewMood } from '../../types';
import type { MyReview, ReviewUpdatePayload } from './myFeedTabTypes';

export function useMyFeedReviewEditor(onUpdateReview: (reviewId: string, payload: ReviewUpdatePayload) => Promise<void>) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewBody, setEditingReviewBody] = useState('');
  const [editingReviewMood, setEditingReviewMood] = useState<ReviewMood>('혼자서');
  const [editingReviewFile, setEditingReviewFile] = useState<File | null>(null);
  const [editingReviewRemoveImage, setEditingReviewRemoveImage] = useState(false);
  const [reviewUpdatingId, setReviewUpdatingId] = useState<string | null>(null);
  const [reviewEditError, setReviewEditError] = useState<string | null>(null);

  function startEditingReview(review: MyReview) {
    setEditingReviewId(review.id);
    setEditingReviewBody(review.body);
    setEditingReviewMood(review.mood);
    setEditingReviewFile(null);
    setEditingReviewRemoveImage(false);
    setReviewEditError(null);
  }

  function cancelEditingReview() {
    setEditingReviewId(null);
    setEditingReviewBody('');
    setEditingReviewMood('혼자서');
    setEditingReviewFile(null);
    setEditingReviewRemoveImage(false);
    setReviewEditError(null);
  }

  async function handleSaveReview(reviewId: string) {
    try {
      setReviewUpdatingId(reviewId);
      setReviewEditError(null);
      await onUpdateReview(reviewId, {
        body: editingReviewBody.trim(),
        mood: editingReviewMood,
        file: editingReviewFile,
        removeImage: editingReviewRemoveImage,
      });
      cancelEditingReview();
    } catch (error) {
      setReviewEditError(error instanceof Error ? error.message : '리뷰를 수정하지 못했어요.');
    } finally {
      setReviewUpdatingId(null);
    }
  }

  return {
    editingReviewId,
    editingReviewBody,
    editingReviewMood,
    editingReviewFile,
    editingReviewRemoveImage,
    reviewUpdatingId,
    reviewEditError,
    setEditingReviewBody,
    setEditingReviewMood,
    setEditingReviewFile,
    setEditingReviewRemoveImage,
    startEditingReview,
    cancelEditingReview,
    handleSaveReview,
  };
}
