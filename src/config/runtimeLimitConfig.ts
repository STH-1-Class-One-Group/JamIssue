export class ApiCacheConfig {
  static readonly secondMs = 1000;
  static readonly minuteMs = 60 * ApiCacheConfig.secondMs;
  static readonly defaultGetTtlMs = 15 * ApiCacheConfig.secondMs;

  static readonly endpointTtlRules = [
    { prefixes: ['/api/festivals', '/api/banner/events'], ttlMs: 30 * ApiCacheConfig.minuteMs },
    { prefixes: ['/api/courses/curated'], ttlMs: ApiCacheConfig.minuteMs },
    { prefixes: ['/api/map-bootstrap', '/api/community-routes'], ttlMs: 20 * ApiCacheConfig.secondMs },
    { prefixes: ['/api/reviews', '/api/my/summary'], ttlMs: 10 * ApiCacheConfig.secondMs },
  ] as const;

  static getTtlForPath(path: string) {
    return ApiCacheConfig.endpointTtlRules.find((rule) =>
      rule.prefixes.some((prefix) => path.startsWith(prefix)),
    )?.ttlMs ?? ApiCacheConfig.defaultGetTtlMs;
  }
}

export class ImageUploadConfig {
  static readonly shrinkScale = 0.75;
  static readonly jpegMimeType = 'image/jpeg';
  static readonly jpegExtension = 'jpg';

  static readonly main = {
    maxDimension: 1600,
    maxBytes: 1_000_000,
    minDimensionAfterResize: 960,
  };

  static readonly thumbnail = {
    maxDimension: 480,
    maxBytes: 120_000,
    minDimensionAfterResize: 320,
  };

  static readonly jpegQuality = {
    initial: 0.84,
    min: 0.58,
    step: 0.08,
  };
}

export class AutoLoadMoreConfig {
  static readonly defaultRootMargin = '160px 0px';
  static readonly threshold = 0.01;
}

export class FeedbackRuntimeConfig {
  static readonly stampUnlockRadiusMeters = 120;
  static readonly noticeDismissDelayMs = 4000;
}

export class PaginationRuntimeConfig {
  static readonly pageSize = 10;
}

export class FloatingBackButtonRuntimeConfig {
  static readonly buttonSizePx = 46;
  static readonly edgePaddingPx = 12;
  static readonly desktopBottomPaddingPx = 120;
  static readonly mobileSheetOffsetPx = 180;
  static readonly touchDragDelayMs = 260;
}
