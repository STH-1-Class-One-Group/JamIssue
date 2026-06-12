import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyFeedReviewCard } from '../../src/components/my-page/MyFeedReviewCard';
import { MyCommentsTabSection } from '../../src/components/my-page/MyCommentsTabSection';
import { MyPageGuestState } from '../../src/components/my-page/MyPageGuestState';
import { MyPageLoadError } from '../../src/components/my-page/MyPageLoadError';
import { MyPageOverviewSection } from '../../src/components/my-page/MyPageOverviewSection';
import { MyPagePrimaryTabs } from '../../src/components/my-page/MyPagePrimaryTabs';
import { MyPublishedRouteCard } from '../../src/components/my-page/MyPublishedRouteCard';
import { MyRouteDraftCard } from '../../src/components/my-page/MyRouteDraftCard';
import { MyStampTabSection } from '../../src/components/my-page/MyStampTabSection';
import type { Place } from '../../src/types/core';
import type { MyPageResponse } from '../../src/types/my-page';
import type { MyReview } from '../../src/components/my-page/myFeedTabTypes';
import type { DraftState, TravelSession, UserRoute } from '../../src/components/my-page/myRoutesTabTypes';

const myPageMocks = vi.hoisted(() => ({
  ProviderButtons: vi.fn((props: { onLogin: (provider: 'kakao') => void }) => (
    <button type="button" data-testid="provider-login" onClick={() => props.onLogin('kakao')}>
      provider
    </button>
  )),
  ReviewFeedCardHeader: vi.fn((props: { title: React.ReactNode }) => <div data-testid="review-header">{props.title}</div>),
  ReviewFormFields: vi.fn((props: {
    body: string;
    onBodyChange: (body: string) => void;
    onFileChange: (file: File | null) => void;
    onMoodChange: (mood: MyReview['mood']) => void;
    onToggleRemoveImage?: () => void;
  }) => (
    <div data-testid="review-form-fields">
      <input aria-label="body" value={props.body} onChange={(event) => props.onBodyChange(event.target.value)} />
      <button type="button" data-testid="change-mood" onClick={() => props.onMoodChange('혼자서')}>mood</button>
      <button type="button" data-testid="set-file" onClick={() => props.onFileChange(new File(['x'], 'x.png'))}>file</button>
      {props.onToggleRemoveImage && <button type="button" data-testid="remove-image" onClick={props.onToggleRemoveImage}>remove</button>}
    </div>
  )),
  ReviewTagRow: vi.fn(() => <div data-testid="review-tags" />),
}));

vi.mock('../../src/components/ProviderButtons', () => ({
  ProviderButtons: myPageMocks.ProviderButtons,
}));

vi.mock('../../src/components/review/ReviewFeedCardHeader', () => ({
  ReviewFeedCardHeader: myPageMocks.ReviewFeedCardHeader,
}));

vi.mock('../../src/components/ReviewFormFields', () => ({
  ReviewFormFields: myPageMocks.ReviewFormFields,
}));

vi.mock('../../src/components/review/ReviewTagRow', () => ({
  ReviewTagRow: myPageMocks.ReviewTagRow,
}));

function reviewFixture(overrides: Partial<MyReview> = {}): MyReview {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'Author',
    body: 'review body',
    mood: '혼자서',
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: 'https://image.test/review.png',
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: 'visit',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

function sessionFixture(): TravelSession {
  return {
    id: 'session-1',
    startedAt: '2026-05-14T00:00:00Z',
    endedAt: '2026-05-14T01:00:00Z',
    durationLabel: '1h',
    stampCount: 2,
    placeIds: ['place-1', 'place-2'],
    placeNames: ['Place 1', 'Place 2'],
    canPublish: true,
    publishedRouteId: null,
    coverPlaceId: 'place-1',
  };
}

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#f4a',
    accentColor: '#333',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    totalVisitCount: 0,
    ...overrides,
  };
}

function draftFixture(overrides: Partial<DraftState> = {}): DraftState {
  return {
    title: 'My Route',
    description: 'Route description',
    mood: '혼자서',
    ...overrides,
  };
}

function routeFixture(overrides: Partial<UserRoute> = {}): UserRoute {
  return {
    id: 'route-1',
    authorId: 'user-1',
    author: 'author',
    title: 'Route title',
    description: 'Route description',
    mood: 'mood',
    likeCount: 3,
    likedByMe: true,
    createdAt: '2026-05-14',
    placeIds: ['place-1', 'place-2'],
    placeNames: ['Place 1'],
    isUserGenerated: true,
    travelSessionId: 'session-1',
    ...overrides,
  };
}

function commentLogFixture(overrides: Partial<MyPageResponse['comments'][number]> = {}): MyPageResponse['comments'][number] {
  return {
    id: 'comment-1',
    reviewId: 'review-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    body: 'comment body',
    isDeleted: false,
    parentId: null,
    createdAt: '2026-05-14',
    reviewBody: 'review body',
    ...overrides,
  };
}

function stampLogFixture(overrides: Partial<MyPageResponse['stampLogs'][number]> = {}): MyPageResponse['stampLogs'][number] {
  return {
    id: 'stamp-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14',
    visitLabel: 'visit',
    isToday: true,
    travelSessionId: 'session-1',
    travelSessionStampCount: 2,
    ...overrides,
  };
}

describe('my page basic components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary tabs, includes admin only for admins, and routes tab changes', async () => {
    const user = userEvent.setup();
    const onChangeTab = vi.fn();
    const { rerender } = render(<MyPagePrimaryTabs activeTab="feeds" isAdmin={false} onChangeTab={onChangeTab} />);

    expect(document.querySelector('.my-page-primary-tabs--admin')).toBeNull();
    await user.click(screen.getByRole('button', { name: '피드' }));
    await user.click(screen.getByRole('button', { name: '댓글' }));
    expect(onChangeTab).toHaveBeenCalledWith('feeds');
    expect(onChangeTab).toHaveBeenCalledWith('comments');

    rerender(<MyPagePrimaryTabs activeTab="admin" isAdmin onChangeTab={onChangeTab} />);
    expect(document.querySelector('.my-page-primary-tabs--admin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '관리' }));
    expect(onChangeTab).toHaveBeenCalledWith('admin');
  });

  it('routes guest login and load-error retry actions', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(<MyPageGuestState providers={[{ key: 'kakao', label: 'Kakao' }]} onLogin={onLogin} />);
    await user.click(screen.getByTestId('provider-login'));
    expect(onLogin).toHaveBeenCalledWith('kakao');

    render(<MyPageLoadError myPageError="load failed" onRetry={onRetry} />);
    await user.click(document.querySelector('.route-submit-button') as HTMLButtonElement);
    expect(screen.getByText('load failed')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('my page overview, comments, routes, and stamps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles overview details and routes visited place buttons', async () => {
    const user = userEvent.setup();
    const onToggleVisitedDetail = vi.fn();
    const onOpenPlace = vi.fn();
    const visitedPlaces = [placeFixture({ id: 'visited-1', name: 'Visited 1' })];
    const unvisitedPlaces = [placeFixture({ id: 'unvisited-1', name: 'Unvisited 1' })];
    const { rerender } = render(
      <MyPageOverviewSection
        uniquePlaceCount={0}
        totalPlaceCount={0}
        stampCount={0}
        visitPct={0}
        visitedPlaces={[]}
        unvisitedPlaces={[]}
        showVisitedDetail={false}
        onToggleVisitedDetail={onToggleVisitedDetail}
        onOpenPlace={onOpenPlace}
        travelSessions={[]}
      />,
    );

    expect(document.querySelector('.my-visit-progress')).toBeNull();
    await user.click(document.querySelector('.secondary-button') as HTMLButtonElement);
    expect(onToggleVisitedDetail).toHaveBeenCalledTimes(1);

    rerender(
      <MyPageOverviewSection
        uniquePlaceCount={1}
        totalPlaceCount={2}
        stampCount={1}
        visitPct={50}
        visitedPlaces={visitedPlaces}
        unvisitedPlaces={unvisitedPlaces}
        showVisitedDetail
        onToggleVisitedDetail={onToggleVisitedDetail}
        onOpenPlace={onOpenPlace}
        travelSessions={[sessionFixture()]}
      />,
    );

    expect(document.querySelector('.my-visit-progress__fill')).toHaveStyle({ width: '50%' });
    await user.click(screen.getByRole('button', { name: 'Visited 1' }));
    await user.click(screen.getByRole('button', { name: 'Unvisited 1' }));
    expect(onOpenPlace).toHaveBeenCalledWith('visited-1');
    expect(onOpenPlace).toHaveBeenCalledWith('unvisited-1');
  });

  it('routes my comment section place and comment actions and exposes load sentinel state', async () => {
    const user = userEvent.setup();
    const onOpenPlace = vi.fn();
    const onOpenComment = vi.fn();
    const { rerender } = render(
      <MyCommentsTabSection
        comments={[
          commentLogFixture(),
          commentLogFixture({ id: 'reply-comment', parentId: 'comment-1' }),
        ]}
        commentsHasMore
        commentsLoadingMore
        commentsLoadMoreRef={{ current: null }}
        onOpenPlace={onOpenPlace}
        onOpenComment={onOpenComment}
      />,
    );

    await user.click(document.querySelector('.review-card__place-anchor') as HTMLButtonElement);
    await user.click(document.querySelector('.review-card__place-link') as HTMLButtonElement);
    expect(onOpenPlace).toHaveBeenCalledWith('place-1');
    expect(onOpenComment).toHaveBeenCalledWith('review-1', 'comment-1');
    expect(document.querySelector('.feed-tab__load-sentinel')).toBeInTheDocument();

    rerender(
      <MyCommentsTabSection
        comments={[]}
        commentsHasMore={false}
        commentsLoadingMore={false}
        commentsLoadMoreRef={{ current: null }}
        onOpenPlace={onOpenPlace}
        onOpenComment={onOpenComment}
      />,
    );
    expect(document.querySelector('.empty-copy')).toBeInTheDocument();
  });

  it('routes published route places and route opening without relying on place-name parity', async () => {
    const user = userEvent.setup();
    const onOpenPlace = vi.fn();
    const onOpenRoute = vi.fn().mockResolvedValue(undefined);
    render(<MyPublishedRouteCard route={routeFixture()} onOpenPlace={onOpenPlace} onOpenRoute={onOpenRoute} />);

    const placeButtons = document.querySelectorAll<HTMLButtonElement>('.course-card__place');
    await user.click(placeButtons[0]);
    await user.click(placeButtons[1]);
    await user.click(document.querySelector('.review-link-button') as HTMLButtonElement);

    expect(onOpenPlace).toHaveBeenCalledWith('place-1');
    expect(onOpenPlace).toHaveBeenCalledWith('place-2');
    expect(onOpenRoute).toHaveBeenCalledWith('route-1');
  });

  it('shows publishable stamp sessions, routes stamp places, and renders the empty state', async () => {
    const user = userEvent.setup();
    const onOpenPlace = vi.fn();
    const onOpenRoutes = vi.fn();
    const { rerender } = render(
      <MyStampTabSection
        stampLogs={[stampLogFixture()]}
        travelSessions={[
          sessionFixture(),
          { ...sessionFixture(), id: 'published-session', publishedRouteId: 'route-1' },
        ]}
        onOpenPlace={onOpenPlace}
        onOpenRoutes={onOpenRoutes}
      />,
    );

    await user.click(document.querySelector('.route-submit-button') as HTMLButtonElement);
    await user.click(document.querySelector('.review-link-button') as HTMLButtonElement);
    expect(onOpenRoutes).toHaveBeenCalledTimes(1);
    expect(onOpenPlace).toHaveBeenCalledWith('place-1');

    rerender(<MyStampTabSection stampLogs={[]} travelSessions={[]} onOpenPlace={onOpenPlace} onOpenRoutes={onOpenRoutes} />);
    expect(document.querySelector('.empty-copy')).toBeInTheDocument();
  });
});

describe('my feed review card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    editingReviewId: null,
    editingReviewBody: '',
    editingReviewMood: '혼자서' as MyReview['mood'],
    editingReviewFile: null,
    editingReviewRemoveImage: false,
    reviewUpdatingId: null,
    reviewEditError: null,
    setEditingReviewBody: vi.fn(),
    setEditingReviewMood: vi.fn(),
    setEditingReviewFile: vi.fn(),
    setEditingReviewRemoveImage: vi.fn(),
    startEditingReview: vi.fn(),
    cancelEditingReview: vi.fn(),
    handleSaveReview: vi.fn().mockResolvedValue(undefined),
    onOpenPlace: vi.fn(),
    onOpenReview: vi.fn(),
    onDeleteReview: vi.fn().mockResolvedValue(undefined),
  };

  it('routes place, review, edit, and delete actions in display mode', async () => {
    const user = userEvent.setup();
    const props = { ...baseProps, review: reviewFixture() };
    render(<MyFeedReviewCard {...props} />);

    await user.click(document.querySelector('.review-card__place-anchor') as HTMLButtonElement);
    const actionButtons = document.querySelectorAll<HTMLButtonElement>('.review-card__actions .review-card__place-link');
    await user.click(actionButtons[0]);
    await user.click(actionButtons[1]);
    await user.click(actionButtons[2]);

    expect(props.onOpenPlace).toHaveBeenCalledWith('place-1');
    expect(props.onOpenReview).toHaveBeenCalledWith('review-1');
    expect(props.startEditingReview).toHaveBeenCalledWith(props.review);
    expect(props.onDeleteReview).toHaveBeenCalledWith('review-1');
  });

  it('routes edit mode field, remove image, cancel, and save actions', async () => {
    const user = userEvent.setup();
    const setEditingReviewFile = vi.fn();
    const setEditingReviewRemoveImage = vi.fn();
    const handleSaveReview = vi.fn().mockResolvedValue(undefined);
    render(
      <MyFeedReviewCard
        {...baseProps}
        review={reviewFixture()}
        editingReviewId="review-1"
        editingReviewBody="updated body"
        editingReviewFile={null}
        editingReviewRemoveImage={false}
        setEditingReviewFile={setEditingReviewFile}
        setEditingReviewRemoveImage={setEditingReviewRemoveImage}
        handleSaveReview={handleSaveReview}
      />,
    );

    await user.type(screen.getByLabelText('body'), '!');
    await user.click(screen.getByTestId('change-mood'));
    await user.click(screen.getByTestId('set-file'));
    await user.click(screen.getByTestId('remove-image'));
    await user.click(document.querySelector('.review-edit-form .secondary-button') as HTMLButtonElement);
    await user.click(document.querySelector('.review-edit-form .primary-button') as HTMLButtonElement);

    expect(baseProps.setEditingReviewBody).toHaveBeenCalled();
    expect(baseProps.setEditingReviewMood).toHaveBeenCalledWith('혼자서');
    expect(setEditingReviewFile).toHaveBeenCalledWith(expect.any(File));
    expect(setEditingReviewRemoveImage).toHaveBeenCalledWith(false);
    expect(setEditingReviewRemoveImage).toHaveBeenCalledWith(expect.any(Function));
    expect(baseProps.cancelEditingReview).toHaveBeenCalledTimes(1);
    expect(handleSaveReview).toHaveBeenCalledWith('review-1');
  });
});

describe('my route draft card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes place clicks, draft edits, mood changes, and publish payloads', async () => {
    const user = userEvent.setup();
    const onOpenPlace = vi.fn();
    const onUpdateDraft = vi.fn();
    const onPublishRoute = vi.fn().mockResolvedValue(undefined);
    const session = sessionFixture();
    const draft = draftFixture();

    render(
      <MyRouteDraftCard
        session={session}
        draft={draft}
        routeSubmitting={false}
        onOpenPlace={onOpenPlace}
        onUpdateDraft={onUpdateDraft}
        onPublishRoute={onPublishRoute}
      />,
    );

    await user.click(document.querySelector('.course-card__place') as HTMLButtonElement);
    await user.type(document.querySelector('input') as HTMLInputElement, '!');
    await user.type(document.querySelector('textarea') as HTMLTextAreaElement, '!');
    await user.click(document.querySelector('.chip-row .chip') as HTMLButtonElement);
    await user.click(document.querySelector('.route-submit-button') as HTMLButtonElement);

    expect(onOpenPlace).toHaveBeenCalledWith('place-1');
    expect(onUpdateDraft).toHaveBeenCalledWith('session-1', expect.objectContaining({ title: expect.any(String) }), session);
    expect(onUpdateDraft).toHaveBeenCalledWith('session-1', expect.objectContaining({ description: expect.any(String) }), session);
    expect(onUpdateDraft).toHaveBeenCalledWith('session-1', expect.objectContaining({ mood: expect.any(String) }), session);
    expect(onPublishRoute).toHaveBeenCalledWith({
      travelSessionId: 'session-1',
      title: 'My Route',
      description: 'Route description',
      mood: '혼자서',
    });
  });

  it('disables publish while submitting or while required text is too short', () => {
    const props = {
      session: sessionFixture(),
      draft: draftFixture({ title: 'A', description: 'short' }),
      routeSubmitting: false,
      onOpenPlace: vi.fn(),
      onUpdateDraft: vi.fn(),
      onPublishRoute: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(<MyRouteDraftCard {...props} />);
    expect(document.querySelector('.route-submit-button')).toBeDisabled();

    rerender(<MyRouteDraftCard {...props} draft={draftFixture()} routeSubmitting />);
    expect(document.querySelector('.route-submit-button')).toBeDisabled();
  });
});
