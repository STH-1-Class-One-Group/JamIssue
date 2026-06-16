import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaceDetailSheet } from '../../src/components/PlaceDetailSheet';
import {
  latestStampFixture,
  placeFixture,
  reviewFixture,
  secondaryReviewFixture,
  todayStampFixture,
} from '../fixtures/app-fixtures';

describe('PlaceDetailSheet integration', () => {
  it('wires close, proof, and feed preview actions without losing visible content', () => {
    const onClose = vi.fn();
    const onClaimStamp = vi.fn().mockResolvedValue(undefined);
    const onOpenFeedReview = vi.fn();

    const { container } = render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture, secondaryReviewFixture]}
        isOpen={true}
        drawerState="peek"
        sheetState="peek"
        loggedIn={true}
        visitCount={2}
        latestStamp={latestStampFixture}
        todayStamp={null}
        hasCreatedReviewToday={false}
        stampActionStatus="ready"
        stampActionMessage="오늘 방문 인증을 완료할 수 있어요."
        reviewProofMessage="방문 후 피드를 작성해 주세요."
        reviewError={null}
        reviewSubmitting={false}
        canCreateReview={false}
        onOpenFeedReview={onOpenFeedReview}
        onClose={onClose}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={onClaimStamp}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(placeFixture.name)).toBeInTheDocument();
    expect(screen.getByText(placeFixture.summary)).toBeInTheDocument();

    const closeButton = container.querySelector<HTMLButtonElement>('.place-drawer__shell-close');
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);
    expect(onClose).toHaveBeenCalledTimes(1);

    const proofButton = container.querySelector<HTMLButtonElement>('.place-drawer__proof-button');
    expect(proofButton).not.toBeNull();
    fireEvent.click(proofButton!);
    expect(onClaimStamp).toHaveBeenCalledWith(placeFixture);

    const feedButton = container.querySelector<HTMLButtonElement>('.place-drawer__feed-button');
    expect(feedButton).not.toBeNull();
    fireEvent.click(feedButton!);
    expect(onOpenFeedReview).toHaveBeenCalledTimes(1);
  });

  it('shows completed proof state when today stamp already exists', () => {
    const { container } = render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture]}
        isOpen={true}
        drawerState="full"
        sheetState="full"
        loggedIn={true}
        visitCount={2}
        latestStamp={todayStampFixture}
        todayStamp={todayStampFixture}
        hasCreatedReviewToday={true}
        stampActionStatus="ready"
        stampActionMessage="오늘 스탬프를 이미 찍었어요."
        reviewProofMessage="오늘은 이미 피드를 남겼어요."
        reviewError={null}
        reviewSubmitting={false}
        canCreateReview={false}
        onOpenFeedReview={vi.fn()}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn().mockResolvedValue(undefined)}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const proofButton = container.querySelector<HTMLButtonElement>('.place-drawer__proof-button');
    expect(proofButton).not.toBeNull();
    expect(proofButton).toBeDisabled();
  });

  it('renders place images through the shared bottom-sheet media frame', () => {
    render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture]}
        isOpen={true}
        drawerState="peek"
        sheetState="peek"
        loggedIn={true}
        visitCount={2}
        latestStamp={latestStampFixture}
        todayStamp={null}
        hasCreatedReviewToday={false}
        stampActionStatus="ready"
        stampActionMessage="오늘 방문 인증을 완료할 수 있어요."
        reviewProofMessage="방문 후 피드를 작성해 주세요."
        reviewError={null}
        reviewSubmitting={false}
        canCreateReview={false}
        onOpenFeedReview={vi.fn()}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn().mockResolvedValue(undefined)}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const image = screen.getByRole('img', { name: placeFixture.name });
    const mediaFrame = image.closest('.map-bottom-sheet__media-frame');
    const scrollContent = screen.getByText(placeFixture.summary).closest('.map-bottom-sheet__content');

    expect(mediaFrame).not.toBeNull();
    expect(scrollContent).not.toBeNull();
    expect(scrollContent?.contains(image)).toBe(false);
  });

  it('keeps the review composer inside the scrollable drawer content in full mode', () => {
    render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture]}
        isOpen={true}
        drawerState="full"
        sheetState="full"
        loggedIn={true}
        visitCount={2}
        latestStamp={todayStampFixture}
        todayStamp={todayStampFixture}
        hasCreatedReviewToday={false}
        stampActionStatus="ready"
        stampActionMessage="오늘 스탬프를 이미 찍었어요."
        reviewProofMessage="방문 후 피드를 작성해 주세요."
        reviewError={null}
        reviewSubmitting={false}
        canCreateReview={true}
        onOpenFeedReview={vi.fn()}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn().mockResolvedValue(undefined)}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const textarea = screen.getByRole('textbox');
    const drawerContent = textarea.closest('.place-drawer__content');
    const drawer = textarea.closest('.place-drawer');

    expect(textarea).toBeEnabled();
    expect(drawerContent).not.toBeNull();
    expect(drawer).toHaveClass('place-drawer--full');
    expect(drawer).toHaveAttribute('data-map-sheet-state', 'full');
  });
});
