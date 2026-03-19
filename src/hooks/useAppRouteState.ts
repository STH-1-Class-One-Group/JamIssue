import { useCallback, useEffect, useState } from 'react';
import type { DrawerState, Tab } from '../types';

export type RouteState = {
  tab: Tab;
  placeId: string | null;
  festivalId: string | null;
  drawerState: DrawerState;
};

// 유효한 탭 목록 (URL 파라미터 검증용)
const validTabs: Tab[] = ['map', 'feed', 'course', 'my'];

// URL에서 앱 상태 복원 (쿼리 파라미터 → RouteState)
// 예: ?tab=map&place=123&drawer=partial → { tab: 'map', placeId: '123', ... }
export function getInitialRouteState(): RouteState {
  if (typeof window === 'undefined') {
    return { tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' };
  }

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const placeId = params.get('place');
  const festivalId = params.get('festival');
  const drawer = params.get('drawer');
  // invalid tab일 때는 기본값 'map' 사용, 단 OAuth 후라면 'my' 강제 (프로필 입력 유도)
  const resolvedTab = tab && validTabs.includes(tab as Tab) ? (tab as Tab) : params.get('auth') ? 'my' : 'map';
  const resolvedDrawer = drawer === 'full' || drawer === 'partial' ? drawer : placeId || festivalId ? 'partial' : 'closed';

  return {
    tab: resolvedTab,
    placeId: placeId || null,
    festivalId: festivalId || null,
    drawerState: resolvedDrawer,
  };
}

// RouteState → URL로 변환 (상태 동기화)
// place/festival 선택 시 drawer를 'partial'로 강제 설정 (단, drawerState가 'closed'일 때)
export function buildRouteUrl(routeState: RouteState) {
  if (typeof window === 'undefined') {
    return '/';
  }

  const params = new URLSearchParams(window.location.search);
  params.set('tab', routeState.tab);

  if (routeState.tab === 'map' && routeState.placeId) {
    params.set('place', routeState.placeId);
    params.delete('festival');
    params.set('drawer', routeState.drawerState === 'closed' ? 'partial' : routeState.drawerState);
  } else if (routeState.tab === 'map' && routeState.festivalId) {
    params.set('festival', routeState.festivalId);
    params.delete('place');
    params.set('drawer', routeState.drawerState === 'closed' ? 'partial' : routeState.drawerState);
  } else {
    // feed/course/my 탭이면 place/festival/drawer 파라미터 모두 제거
    params.delete('place');
    params.delete('festival');
    params.delete('drawer');
  }

  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

export function getInitialNotice() {
  if (typeof window === 'undefined') {
    return null;
  }

  // OAuth 콜백 파라미터(?auth=naver-success 등)에서 초기 공지 메시지 생성
  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  const reason = params.get('reason');
  if (auth === 'naver-success') {
    return '네이버 로그인을 연결했어요.';
  }
  if (auth === 'naver-linked') {
    return '네이버 계정을 연결했어요.';
  }
  if (auth === 'naver-error') {
    return reason ? `네이버 로그인에 실패했어요. (${reason})` : '네이버 로그인에 실패했어요.';
  }
  return null;
}

export function clearAuthQueryParams() {
  if (typeof window === 'undefined') {
    return;
  }

  // OAuth 후 ?auth=naver-success 등을 정리: 새로고침 시 "로그인 성공" 공지 반복 방지
  const params = new URLSearchParams(window.location.search);
  if (!params.has('auth') && !params.has('reason')) {
    return;
  }

  params.delete('auth');
  params.delete('reason');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

export function getLoginReturnUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/?tab=my';
  }

  return `${window.location.origin}/?tab=my`;
}

export function useAppRouteState() {
  const [activeTab, setActiveTab] = useState<Tab>(() => getInitialRouteState().tab);
  const [drawerState, setDrawerState] = useState<DrawerState>(() => getInitialRouteState().drawerState);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(() => getInitialRouteState().placeId);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>(() => getInitialRouteState().festivalId);

  const applyRouteState = useCallback((routeState: RouteState) => {
    setActiveTab(routeState.tab);
    setSelectedPlaceId(routeState.tab === 'map' ? routeState.placeId : null);
    setSelectedFestivalId(routeState.tab === 'map' ? routeState.festivalId : null);
    setDrawerState(routeState.tab === 'map' ? routeState.drawerState : 'closed');
  }, []);

  const commitRouteState = useCallback(
    (routeState: RouteState, mode: 'push' | 'replace' = 'push') => {
      applyRouteState(routeState);
      if (typeof window === 'undefined') {
        return;
      }

      const nextUrl = buildRouteUrl(routeState);
      if (mode === 'replace') {
        window.history.replaceState(routeState, '', nextUrl);
        return;
      }

      window.history.pushState(routeState, '', nextUrl);
    },
    [applyRouteState],
  );

  const goToTab = useCallback(
    (nextTab: Tab, mode: 'push' | 'replace' = 'push') => {
      commitRouteState(
        {
          tab: nextTab,
          placeId: null,
          festivalId: null,
          drawerState: 'closed',
        },
        mode,
      );
    },
    [commitRouteState],
  );

  const openPlace = useCallback(
    (placeId: string) => {
      commitRouteState({
        tab: 'map',
        placeId,
        festivalId: null,
        drawerState: 'partial',
      });
    },
    [commitRouteState],
  );

  const openFestival = useCallback(
    (festivalId: string) => {
      commitRouteState({
        tab: 'map',
        placeId: null,
        festivalId,
        drawerState: 'partial',
      });
    },
    [commitRouteState],
  );

  const closeDrawer = useCallback(() => {
    commitRouteState({
      tab: 'map',
      placeId: null,
      festivalId: null,
      drawerState: 'closed',
    });
  }, [commitRouteState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      applyRouteState(getInitialRouteState());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyRouteState]);

  return {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    setSelectedPlaceId,
    setSelectedFestivalId,
    commitRouteState,
    goToTab,
    openPlace,
    openFestival,
    closeDrawer,
  };
}
