/*
 * File: tourismQuery.ts
 * Purpose: Build Worker tourism API queries for the app coordinator.
 * Primary Responsibility: Convert map tourism display filters into stable API query objects and cache keys.
 * Design Intent: Keep KTO query policy testable without growing the app coordinator effect module.
 * Non-Goals: This module does not fetch tourism data or interpret Worker response payloads.
 * Dependencies: Tourism consumer contract query and display group types.
 */
import type { TourismDisplayGroupFilter, TourismPlacesQuery } from '../../tourismTypes';

/**
 * Builds the canonical KTO tourism places query for map overlay loading.
 *
 * The map layer must request full result sets through `scope=all`; display
 * groups are applied as server-side filters instead of client-side category
 * guesses.
 */
export function buildTourismPlacesQuery(displayGroup: TourismDisplayGroupFilter): TourismPlacesQuery {
  if (displayGroup === 'all') {
    return { scope: 'all' };
  }
  return { scope: 'all', displayGroup };
}

/**
 * Returns a stable cache key for the tourism query represented by a display group.
 */
export function buildTourismPlacesQueryKey(displayGroup: TourismDisplayGroupFilter) {
  return displayGroup === 'all' ? 'scope=all' : `scope=all&displayGroup=${displayGroup}`;
}
