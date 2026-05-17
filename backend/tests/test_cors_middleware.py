from app.main import app


def test_cors_middleware_restricts_methods_and_headers() -> None:
    cors = next(m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware")

    assert cors.kwargs["allow_credentials"] is True
    assert cors.kwargs["allow_methods"] == ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    assert cors.kwargs["allow_headers"] == ["Content-Type", "Authorization"]
