import { describe, expect, it } from 'vitest';
import { tourismMarkerContent } from '../../src/components/naver-map/markerContent';
import { UiNaverMarkerVisualConfig } from '../../src/config/uiTokenConfig';
import type { TourismPlaceItem } from '../../src/tourismTypes';

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
});
