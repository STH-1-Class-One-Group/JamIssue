"""Named FastAPI runtime defaults and non-env operational constants."""

from __future__ import annotations


class FastApiAuthRuntimeConfig:
    default_secret_token_urlsafe_bytes = 32
    default_jwt_access_token_minutes = 60 * 24 * 14
    session_middleware_max_age_seconds = 60 * 60
    oauth_state_token_urlsafe_bytes = 24
    oauth_http_timeout_seconds = 10


class FastApiPublicDataRuntimeConfig:
    request_timeout_seconds = 3.0
    event_refresh_minutes = 360
    event_limit = 6
    end_of_day_hour = 23
    end_of_day_minute = 59
    end_of_day_second = 59


class FastApiUploadRuntimeConfig:
    max_upload_size_bytes = 5 * 1024 * 1024


class FastApiStampRuntimeConfig:
    default_unlock_radius_meters = 120
    earth_radius_meters = 6_371_000
    travel_session_gap_hours = 24


class FastApiRouteRuntimeConfig:
    min_route_place_count = 2
    max_route_place_count = 6


class FastApiNotificationRuntimeConfig:
    user_notification_list_limit = 50
    sse_heartbeat_timeout_seconds = 15
