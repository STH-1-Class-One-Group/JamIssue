"""SQLAlchemy 엔진과 세션 팩토리를 구성합니다."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    """모든 ORM 모델이 상속하는 기본 선언형 베이스입니다."""


settings = get_settings()

engine_options: dict[str, object] = {"future": True}
connect_args: dict[str, object] = {}

if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_options["pool_pre_ping"] = True
    engine_options["pool_recycle"] = 3600

if connect_args:
    engine_options["connect_args"] = connect_args

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """요청 단위 데이터베이스 세션을 열고 닫습니다."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
