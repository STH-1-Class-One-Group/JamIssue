import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getTourismPlaceDetail, getTourismPlaces } from '../../src/api/tourismClient';
import { TourismRuntimeConfig } from '../../src/config/runtimeLimitConfig';
import { useTourismOverlayEffects } from '../../src/hooks/app-coordinator/useTourismOverlayEffects';

vi.mock('../../src/api/tourismClient', () => ({
  getTourismPlaces: vi.fn(),
  getTourismPlaceDetail: vi.fn(),
}));

const getTourismPlacesMock = vi.mocked(getTourismPlaces);

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(getTourismPlaceDetail).mockReset();
  getTourismPlacesMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
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
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }

  expect(setTourismError).toHaveBeenCalledWith('관광정보 응답이 지연되고 있어요. 잠시 후 다시 켜 주세요.');
  expect(setTourismLoading).toHaveBeenLastCalledWith(false);
});
