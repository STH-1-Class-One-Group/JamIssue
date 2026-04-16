"""Database configuration helpers for Settings."""

from __future__ import annotations

from sqlalchemy.engine import URL, make_url


def normalize_database_url(database_url: str) -> str:
    raw_url = database_url.strip()
    lowered = raw_url.lower()
    if lowered.startswith("postgres://"):
        return f"postgresql+psycopg://{raw_url[len('postgres://') :]}"
    if lowered.startswith("postgresql://"):
        return f"postgresql+psycopg://{raw_url[len('postgresql://') :]}"
    if lowered.startswith("mysql://"):
        return f"mysql+pymysql://{raw_url[len('mysql://') :]}"
    return raw_url


def build_database_url_object(database_url: str) -> URL | None:
    try:
        return make_url(database_url)
    except Exception:
        return None


def get_database_host(url: URL | None) -> str:
    return url.host or "" if url else ""


def is_sqlite_database(database_url: str) -> bool:
    return database_url.lower().startswith("sqlite")


def is_postgres_database(database_url: str) -> bool:
    return database_url.lower().startswith("postgresql")


def is_mysql_database(database_url: str) -> bool:
    return database_url.lower().startswith("mysql")


def is_supabase_database(host: str) -> bool:
    lowered = host.lower()
    return "supabase.co" in lowered or "pooler.supabase.com" in lowered


def uses_supabase_pooler(host: str, url: URL | None) -> bool:
    lowered = host.lower()
    return lowered.endswith("pooler.supabase.com") or (url.port == 6543 if url else False)


def prefer_sqlalchemy_null_pool(*, env: str, uses_pooler: bool, is_postgres: bool) -> bool:
    return uses_pooler or (env == "worker" and is_postgres)


def database_connect_args(*, is_sqlite: bool) -> dict[str, object]:
    if is_sqlite:
        return {"check_same_thread": False}
    return {}


def database_provider(*, is_supabase: bool, is_postgres: bool, is_mysql: bool, is_sqlite: bool) -> str:
    if is_supabase:
        return "supabase-postgres"
    if is_postgres:
        return "postgresql"
    if is_mysql:
        return "mysql"
    if is_sqlite:
        return "sqlite"
    return "unknown"


def database_display_url(*, url: URL | None, normalized_database_url: str, provider: str, is_sqlite: bool) -> str:
    if not url:
        return provider
    if is_sqlite:
        return normalized_database_url
    return url.render_as_string(hide_password=True)
