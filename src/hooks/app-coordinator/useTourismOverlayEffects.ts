/*
 * File: useTourismOverlayEffects.ts
 * Purpose: Run KTO tourism overlay loading effects for the app coordinator.
 * Primary Responsibility: Fetch tourism list/detail data through the Worker consumer API when map tourism state changes.
 * Design Intent: Keep KTO request orchestration separate from the broader app coordinator lifecycle effects.
 * Non-Goals: This hook does not render tourism UI, normalize taxonomy, or call provider/admin APIs directly.
 * Dependencies: React effects, tourism API client, runtime request timeout config, and tourism query helpers.
 */
import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getTourismPlaceDetail, getTourismPlaces } from '../../api/tourismClient';
import { TourismRuntimeConfig } from '../../config/runtimeLimitConfig';
import type { TourismFacets, TourismPlaceDetailResponse, TourismPlaceItem } from '../../tourismTypes';
import { buildTourismPlacesQuery, buildTourismPlacesQueryKey } from './tourismQuery';

type TourismOverlayEffectsArgs = {
  selectedTourismPlaceId: string | null;
  showTourismInfo: boolean;
  tourismDetailsById: Record<string, TourismPlaceDetailResponse>;
  tourismPlaces: TourismPlaceItem[];
  tourismPlacesQueryKey: string | null;
  setSelectedTourismPlaceId: (placeId: string | null) => void;
  setTourismDetailError: (message: string | null) => void;
  setTourismDetailLoading: (isLoading: boolean) => void;
  setTourismDetailsById: Dispatch<SetStateAction<Record<string, TourismPlaceDetailResponse>>>;
  setTourismError: (message: string | null) => void;
  setTourismFacets: (facets: TourismFacets) => void;
  setTourismLoading: (isLoading: boolean) => void;
  setTourismPlaces: (places: TourismPlaceItem[]) => void;
  setTourismPlacesQueryKey: (queryKey: string | null) => void;
  setTourismSourceReady: (isReady: boolean) => void;
  formatErrorMessage: (error: unknown) => string;
};

/**
 * Coordinates KTO tourism list and detail requests for the optional map layer.
 *
 * The list request always uses `scope=all` so the map layer consumes the Worker
 * KV snapshot compact read model instead of an arbitrary first page.
 */
export function useTourismOverlayEffects({
  selectedTourismPlaceId,
  showTourismInfo,
  tourismDetailsById,
  tourismPlaces,
  tourismPlacesQueryKey,
  setSelectedTourismPlaceId,
  setTourismDetailError,
  setTourismDetailLoading,
  setTourismDetailsById,
  setTourismError,
  setTourismFacets,
  setTourismLoading,
  setTourismPlaces,
  setTourismPlacesQueryKey,
  setTourismSourceReady,
  formatErrorMessage,
}: TourismOverlayEffectsArgs) {
  useEffect(() => {
    if (!showTourismInfo) {
      setSelectedTourismPlaceId(null);
      return;
    }
    const tourismQuery = buildTourismPlacesQuery();
    const tourismQueryKey = buildTourismPlacesQueryKey();
    if (tourismPlaces.length > 0 && tourismPlacesQueryKey === tourismQueryKey) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, TourismRuntimeConfig.placesRequestTimeoutMs);
    setTourismLoading(true);
    setTourismError(null);

    getTourismPlaces(tourismQuery, { signal: controller.signal })
      .then((response) => {
        if (!isActive) {
          return;
        }
        if (!response.sourceReady) {
          setTourismPlaces([]);
          setTourismFacets(response.facets);
          setTourismPlacesQueryKey(null);
          setTourismSourceReady(false);
          setTourismError('관광정보를 준비 중이에요. 잠시 후 다시 시도해 주세요.');
          return;
        }
        setTourismPlaces(response.items);
        setTourismFacets(response.facets);
        setTourismPlacesQueryKey(tourismQueryKey);
        setTourismSourceReady(true);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        setTourismPlaces([]);
        setTourismPlacesQueryKey(null);
        setTourismSourceReady(false);
        setTourismError(formatTourismErrorMessage(error, formatErrorMessage));
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (isActive) {
          setTourismLoading(false);
        }
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    formatErrorMessage,
    setSelectedTourismPlaceId,
    setTourismError,
    setTourismFacets,
    setTourismLoading,
    setTourismPlaces,
    setTourismPlacesQueryKey,
    setTourismSourceReady,
    showTourismInfo,
    tourismPlaces.length,
    tourismPlacesQueryKey,
  ]);

  useEffect(() => {
    if (!selectedTourismPlaceId) {
      setTourismDetailError(null);
      setTourismDetailLoading(false);
      return;
    }
    if (tourismDetailsById[selectedTourismPlaceId]) {
      return;
    }
    const selectedTourismPlace = tourismPlaces.find((place) => place.id === selectedTourismPlaceId);
    if (selectedTourismPlace?.hasDetail === false) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, TourismRuntimeConfig.placesRequestTimeoutMs);
    setTourismDetailLoading(true);
    setTourismDetailError(null);

    getTourismPlaceDetail(selectedTourismPlaceId, { signal: controller.signal })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setTourismDetailsById((current) => ({
          ...current,
          [selectedTourismPlaceId]: response,
        }));
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        setTourismDetailError(formatTourismErrorMessage(error, formatErrorMessage));
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (isActive) {
          setTourismDetailLoading(false);
        }
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    formatErrorMessage,
    selectedTourismPlaceId,
    setTourismDetailError,
    setTourismDetailLoading,
    setTourismDetailsById,
    tourismDetailsById,
    tourismPlaces,
  ]);
}

function formatTourismErrorMessage(error: unknown, formatErrorMessage: (error: unknown) => string) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '관광정보 응답이 지연되고 있어요. 잠시 후 다시 켜 주세요.';
  }
  return formatErrorMessage(error);
}
