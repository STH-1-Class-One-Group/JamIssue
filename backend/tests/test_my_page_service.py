from types import SimpleNamespace

import pytest
from fastapi import HTTPException, status

from app.config import Settings
from app.models import SessionUser
from app.repositories.errors import RepositoryNotFoundError
from app.services import my_page_service


def build_session_user() -> SessionUser:
    return SessionUser(
        id="user-1",
        nickname="tester",
        email="tester@example.com",
        provider="kakao",
        profileImage=None,
        isAdmin=False,
        profileCompletedAt=None,
    )


def test_read_my_page_service_maps_missing_user_to_404(monkeypatch):
    def failing_read_my_page(*_args, **_kwargs):
        raise RepositoryNotFoundError("사용자를 찾을 수 없어요.")

    monkeypatch.setattr(my_page_service, "read_my_page_entry", failing_read_my_page)

    with pytest.raises(HTTPException) as caught:
        my_page_service.read_my_page_service(SimpleNamespace(), build_session_user(), Settings())

    assert caught.value.status_code == status.HTTP_404_NOT_FOUND
