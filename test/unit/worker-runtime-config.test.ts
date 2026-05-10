import { describe, expect, it } from 'vitest';

import {
  WorkerBaseDataRuntimeConfig,
  WorkerFestivalRuntimeConfig,
  WorkerNotificationRuntimeConfig,
  WorkerPaginationRuntimeConfig,
  WorkerSessionRuntimeConfig,
  WorkerStampRuntimeConfig,
  WorkerSupabaseRuntimeConfig,
  WorkerTimeConfig,
} from '../../deploy/api-worker-shell/config/runtime';

describe('Worker runtime config', () => {
  it('preserves shared time units', () => {
    expect(WorkerTimeConfig.secondMs).toBe(1000);
    expect(WorkerTimeConfig.minuteMs).toBe(60 * 1000);
    expect(WorkerTimeConfig.hourMs).toBe(60 * 60 * 1000);
    expect(WorkerTimeConfig.dayMs).toBe(24 * 60 * 60 * 1000);
  });

  it('preserves auth session cookie settings', () => {
    expect(WorkerSessionRuntimeConfig.sessionCookieName).toBe('jamissue_worker_session');
    expect(WorkerSessionRuntimeConfig.oauthStateCookieName).toBe('jamissue_worker_oauth_state');
    expect(WorkerSessionRuntimeConfig.sessionMaxAgeSeconds).toBe(60 * 60 * 24 * 7);
    expect(WorkerSessionRuntimeConfig.oauthStateMaxAgeSeconds).toBe(60 * 10);
  });

  it('preserves list pagination limits', () => {
    expect(WorkerSupabaseRuntimeConfig.defaultListLimit).toBe(12);
    expect(WorkerSupabaseRuntimeConfig.maxListLimit).toBe(24);
    expect(WorkerPaginationRuntimeConfig.reviewFeedPageSize).toBe(10);
    expect(WorkerPaginationRuntimeConfig.reviewFeedMaxPageSize).toBe(20);
    expect(WorkerPaginationRuntimeConfig.myCommentsPageSize).toBe(10);
    expect(WorkerPaginationRuntimeConfig.myCommentsMaxPageSize).toBe(20);
  });

  it('preserves base data cache settings', () => {
    expect(WorkerBaseDataRuntimeConfig.staticBaseCacheTtlMs).toBe(5 * 60 * 1000);
  });

  it('preserves festival runtime settings', () => {
    expect(WorkerFestivalRuntimeConfig.cacheTtlMs).toBe(10 * 60 * 1000);
    expect(WorkerFestivalRuntimeConfig.windowMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(WorkerFestivalRuntimeConfig.dbQueryLimit).toBe(100);
    expect(WorkerFestivalRuntimeConfig.cardDisplayLimit).toBe(10);
    expect(WorkerFestivalRuntimeConfig.bannerQueryLimit).toBe(20);
    expect(WorkerFestivalRuntimeConfig.bannerDisplayLimit).toBe(4);
    expect(WorkerFestivalRuntimeConfig.externalIdTokenLength).toBe(22);
    expect(WorkerFestivalRuntimeConfig.internalSourceKey).toBe('jamissue-public-event-feed');
    expect(WorkerFestivalRuntimeConfig.internalSourceName).toBe('Daejeon Official Event Search');
    expect(WorkerFestivalRuntimeConfig.internalSourceUrl).toBe('https://www.daejeon.go.kr/fvu/FvuEventList.do?menuSeq=504');
  });

  it('preserves notification runtime limits', () => {
    expect(WorkerNotificationRuntimeConfig.defaultListLimit).toBe(30);
    expect(WorkerNotificationRuntimeConfig.myNotificationsListLimit).toBe(50);
  });

  it('preserves stamp runtime limits and geometry constants', () => {
    expect(WorkerStampRuntimeConfig.defaultUnlockRadiusMeters).toBe(120);
    expect(WorkerStampRuntimeConfig.earthRadiusMeters).toBe(6_371_000);
    expect(WorkerStampRuntimeConfig.metersPerKilometer).toBe(1000);
    expect(WorkerStampRuntimeConfig.radiansPerDegree).toBe(Math.PI / 180);
    expect(WorkerStampRuntimeConfig.travelSessionGapMs).toBe(24 * 60 * 60 * 1000);
  });
});
