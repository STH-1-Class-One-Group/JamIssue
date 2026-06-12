import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppMapActions } from '../../src/hooks/useAppMapActions';
import type { Place, SessionUser, StampState } from '../../src/types';

const apiMocks = vi.hoisted(() => ({
  claimStamp: vi.fn(),
}));

const geoMocks = vi.hoisted(() => ({
  getCurrentDevicePosition: vi.fn(),
}));

const runtimeState = vi.hoisted(() => ({
  setCurrentPosition: vi.fn(),
  setMapLocationStatus: vi.fn(),
  setMapLocationMessage: vi.fn(),
  setMapLocationFocusKey: vi.fn(),
  setNotice: vi.fn(),
  setStampActionStatus: vi.fn(),
}));

vi.mock('../../src/api/stampClient', () => ({
  claimStamp: apiMocks.claimStamp,
}));

vi.mock('../../src/lib/geolocation', () => ({
  getCurrentDevicePosition: geoMocks.getCurrentDevicePosition,
}));

vi.mock('../../src/store/app-shell-runtime-store', () => ({
  useAppShellRuntimeStore: (selector: (state: typeof runtimeState) => unknown) => selector(runtimeState),
}));

const place: Place = {
  id: 'place-1',
  positionId: '101',
  name: 'Place 1',
  category: 'cafe',
  district: 'District',
  latitude: 36.35,
  longitude: 127.38,
  address: 'Address',
  description: 'Description',
  jamColor: '#fff',
  stampReward: 'Reward',
  totalVisitCount: 1,
};

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'User',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

function createParams(overrides: Partial<Parameters<typeof useAppMapActions>[0]> = {}): Parameters<typeof useAppMapActions>[0] {
  return {
    sessionUser,
    setPlaces: vi.fn(),
    setStampState: vi.fn(),
    goToTab: vi.fn(),
    commitRouteState: vi.fn(),
    refreshMyPageForUser: vi.fn().mockResolvedValue(undefined),
    formatErrorMessage: (error) => error instanceof Error ? error.message : 'formatted error',
    ...overrides,
  };
}

describe('useAppMapActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geoMocks.getCurrentDevicePosition.mockResolvedValue({
      latitude: 36.35,
      longitude: 127.38,
      accuracyMeters: 42,
    });
    apiMocks.claimStamp.mockResolvedValue({ collectedPlaceIds: ['place-1'], logs: [], travelSessions: [] } satisfies StampState);
  });

  it('refreshes current position and focuses the map when requested', async () => {
    const { result } = renderHook(() => useAppMapActions(createParams()));

    await act(async () => {
      await result.current.refreshCurrentPosition(true);
    });

    expect(runtimeState.setMapLocationStatus).toHaveBeenCalledWith('loading');
    expect(runtimeState.setCurrentPosition).toHaveBeenCalledWith({ latitude: 36.35, longitude: 127.38 });
    expect(runtimeState.setMapLocationStatus).toHaveBeenCalledWith('ready');
    expect(runtimeState.setMapLocationFocusKey).toHaveBeenCalledWith(expect.any(Function));
  });

  it('reports current position errors without focusing the map', async () => {
    geoMocks.getCurrentDevicePosition.mockRejectedValueOnce(new Error('position denied'));
    const { result } = renderHook(() => useAppMapActions(createParams()));

    await act(async () => {
      await result.current.refreshCurrentPosition(false);
    });

    expect(runtimeState.setCurrentPosition).toHaveBeenCalledWith(null);
    expect(runtimeState.setMapLocationStatus).toHaveBeenCalledWith('error');
    expect(runtimeState.setMapLocationMessage).toHaveBeenCalledWith('position denied');
    expect(runtimeState.setMapLocationFocusKey).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated stamp attempts to my tab', async () => {
    const params = createParams({ sessionUser: null });
    const { result } = renderHook(() => useAppMapActions(params));

    await act(async () => {
      await result.current.handleClaimStamp(place);
    });

    expect(params.goToTab).toHaveBeenCalledWith('my');
    expect(runtimeState.setNotice).toHaveBeenCalled();
    expect(apiMocks.claimStamp).not.toHaveBeenCalled();
  });

  it('claims stamps, updates place counts, opens the drawer, and refreshes my page', async () => {
    const params = createParams();
    const { result } = renderHook(() => useAppMapActions(params));

    await act(async () => {
      await result.current.handleClaimStamp(place);
    });

    expect(apiMocks.claimStamp).toHaveBeenCalledWith({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 });
    expect(params.setStampState).toHaveBeenCalledWith({ collectedPlaceIds: ['place-1'], logs: [], travelSessions: [] });
    expect(params.commitRouteState).toHaveBeenCalledWith({
      tab: 'map',
      placeId: 'place-1',
      festivalId: null,
      drawerState: 'full',
    }, 'replace');
    expect(params.refreshMyPageForUser).toHaveBeenCalledWith(sessionUser);
    expect(runtimeState.setStampActionStatus).toHaveBeenLastCalledWith('ready');
  });

  it('reports stamp claim failures and still resets action status', async () => {
    apiMocks.claimStamp.mockRejectedValueOnce(new Error('too far'));
    const { result } = renderHook(() => useAppMapActions(createParams()));

    await act(async () => {
      await result.current.handleClaimStamp(place);
    });

    expect(runtimeState.setNotice).toHaveBeenCalledWith('too far');
    expect(runtimeState.setStampActionStatus).toHaveBeenLastCalledWith('ready');
  });
});
