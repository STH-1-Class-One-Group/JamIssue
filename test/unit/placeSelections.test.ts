import { describe, expect, it } from 'vitest';
import {
  buildPlaceNameById,
  getRoutePreviewPlaces,
  getSelectedFestival,
  getSelectedPlace,
} from '../../src/hooks/app-view-models/placeSelections';
import type { FestivalItem, Place, RoutePreview } from '../../src/types';
import { placeFixture } from '../fixtures/app-fixtures';

describe('placeSelections view model', () => {
  const mockPlaces: Place[] = [
    { ...placeFixture, id: 'p1', name: 'Place 1 (First)', category: 'cafe' },
    { ...placeFixture, id: 'p2', name: 'Place 2', category: 'restaurant' },
    { ...placeFixture, id: 'p4', name: 'Place 1 (Second)', category: 'cafe' },
    { ...placeFixture, id: 'p3', name: 'Place 3', category: 'cafe' },
  ];

  describe('getSelectedPlace', () => {
    it('returns the place with matching ID', () => {
      const result = getSelectedPlace(mockPlaces, 'p2');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('p2');
      expect(result?.name).toBe('Place 2');
    });

    it('returns null if no ID matches', () => {
      const result = getSelectedPlace(mockPlaces, 'non-existent');
      expect(result).toBeNull();
    });

    it('returns null if selectedPlaceId is null', () => {
      const result = getSelectedPlace(mockPlaces, null);
      expect(result).toBeNull();
    });

    it('returns the matching place when ID exists', () => {
      const result = getSelectedPlace(mockPlaces, 'p1');
      expect(result?.name).toBe('Place 1 (First)');
    });
  });

  describe('getRoutePreviewPlaces', () => {
    it('maintains the order of placeIds in the result', () => {
      const routePreview: RoutePreview = {
        placeIds: ['p3', 'p2'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(mockPlaces, routePreview);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p3');
      expect(result[1].id).toBe('p2');
    });

    it('handles repeating IDs in the route preview', () => {
      const routePreview: RoutePreview = {
        placeIds: ['p2', 'p2', 'p3'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(mockPlaces, routePreview);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('p2');
      expect(result[1].id).toBe('p2');
      expect(result[2].id).toBe('p3');
    });

    it('skips missing IDs', () => {
      const routePreview: RoutePreview = {
        placeIds: ['p1', 'missing', 'p3'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(mockPlaces, routePreview);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p3');
    });

    it('returns matching place when a route ID exists once in source places', () => {
      const routePreview: RoutePreview = {
        placeIds: ['p1'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(mockPlaces, routePreview);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Place 1 (First)');
    });

    it('keeps first-match semantics when source places contain duplicate IDs', () => {
      const placesWithDuplicateId: Place[] = [
        ...mockPlaces,
        { ...placeFixture, id: 'p1', name: 'Place 1 (Duplicate Later)', category: 'cafe' },
      ];
      const routePreview: RoutePreview = {
        placeIds: ['p1'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(placesWithDuplicateId, routePreview);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Place 1 (First)');
    });

    it('returns an empty array if routePreview.placeIds is empty', () => {
      const routePreview: RoutePreview = {
        placeIds: [],
      } as RoutePreview;

      const result = getRoutePreviewPlaces(mockPlaces, routePreview);
      expect(result).toEqual([]);
    });

    it('returns an empty array if selectedRoutePreview is null', () => {
      const result = getRoutePreviewPlaces(mockPlaces, null);
      expect(result).toEqual([]);
    });

    it('returns an empty array when places is empty', () => {
      const routePreview: RoutePreview = {
        placeIds: ['p1', 'p2'],
      } as RoutePreview;

      const result = getRoutePreviewPlaces([], routePreview);
      expect(result).toEqual([]);
    });
  });

  describe('getSelectedFestival', () => {
    const mockFestivals: FestivalItem[] = [
      { id: 'f1', title: 'Festival 1' } as FestivalItem,
      { id: 'f2', title: 'Festival 2' } as FestivalItem,
    ];

    it('returns the festival with matching ID', () => {
      const result = getSelectedFestival(mockFestivals, 'f1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('f1');
      expect(result?.title).toBe('Festival 1');
    });

    it('returns null if no ID matches', () => {
      const result = getSelectedFestival(mockFestivals, 'non-existent');
      expect(result).toBeNull();
    });

    it('returns null if selectedFestivalId is null', () => {
      const result = getSelectedFestival(mockFestivals, null);
      expect(result).toBeNull();
    });
  });

  describe('buildPlaceNameById', () => {
    it('returns a map of names by ID', () => {
      const result = buildPlaceNameById(mockPlaces);
      expect(result).toEqual({
        p1: 'Place 1 (First)',
        p2: 'Place 2',
        p3: 'Place 3',
        p4: 'Place 1 (Second)',
      });
    });

    it('handles empty array', () => {
      const result = buildPlaceNameById([]);
      expect(result).toEqual({});
    });
  });
});
