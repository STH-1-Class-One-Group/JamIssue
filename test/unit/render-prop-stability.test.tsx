import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityRouteCard } from '../../src/components/course/CommunityRouteCard';
import type { UserRoute } from '../../src/types';
import { createReviewFixture, placeFixture, routeFixture, sessionUserFixture } from '../fixtures/app-fixtures';

const feedTabMock = vi.hoisted(() => ({
  renderCount: 0,
}));

vi.mock('../../src/components/FeedTab', async () => {
  const React = await import('react');

  return {
    FeedTab: React.memo(function MockFeedTab() {
      feedTabMock.renderCount += 1;
      return React.createElement('div', { 'data-testid': 'feed-tab' });
    }),
  };
});

describe('render prop stability', () => {
  beforeEach(() => {
    feedTabMock.renderCount = 0;
  });

  it('keeps FeedTab skipped when PageStageFeedView receives an unrelated parent render', async () => {
    const { PageStageFeedView } = await import('../../src/components/page-stage/PageStageFeedView');
    const review = createReviewFixture();
    const props: Parameters<typeof PageStageFeedView>[0] = {
      sharedData: {
        sessionUser: sessionUserFixture,
        placeNameById: { [placeFixture.id]: placeFixture.name },
        festivals: [],
      },
      feedData: {
        reviews: [review],
        reviewLikeUpdatingId: null,
        feedPlaceFilterId: null,
        commentSubmittingReviewId: null,
        commentMutatingId: null,
        deletingReviewId: null,
        activeCommentReviewId: null,
        activeCommentReviewComments: [],
        activeCommentReviewStatus: 'idle',
        highlightedCommentId: null,
        highlightedReviewId: null,
        feedHasMore: false,
        feedLoadingMore: false,
      },
      sharedActions: {
        onRequestLogin: vi.fn(),
        onOpenPlace: vi.fn(),
      },
      feedActions: {
        onLoadMoreFeed: vi.fn().mockResolvedValue(undefined),
        onToggleReviewLike: vi.fn().mockResolvedValue(undefined),
        onCreateComment: vi.fn().mockResolvedValue(undefined),
        onUpdateComment: vi.fn().mockResolvedValue(undefined),
        onDeleteComment: vi.fn().mockResolvedValue(undefined),
        onDeleteReview: vi.fn().mockResolvedValue(undefined),
        onClearPlaceFilter: vi.fn(),
        onOpenComments: vi.fn(),
        onCloseComments: vi.fn(),
      },
    };

    function Harness() {
      const [tick, setTick] = useState(0);

      return (
        <>
          <button type="button" onClick={() => setTick((value) => value + 1)}>
            rerender parent {tick}
          </button>
          <PageStageFeedView {...props} />
        </>
      );
    }

    render(<Harness />);
    expect(feedTabMock.renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /rerender parent/ }));

    expect(feedTabMock.renderCount).toBe(1);
  });

  it('keeps a stable community route card skipped during unrelated parent renders', () => {
    let routeIdReadCount = 0;
    const route: UserRoute = {
      ...routeFixture,
      get id() {
        routeIdReadCount += 1;
        return routeFixture.id;
      },
    };
    const cardProps = {
      highlightedRouteId: null,
      routeLikeUpdatingId: null,
      sessionUser: sessionUserFixture,
      placeNameById: { [placeFixture.id]: placeFixture.name },
      onToggleLike: vi.fn().mockResolvedValue(undefined),
      onOpenPlace: vi.fn(),
      onOpenRoutePreview: vi.fn(),
      onRequestLogin: vi.fn(),
    };

    function Harness() {
      const [tick, setTick] = useState(0);
      const routeRefs = useRef<Record<string, HTMLElement | null>>({});

      return (
        <>
          <button type="button" onClick={() => setTick((value) => value + 1)}>
            rerender route parent {tick}
          </button>
          <CommunityRouteCard {...cardProps} route={route} routeRefs={routeRefs} />
        </>
      );
    }

    render(<Harness />);
    expect(routeIdReadCount).toBeGreaterThan(0);
    const routeIdReadsAfterMount = routeIdReadCount;

    fireEvent.click(screen.getByRole('button', { name: /rerender route parent/ }));

    expect(routeIdReadCount).toBe(routeIdReadsAfterMount);
  });
});
