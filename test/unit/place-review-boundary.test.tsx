import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceDetailReviewSection } from '../../src/components/place/PlaceDetailReviewSection';
import { usePlaceDrawerHandle } from '../../src/components/place/usePlaceDrawerHandle';
import { ReviewListEmptyState } from '../../src/components/review/ReviewListEmptyState';
import type { Place, Review, StampLog } from '../../src/types/core';

const placeReviewMocks = vi.hoisted(() => ({
  PlaceReviewPreviewList: vi.fn((props: { reviews: Review[] }) => (
    <div data-testid="preview-count">{props.reviews.length}</div>
  )),
  ReviewComposer: vi.fn((props: {
    status: string;
    onRequestProof: () => void;
    onSubmit: (payload: { body: string; mood: string; file: File | null }) => Promise<void>;
  }) => (
    <div data-testid="review-composer" data-status={props.status}>
      <button type="button" onClick={props.onRequestProof}>proof</button>
      <button type="button" onClick={() => void props.onSubmit({ body: 'body', mood: 'mood', file: null })}>submit</button>
    </div>
  )),
}));

vi.mock('../../src/components/review/PlaceReviewPreviewList', () => ({
  PlaceReviewPreviewList: placeReviewMocks.PlaceReviewPreviewList,
}));

vi.mock('../../src/components/ReviewComposer', () => ({
  ReviewComposer: placeReviewMocks.ReviewComposer,
}));

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#fff',
    accentColor: '#000',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    ...overrides,
  };
}

function reviewFixture(id: string): Review {
  return {
    id,
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'Author',
    body: 'body',
    mood: 'mood',
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: 'visit',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
  };
}

function stampFixture(): StampLog {
  return {
    id: 'stamp-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14',
    visitNumber: 1,
    visitLabel: 'visit',
    travelSessionId: 'session-1',
    travelSessionStampCount: 1,
  };
}

describe('place review section boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives composer state from login, daily limit, proof, and ready conditions', () => {
    const baseProps = {
      place: placeFixture(),
      reviews: [reviewFixture('review-1'), reviewFixture('review-2'), reviewFixture('review-3')],
      reviewSubmitting: false,
      reviewError: null,
      reviewProofMessage: 'proof',
      canCreateReview: true,
      onOpenFeedReview: vi.fn(),
      onRequestLogin: vi.fn(),
      onClaimStamp: vi.fn(),
      onCreateReview: vi.fn(),
    };

    const { rerender } = render(
      <PlaceDetailReviewSection
        {...baseProps}
        loggedIn={false}
        todayStamp={null}
        hasCreatedReviewToday={false}
      />,
    );
    expect(screen.getByTestId('review-composer')).toHaveAttribute('data-status', 'login');

    rerender(<PlaceDetailReviewSection {...baseProps} loggedIn todayStamp={stampFixture()} hasCreatedReviewToday />);
    expect(screen.getByTestId('review-composer')).toHaveAttribute('data-status', 'daily-limit');

    rerender(<PlaceDetailReviewSection {...baseProps} loggedIn todayStamp={null} hasCreatedReviewToday={false} />);
    expect(screen.getByTestId('review-composer')).toHaveAttribute('data-status', 'claim');

    rerender(<PlaceDetailReviewSection {...baseProps} loggedIn todayStamp={stampFixture()} hasCreatedReviewToday={false} />);
    expect(screen.getByTestId('review-composer')).toHaveAttribute('data-status', 'ready');
    expect(screen.getByTestId('preview-count')).toHaveTextContent('2');
  });

  it('routes proof, feed, and submit actions without submitting when proof is absent', async () => {
    const user = userEvent.setup();
    const onOpenFeedReview = vi.fn();
    const onRequestLogin = vi.fn();
    const onClaimStamp = vi.fn().mockResolvedValue(undefined);
    const onCreateReview = vi.fn().mockResolvedValue(undefined);
    const props = {
      place: placeFixture(),
      reviews: [],
      loggedIn: false,
      todayStamp: null,
      hasCreatedReviewToday: false,
      reviewSubmitting: false,
      reviewError: null,
      reviewProofMessage: 'proof',
      canCreateReview: false,
      onOpenFeedReview,
      onRequestLogin,
      onClaimStamp,
      onCreateReview,
    };
    const { rerender } = render(<PlaceDetailReviewSection {...props} />);

    await user.click(screen.getByRole('button', { name: 'proof' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));
    await user.click(document.querySelector('.place-drawer__feed-button') as HTMLButtonElement);
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(onCreateReview).not.toHaveBeenCalled();
    expect(onOpenFeedReview).toHaveBeenCalledTimes(1);

    rerender(<PlaceDetailReviewSection {...props} loggedIn canCreateReview />);
    await user.click(screen.getByRole('button', { name: 'proof' }));
    expect(onClaimStamp).toHaveBeenCalledWith(props.place);

    rerender(<PlaceDetailReviewSection {...props} loggedIn todayStamp={stampFixture()} canCreateReview />);
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(onCreateReview).toHaveBeenCalledWith({
      stampId: 'stamp-1',
      body: 'body',
      mood: 'mood',
      file: null,
    });
  });
});

describe('place drawer handle behavior', () => {
  it('maps clicks and vertical drags to expand, collapse, and close actions', () => {
    const onClose = vi.fn();
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { result, rerender } = renderHook(
      ({ drawerState }) => usePlaceDrawerHandle({ drawerState, onClose, onExpand, onCollapse }),
      { initialProps: { drawerState: 'partial' as const } },
    );

    result.current.handleClick();
    expect(onExpand).toHaveBeenCalledTimes(1);

    result.current.handlePointerDown({ clientY: 100 } as React.PointerEvent<HTMLButtonElement>);
    result.current.handlePointerUp({ clientY: 10 } as React.PointerEvent<HTMLButtonElement>);
    expect(onExpand).toHaveBeenCalledTimes(2);

    result.current.handlePointerDown({ clientY: 100 } as React.PointerEvent<HTMLButtonElement>);
    result.current.handlePointerUp({ clientY: 190 } as React.PointerEvent<HTMLButtonElement>);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender({ drawerState: 'full' });
    result.current.handleClick();
    result.current.handlePointerDown({ clientY: 100 } as React.PointerEvent<HTMLButtonElement>);
    result.current.handlePointerUp({ clientY: 190 } as React.PointerEvent<HTMLButtonElement>);
    expect(onCollapse).toHaveBeenCalledTimes(2);
  });

  it('ignores pointer-up events without a matching drag start', () => {
    const onClose = vi.fn();
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { result } = renderHook(() => usePlaceDrawerHandle({
      drawerState: 'partial',
      onClose,
      onExpand,
      onCollapse,
    }));

    result.current.handlePointerUp({ clientY: 190 } as React.PointerEvent<HTMLButtonElement>);

    expect(onClose).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();
  });
});

describe('review empty state', () => {
  it('renders the provided empty state title and body without changing copy', () => {
    render(<ReviewListEmptyState emptyTitle="empty title" emptyBody="empty body" />);

    expect(screen.getByText('empty title')).toBeInTheDocument();
    expect(screen.getByText('empty body')).toHaveClass('section-copy');
  });
});
