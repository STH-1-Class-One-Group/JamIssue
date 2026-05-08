import { describe, expect, it } from 'vitest';

import { getRoutePreviewPlaces } from '../../src/hooks/app-view-models/placeSelections';
import type { Place, RoutePreview } from '../../src/types';
import { placeFixture } from '../fixtures/app-fixtures';

function createPlace(id: string, name: string): Place {
  return {
    ...placeFixture,
    id,
    name,
  };
}

function createRoutePreview(placeIds: string[]): RoutePreview {
  return {
    id: 'route-1',
    title: 'route',
    subtitle: 'subtitle',
    mood: 'mood',
    placeIds,
    placeNames: [],
  };
}

describe('place selection helpers', () => {
  it('returns no route preview places when the route preview is empty', () => {
    expect(getRoutePreviewPlaces([createPlace('place-1', 'Place 1')], null)).toEqual([]);
  });

  it('keeps route order, repeated ids, and skips missing places', () => {
    const places = [
      createPlace('place-1', 'Place 1'),
      createPlace('place-2', 'Place 2'),
    ];

    const result = getRoutePreviewPlaces(places, createRoutePreview(['place-2', 'missing', 'place-1', 'place-2']));

    expect(result.map((place) => place.id)).toEqual(['place-2', 'place-1', 'place-2']);
  });

  it('keeps the first matching place when source data contains duplicate ids', () => {
    const result = getRoutePreviewPlaces(
      [
        createPlace('place-1', 'First Place'),
        createPlace('place-1', 'Second Place'),
      ],
      createRoutePreview(['place-1']),
    );

    expect(result[0]?.name).toBe('First Place');
  });
});
