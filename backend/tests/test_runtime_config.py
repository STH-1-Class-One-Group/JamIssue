from datetime import timedelta

from app.config import Settings
from app.runtime_config import (
    FastApiAuthRuntimeConfig,
    FastApiNotificationRuntimeConfig,
    FastApiPublicDataRuntimeConfig,
    FastApiRouteRuntimeConfig,
    FastApiStampRuntimeConfig,
    FastApiUploadRuntimeConfig,
)


def test_fastapi_runtime_config_preserves_settings_defaults():
    settings = Settings(env="development")

    assert settings.jwt_access_token_minutes == 60 * 24 * 14
    assert settings.public_data_request_timeout_seconds == 3.0
    assert settings.public_event_request_timeout_seconds == 3.0
    assert settings.public_event_refresh_minutes == 360
    assert settings.public_event_limit == 6
    assert settings.max_upload_size_bytes == 5 * 1024 * 1024
    assert settings.stamp_unlock_radius_meters == 120


def test_fastapi_runtime_config_preserves_auth_defaults():
    assert FastApiAuthRuntimeConfig.default_secret_token_urlsafe_bytes == 32
    assert FastApiAuthRuntimeConfig.default_jwt_access_token_minutes == 60 * 24 * 14
    assert FastApiAuthRuntimeConfig.session_middleware_max_age_seconds == 60 * 60
    assert FastApiAuthRuntimeConfig.oauth_state_token_urlsafe_bytes == 24
    assert FastApiAuthRuntimeConfig.oauth_http_timeout_seconds == 10


def test_fastapi_runtime_config_preserves_public_data_defaults():
    assert FastApiPublicDataRuntimeConfig.request_timeout_seconds == 3.0
    assert FastApiPublicDataRuntimeConfig.event_refresh_minutes == 360
    assert FastApiPublicDataRuntimeConfig.event_limit == 6
    assert (
        timedelta(
            hours=FastApiPublicDataRuntimeConfig.end_of_day_hour,
            minutes=FastApiPublicDataRuntimeConfig.end_of_day_minute,
            seconds=FastApiPublicDataRuntimeConfig.end_of_day_second,
        )
        == timedelta(hours=23, minutes=59, seconds=59)
    )


def test_fastapi_runtime_config_preserves_domain_limits():
    assert FastApiUploadRuntimeConfig.max_upload_size_bytes == 5 * 1024 * 1024
    assert FastApiStampRuntimeConfig.default_unlock_radius_meters == 120
    assert FastApiStampRuntimeConfig.earth_radius_meters == 6_371_000
    assert FastApiStampRuntimeConfig.travel_session_gap_hours == 24
    assert FastApiRouteRuntimeConfig.min_route_place_count == 2
    assert FastApiRouteRuntimeConfig.max_route_place_count == 6
    assert FastApiNotificationRuntimeConfig.user_notification_list_limit == 50
    assert FastApiNotificationRuntimeConfig.sse_heartbeat_timeout_seconds == 15
