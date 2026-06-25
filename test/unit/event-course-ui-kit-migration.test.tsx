import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CourseTab } from '../../src/components/CourseTab';
import { EventTab } from '../../src/components/EventTab';
import type { FestivalItem } from '../../src/types/core';
import type { UserRoute } from '../../src/types/review';

const festival: FestivalItem = {
  id: 'festival-1',
  title: '[대전] 버니나 소잉 페스티벌 (BUNNY)',
  venueName: '대전시청',
  startDate: '2026-06-18',
  endDate: '2026-06-23',
  homepageUrl: 'https://example.com/festival',
  roadAddress: '대전광역시 서구 둔산로 100',
  latitude: 36.35,
  longitude: 127.38,
  isOngoing: true,
};

const route: UserRoute = {
  id: 'route-1',
  authorId: 'user-1',
  author: 'code305',
  title: '오타에서 야자야채치킨까지',
  description: '역시 칼국수-아아-치맥은 진리죠.',
  mood: '친구랑',
  likeCount: 1,
  likedByMe: false,
  createdAt: '03. 30. 18:07',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['오타', '야자야채치킨'],
  isUserGenerated: true,
  travelSessionId: 'session-1',
};

describe('Event and Course UI kit migration', () => {
  it('renders event data through kit surfaces while preserving homepage links', () => {
    render(<EventTab festivals={[festival]} />);

    expect(screen.getByRole('heading', { name: '행사' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '지금 확인할 행사' })).toBeInTheDocument();
    expect(screen.getByText('1개')).toBeInTheDocument();
    expect(screen.getByText('진행 중')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '버니나 소잉 페스티벌' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈페이지 열기' })).toHaveAttribute('href', festival.homepageUrl);
    expect(document.querySelector('[data-ui-content-card]')).not.toBeNull();
  });

  it('renders event empty state without dropping the event section shell', () => {
    render(<EventTab festivals={[]} />);

    expect(screen.getByRole('heading', { name: '지금 확인할 행사' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '현재 진행 중이거나 30일 이내 예정된 대전 행사가 없어요.' })).toBeInTheDocument();
    expect(screen.getByText('0개')).toBeInTheDocument();
  });

  it('preserves course sorting, place opening, liking, and route preview actions', async () => {
    const user = userEvent.setup();
    const onChangeSort = vi.fn();
    const onToggleLike = vi.fn().mockResolvedValue(undefined);
    const onOpenPlace = vi.fn();
    const onOpenRoutePreview = vi.fn();
    const onRequestLogin = vi.fn();

    render(
      <CourseTab
        courses={[]}
        communityRoutes={[route]}
        sort="popular"
        sessionUser={{
          id: 'user-1',
          nickname: 'code305',
          email: null,
          provider: 'naver',
          linkedProviders: ['naver'],
          profileImage: null,
          isAdmin: false,
          profileCompletedAt: null,
        }}
        routeLikeUpdatingId={null}
        highlightedRouteId={null}
        placeNameById={{}}
        onChangeSort={onChangeSort}
        onToggleLike={onToggleLike}
        onOpenPlace={onOpenPlace}
        onOpenRoutePreview={onOpenRoutePreview}
        onRequestLogin={onRequestLogin}
      />,
    );

    expect(screen.getByRole('heading', { name: '코스' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '최신순' }));
    expect(onChangeSort).toHaveBeenCalledWith('latest');

    await user.click(screen.getByRole('button', { name: '1. 오타' }));
    expect(onOpenPlace).toHaveBeenCalledWith('place-1');

    await user.click(screen.getByRole('button', { name: '1' }));
    expect(onToggleLike).toHaveBeenCalledWith('route-1');
    expect(onRequestLogin).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '지도에서 보기' }));
    expect(onOpenRoutePreview).toHaveBeenCalledWith(expect.objectContaining({
      id: 'route-1',
      title: '오타에서 야자야채치킨까지',
      placeIds: ['place-1', 'place-2'],
    }));
  });
});
