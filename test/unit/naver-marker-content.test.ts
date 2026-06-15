import { describe, expect, it } from 'vitest';
import { placeMarkerContent, tourismMarkerContent } from '../../src/components/naver-map/markerContent';
import { UiNaverMarkerVisualConfig } from '../../src/config/uiTokenConfig';
import type { TourismPlaceItem } from '../../src/tourismTypes';
import type { Place } from '../../src/types/core';

const tourismPlace = {
  id: 'tourism-1',
  name: 'Tourism 1',
  category: 'restaurant',
  primaryType: 'restaurant',
  subType: 'unknown',
  displayGroup: 'restaurant',
  officialCategoryLabel: '음식점',
  curationStatus: 'raw_kto',
  ktoContentTypeId: '39',
  ktoContentTypeLabel: '음식점',
  ktoFacet: 'restaurant',
  district: '서구',
  address: null,
  roadAddress: null,
  summary: '',
  description: null,
  latitude: 36.7,
  longitude: 127.7,
  imageUrl: null,
  sourcePageUrl: null,
  sourceUpdatedAt: null,
  sourceName: 'KTO 관광정보',
  hasDetail: true,
  detailKind: 'restaurant',
  isCurated: false,
  curatedPlace: null,
} as TourismPlaceItem;

const curatedPlace = {
  id: 'place-1',
  name: 'Curated Place',
  district: 'Seo-gu',
  category: 'cafe',
  jamColor: '#f6a8c8',
  accentColor: '#315f72',
  latitude: 36.7,
  longitude: 127.7,
} as Place;

describe('tourism marker content', () => {
  it('renders inactive KTO markers with lower emphasis than active markers', () => {
    const inactiveContent = tourismMarkerContent(tourismPlace, false);
    const activeContent = tourismMarkerContent(tourismPlace, true);

    expect(inactiveContent).toContain(`transform:${UiNaverMarkerVisualConfig.inactiveTourismScale}`);
    expect(inactiveContent).toContain(`opacity:${UiNaverMarkerVisualConfig.inactiveTourismOpacity}`);
    expect(activeContent).toContain(`transform:${UiNaverMarkerVisualConfig.activeTourismScale}`);
    expect(activeContent).toContain(`opacity:${UiNaverMarkerVisualConfig.activeTourismOpacity}`);
    expect(inactiveContent).not.toContain(UiNaverMarkerVisualConfig.activeTourismScale);
  });

  it('keeps marker pointer targets on the visible core instead of the transparent wrapper', () => {
    const tourismContent = tourismMarkerContent(tourismPlace, false);
    const placeContent = placeMarkerContent(curatedPlace, false);

    expect(tourismContent).toContain('data-marker-hit-target="tourism"');
    expect(tourismContent).toContain('pointer-events:none');
    expect(tourismContent).toContain('pointer-events:auto');
    expect(placeContent).toContain('data-marker-hit-target="curated"');
    expect(placeContent).toContain('pointer-events:none');
    expect(placeContent).toContain('pointer-events:auto');
  });
});
