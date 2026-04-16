"""JamIssue backend settings."""

from __future__ import annotations

from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

from .config_database import (
    build_database_url_object,
    database_connect_args,
    database_display_url,
    database_provider,
    get_database_host,
    is_mysql_database,
    is_postgres_database,
    is_sqlite_database,
    is_supabase_database,
    normalize_database_url,
    prefer_sqlalchemy_null_pool,
    uses_supabase_pooler,
)
from .config_paths import resolve_repo_relative_path, split_csv_set, split_csv_values


class Settings(BaseSettings):
    """Environment-backed settings used by the backend."""

    env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8001
    cors_origins: str = "http://localhost:8000,http://127.0.0.1:8000"
    frontend_url: str = "http://localhost:8000"
    session_secret: str = "jamissue-local-session-secret"
    session_https: bool = False
    jwt_secret: str = "jamissue-local-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 60 * 24 * 14
    admin_user_ids: str = ""
    database_url: str = "mysql+pymysql://jamissue:jamissue@127.0.0.1:3306/jamissue?charset=utf8mb4"
    seed_demo_data: bool = False
    cleanup_legacy_demo_data: bool = True
    auto_import_public_data: bool = True
    public_data_path: str = "data/public_bundle.json"
    public_data_source_url: str = ""
    public_data_request_timeout_seconds: float = 3.0
    public_event_path: str = "data/public_events.json"
    public_event_source_url: str = ""
    public_event_request_timeout_seconds: float = 3.0
    public_event_service_key: str = ""
    public_event_city_keyword: str = "대전"
    public_event_refresh_minutes: int = 360
    public_event_limit: int = 6
    storage_backend: Literal["local", "supabase"] = "local"
    upload_dir: str = "storage/uploads"
    upload_base_url: str = "/uploads"
    max_upload_size_bytes: int = 5 * 1024 * 1024
    stamp_unlock_radius_meters: int = 120
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "review-images"
    supabase_storage_public_base_url: str = ""
    naver_login_client_id: str = ""
    naver_login_client_secret: str = ""
    naver_login_callback_url: str = "http://localhost:8000/api/auth/naver/callback"
    kakao_login_client_id: str = ""
    kakao_login_client_secret: str = ""
    kakao_login_callback_url: str = "http://localhost:8000/api/auth/kakao/callback"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def backend_dir(self) -> Path:
        return Path(__file__).resolve().parents[1]

    @property
    def repo_dir(self) -> Path:
        return self.backend_dir.parent

    @property
    def cors_origin_list(self) -> list[str]:
        return split_csv_values(self.cors_origins)

    @property
    def admin_user_id_set(self) -> set[str]:
        return split_csv_set(self.admin_user_ids)

    @property
    def upload_path(self) -> Path:
        return resolve_repo_relative_path(backend_dir=self.backend_dir, raw_path=self.upload_dir)

    @property
    def storage_target_label(self) -> str:
        if self.storage_backend == "supabase":
            return f"supabase://{self.supabase_storage_bucket}"
        return str(self.upload_path)

    @property
    def public_data_file_path(self) -> Path:
        return resolve_repo_relative_path(backend_dir=self.backend_dir, raw_path=self.public_data_path)

    @property
    def public_event_file_path(self) -> Path:
        return resolve_repo_relative_path(backend_dir=self.backend_dir, raw_path=self.public_event_path)

    @property
    def normalized_database_url(self) -> str:
        return normalize_database_url(self.database_url)

    @property
    def database_url_object(self) -> URL | None:
        return build_database_url_object(self.normalized_database_url)

    @property
    def database_host(self) -> str:
        return get_database_host(self.database_url_object)

    @property
    def is_sqlite_database(self) -> bool:
        return is_sqlite_database(self.normalized_database_url)

    @property
    def is_postgres_database(self) -> bool:
        return is_postgres_database(self.normalized_database_url)

    @property
    def is_mysql_database(self) -> bool:
        return is_mysql_database(self.normalized_database_url)

    @property
    def is_supabase_database(self) -> bool:
        return is_supabase_database(self.database_host)

    @property
    def uses_supabase_pooler(self) -> bool:
        return uses_supabase_pooler(self.database_host, self.database_url_object)

    @property
    def prefer_sqlalchemy_null_pool(self) -> bool:
        return prefer_sqlalchemy_null_pool(
            env=self.env,
            uses_pooler=self.uses_supabase_pooler,
            is_postgres=self.is_postgres_database,
        )

    @property
    def database_connect_args(self) -> dict[str, object]:
        return database_connect_args(is_sqlite=self.is_sqlite_database)

    @property
    def database_provider(self) -> str:
        return database_provider(
            is_supabase=self.is_supabase_database,
            is_postgres=self.is_postgres_database,
            is_mysql=self.is_mysql_database,
            is_sqlite=self.is_sqlite_database,
        )

    @property
    def database_display_url(self) -> str:
        return database_display_url(
            url=self.database_url_object,
            normalized_database_url=self.normalized_database_url,
            provider=self.database_provider,
            is_sqlite=self.is_sqlite_database,
        )

    @property
    def storage_provider(self) -> str:
        return self.storage_backend

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and (self.supabase_service_role_key or self.supabase_anon_key))

    def is_admin(self, user_id: str | None) -> bool:
        if not user_id:
            return False
        return user_id in self.admin_user_id_set

    def provider_enabled(self, provider: str) -> bool:
        mapping = {
            "naver": bool(self.naver_login_client_id and self.naver_login_client_secret),
            "kakao": bool(self.kakao_login_client_id and self.kakao_login_client_secret),
        }
        return mapping.get(provider, False)

    @property
    def access_token_expires_delta(self) -> timedelta:
        return timedelta(minutes=self.jwt_access_token_minutes)

    @property
    def access_token_max_age_seconds(self) -> int:
        return int(self.access_token_expires_delta.total_seconds())

    @property
    def auth_cookie_secure(self) -> bool:
        lowered = self.env.strip().lower()
        if lowered in {"development", "dev", "local", "test"}:
            return False
        return bool(self.session_https or lowered in {"production", "prod", "staging"})


@lru_cache
def get_settings() -> Settings:
    return Settings()
