import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { FeedCommentSheet } from '../../src/components/FeedCommentSheet';
import { FeedTabHeader } from '../../src/components/feed/FeedTabHeader';
import { ReviewListItem } from '../../src/components/review/ReviewListItem';
import type { Comment, Review } from '../../src/types/review';

const review: Review = {
  id: 'review-1',
  userId: 'user-1',
  placeId: 'place-1',
  placeName: '솔레벤토',
  author: '민지',
  body: '혼자 사진을 보고 들어왔는데 공간이 편하고 다시 오르고 싶었어요.',
  mood: '친구랑' as Review['mood'],
  badge: '맛집',
  visitedAt: '2026. 06. 17.',
  imageUrl: 'https://example.com/review.jpg',
  thumbnailUrl: 'https://example.com/review-thumb.jpg',
  commentCount: 3,
  likeCount: 12,
  likedByMe: false,
  stampId: 'stamp-1',
  visitNumber: 1,
  visitLabel: '첫 방문',
  travelSessionId: null,
  hasPublishedRoute: false,
  comments: [],
};

const comments: Comment[] = [
  {
    id: 'comment-1',
    userId: 'user-2',
    author: '도윤',
    authorProfileImage: null,
    body: '다음에 여기 가볼게요.',
    parentId: null,
    isDeleted: false,
    createdAt: '2026. 06. 18.',
    replies: [],
  },
];

function renderReviewListItem(overrides: Partial<Review> = {}) {
  const props = {
    review: { ...review, ...overrides },
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
    onOpenPlace: vi.fn(),
    onOpenComments: vi.fn(),
  };

  render(<ReviewListItem {...props} />);

  return props;
}

function renderFeedCommentSheet(overrides: Partial<Parameters<typeof FeedCommentSheet>[0]> = {}) {
  const props = {
    review,
    comments,
    commentsStatus: 'ready' as const,
    isOpen: true,
    canWriteComment: true,
    currentUserId: 'user-1',
    submittingReviewId: null,
    mutatingCommentId: null,
    deletingReviewId: null,
    highlightedCommentId: null,
    onClose: vi.fn(),
    onSubmitComment: vi.fn().mockResolvedValue(undefined),
    onUpdateComment: vi.fn().mockResolvedValue(undefined),
    onDeleteComment: vi.fn().mockResolvedValue(undefined),
    onDeleteReview: vi.fn().mockResolvedValue(undefined),
    onRequestLogin: vi.fn(),
    ...overrides,
  };

  render(<FeedCommentSheet {...props} />);

  return props;
}

describe('feed modern rhythm migration', () => {
  it('renders each feed review as a UI-kit-backed media-first stream card without changing actions', async () => {
    const user = userEvent.setup();
    const props = renderReviewListItem();
    const card = screen.getByTestId('feed-review-card');

    expect(card).toHaveAttribute('data-feed-card', 'review');
    expect(card).toHaveAttribute('data-ui-content-card', '');
    expect(within(card).getByText('솔레벤토')).toBeInTheDocument();
    expect(within(card).getByText('민지 · 2026. 06. 17.')).toBeInTheDocument();
    expect(within(card).getByText('친구랑')).toBeInTheDocument();
    expect(within(card).getByRole('img', { name: '솔레벤토 후기 이미지' })).toBeInTheDocument();
    expect(within(card).getByText(review.body)).toHaveClass('review-card__caption');

    const sections = Array.from(card.querySelectorAll('[data-feed-section]')).map((node) =>
      node.getAttribute('data-feed-section'),
    );
    expect(sections).toEqual(['header', 'media', 'actions', 'caption', 'tags']);

    await user.click(within(card).getByRole('button', { name: '좋아요 12개' }));
    await user.click(within(card).getByRole('button', { name: '댓글 3개 보기' }));
    await user.click(within(card).getByRole('button', { name: '장소 보기' }));

    expect(props.onToggleLike).toHaveBeenCalledWith('review-1', props.review);
    expect(props.onOpenComments).toHaveBeenCalledWith('review-1');
    expect(props.onOpenPlace).toHaveBeenCalledWith('place-1');
  });

  it('keeps image-less reviews in the same app-feed rhythm', () => {
    renderReviewListItem({ imageUrl: null, thumbnailUrl: null });
    const card = screen.getByTestId('feed-review-card');

    expect(card).toHaveClass('review-card--text-only');
    expect(card.querySelector('[data-feed-section="media"]')).toBeNull();
    expect(card.querySelector('[data-feed-section="text"]')).not.toBeNull();
    expect(within(card).getByText(review.body)).toHaveClass('review-card__caption');

    const sections = Array.from(card.querySelectorAll('[data-feed-section]')).map((node) =>
      node.getAttribute('data-feed-section'),
    );
    expect(sections).toEqual(['header', 'text', 'actions', 'tags']);
  });

  it('renders the feed header through UI kit section rhythm and preserves filter clearing', async () => {
    const user = userEvent.setup();
    const onClearPlaceFilter = vi.fn();

    render(<FeedTabHeader placeFilterName="솔레벤토" onClearPlaceFilter={onClearPlaceFilter} />);

    expect(screen.getByRole('heading', { name: '솔레벤토 피드' })).toBeInTheDocument();
    expect(screen.getByText('지도에서 고른 장소의 방문 피드만 먼저 보여줍니다.')).toBeInTheDocument();
    expect(screen.getByText('현재 장소: 솔레벤토')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전체 피드 보기' }));

    expect(onClearPlaceFilter).toHaveBeenCalledTimes(1);
  });

  it('keeps FeedCommentSheet close, delete, and comment submit behavior while using UI-kit sheet rhythm', async () => {
    const user = userEvent.setup();
    const props = renderFeedCommentSheet();

    const sheet = screen.getByRole('region', { name: '댓글 시트' });
    expect(sheet).toHaveClass('feed-comment-sheet--open');
    expect(screen.getByText('솔레벤토')).toBeInTheDocument();
    expect(screen.getByText('민지 · 첫 방문 · 2026. 06. 17.')).toBeInTheDocument();
    expect(screen.getByText('다음에 여기 가볼게요.')).toBeInTheDocument();
    expect(sheet.querySelector('[data-ui-content-card]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: '피드 삭제' }));
    expect(props.onDeleteReview).toHaveBeenCalledWith('review-1');

    await user.type(screen.getByPlaceholderText('댓글 내용을 적어 보세요.'), '좋은 후기예요');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(props.onSubmitComment).toHaveBeenCalledWith('review-1', '좋은 후기예요', undefined);

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps touched feed modules free of mojibake and replacement characters', () => {
    const files = [
      'src/components/FeedTab.tsx',
      'src/components/FeedCommentSheet.tsx',
      'src/components/CommentThread.tsx',
      'src/components/feed/FeedTabHeader.tsx',
      'src/components/review/ReviewListItem.tsx',
      'src/components/review/ReviewTagRow.tsx',
      'src/components/comment-thread/CommentComposer.tsx',
      'src/components/comment-thread/CommentThreadItem.tsx',
      'src/components/comment-thread/CommentThreadItemActions.tsx',
    ];
    const text = (...codes: number[]) => String.fromCodePoint(...codes);
    const brokenFragments = [
      String.fromCodePoint(0xfffd),
      text(0x3f, 0x3f, 0x3f),
      text(0x8adb),
      text(0x7b4c),
      text(0x63f6),
      text(0x7652),
      text(0x8e42),
      text(0xf9de),
      text(0xc1e0, 0xb0b0, 0xc2b6),
      text(0xbc24, 0xa4),
      text(0xc12c, 0xc8),
      text(0xae45),
    ];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      for (const fragment of brokenFragments) {
        expect(source, file).not.toContain(fragment);
      }
    }
  });
});
