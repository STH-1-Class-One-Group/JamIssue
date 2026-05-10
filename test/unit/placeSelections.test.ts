import { describe, expect, it } from 'vitest';
import { getRoutePreviewPlaces } from '../../src/hooks/app-view-models/placeSelections';
import type { Place, RoutePreview } from '../../src/types';

describe('getRoutePreviewPlaces', () => {
  const mockPlaces: Place[] = [
    { id: 'p1', name: 'Place 1 (First)' } as Place,
    { id: 'p2', name: 'Place 2' } as Place,
    { id: 'p1', name: 'Place 1 (Second)' } as Place,
    { id: 'p3', name: 'Place 3' } as Place,
  ];

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

  it('preserves first-match behavior for duplicate IDs in source places', () => {
    const routePreview: RoutePreview = {
      placeIds: ['p1'],
    } as RoutePreview;

    const result = getRoutePreviewPlaces(mockPlaces, routePreview);
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
