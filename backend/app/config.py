"""?깆꽌踰꾩뿉???곕뒗 ?섍꼍 ?ㅼ젙怨?寃쎈줈 怨꾩궛???뺤쓽?⑸땲??"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """FastAPI ?깆씠 ?쎈뒗 ?섍꼍 蹂?섏? ?뚯깮 ?ㅼ젙??愿由ы빀?덈떎."""

    env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8001
    cors_origins: str = "http://localhost:8000,http://127.0.0.1:8000"
    frontend_url: str = "http://localhost:8000"
    session_secret: str = "jamissue-local-session-secret"
    session_https: bool = False
    jwt_secret: str = "jamissue-local-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 60 * 24 * 14
    admin_user_ids: str = ""
    database_url: str = "mysql+pymysql://jamissue:jamissue@127.0.0.1:3306/jamissue?charset=utf8mb4"
    seed_demo_data: bool = False
    cleanup_legacy_demo_data: bool = True
    auto_import_public_data: bool = True
    public_data_path: str = "data/public_bundle.json"
    public_data_source_url: str = ""
    upload_dir: str = "storage/uploads"
    upload_base_url: str = "/uploads"
    max_upload_size_bytes: int = 5 * 1024 * 1024
    stamp_unlock_radius_meters: int = 120

    naver_login_client_id: str = ""
    naver_login_client_secret: str = ""
    naver_login_callback_url: str = "http://localhost:8000/api/auth/naver/callback"

    google_login_client_id: str = ""
    google_login_client_secret: str = ""
    google_login_callback_url: str = "http://localhost:8000/api/auth/google/callback"

    kakao_login_client_id: str = ""
    kakao_login_client_secret: str = ""
    kakao_login_callback_url: str = "http://localhost:8000/api/auth/kakao/callback"

    apple_login_client_id: str = ""
    apple_login_client_secret: str = ""
    apple_login_callback_url: str = "http://localhost:8000/api/auth/apple/callback"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def backend_dir(self) -> Path:
        """諛깆뿏??猷⑦듃 ?붾젆?곕━瑜?諛섑솚?⑸땲??"""

        return Path(__file__).resolve().parents[1]

    @property
    def repo_dir(self) -> Path:
        """??μ냼 猷⑦듃 ?붾젆?곕━瑜?諛섑솚?⑸땲??"""

        return self.backend_dir.parent

    @property
    def cors_origin_list(self) -> list[str]:
        """?쇳몴濡?諛쏆? CORS Origin 臾몄옄?댁쓣 由ъ뒪?몃줈 蹂?섑빀?덈떎."""

        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def admin_user_id_set(self) -> set[str]:
        """愿由ъ옄 沅뚰븳??遺?ы븷 ?ъ슜??ID 吏묓빀??諛섑솚?⑸땲??"""

        return {user_id.strip() for user_id in self.admin_user_ids.split(",") if user_id.strip()}

    @property
    def upload_path(self) -> Path:
        """?낅줈???붾젆?곕━瑜??덈? 寃쎈줈濡?怨꾩궛?⑸땲??"""

        raw_path = Path(self.upload_dir)
        return raw_path if raw_path.is_absolute() else (self.backend_dir / raw_path).resolve()

    @property
    def public_data_file_path(self) -> Path:
        """怨듦났 ?곗씠??JSON ?뚯씪 寃쎈줈瑜??덈? 寃쎈줈濡?怨꾩궛?⑸땲??"""

        raw_path = Path(self.public_data_path)
        return raw_path if raw_path.is_absolute() else (self.backend_dir / raw_path).resolve()

    def is_admin(self, user_id: str | None) -> bool:
        """?꾩옱 ?ъ슜?먭? 愿由ъ옄 沅뚰븳 ??곸씤吏 ?먮퀎?⑸땲??"""

        if not user_id:
            return False
        return user_id in self.admin_user_id_set

    def provider_enabled(self, provider: str) -> bool:
        """濡쒓렇???쒓났?먯쓽 ?섍꼍 蹂?섍? 以鍮꾨릱?붿? ?뺤씤?⑸땲??"""

        mapping = {
            "naver": bool(self.naver_login_client_id and self.naver_login_client_secret),
            "google": bool(self.google_login_client_id and self.google_login_client_secret),
            "kakao": bool(self.kakao_login_client_id and self.kakao_login_client_secret),
            "apple": bool(self.apple_login_client_id and self.apple_login_client_secret),
        }
        return mapping.get(provider, False)


@lru_cache
def get_settings() -> Settings:
    """?ㅼ젙 媛앹껜瑜?罹먯떆?댁꽌 ?ъ궗?⑺빀?덈떎."""

    return Settings()
