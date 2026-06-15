import { describe, expect, it } from 'vitest';
import { filterPlacesByCategory } from '../../src/hooks/app-view-models/placeSelections';
import type { Place } from '../../src/types';
import { placeFixture } from '../fixtures/app-fixtures';

describe('filterPlacesByCategory', () => {
  const mockPlaces: Place[] = [
    { ...placeFixture, id: 'place-1', category: 'cafe' },
    { ...placeFixture, id: 'place-2', category: 'restaurant' },
    { ...placeFixture, id: 'place-3', category: 'cafe' },
  ];

  it('should return all places when category is "all"', () => {
    const result = filterPlacesByCategory(mockPlaces, 'all');
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockPlaces);
  });

  it('keeps the full curated map-bootstrap list when category is "all"', () => {
    const allCuratedPlaces = Array.from({ length: 81 }, (_, index) => ({
      ...placeFixture,
      id: `curated-place-${index + 1}`,
      category: index % 2 === 0 ? 'cafe' : 'restaurant',
      latitude: 36.1 + index * 0.001,
      longitude: 127.1 + index * 0.001,
    })) as Place[];

    const result = filterPlacesByCategory(allCuratedPlaces, 'all');

    expect(result).toHaveLength(81);
    expect(result).toEqual(allCuratedPlaces);
  });

  it('should filter places by a specific category', () => {
    const result = filterPlacesByCategory(mockPlaces, 'cafe');
    expect(result).toHaveLength(2);
    expect(result.every((place) => place.category === 'cafe')).toBe(true);
    expect(result.map((p) => p.id)).toEqual(['place-1', 'place-3']);
  });

  it('should return an empty array when no places match the category', () => {
    const result = filterPlacesByCategory(mockPlaces, 'culture');
    expect(result).toHaveLength(0);
  });

  it('should handle an empty input array', () => {
    const result = filterPlacesByCategory([], 'cafe');
    expect(result).toHaveLength(0);
  });
});
