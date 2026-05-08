import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReviewFixture } from '../fixtures/app-fixtures';
import type { Review } from '../../src/types';

const reviewListItemMock = vi.hoisted(() => ({
  renderCounts: {} as Record<string, number>,
}));

vi.mock('../../src/components/review/ReviewListItem', async () => {
  const React = await import('react');

  return {
    ReviewListItem: React.memo(function MockReviewListItem({ review }: { review: Review }) {
      reviewListItemMock.renderCounts[review.id] = (reviewListItemMock.renderCounts[review.id] ?? 0) + 1;
      return React.createElement('article', { 'data-testid': `review-${review.id}` });
    }),
  };
});

describe('ReviewList render stability', () => {
  beforeEach(() => {
    reviewListItemMock.renderCounts = {};
  });

  it('keeps inactive review items skipped when the active review id changes', async () => {
    const { ReviewList } = await import('../../src/components/ReviewList');
    const reviews = [
      createReviewFixture({ id: 'review-1' }),
      createReviewFixture({ id: 'review-2' }),
      createReviewFixture({ id: 'review-3' }),
    ];
    const stableActions = {
      onDeleteComment: vi.fn().mockResolvedValue(undefined),
      onOpenComments: vi.fn(),
      onOpenPlace: vi.fn(),
      onRequestLogin: vi.fn(),
      onSubmitComment: vi.fn().mockResolvedValue(undefined),
      onToggleLike: vi.fn().mockResolvedValue(undefined),
      onUpdateComment: vi.fn().mockResolvedValue(undefined),
    };

    function Harness() {
      const [likingReviewId, setLikingReviewId] = useState('review-1');

      return (
        <>
          <button type="button" onClick={() => setLikingReviewId('review-2')}>
            move active review
          </button>
          <ReviewList
            reviews={reviews}
            canWriteComment
            canToggleLike
            currentUserId="user-1"
            highlightedReviewId={null}
            likingReviewId={likingReviewId}
            submittingReviewId={null}
            emptyTitle="empty"
            emptyBody="empty"
            {...stableActions}
          />
        </>
      );
    }

    render(<Harness />);

    expect(reviewListItemMock.renderCounts).toEqual({
      'review-1': 1,
      'review-2': 1,
      'review-3': 1,
    });

    fireEvent.click(screen.getByRole('button', { name: 'move active review' }));

    expect(reviewListItemMock.renderCounts).toEqual({
      'review-1': 2,
      'review-2': 2,
      'review-3': 1,
    });
  });
});
