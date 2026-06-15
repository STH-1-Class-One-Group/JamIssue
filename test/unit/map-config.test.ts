import { afterEach, describe, expect, it } from 'vitest';
import {
  GeoDistanceConfig,
  GeolocationConfig,
  MapViewportConfig,
  NaverMarkerConfig,
  SelectionMotionConfig,
} from '../../src/config/mapConfig';
import { getSelectionVerticalOffset } from '../../src/components/naver-map/selectionOffset';
import { getInitialMapViewport, updateMapViewportInUrl } from '../../src/hooks/app-route/mapViewportState';

const originalUrl = window.location.href;
const originalInnerWidth = window.innerWidth;

afterEach(() => {
  window.history.replaceState({}, '', originalUrl);
  setViewportWidth(originalInnerWidth);
});

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
}

describe('map config boundaries', () => {
  it('keeps the default Daejeon viewport and URL precision stable', () => {
    window.history.replaceState({}, '', '/?lat=36.111119&lng=127.222229&z=15');

    expect(getInitialMapViewport()).toEqual({ lat: 36.111119, lng: 127.222229, zoom: 15 });

    updateMapViewportInUrl(36.111119, 127.222229, MapViewportConfig.defaultZoom);

    expect(window.location.search).toContain('lat=36.11112');
    expect(window.location.search).toContain('lng=127.22223');
    expect(window.location.search).toContain(`z=${MapViewportConfig.defaultZoom}`);
  });

  it('keeps marker layer and anchor semantics in named config', () => {
    expect(MapViewportConfig.daejeonCenter).toEqual({ latitude: 36.3504, longitude: 127.3845 });
    expect(MapViewportConfig.defaultZoom).toBe(13);
    expect(MapViewportConfig.minZoom).toBe(11);
    expect(MapViewportConfig.selectedZoomFloor).toBe(15);
    expect(MapViewportConfig.urlCoordinatePrecision).toBe(5);

    expect(NaverMarkerConfig.anchor.default).toEqual({ x: 15, y: 15 });
    expect(NaverMarkerConfig.anchor.routeStep).toEqual({ x: 13, y: 13 });
    expect(NaverMarkerConfig.zIndex).toMatchObject({
      placeDefault: 100,
      placeActive: 160,
      tourismDefault: 90,
      tourismActive: 150,
      festivalDefault: 110,
      festivalActive: 170,
      routeLine: 120,
      routeStep: 165,
      currentLocation: 200,
    });
    expect(NaverMarkerConfig.zIndex.tourismDefault).toBeLessThan(NaverMarkerConfig.zIndex.placeDefault);
    expect(NaverMarkerConfig.zIndex.tourismActive).toBeGreaterThan(NaverMarkerConfig.zIndex.tourismDefault);
    expect(NaverMarkerConfig.zIndex.tourismActive).toBeLessThan(NaverMarkerConfig.zIndex.placeActive);
    expect(NaverMarkerConfig.routeBoundsPadding).toEqual({ top: 72, right: 40, bottom: 120, left: 40 });
    expect(NaverMarkerConfig.materialization.tourismMobileViewportMarkerLimit).toBeLessThan(
      NaverMarkerConfig.materialization.tourismFallbackMarkerLimit,
    );
    expect(NaverMarkerConfig.materialization.tourismMobileViewportMaxWidth).toBe(640);
    expect(NaverMarkerConfig.materialization.tourismMobileViewportMarkerLimit).toBe(32);
    expect(NaverMarkerConfig.materialization.tourismDesktopViewportMarkerLimit).toBe(64);
    expect(NaverMarkerConfig.materialization.tourismViewportMarkerLimit).toBe(32);
    expect(NaverMarkerConfig.materialization.tourismFallbackMarkerLimit).toBe(48);
    expect(NaverMarkerConfig.materialization.tourismMarkerBatchSize).toBe(8);
  });

  it('keeps selection offset behavior while moving numbers into config', () => {
    setViewportWidth(390);
    expect(getSelectionVerticalOffset(null, 'place')).toBe(SelectionMotionConfig.fallbackOffsetPx.place.mobile);
    expect(getSelectionVerticalOffset(null, 'festival')).toBe(SelectionMotionConfig.fallbackOffsetPx.festival.mobile);

    const mapElement = document.createElement('div');
    Object.defineProperty(mapElement, 'clientHeight', {
      value: 700,
      configurable: true,
    });

    expect(getSelectionVerticalOffset(mapElement, 'place')).toBe(392);
    expect(getSelectionVerticalOffset(mapElement, 'festival')).toBe(294);
  });

  it('keeps geolocation and distance thresholds in named config', () => {
    expect(GeolocationConfig.validAreaCenter).toBe(MapViewportConfig.daejeonCenter);
    expect(GeolocationConfig.validRadiusMeters).toBe(45_000);
    expect(GeolocationConfig.maxAcceptableAccuracyMeters).toBe(5_000);
    expect(GeolocationConfig.earlySuccessAccuracyMeters).toBe(150);
    expect(GeolocationConfig.settleTimeoutMs).toBe(8_000);
    expect(GeolocationConfig.watchOptions).toEqual({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });

    expect(GeoDistanceConfig.earthRadiusMeters).toBe(6_371_000);
    expect(GeoDistanceConfig.kilometerThresholdMeters).toBe(1000);
    expect(GeoDistanceConfig.kilometerFractionDigits).toBe(1);
  });
});
