import type { Comment, Review } from '../types';

export function countCommentsInThread(comments: Comment[]): number {
  // Count comments without using reduce to avoid unnecessary closure allocations
  let count = 0;
  for (const comment of comments) {
    count += 1 + countCommentsInThread(comment.replies);
  }
  return count;
}

export function toReviewSummary(review: Review): Review {
  return {
    ...review,
    comments: [],
  };
}

export function toReviewSummaryList(reviews: Review[]): Review[] {
  return reviews.map(toReviewSummary);
}
