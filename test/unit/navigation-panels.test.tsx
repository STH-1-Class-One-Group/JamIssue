import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BottomNav } from '../../src/components/BottomNav';
import { CourseTab } from '../../src/components/CourseTab';
import { EventTab } from '../../src/components/EventTab';
import { GlobalNotificationCenter } from '../../src/components/GlobalNotificationCenter';
import { GlobalSettingsMenu } from '../../src/components/GlobalSettingsMenu';
import type { FestivalItem, SessionUser, UserNotification, UserRoute } from '../../src/types';
import type { TourismPlacesResponse } from '../../src/tourismTypes';

const apiMocks = vi.hoisted(() => ({
  getTourismPlaces: vi.fn(),
}));

vi.mock('../../src/api/client', () => apiMocks);

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const routeFixture: UserRoute = {
  id: 'route-1',
  authorId: 'user-1',
  author: 'tester',
  title: 'Route 1',
  description: 'route description',
  mood: 'walk',
  likeCount: 3,
  likedByMe: false,
  createdAt: '2026-05-14T00:00:00Z',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['Place 1'],
  isUserGenerated: true,
  travelSessionId: 'session-1',
};

const notificationFixture: UserNotification = {
  id: 'notification-1',
  type: 'review-comment',
  title: 'Notification title',
  body: 'Notification body',
  createdAt: '2026-05-14T00:00:00Z',
  isRead: false,
  reviewId: 'review-1',
  commentId: 'comment-1',
  routeId: null,
  actorName: 'tester',
};

const tourismFixture: TourismPlacesResponse = {
  sourceReady: true,
  sourceName: 'KTO',
  importedAt: '2026-06-01T00:00:00Z',
  facets: {
    contentTypes: [{ id: '12', label: '관광지', count: 1 }],
    ktoFacets: [{ key: 'attraction', label: '관광지', count: 1 }],
    districts: [{ name: '유성구', count: 1 }],
  },
  items: [
    {
      id: 'kto-1',
      name: '대전 관광지',
      category: 'tourism',
      ktoContentTypeId: '12',
      ktoContentTypeLabel: '관광지',
      ktoCategoryCode1: null,
      ktoCategoryLabel1: null,
      ktoCategoryCode2: null,
      ktoCategoryLabel2: null,
      ktoCategoryCode3: null,
      ktoCategoryLabel3: null,
      ktoFacet: 'attraction',
      district: '유성구',
      address: null,
      roadAddress: null,
      summary: '',
      imageUrl: null,
      sourcePageUrl: null,
      latitude: null,
      longitude: null,
      sourceUpdatedAt: null,
      isCurated: true,
      curatedPlace: { positionId: 101, slug: 'daejeon-place', name: '지도 장소' },
    },
  ],
};

function festivalFixture(overrides: Partial<FestivalItem> = {}): FestivalItem {
  return {
    id: 'festival-1',
    title: '[Daejeon] Festival Title (2026) ABC',
    venueName: 'Daejeon Hall',
    startDate: '2026-05-14',
    endDate: '2026-05-15',
    homepageUrl: 'https://festival.example.test',
    roadAddress: 'Daejeon Road',
    latitude: 36.35,
    longitude: 127.38,
    isOngoing: true,
    ...overrides,
  };
}

describe('navigation and panel components', () => {
  beforeEach(() => {
    apiMocks.getTourismPlaces.mockResolvedValue(tourismFixture);
  });

  it('renders bottom navigation items and reports selected tab changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<BottomNav activeTab="map" onChange={onChange} />);
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('.bottom-nav__item')];

    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveClass('is-active');
    await user.click(buttons[2]);

    expect(onChange).toHaveBeenCalledWith('feed');
  });

  it('renders course routes, sort actions, place actions, preview actions, and authenticated likes', async () => {
    const user = userEvent.setup();
    const onChangeSort = vi.fn();
    const onToggleLike = vi.fn().mockResolvedValue(undefined);
    const onOpenPlace = vi.fn();
    const onOpenRoutePreview = vi.fn();
    const onRequestLogin = vi.fn();
    const { container } = render(
      <CourseTab
        courses={[]}
        communityRoutes={[routeFixture]}
        sort="popular"
        sessionUser={sessionUser}
        routeLikeUpdatingId={null}
        highlightedRouteId="route-1"
        placeNameById={{ 'place-2': 'Fallback Place 2' }}
        onChangeSort={onChangeSort}
        onToggleLike={onToggleLike}
        onOpenPlace={onOpenPlace}
        onOpenRoutePreview={onOpenRoutePreview}
        onRequestLogin={onRequestLogin}
      />,
    );

    const sortButtons = [...container.querySelectorAll<HTMLButtonElement>('.chip')];
    await user.click(sortButtons[1]);
    await user.click(container.querySelector<HTMLButtonElement>('.community-like-button')!);
    const placeButtons = [...container.querySelectorAll<HTMLButtonElement>('.course-card__place')];
    await user.click(placeButtons[1]);
    await user.click(container.querySelector<HTMLButtonElement>('.review-link-button')!);

    expect(onChangeSort).toHaveBeenCalledWith('latest');
    expect(onToggleLike).toHaveBeenCalledWith('route-1');
    expect(onRequestLogin).not.toHaveBeenCalled();
    expect(onOpenPlace).toHaveBeenCalledWith('place-2');
    expect(onOpenRoutePreview).toHaveBeenCalledWith({
      id: 'route-1',
      title: 'Route 1',
      subtitle: 'tester / 2026-05-14T00:00:00Z',
      mood: 'walk',
      placeIds: ['place-1', 'place-2'],
      placeNames: ['Place 1'],
    });
    expect(container.querySelector('.community-route-card--highlighted')).not.toBeNull();
  });

  it('requests login instead of liking a community route without a session user', async () => {
    const user = userEvent.setup();
    const onRequestLogin = vi.fn();
    const onToggleLike = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <CourseTab
        courses={[]}
        communityRoutes={[routeFixture]}
        sort="latest"
        sessionUser={null}
        routeLikeUpdatingId={null}
        highlightedRouteId={null}
        placeNameById={{}}
        onChangeSort={vi.fn()}
        onToggleLike={onToggleLike}
        onOpenPlace={vi.fn()}
        onOpenRoutePreview={vi.fn()}
        onRequestLogin={onRequestLogin}
      />,
    );

    await user.click(container.querySelector<HTMLButtonElement>('.community-like-button')!);

    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(onToggleLike).not.toHaveBeenCalled();
  });

  it('renders festival cards with normalized titles, locations, and external links', () => {
    const { container } = render(
      <EventTab
        festivals={[
          festivalFixture(),
          festivalFixture({
            id: 'festival-2',
            title: 'Single Day',
            venueName: 'Same Address',
            roadAddress: 'Same Address',
            startDate: '2026-06-01',
            endDate: '2026-06-01',
            homepageUrl: null,
            isOngoing: false,
          }),
        ]}
      />,
    );

    expect(container.querySelectorAll('.festival-card')).toHaveLength(2);
    expect(container.querySelector('.festival-card__title')?.textContent).toBe('Festival Title');
    expect(container.querySelector<HTMLAnchorElement>('.festival-card__link')?.href).toBe('https://festival.example.test/');
    expect(container.querySelectorAll('.festival-card__location-primary')).toHaveLength(2);
  });

  it('switches EventTab to tourism places and refetches with facet filters', async () => {
    const user = userEvent.setup();
    const { container, findByText } = render(<EventTab festivals={[festivalFixture()]} />);

    expect(container.querySelectorAll('.festival-card')).toHaveLength(1);
    await user.click(await findByText('관광장소'));
    await findByText('대전 관광지');
    await user.click(await findByText('유성구 1'));

    expect(apiMocks.getTourismPlaces).toHaveBeenNthCalledWith(1, {
      district: null,
      ktoContentTypeId: null,
      ktoFacet: null,
    });
    expect(apiMocks.getTourismPlaces).toHaveBeenNthCalledWith(2, {
      district: '유성구',
      ktoContentTypeId: null,
      ktoFacet: null,
    });
    expect(container.querySelector('.tourism-card__curated')?.textContent).toContain('지도 장소');
  });

  it('opens global notification center and delegates panel actions', async () => {
    const user = userEvent.setup();
    const onOpenNotification = vi.fn().mockResolvedValue(undefined);
    const onMarkAllNotificationsRead = vi.fn().mockResolvedValue(undefined);
    const onDeleteNotification = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <GlobalNotificationCenter
        sessionUserName="tester"
        notifications={[notificationFixture]}
        unreadCount={1}
        onOpenNotification={onOpenNotification}
        onMarkAllNotificationsRead={onMarkAllNotificationsRead}
        onDeleteNotification={onDeleteNotification}
      />,
    );

    await user.click(container.querySelector<HTMLButtonElement>('.notification-bell')!);
    expect(container.querySelector('.global-notification-panel')).not.toBeNull();
    await user.click(container.querySelector<HTMLButtonElement>('.notification-panel__mark-all')!);
    await user.click(container.querySelector<HTMLButtonElement>('.notification-item__delete')!);
    await user.click(container.querySelector<HTMLButtonElement>('.notification-item__content')!);

    expect(onMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(onDeleteNotification).toHaveBeenCalledWith('notification-1');
    expect(onOpenNotification).toHaveBeenCalledWith(notificationFixture);
    await waitFor(() => expect(container.querySelector('.global-notification-panel')).toBeNull());
  });

  it('opens settings menu, toggles notification depth, and keeps feedback link available', async () => {
    const user = userEvent.setup();
    const onOpenNotification = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <GlobalSettingsMenu
        sessionUserName="tester"
        notifications={[notificationFixture]}
        unreadCount={1}
        onOpenNotification={onOpenNotification}
        onMarkAllNotificationsRead={vi.fn().mockResolvedValue(undefined)}
        onDeleteNotification={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(container.querySelector<HTMLButtonElement>('.global-settings-menu__trigger')!);
    expect(container.querySelector('.global-settings-menu__menu')).not.toBeNull();
    expect(container.querySelector<HTMLAnchorElement>('a.global-settings-menu__item')?.target).toBe('_blank');
    await user.click(container.querySelector<HTMLButtonElement>('.global-settings-menu__item')!);
    expect(container.querySelector('.global-notification-panel')).not.toBeNull();
    await user.click(container.querySelector<HTMLButtonElement>('.notification-item__content')!);

    expect(onOpenNotification).toHaveBeenCalledWith(notificationFixture);
    await waitFor(() => expect(container.querySelector('.global-settings-menu__menu')).toBeNull());
  });
});
