from fastapi import HTTPException

from app.repositories.errors import RepositoryNotFoundError
from app.services import account_service


def test_delete_my_account_service_uses_repository_entry(monkeypatch):
    calls = []
    monkeypatch.setattr(account_service, "delete_account_entry", lambda db, user_id: calls.append((db, user_id)))

    account_service.delete_my_account_service("db-session", "user-1")

    assert calls == [("db-session", "user-1")]


def test_delete_my_account_service_maps_value_error(monkeypatch):
    monkeypatch.setattr(
        account_service,
        "delete_account_entry",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RepositoryNotFoundError("missing")),
    )

    try:
        account_service.delete_my_account_service("db-session", "user-1")
    except HTTPException as error:
        assert error.status_code == 404
        assert error.detail == "사용자 정보를 찾지 못했어요."
    else:
        raise AssertionError("Expected HTTPException")
