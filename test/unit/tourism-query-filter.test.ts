import { describe, expect, it } from 'vitest';
import { filterTourismPlacesByDisplayGroup } from '../../src/lib/tourismTaxonomy';
import type { TourismPlaceItem } from '../../src/tourismTypes';
import { buildTourismPlacesQuery, buildTourismPlacesQueryKey } from '../../src/hooks/app-coordinator/tourismQuery';

const tourismPlaces = [
  {
    id: 'restaurant-1',
    name: '음식점',
    category: 'restaurant',
    displayGroup: 'restaurant',
  },
  {
    id: 'cafe-1',
    name: '카페',
    category: 'restaurant',
    primaryType: 'restaurant',
    subType: 'cafe',
    displayGroup: 'cafe',
  },
  {
    id: 'lodging-1',
    name: '숙박',
    category: 'lodging',
    displayGroup: 'lodging',
  },
] as TourismPlaceItem[];

describe('tourism map query and local displayGroup filtering', () => {
  it('always requests the all-scope tourism list for the map overlay', () => {
    expect(buildTourismPlacesQuery()).toEqual({ scope: 'all' });
    expect(buildTourismPlacesQueryKey()).toBe('scope=all');
  });

  it('filters display groups locally after the all-scope response is loaded', () => {
    expect(filterTourismPlacesByDisplayGroup(tourismPlaces, 'all')).toEqual(tourismPlaces);
    expect(filterTourismPlacesByDisplayGroup(tourismPlaces, 'cafe').map((place) => place.id)).toEqual(['cafe-1']);
    expect(filterTourismPlacesByDisplayGroup(tourismPlaces, 'lodging').map((place) => place.id)).toEqual(['lodging-1']);
  });
});
