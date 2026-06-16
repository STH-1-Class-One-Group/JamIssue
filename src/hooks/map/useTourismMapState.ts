/*
 * File: hooks/map/useTourismMapState.ts
 * Purpose: Store map-local KTO tourism overlay UI state.
 * Primary Responsibility: Own the tourism visibility toggle, selected tourism item id, and sheet expansion state.
 * Design Intent: Keep KTO map overlay state local to map domain instead of encoding it in route URLs before the flow is proven stable.
 * Non-Goals: This hook does not fetch tourism data or own curated place navigation.
 * Dependencies: React local state.
 */
import { useState } from 'react';
import type { DrawerState } from '../../types/core';
import type { TourismDisplayGroupFilter } from '../../tourismTypes';

export type TourismSheetState = Exclude<DrawerState, 'closed'>;

export function useTourismMapState() {
  const [showTourismInfo, setShowTourismInfo] = useState(false);
  const [activeTourismDisplayGroup, setActiveTourismDisplayGroup] = useState<TourismDisplayGroupFilter>('all');
  const [selectedTourismPlaceId, setSelectedTourismPlaceId] = useState<string | null>(null);
  const [tourismSheetState, setTourismSheetState] = useState<TourismSheetState>('peek');

  return {
    showTourismInfo,
    setShowTourismInfo,
    activeTourismDisplayGroup,
    setActiveTourismDisplayGroup,
    selectedTourismPlaceId,
    setSelectedTourismPlaceId,
    tourismSheetState,
    setTourismSheetState,
  };
}
