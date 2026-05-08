import pytest
from app.config import Settings


def test_secrets_default_factory(monkeypatch):
    monkeypatch.delenv("APP_SESSION_SECRET", raising=False)
    monkeypatch.delenv("APP_JWT_SECRET", raising=False)

    settings = Settings(_env_file=None, env="development")
    assert settings.session_secret is not None
    assert len(settings.session_secret) >= 32
    assert settings.jwt_secret is not None
    assert len(settings.jwt_secret) >= 32

    # Subsequent calls should (ideally) get different secrets if they were re-instantiated
    # but here we just check they are not the old hardcoded ones
    assert settings.session_secret != "jamissue-local-session-secret"
    assert settings.jwt_secret != "jamissue-local-jwt-secret"


def test_production_validation_fails_on_insecure_defaults():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(_env_file=None, env="production", session_secret="jamissue-local-session-secret", jwt_secret="secure-jwt")

    with pytest.raises(ValueError, match="APP_JWT_SECRET must be explicitly set"):
        Settings(_env_file=None, env="prod", session_secret="secure-session", jwt_secret="jamissue-local-jwt-secret")


def test_production_validation_passes_on_secure_secrets():
    settings = Settings(
        _env_file=None,
        env="production",
        session_secret="very-secure-session-secret-12345",
        jwt_secret="very-secure-jwt-secret-12345",
    )
    assert settings.session_secret == "very-secure-session-secret-12345"
    assert settings.jwt_secret == "very-secure-jwt-secret-12345"


def test_production_validation_fails_on_empty_secrets():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(_env_file=None, env="staging", session_secret="", jwt_secret="secure-jwt")


def test_production_validation_fails_when_secrets_are_missing(monkeypatch):
    monkeypatch.delenv("APP_SESSION_SECRET", raising=False)
    monkeypatch.delenv("APP_JWT_SECRET", raising=False)

    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(_env_file=None, env="production")


def test_production_validation_accepts_environment_secrets(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("APP_SESSION_SECRET", "secure-session-from-env")
    monkeypatch.setenv("APP_JWT_SECRET", "secure-jwt-from-env")

    settings = Settings(_env_file=None)

    assert settings.session_secret == "secure-session-from-env"
    assert settings.jwt_secret == "secure-jwt-from-env"
