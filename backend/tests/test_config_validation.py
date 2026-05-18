import pytest
from app.config import Settings

def test_secrets_default_factory():
    # In development mode, secrets should be automatically generated if not provided
    settings = Settings(env="development")
    assert settings.session_secret is not None
    assert len(settings.session_secret) >= 32
    assert settings.jwt_secret is not None
    assert len(settings.jwt_secret) >= 32

def test_production_validation_warns_on_missing_secrets():
    # Production mode should warn if secrets are not provided and use random secure secrets
    with pytest.warns(UserWarning, match="APP_SESSION_SECRET is missing"):
        settings = Settings(env="production")
        assert len(settings.session_secret) >= 32
        assert len(settings.jwt_secret) >= 32

def test_production_validation_warns_on_short_or_low_entropy_secrets():
    # Production mode should warn if using short or low entropy insecure secrets
    with pytest.warns(UserWarning, match="APP_SESSION_SECRET is too short or has low entropy"):
        settings = Settings(env="production", session_secret="short-secret", jwt_secret="very-secure-jwt-secret-that-is-long-enough-with-high-entropy")
        assert settings.session_secret != "short-secret"
        assert len(settings.session_secret) >= 32

    # Low entropy test
    low_entropy = "a" * 32
    with pytest.warns(UserWarning, match="APP_JWT_SECRET is too short or has low entropy"):
        settings = Settings(env="prod", session_secret="very-secure-session-secret-that-is-long-enough-with-high-entropy", jwt_secret=low_entropy)
        assert settings.jwt_secret != low_entropy
        assert len(settings.jwt_secret) >= 32

def test_production_validation_passes_on_secure_secrets():
    # Production mode should pass if using secure secrets (>= 32 chars, >= 16 unique chars)
    # 16 unique characters are needed, so let's use a known secure string
    secure_string_1 = "very-secure-session-secret-1234567890"
    secure_string_2 = "very-secure-jwt-secret-1234567890"
    settings = Settings(env="production", session_secret=secure_string_1, jwt_secret=secure_string_2)
    assert settings.session_secret == secure_string_1
    assert settings.jwt_secret == secure_string_2

def test_production_validation_warns_on_empty_secrets():
    with pytest.warns(UserWarning, match="APP_SESSION_SECRET is missing"):
        settings = Settings(env="staging", session_secret="", jwt_secret="very-secure-jwt-secret-that-is-long-enough-with-high-entropy")
        assert len(settings.session_secret) >= 32
