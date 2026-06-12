import { describe, expect, it } from 'vitest';

import {
  CATEGORY_META,
  deriveTags,
  getImageFileName,
  inferDistrict,
  makeDescription,
  makeRouteHint,
  makeSummary,
  normalizeCategory,
  slugify,
} from '../../scripts/sample-place/derive';

describe('sample place derive helpers', () => {
  it('normalizes known category labels from exported metadata and falls back to restaurant', () => {
    expect(normalizeCategory(CATEGORY_META.cafe.name)).toBe('cafe');
    expect(normalizeCategory(CATEGORY_META.culture.name)).toBe('culture');
    expect(normalizeCategory(CATEGORY_META.attraction.name)).toBe('attraction');
    expect(normalizeCategory('unknown')).toBe('restaurant');
  });

  it('infers districts from coordinate fallback branches', () => {
    expect(inferDistrict('Coordinate West', 36.3, 127.35)).toBeTruthy();
    expect(inferDistrict('Coordinate East North', 36.34, 127.43)).toBeTruthy();
    expect(inferDistrict('Coordinate East South', 36.32, 127.43)).toBeTruthy();
    expect(inferDistrict('Coordinate North West', 36.37, 127.38)).toBeTruthy();
    expect(inferDistrict('Coordinate West Fallback', 36.34, 127.39)).toBeTruthy();
    expect(inferDistrict('Coordinate Default', 36.34, 127.41)).toBeTruthy();
  });

  it('creates stable unique slugs and image names', () => {
    const used = new Set<string>();

    expect(slugify(1, 'Jam & Bread (Old)', used)).toBe('001-jam-and-bread');
    expect(slugify(1, 'Jam & Bread (Old)', used)).toBe('001-jam-and-bread-2');
    expect(slugify(2, '!!!', used)).toBe('002-place-002');
    expect(getImageFileName(1)).toBe('image.png');
    expect(getImageFileName(3)).toBe('image 2.png');
  });

  it('builds category-specific summary, description, route hints, and tags', () => {
    const categories = ['restaurant', 'cafe', 'culture', 'attraction'] as const;

    for (const category of categories) {
      expect(makeSummary('Place', category)).toContain('Place');
      expect(makeDescription('Place', category, 'District')).toContain('Place');
      expect(makeRouteHint(category, 'District')).toContain('District');
      expect(deriveTags('Plain Place', category, 'District', '')).toContain(CATEGORY_META[category].name);
    }
  });
});
