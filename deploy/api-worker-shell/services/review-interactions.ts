/*
 * File: review-interactions.ts
 * Purpose: Provide the public review interaction handler facade used by routing.
 * Primary Responsibility: Preserve the route registry import surface while use cases live in readable handler modules.
 * Design Intent: Callers should not need to know the internal handler grouping.
 * Non-Goals: This file does not implement review, comment, like, upload, or notification behavior directly.
 * Dependencies: Review upload, write, comment, and like handlers.
 */
export { handleReviewUpload } from './review-upload-handler';
export { handleCreateReview, handleUpdateReview, handleDeleteReview } from './review-write-handlers';
export { handleCreateComment, handleUpdateComment, handleDeleteComment } from './review-comment-handlers';
export { handleToggleReviewLike } from './review-like-handler';
