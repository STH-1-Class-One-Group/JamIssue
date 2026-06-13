/*
 * File: useTourismMapState.ts
 * Purpose: Store map-local KTO tourism overlay UI state.
 * Primary Responsibility: Own the tourism visibility toggle, selected tourism item id, and sheet expansion state.
 * Design Intent: Keep KTO map overlay state local to map domain instead of encoding it in route URLs before the flow is proven stable.
 * Non-Goals: This hook does not fetch tourism data or own curated place navigation.
 * Dependencies: React local state.
 */
import { useState } from 'react';

export function useTourismMapState() {
  const [showTourismInfo, setShowTourismInfo] = useState(false);
  const [selectedTourismPlaceId, setSelectedTourismPlaceId] = useState<string | null>(null);
  const [tourismSheetState, setTourismSheetState] = useState<'partial' | 'full'>('partial');

  return {
    showTourismInfo,
    setShowTourismInfo,
    selectedTourismPlaceId,
    setSelectedTourismPlaceId,
    tourismSheetState,
    setTourismSheetState,
  };
}
