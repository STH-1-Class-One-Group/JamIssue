import { describe, expect, it } from 'vitest';

import {
  ApiCacheConfig,
  AutoLoadMoreConfig,
  FeedbackRuntimeConfig,
  ImageUploadConfig,
  PaginationRuntimeConfig,
} from '../../src/config/runtimeLimitConfig';

describe('runtime limit config', () => {
  it('preserves API cache TTL rules by endpoint prefix', () => {
    expect(ApiCacheConfig.getTtlForPath('/api/festivals')).toBe(30 * 60 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/banner/events/current')).toBe(30 * 60 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/courses/curated')).toBe(60 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/map-bootstrap')).toBe(20 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/community-routes')).toBe(20 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/reviews')).toBe(10 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/my/summary')).toBe(10 * 1000);
    expect(ApiCacheConfig.getTtlForPath('/api/places')).toBe(15 * 1000);
  });

  it('preserves review image upload compression limits', () => {
    expect(ImageUploadConfig.main).toEqual({
      maxDimension: 1600,
      maxBytes: 1_000_000,
      minDimensionAfterResize: 960,
    });
    expect(ImageUploadConfig.thumbnail).toEqual({
      maxDimension: 480,
      maxBytes: 120_000,
      minDimensionAfterResize: 320,
    });
    expect(ImageUploadConfig.jpegQuality).toEqual({
      initial: 0.84,
      min: 0.58,
      step: 0.08,
    });
    expect(ImageUploadConfig.shrinkScale).toBe(0.75);
    expect(ImageUploadConfig.jpegMimeType).toBe('image/jpeg');
    expect(ImageUploadConfig.jpegExtension).toBe('jpg');
  });

  it('preserves frontend interaction and pagination limits', () => {
    expect(AutoLoadMoreConfig.defaultRootMargin).toBe('160px 0px');
    expect(AutoLoadMoreConfig.threshold).toBe(0.01);
    expect(FeedbackRuntimeConfig.stampUnlockRadiusMeters).toBe(120);
    expect(FeedbackRuntimeConfig.noticeDismissDelayMs).toBe(4000);
    expect(PaginationRuntimeConfig.pageSize).toBe(10);
  });
});
