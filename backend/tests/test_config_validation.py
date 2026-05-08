import pytest
from app.config import Settings
import secrets

def test_secrets_default_factory():
    # In development mode, secrets should be automatically generated if not provided
    settings = Settings(env="development")
    assert settings.session_secret is not None
    assert len(settings.session_secret) >= 32
    assert settings.jwt_secret is not None
    assert len(settings.jwt_secret) >= 32

    # Subsequent calls should (ideally) get different secrets if they were re-instantiated
    # but here we just check they are not the old hardcoded ones
    assert settings.session_secret != "jamissue-local-session-secret"
    assert settings.jwt_secret != "jamissue-local-jwt-secret"

def test_production_validation_fails_on_missing_secrets():
    # Production mode should fail if secrets are not provided
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(env="production")

def test_production_validation_fails_on_insecure_defaults():
    # Production mode should fail if using old insecure defaults
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(env="production", session_secret="jamissue-local-session-secret", jwt_secret="secure-jwt")

    with pytest.raises(ValueError, match="APP_JWT_SECRET must be explicitly set"):
        Settings(env="prod", session_secret="secure-session", jwt_secret="jamissue-local-jwt-secret")

def test_production_validation_passes_on_secure_secrets():
    # Production mode should pass if using secure secrets
    settings = Settings(env="production", session_secret="very-secure-session-secret-12345", jwt_secret="very-secure-jwt-secret-12345")
    assert settings.session_secret == "very-secure-session-secret-12345"
    assert settings.jwt_secret == "very-secure-jwt-secret-12345"

def test_production_validation_fails_on_empty_secrets():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set"):
        Settings(env="staging", session_secret="", jwt_secret="secure-jwt")
