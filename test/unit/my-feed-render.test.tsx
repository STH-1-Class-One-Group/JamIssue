import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyFeedTabSection } from '../../src/components/my-page/MyFeedTabSection';
import type { MyReview } from '../../src/components/my-page/myFeedTabTypes';
import { createReviewFixture } from '../fixtures/app-fixtures';

const headerRenderCounts = vi.hoisted(() => new Map<string, number>());

interface MockReviewFeedCardHeaderProps {
  title: ReactNode;
  mood: ReactNode;
  meta: ReactNode;
}

vi.mock('../../src/components/review/ReviewFeedCardHeader', () => ({
  ReviewFeedCardHeader: ({ title, mood, meta }: MockReviewFeedCardHeaderProps) => {
    const countKey = String(meta);
    headerRenderCounts.set(countKey, (headerRenderCounts.get(countKey) ?? 0) + 1);

    return (
      <div data-testid={`review-feed-card-header-${countKey}`}>
        <div>{title}</div>
        <span>{mood}</span>
        <p>{meta}</p>
      </div>
    );
  },
}));

function getHeaderRenderCount(meta: string) {
  return headerRenderCounts.get(meta) ?? 0;
}

describe('MyFeedTabSection render stability', () => {
  beforeEach(() => {
    headerRenderCounts.clear();
  });

  it('does not re-render inactive cards during edits', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const activeMeta = '2024-05-01';
    const inactiveMeta = '2024-05-02';
    const reviews: MyReview[] = [
      createReviewFixture({
        id: 'rev-1',
        placeId: 'p-1',
        placeName: 'P 1',
        body: 'body 1',
        visitedAt: activeMeta,
        imageUrl: null,
        thumbnailUrl: null,
        hasPublishedRoute: false,
      }),
      createReviewFixture({
        id: 'rev-2',
        placeId: 'p-2',
        placeName: 'P 2',
        body: 'body 2',
        visitedAt: inactiveMeta,
        imageUrl: null,
        thumbnailUrl: null,
        hasPublishedRoute: false,
      }),
    ];

    render(
      <MyFeedTabSection
        reviews={reviews}
        onOpenPlace={vi.fn()}
        onOpenReview={vi.fn()}
        onUpdateReview={mockUpdate}
        onDeleteReview={vi.fn()}
      />,
    );

    expect(getHeaderRenderCount(activeMeta)).toBe(1);
    expect(getHeaderRenderCount(inactiveMeta)).toBe(1);

    const editButtons = screen.getAllByRole('button', { name: '수정' });
    await user.click(editButtons[0]);

    const activeCountAfterOpen = getHeaderRenderCount(activeMeta);
    const inactiveCountAfterOpen = getHeaderRenderCount(inactiveMeta);

    const textarea = screen.getByLabelText('리뷰 내용');
    await user.clear(textarea);
    await user.type(textarea, 'updated body 1');

    expect(getHeaderRenderCount(inactiveMeta)).toBe(inactiveCountAfterOpen);
    expect(getHeaderRenderCount(activeMeta)).toBeGreaterThan(activeCountAfterOpen);
  });
});
