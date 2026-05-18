import pytest
from app.config import Settings

def test_secrets_default_factory():
    # In development mode, secrets should be automatically generated if not provided
    settings = Settings(env="development")
    assert settings.session_secret is not None
    assert len(settings.session_secret) >= 32
    assert settings.jwt_secret is not None
    assert len(settings.jwt_secret) >= 32

def test_production_validation_fails_on_missing_secrets():
    # Production mode should fail if secrets are not provided
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set to a secure value of at least 32 characters in production"):
        Settings(env="production")

def test_production_validation_fails_on_short_secrets():
    # Production mode should fail if using short insecure secrets
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set to a secure value of at least 32 characters in production"):
        Settings(env="production", session_secret="short-session-secret", jwt_secret="very-secure-jwt-secret-that-is-long-enough")

    with pytest.raises(ValueError, match="APP_JWT_SECRET must be explicitly set to a secure value of at least 32 characters in production"):
        Settings(env="prod", session_secret="very-secure-session-secret-that-is-long-enough", jwt_secret="short-jwt")

def test_production_validation_passes_on_secure_secrets():
    # Production mode should pass if using secure secrets (>= 32 chars)
    settings = Settings(env="production", session_secret="very-secure-session-secret-1234567890", jwt_secret="very-secure-jwt-secret-1234567890")
    assert settings.session_secret == "very-secure-session-secret-1234567890"
    assert settings.jwt_secret == "very-secure-jwt-secret-1234567890"

def test_production_validation_fails_on_empty_secrets():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set to a secure value of at least 32 characters in production"):
        Settings(env="staging", session_secret="", jwt_secret="very-secure-jwt-secret-that-is-long-enough")
