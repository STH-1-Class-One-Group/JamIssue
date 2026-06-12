import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NaverMap } from '../../src/components/NaverMap';
import type { FestivalItem, Place } from '../../src/types/core';

const naverMapMocks = vi.hoisted(() => ({
  getClientConfig: vi.fn(),
  NaverMapStatus: vi.fn((props: { onLocateCurrentPosition: () => void }) => (
    <button type="button" data-testid="naver-map-status" onClick={props.onLocateCurrentPosition}>
      status
    </button>
  )),
  useNaverMapInstance: vi.fn(),
  useNaverMapInteractions: vi.fn(),
  useNaverViewportChangeRef: vi.fn(),
  useNaverViewportSync: vi.fn(),
}));

vi.mock('../../src/config', () => ({
  getClientConfig: naverMapMocks.getClientConfig,
}));

vi.mock('../../src/components/naver-map/NaverMapStatus', () => ({
  NaverMapStatus: naverMapMocks.NaverMapStatus,
}));

vi.mock('../../src/components/naver-map/useNaverMapInstance', () => ({
  useNaverMapInstance: naverMapMocks.useNaverMapInstance,
}));

vi.mock('../../src/components/naver-map/useNaverMapInteractions', () => ({
  useNaverMapInteractions: naverMapMocks.useNaverMapInteractions,
}));

vi.mock('../../src/components/naver-map/useNaverViewportChangeRef', () => ({
  useNaverViewportChangeRef: naverMapMocks.useNaverViewportChangeRef,
}));

vi.mock('../../src/components/naver-map/useNaverViewportSync', () => ({
  useNaverViewportSync: naverMapMocks.useNaverViewportSync,
}));

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#fff',
    accentColor: '#000',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    ...overrides,
  };
}

function festivalFixture(overrides: Partial<FestivalItem> = {}): FestivalItem {
  return {
    id: 'festival-1',
    title: 'Festival',
    venueName: null,
    startDate: '2026-05-14',
    endDate: '2026-05-15',
    homepageUrl: null,
    roadAddress: null,
    latitude: 36.36,
    longitude: 127.39,
    isOngoing: true,
    ...overrides,
  };
}

describe('NaverMap component boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    naverMapMocks.getClientConfig.mockReturnValue({ naverMapClientId: 'naver-client' });
    naverMapMocks.useNaverViewportChangeRef.mockReturnValue({ current: vi.fn() });
    naverMapMocks.useNaverMapInstance.mockReturnValue({
      mapRef: { current: { id: 'map-instance' } },
      status: 'ready',
      errorMessage: null,
    });
    Object.defineProperty(window, 'naver', {
      configurable: true,
      value: { maps: { api: 'maps-api' } },
    });
  });

  it('composes map instance, viewport sync, interaction hooks, and status controls', async () => {
    const user = userEvent.setup();
    const onLocateCurrentPosition = vi.fn();
    const onViewportChange = vi.fn();
    const onSelectPlace = vi.fn();
    const onSelectFestival = vi.fn();
    const places = [placeFixture()];
    const festivals = [festivalFixture()];
    const routePreviewPlaces = [placeFixture({ id: 'place-2', latitude: 36.37, longitude: 127.4 })];

    render(
      <NaverMap
        places={places}
        festivals={festivals}
        selectedPlaceId="place-1"
        selectedFestivalId="festival-1"
        onSelectPlace={onSelectPlace}
        onSelectFestival={onSelectFestival}
        currentPosition={{ latitude: 36.35, longitude: 127.38 }}
        currentLocationStatus="idle"
        currentLocationMessage="location message"
        focusCurrentLocationKey={3}
        onLocateCurrentPosition={onLocateCurrentPosition}
        initialCenter={{ lat: 36.36, lng: 127.39 }}
        initialZoom={14}
        onViewportChange={onViewportChange}
        routePreviewPlaces={routePreviewPlaces}
        height="240px"
      />,
    );

    await user.click(screen.getByTestId('naver-map-status'));

    expect(onLocateCurrentPosition).toHaveBeenCalledTimes(1);
    expect(naverMapMocks.useNaverViewportChangeRef).toHaveBeenCalledWith(onViewportChange);
    expect(naverMapMocks.useNaverMapInstance).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'naver-client',
      initialCenter: { lat: 36.36, lng: 127.39 },
      initialZoom: 14,
    }));
    expect(naverMapMocks.useNaverViewportSync).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ready',
      mapsApi: { api: 'maps-api' },
      mapRef: { current: { id: 'map-instance' } },
    }));
    expect(naverMapMocks.useNaverMapInteractions).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ready',
      mapsApi: { api: 'maps-api' },
      places,
      festivals,
      selectedPlaceId: 'place-1',
      selectedFestivalId: 'festival-1',
      onSelectPlace,
      onSelectFestival,
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      focusCurrentLocationKey: 3,
      routePreviewPlaces,
    }));
    expect(naverMapMocks.NaverMapStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'naver-client',
        status: 'ready',
        errorMessage: null,
        currentLocationMessage: 'location message',
      }),
      expect.anything(),
    );
    expect(document.querySelector('.map-surface-frame div[style*="height: 240px"]')).toBeInTheDocument();
  });
});
