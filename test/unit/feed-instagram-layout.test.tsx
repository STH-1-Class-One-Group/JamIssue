import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { FeedTabHeader } from '../../src/components/feed/FeedTabHeader';
import { ReviewListItem } from '../../src/components/review/ReviewListItem';
import type { Review } from '../../src/types/review';

const review: Review = {
  id: 'review-1',
  userId: 'user-1',
  placeId: 'place-1',
  placeName: '솔레벤토',
  author: '민지',
  body: '피자 사진을 보고 들어왔는데 공간도 편하고 다시 들르고 싶었어요.',
  mood: '친구랑',
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

describe('feed Instagram layout polish', () => {
  it('renders each feed review as a media-first stream card without changing actions', async () => {
    const user = userEvent.setup();
    const props = renderReviewListItem();
    const card = screen.getByTestId('feed-review-card');

    expect(card).toHaveAttribute('data-feed-card', 'review');
    expect(within(card).getByText('솔레벤토')).toBeInTheDocument();
    expect(within(card).getByText('민지 · 2026. 06. 17.')).toBeInTheDocument();
    expect(within(card).getByRole('img', { name: '솔레벤토 후기 이미지' })).toBeInTheDocument();
    expect(within(card).getByText(review.body)).toHaveClass('review-card__caption');

    const sections = Array.from(card.querySelectorAll('[data-feed-section]')).map((node) =>
      node.getAttribute('data-feed-section'),
    );
    expect(sections).toEqual(['header', 'tags', 'media', 'caption', 'actions']);

    await user.click(within(card).getByRole('button', { name: '좋아요 12개' }));
    await user.click(within(card).getByRole('button', { name: '댓글 3개 보기' }));
    await user.click(within(card).getByRole('button', { name: '장소 보기' }));

    expect(props.onToggleLike).toHaveBeenCalledWith('review-1', props.review);
    expect(props.onOpenComments).toHaveBeenCalledWith('review-1');
    expect(props.onOpenPlace).toHaveBeenCalledWith('place-1');
  });

  it('restores feed header and touched feed modules from mojibake', () => {
    render(<FeedTabHeader placeFilterName="솔레벤토" onClearPlaceFilter={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '솔레벤토 피드' })).toBeInTheDocument();
    expect(screen.getByText('지도에서 고른 장소의 방문 피드만 먼저 보여줍니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 피드 보기' })).toBeInTheDocument();

    const files = [
      'src/components/FeedTab.tsx',
      'src/components/feed/FeedTabHeader.tsx',
      'src/components/review/ReviewListItem.tsx',
    ];
    const brokenFragments = [
      String.fromCodePoint(0xfffd),
      `${String.fromCodePoint(0x3f)}쇰뱶`,
      '諛⑸Ц',
      '쨌',
      `${String.fromCodePoint(0x3f)}μ냼`,
      `${String.fromCodePoint(0x3f)}꾧린`,
    ];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      for (const fragment of brokenFragments) {
        expect(source, file).not.toContain(fragment);
      }
    }
  });
});
