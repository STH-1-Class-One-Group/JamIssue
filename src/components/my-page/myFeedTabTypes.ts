import type { MyPageResponse, ReviewMood } from '../../types';

export const reviewMoodOptions: ReviewMood[] = ['혼자서', '친구랑', '데이트', '야경 맛집'];

export type MyReview = NonNullable<MyPageResponse>['reviews'][number];

export interface ReviewUpdatePayload {
  body: string;
  mood: ReviewMood;
  file?: File | null;
  removeImage?: boolean;
}
