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
    settings = Settings(env="production", session_secret="Very-secure-session-secret-1234567890", jwt_secret="Very-secure-jwt-secret-1234567890")
    assert settings.session_secret == "Very-secure-session-secret-1234567890"
    assert settings.jwt_secret == "Very-secure-jwt-secret-1234567890"

def test_production_validation_fails_on_empty_secrets():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must be explicitly set to a secure value of at least 32 characters in production"):
        Settings(env="staging", session_secret="", jwt_secret="very-secure-jwt-secret-that-is-long-enough")

def test_production_validation_fails_on_low_complexity_secrets():
    with pytest.raises(ValueError, match="APP_SESSION_SECRET must include at least 3 of: uppercase, lowercase, digit, special character"):
        Settings(env="production", session_secret="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", jwt_secret="Very-secure-jwt-secret-1234567890")

def test_production_validation_supports_secret_files(tmp_path):
    session_secret_path = tmp_path / "session.secret"
    jwt_secret_path = tmp_path / "jwt.secret"
    session_secret_path.write_text("Very-secure-session-secret-1234567890", encoding="utf-8")
    jwt_secret_path.write_text("Very-secure-jwt-secret-1234567890", encoding="utf-8")

    settings = Settings(
        env="production",
        session_secret_file=str(session_secret_path),
        jwt_secret_file=str(jwt_secret_path),
    )

    assert settings.session_secret == "Very-secure-session-secret-1234567890"
    assert settings.jwt_secret == "Very-secure-jwt-secret-1234567890"
