import { describe, expect, it } from 'vitest';
import { buildPlacesSearchPath } from '../../src/api/placesSearchClient';

describe('placesSearchClient', () => {
  it('builds the lightweight place search endpoint with trimmed query and limit', () => {
    expect(buildPlacesSearchPath({ q: ' 여기 ', limit: 5 })).toBe('/api/places/search?q=%EC%97%AC%EA%B8%B0&limit=5');
  });

  it('uses the frontend default limit when no limit is provided', () => {
    expect(buildPlacesSearchPath({ q: '소제' })).toBe('/api/places/search?q=%EC%86%8C%EC%A0%9C&limit=10');
  });
});
