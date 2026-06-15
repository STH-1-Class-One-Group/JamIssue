export type GeoCoordinate = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type MapPointConfig = Readonly<{
  x: number;
  y: number;
}>;

export type SelectionTargetType = 'place' | 'festival';

export class MapViewportConfig {
  static readonly daejeonCenter: GeoCoordinate = { latitude: 36.3504, longitude: 127.3845 };
  static readonly defaultZoom = 13;
  static readonly minZoom = 11;
  static readonly selectedZoomFloor = 15;
  static readonly urlCoordinatePrecision = 5;
  static readonly urlZoomRadix = 10;
}

export class NaverMarkerConfig {
  static readonly anchor = {
    default: { x: 15, y: 15 },
    routeStep: { x: 13, y: 13 },
  } satisfies Record<string, MapPointConfig>;

  static readonly zIndex = {
    placeDefault: 100,
    placeActive: 160,
    tourismDefault: 90,
    tourismActive: 150,
    festivalDefault: 110,
    festivalActive: 170,
    routeLine: 120,
    routeStep: 165,
    currentLocation: 200,
  };

  static readonly routeBoundsPadding = {
    top: 72,
    right: 40,
    bottom: 120,
    left: 40,
  };

  static readonly materialization = {
    tourismFallbackMarkerLimit: 120,
    tourismMarkerBatchSize: 40,
    tourismMarkerBatchDelayMs: 0,
  };
}

export class SelectionMotionConfig {
  static readonly mobileBreakpointPx = 640;
  static readonly panDelayMs = {
    mobilePlace: 260,
    default: 180,
  };
  static readonly viewportIdleDebounceMs = 300;

  static readonly fallbackOffsetPx = {
    place: {
      mobile: 360,
      desktop: 250,
    },
    festival: {
      mobile: 280,
      desktop: 190,
    },
  };

  static readonly offsetRatio = {
    place: {
      mobile: 0.56,
      desktop: 0.38,
    },
    festival: {
      mobile: 0.42,
      desktop: 0.29,
    },
  };

  static readonly minOffsetPx = {
    place: {
      mobile: 340,
      desktop: 240,
    },
    festival: {
      mobile: 260,
      desktop: 170,
    },
  };

  static readonly maxOffsetPx = {
    place: {
      mobile: 430,
      desktop: 310,
    },
    festival: {
      mobile: 330,
      desktop: 230,
    },
  };
}

export class GeolocationConfig {
  static readonly validAreaCenter = MapViewportConfig.daejeonCenter;
  static readonly validRadiusMeters = 45_000;
  static readonly maxAcceptableAccuracyMeters = 5_000;
  static readonly earlySuccessAccuracyMeters = 150;
  static readonly settleTimeoutMs = 8_000;
  static readonly watchOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10_000,
    maximumAge: 0,
  };
}

export class GeoDistanceConfig {
  static readonly earthRadiusMeters = 6_371_000;
  static readonly degreesPerHalfCircle = 180;
  static readonly haversineMultiplier = 2;
  static readonly kilometerThresholdMeters = 1000;
  static readonly kilometerFractionDigits = 1;
}
