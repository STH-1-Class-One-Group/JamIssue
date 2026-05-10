export class WorkerTimeConfig {
  static readonly secondMs = 1000;
  static readonly minuteMs = 60 * WorkerTimeConfig.secondMs;
  static readonly hourMs = 60 * WorkerTimeConfig.minuteMs;
  static readonly dayMs = 24 * WorkerTimeConfig.hourMs;
}

export class WorkerSessionRuntimeConfig {
  static readonly sessionCookieName = 'jamissue_worker_session';
  static readonly oauthStateCookieName = 'jamissue_worker_oauth_state';
  static readonly sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
  static readonly oauthStateMaxAgeSeconds = 60 * 10;
}

export class WorkerSupabaseRuntimeConfig {
  static readonly defaultListLimit = 12;
  static readonly maxListLimit = 24;
}

export class WorkerPaginationRuntimeConfig {
  static readonly reviewFeedPageSize = 10;
  static readonly reviewFeedMaxPageSize = 20;
  static readonly myCommentsPageSize = 10;
  static readonly myCommentsMaxPageSize = 20;
}

export class WorkerBaseDataRuntimeConfig {
  static readonly staticBaseCacheTtlMs = 5 * WorkerTimeConfig.minuteMs;
}

export class WorkerFestivalRuntimeConfig {
  static readonly cacheTtlMs = 10 * WorkerTimeConfig.minuteMs;
  static readonly windowMs = 30 * WorkerTimeConfig.dayMs;
  static readonly dbQueryLimit = 100;
  static readonly cardDisplayLimit = 10;
  static readonly bannerQueryLimit = 20;
  static readonly bannerDisplayLimit = 4;
  static readonly externalIdTokenLength = 22;
  static readonly internalSourceKey = 'jamissue-public-event-feed';
  static readonly internalSourceName = 'Daejeon Official Event Search';
  static readonly internalSourceUrl = 'https://www.daejeon.go.kr/fvu/FvuEventList.do?menuSeq=504';
}

export class WorkerNotificationRuntimeConfig {
  static readonly defaultListLimit = 30;
  static readonly myNotificationsListLimit = 50;
}

export class WorkerStampRuntimeConfig {
  static readonly defaultUnlockRadiusMeters = 120;
  static readonly earthRadiusMeters = 6_371_000;
  static readonly metersPerKilometer = 1000;
  static readonly radiansPerDegree = Math.PI / 180;
  static readonly travelSessionGapMs = WorkerTimeConfig.dayMs;
}
