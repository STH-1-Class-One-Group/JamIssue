/*
 * File: read-model.ts
 * Purpose: Define the review read-model returned by Worker review APIs.
 * Primary Responsibility: Keep review DTO shape owned by the review domain.
 * Design Intent: Base-data assembly and review services can share the review read-model without keeping it in the global Worker type barrel.
 * Non-Goals: This file does not map database rows, load reviews, or change API response fields.
 * Dependencies: Shared JSON record primitives.
 */
import type { WorkerJsonRecord } from '../../types';

export interface WorkerReviewComment extends WorkerJsonRecord {
  id: string;
  replies?: WorkerReviewComment[];
}

export interface WorkerReview extends WorkerJsonRecord {
  id: string;
  comments?: WorkerReviewComment[];
}
