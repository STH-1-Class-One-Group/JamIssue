import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import type { RefObject } from 'react';
import type { SessionUser } from '../../src/types/auth';
import type { Comment, Review } from '../../src/types/review';
import { FeedTab } from '../../src/components/FeedTab';
import { FeedCommentSheet } from '../../src/components/FeedCommentSheet';
import { FeedLoadMoreRow } from '../../src/components/feed/FeedLoadMoreRow';
import { FeedTabHeader } from '../../src/components/feed/FeedTabHeader';
import { ProviderButtons } from '../../src/components/ProviderButtons';

const hookMocks = vi.hoisted(() => ({
  useAutoLoadMore: vi.fn(() => ({ current: null })),
  useScrollRestoration: vi.fn(() => ({ current: null })),
}));

vi.mock('../../src/hooks/useAutoLoadMore', () => ({
  useAutoLoadMore: hookMocks.useAutoLoadMore,
}));

vi.mock('../../src/hooks/useScrollRestoration', () => ({
  useScrollRestoration: hookMocks.useScrollRestoration,
}));

vi.mock('../../src/components/ReviewList', () => ({
  ReviewList: (props: {
    reviews: Review[];
    canWriteComment: boolean;
    canToggleLike: boolean;
    highlightedReviewId: string | null;
    onToggleLike: (reviewId: string) => Promise<void>;
    onOpenComments: (reviewId: string, commentId?: string | null) => void;
  }) => (
    <div
      data-testid="review-list"
      data-review-count={props.reviews.length}
      data-can-write={String(props.canWriteComment)}
      data-can-like={String(props.canToggleLike)}
      data-highlighted={props.highlightedReviewId ?? ''}
    >
      {props.reviews.map((review) => (
        <button key={review.id} type="button" onClick={() => props.onOpenComments(review.id)}>
          {review.id}
        </button>
      ))}
      <button type="button" onClick={() => void props.onToggleLike(props.reviews[0]?.id ?? 'none')}>
        toggle-like
      </button>
    </div>
  ),
}));

vi.mock('../../src/components/CommentThread', () => ({
  CommentThread: (props: {
    comments: Comment[];
    reviewId: string;
    canWriteComment: boolean;
    onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
    onRequestLogin: () => void;
  }) => (
    <div
      data-testid="comment-thread"
      data-review-id={props.reviewId}
      data-comment-count={props.comments.length}
      data-can-write={String(props.canWriteComment)}
    >
      <button type="button" onClick={() => void props.onSubmitComment(props.reviewId, 'body')}>
        submit-comment
      </button>
      <button type="button" onClick={props.onRequestLogin}>
        request-login
      </button>
    </div>
  ),
}));

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const TEST_REVIEW_MOOD = 'test-mood' as Review['mood'];

function reviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'author',
    body: 'body',
    mood: TEST_REVIEW_MOOD,
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: null,
    thumbnailUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

function commentFixture(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    userId: 'user-1',
    author: 'author',
    body: 'comment',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-05-14',
    replies: [],
    ...overrides,
  };
}

function feedActions() {
  return {
    onLoadMore: vi.fn().mockResolvedValue(undefined),
    onToggleReviewLike: vi.fn().mockResolvedValue(undefined),
    onCreateComment: vi.fn().mockResolvedValue(undefined),
    onUpdateComment: vi.fn().mockResolvedValue(undefined),
    onDeleteComment: vi.fn().mockResolvedValue(undefined),
    onDeleteReview: vi.fn().mockResolvedValue(undefined),
    onClearPlaceFilter: vi.fn(),
    onOpenComments: vi.fn(),
    onCloseComments: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('FeedTab filters visible reviews, wires auto-load sentinel, and opens the active comment sheet', async () => {
  const user = userEvent.setup();
  const actions = feedActions();
  render(
    <FeedTab
      feedData={{
        reviews: [reviewFixture({ id: 'review-1', placeId: 'place-1' }), reviewFixture({ id: 'review-2', placeId: 'place-2' })],
        placeFilterId: 'place-1',
        placeFilterName: 'Place 1',
        highlightedReviewId: 'review-1',
        reviewLikeUpdatingId: null,
        hasMore: true,
        loadingMore: false,
      }}
      commentSheetData={{
        activeCommentReviewId: 'review-1',
        activeCommentReviewComments: [commentFixture()],
        activeCommentReviewStatus: 'ready',
        highlightedCommentId: null,
        commentSubmittingReviewId: null,
        commentMutatingId: null,
        deletingReviewId: null,
      }}
      sharedData={{ sessionUser }}
      feedActions={actions}
      sharedActions={{ onRequestLogin: vi.fn(), onOpenPlace: vi.fn() }}
    />,
  );

  expect(screen.getByTestId('review-list')).toHaveAttribute('data-review-count', '1');
  expect(screen.getByTestId('review-list')).toHaveAttribute('data-can-write', 'true');
  expect(screen.getByTestId('comment-thread')).toHaveAttribute('data-review-id', 'review-1');
  expect(hookMocks.useAutoLoadMore).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, loading: false }));

  await user.click(screen.getByText('review-1'));
  expect(actions.onOpenComments).toHaveBeenCalledWith('review-1');

  await user.click(screen.getByText('submit-comment'));
  expect(actions.onCreateComment).toHaveBeenCalledWith('review-1', 'body');

  await user.click(screen.getByRole('button', { name: /More feed/i }));
  expect(actions.onLoadMore).toHaveBeenCalled();
});

test('FeedTab enables auto-load on unfiltered feeds and renders anonymous comment sheet state', async () => {
  const actions = feedActions();
  const onRequestLogin = vi.fn();
  render(
    <FeedTab
      feedData={{
        reviews: [reviewFixture({ id: 'review-1', placeId: 'place-1' })],
        placeFilterId: null,
        placeFilterName: null,
        highlightedReviewId: null,
        reviewLikeUpdatingId: 'review-1',
        hasMore: true,
        loadingMore: true,
      }}
      commentSheetData={{
        activeCommentReviewId: 'missing-review',
        activeCommentReviewComments: [],
        activeCommentReviewStatus: 'error',
        highlightedCommentId: 'comment-1',
        commentSubmittingReviewId: 'review-1',
        commentMutatingId: 'comment-1',
        deletingReviewId: 'review-1',
      }}
      sharedData={{ sessionUser: null }}
      feedActions={actions}
      sharedActions={{ onRequestLogin, onOpenPlace: vi.fn() }}
    />,
  );

  expect(screen.getByTestId('review-list')).toHaveAttribute('data-review-count', '1');
  expect(screen.getByTestId('review-list')).toHaveAttribute('data-can-write', 'false');
  expect(screen.getByTestId('review-list')).toHaveAttribute('data-can-like', 'false');
  expect(hookMocks.useAutoLoadMore).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, loading: true }));
  expect(document.querySelector('.feed-comment-sheet')).toHaveClass('feed-comment-sheet--open');
});

test('FeedCommentSheet supports drag-to-close and owner delete action without rendering thread while loading', () => {
  const onClose = vi.fn();
  const onDeleteReview = vi.fn().mockResolvedValue(undefined);
  const { container } = render(
    <FeedCommentSheet
      review={reviewFixture()}
      comments={[commentFixture()]}
      commentsStatus="loading"
      isOpen
      canWriteComment
      currentUserId="user-1"
      submittingReviewId={null}
      mutatingCommentId={null}
      deletingReviewId={null}
      highlightedCommentId={null}
      onClose={onClose}
      onSubmitComment={vi.fn().mockResolvedValue(undefined)}
      onUpdateComment={vi.fn().mockResolvedValue(undefined)}
      onDeleteComment={vi.fn().mockResolvedValue(undefined)}
      onDeleteReview={onDeleteReview}
      onRequestLogin={vi.fn()}
    />,
  );

  const handle = container.querySelector<HTMLButtonElement>('.feed-comment-sheet__handle');
  expect(handle).not.toBeNull();
  fireEvent.pointerDown(handle!, { clientY: 0 });
  fireEvent.pointerUp(handle!, { clientY: 100 });
  expect(onClose).toHaveBeenCalled();
  expect(screen.queryByTestId('comment-thread')).toBeNull();

  const deleteButton = container.querySelector<HTMLButtonElement>('.feed-comment-sheet__delete');
  expect(deleteButton).not.toBeNull();
  fireEvent.click(deleteButton!);
  expect(onDeleteReview).toHaveBeenCalledWith('review-1');
});

test('FeedLoadMoreRow hides when exhausted and calls load callback when visible', async () => {
  const user = userEvent.setup();
  const onLoadMore = vi.fn().mockResolvedValue(undefined);
  const loadMoreRef = { current: null } as RefObject<HTMLDivElement>;
  const { rerender } = render(
    <FeedLoadMoreRow hasMore={false} loadingMore={false} loadMoreRef={loadMoreRef} onLoadMore={onLoadMore} />,
  );

  expect(document.querySelector('.list-load-more-row')).toBeNull();

  rerender(<FeedLoadMoreRow hasMore loadingMore={false} loadMoreRef={loadMoreRef} onLoadMore={onLoadMore} />);
  await user.click(screen.getByRole('button', { name: /More feed/i }));
  expect(onLoadMore).toHaveBeenCalled();
});

test('FeedTabHeader exposes clear-filter action only for filtered feeds', async () => {
  const user = userEvent.setup();
  const onClearPlaceFilter = vi.fn();
  const { rerender } = render(<FeedTabHeader placeFilterName={null} onClearPlaceFilter={onClearPlaceFilter} />);

  expect(document.querySelector('.chip-row')).toBeNull();

  rerender(<FeedTabHeader placeFilterName="Place 1" onClearPlaceFilter={onClearPlaceFilter} />);
  const clearButton = document.querySelector<HTMLButtonElement>('.chip-row .chip');
  expect(clearButton).not.toBeNull();
  await user.click(clearButton!);
  expect(onClearPlaceFilter).toHaveBeenCalled();
});

test('ProviderButtons disables unavailable providers and calls login for enabled providers', async () => {
  const user = userEvent.setup();
  const onLogin = vi.fn();
  render(
    <ProviderButtons
      providers={[
        { key: 'kakao', label: 'Kakao', isEnabled: true, loginUrl: '/login/kakao' },
        { key: 'naver', label: 'Naver', isEnabled: false, loginUrl: null },
      ]}
      onLogin={onLogin}
    />,
  );

  const buttons = screen.getAllByRole('button');
  expect(buttons[1]).toBeDisabled();
  await user.click(buttons[0]);
  expect(onLogin).toHaveBeenCalledWith('kakao');
});
