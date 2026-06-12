import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReviewListItem } from '../../src/components/review/ReviewListItem';
import { createReviewFixture } from '../fixtures/app-fixtures';

function baseProps(overrides: Partial<Parameters<typeof ReviewListItem>[0]> = {}): Parameters<typeof ReviewListItem>[0] {
  return {
    review: createReviewFixture({
      id: 'review-1',
      comments: [],
      commentCount: 2,
      likeCount: 3,
    }),
    currentUserId: 'user-1',
    isHighlighted: false,
    canWriteComment: true,
    canToggleLike: true,
    isLiking: false,
    isSubmitting: false,
    onToggleLike: vi.fn().mockResolvedValue(undefined),
    onSubmitComment: vi.fn().mockResolvedValue(undefined),
    onUpdateComment: vi.fn().mockResolvedValue(undefined),
    onDeleteComment: vi.fn().mockResolvedValue(undefined),
    onRequestLogin: vi.fn(),
    ...overrides,
  };
}

describe('ReviewListItem', () => {
  it('renders feed action mode with image, highlighted state, and open callbacks', () => {
    const onToggleLike = vi.fn().mockResolvedValue(undefined);
    const onOpenComments = vi.fn();
    const onOpenPlace = vi.fn();
    const review = createReviewFixture({
      id: 'review-1',
      imageUrl: '/images/review.jpg',
      thumbnailUrl: '/images/review-thumb.jpg',
      likedByMe: true,
      likeCount: 5,
      commentCount: 7,
    });

    const { container } = render(<ReviewListItem {...baseProps({
      review,
      isHighlighted: true,
      isLiking: true,
      onToggleLike,
      onOpenComments,
      onOpenPlace,
    })} />);

    const article = container.querySelector('article');
    expect(article?.className).toContain('review-card--highlighted');
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/review-thumb.jpg');
    expect(screen.getByRole('button', { pressed: true })).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/7/));
    fireEvent.click(screen.getByRole('button', { name: '장소 보기' }));

    expect(onOpenComments).toHaveBeenCalledWith('review-1');
    expect(onOpenPlace).toHaveBeenCalledWith(review.placeId);
    expect(onToggleLike).not.toHaveBeenCalled();
  });

  it('falls back to login for likes and renders the inline comment thread when comments are not delegated', () => {
    const onRequestLogin = vi.fn();
    const onSubmitComment = vi.fn().mockResolvedValue(undefined);

    render(<ReviewListItem {...baseProps({
      review: createReviewFixture({ likedByMe: false, imageUrl: null, thumbnailUrl: null }),
      canToggleLike: false,
      canWriteComment: false,
      currentUserId: null,
      isSubmitting: true,
      onRequestLogin,
      onSubmitComment,
    })} />);

    fireEvent.click(screen.getByRole('button', { pressed: false }));

    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /보기/ })).toBeNull();
  });
});
