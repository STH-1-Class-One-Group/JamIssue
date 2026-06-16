import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ApiError } from '../../src/api/core';
import { getTourismPlaceDetail, getTourismPlaces } from '../../src/api/tourismClient';
import { TourismRuntimeConfig } from '../../src/config/runtimeLimitConfig';
import { useTourismOverlayEffects } from '../../src/hooks/app-coordinator/useTourismOverlayEffects';
import type { TourismPlaceDetailResponse, TourismPlaceItem, TourismPlacesResponse } from '../../src/tourismTypes';

vi.mock('../../src/api/tourismClient', () => ({
  getTourismPlaces: vi.fn(),
  getTourismPlaceDetail: vi.fn(),
}));

const getTourismPlacesMock = vi.mocked(getTourismPlaces);
const getTourismPlaceDetailMock = vi.mocked(getTourismPlaceDetail);

const tourismPlace: TourismPlaceItem = {
  id: 'kto-content-1',
  name: '아트브릿지(대전)',
  category: 'culture',
  primaryType: 'culture',
  subType: 'unknown',
  displayGroup: 'culture',
  officialCategoryLabel: '문화시설',
  curationStatus: 'raw_kto',
  ktoContentTypeId: '14',
  ktoContentTypeLabel: '문화시설',
  district: '서구',
  address: '대전광역시 서구 둔산로 1',
  roadAddress: null,
  summary: '공연과 전시를 볼 수 있는 문화공간입니다.',
  description: null,
  latitude: 36.35,
  longitude: 127.38,
  imageUrl: null,
  sourceName: 'KTO 관광정보',
  hasDetail: true,
  detailKind: 'culture',
  isCurated: false,
  curatedPlace: null,
};

function createTourismPlacesResponse(overrides: Partial<TourismPlacesResponse> = {}): TourismPlacesResponse {
  return {
    sourceReady: true,
    sourceName: 'KTO TourAPI Daejeon Tourism',
    importedAt: '2026-06-13T00:00:00.000Z',
    total: 1,
    facets: {
      categories: [],
      districts: [],
      contentTypes: [],
      ktoFacets: [],
      displayGroups: [{ key: 'culture', label: '문화시설', count: 1 }],
    },
    items: [tourismPlace],
    ...overrides,
  };
}

function createDetailResponse(): TourismPlaceDetailResponse {
  return {
    sourceReady: true,
    item: {
      ...tourismPlace,
      overview: '상세 소개입니다.',
      contact: '042-000-0000',
      homepageUrl: null,
      images: [],
      displaySections: [],
      detail: {},
    },
  };
}

function createArgs(overrides = {}) {
  return {
    selectedTourismPlaceId: null,
    showTourismInfo: true,
    tourismDetailsById: {},
    tourismPlaces: [],
    tourismPlacesQueryKey: null,
    setSelectedTourismPlaceId: vi.fn(),
    setTourismDetailError: vi.fn(),
    setTourismDetailLoading: vi.fn(),
    setTourismDetailsById: vi.fn(),
    setTourismError: vi.fn(),
    setTourismFacets: vi.fn(),
    setTourismLoading: vi.fn(),
    setTourismPlaces: vi.fn(),
    setTourismPlacesQueryKey: vi.fn(),
    setTourismSourceReady: vi.fn(),
    formatErrorMessage: (error: unknown) => error instanceof Error ? error.message : '요청 실패',
    ...overrides,
  };
}

async function flushPromises() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  getTourismPlaceDetailMock.mockReset();
  getTourismPlacesMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

test('requests the KV snapshot list with scope=all only once for KTO ON', async () => {
  const setTourismPlaces = vi.fn();
  const setTourismPlacesQueryKey = vi.fn();
  getTourismPlacesMock.mockResolvedValue(createTourismPlacesResponse());

  renderHook(() => useTourismOverlayEffects(createArgs({
    setTourismPlaces,
    setTourismPlacesQueryKey,
  })));
  await flushPromises();

  expect(getTourismPlacesMock).toHaveBeenCalledTimes(1);
  expect(getTourismPlacesMock).toHaveBeenCalledWith({ scope: 'all' }, expect.objectContaining({
    signal: expect.any(AbortSignal),
  }));
  expect(setTourismPlaces).toHaveBeenCalledWith([tourismPlace]);
  expect(setTourismPlacesQueryKey).toHaveBeenCalledWith('scope=all');
});

test('keeps KTO layer disabled and retryable when the KV snapshot is not ready', async () => {
  const setTourismError = vi.fn();
  const setTourismPlaces = vi.fn();
  const setTourismPlacesQueryKey = vi.fn();
  const setTourismSourceReady = vi.fn();
  getTourismPlacesMock.mockResolvedValue(createTourismPlacesResponse({
    sourceReady: false,
    total: 0,
    items: [],
    facets: { categories: [], districts: [], contentTypes: [], ktoFacets: [], displayGroups: [] },
  }));

  renderHook(() => useTourismOverlayEffects(createArgs({
    setTourismError,
    setTourismPlaces,
    setTourismPlacesQueryKey,
    setTourismSourceReady,
  })));
  await flushPromises();

  expect(setTourismPlaces).toHaveBeenCalledWith([]);
  expect(setTourismSourceReady).toHaveBeenCalledWith(false);
  expect(setTourismError).toHaveBeenCalledWith('관광정보를 준비 중이에요. 잠시 후 다시 시도해 주세요.');
  expect(setTourismPlacesQueryKey).not.toHaveBeenCalledWith('scope=all');
});

test('handles HTTP 503 without DB fallback and releases loading state', async () => {
  const setTourismError = vi.fn();
  const setTourismLoading = vi.fn();
  const setTourismPlacesQueryKey = vi.fn();
  getTourismPlacesMock.mockRejectedValue(new ApiError('관광정보 스냅샷을 준비 중입니다.', 503));

  renderHook(() => useTourismOverlayEffects(createArgs({
    setTourismError,
    setTourismLoading,
    setTourismPlacesQueryKey,
  })));
  await flushPromises();

  expect(setTourismError).toHaveBeenCalledWith('관광정보 스냅샷을 준비 중입니다.');
  expect(setTourismLoading).toHaveBeenLastCalledWith(false);
  expect(setTourismPlacesQueryKey).toHaveBeenCalledWith(null);
});

test('aborts the initial KTO places request and clears loading when the request hangs', async () => {
  const setTourismError = vi.fn();
  const setTourismLoading = vi.fn();

  getTourismPlacesMock.mockImplementation((_query, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'));
      });
    }),
  );

  renderHook(() => useTourismOverlayEffects(createArgs({
    setTourismError,
    setTourismLoading,
  })));

  expect(getTourismPlacesMock).toHaveBeenCalledWith({ scope: 'all' }, expect.objectContaining({
    signal: expect.any(AbortSignal),
  }));
  expect(setTourismLoading).toHaveBeenCalledWith(true);

  vi.advanceTimersByTime(TourismRuntimeConfig.placesRequestTimeoutMs);
  await flushPromises();

  expect(setTourismError).toHaveBeenCalledWith('관광정보 응답이 지연되고 있어요. 잠시 후 다시 켜 주세요.');
  expect(setTourismLoading).toHaveBeenLastCalledWith(false);
});

test('lazy-loads the selected KTO place detail through the detail endpoint', async () => {
  const setTourismDetailsById = vi.fn();
  getTourismPlacesMock.mockResolvedValue(createTourismPlacesResponse());
  getTourismPlaceDetailMock.mockResolvedValue(createDetailResponse());

  renderHook(() => useTourismOverlayEffects(createArgs({
    selectedTourismPlaceId: tourismPlace.id,
    tourismPlaces: [tourismPlace],
    tourismPlacesQueryKey: 'scope=all',
    setTourismDetailsById,
  })));
  await flushPromises();

  expect(getTourismPlacesMock).not.toHaveBeenCalled();
  expect(getTourismPlaceDetailMock).toHaveBeenCalledWith(tourismPlace.id, expect.objectContaining({
    signal: expect.any(AbortSignal),
  }));
  expect(setTourismDetailsById).toHaveBeenCalledWith(expect.any(Function));
});

test('does not request detail for compact list items that declare hasDetail=false', async () => {
  getTourismPlacesMock.mockResolvedValue(createTourismPlacesResponse());

  renderHook(() => useTourismOverlayEffects(createArgs({
    selectedTourismPlaceId: tourismPlace.id,
    tourismPlaces: [{ ...tourismPlace, hasDetail: false }],
    tourismPlacesQueryKey: 'scope=all',
  })));
  await flushPromises();

  expect(getTourismPlacesMock).not.toHaveBeenCalled();
  expect(getTourismPlaceDetailMock).not.toHaveBeenCalled();
});
