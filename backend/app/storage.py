"""로컬 파일 시스템과 Supabase Storage를 바꿔 끼울 수 있는 업로드 어댑터입니다."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .config import Settings


@dataclass(slots=True)
class StoredFile:
    """업로드 결과로 외부에 노출할 파일 정보입니다."""

    url: str
    file_name: str
    content_type: str


class LocalStorageAdapter:
    """기존 로컬 업로드 경로에 파일을 저장합니다."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.settings.upload_path.mkdir(parents=True, exist_ok=True)

    def save_review_image(self, *, owner_id: str, file_name: str, content_type: str, raw_bytes: bytes) -> StoredFile:
        target_path = self.settings.upload_path / file_name
        target_path.write_bytes(raw_bytes)
        return StoredFile(
            url=f"{self.settings.upload_base_url}/{file_name}",
            file_name=file_name,
            content_type=content_type,
        )


class SupabaseStorageAdapter:
    """Supabase Storage 버킷에 후기 이미지를 업로드합니다."""

    def __init__(self, settings: Settings):
        self.settings = settings
        if not settings.supabase_configured:
            raise ValueError("Supabase Storage를 쓰려면 APP_SUPABASE_URL 과 인증키가 필요해요.")

    @property
    def auth_token(self) -> str:
        token = self.settings.supabase_service_role_key or self.settings.supabase_anon_key
        if not token:
            raise ValueError("Supabase 인증키가 비어 있어요.")
        return token

    def build_object_path(self, owner_id: str, file_name: str) -> str:
        """Supabase Storage 내부 경로를 구성합니다.
        
        경로 규칙: reviews/{안전한_user_id}/{file_name}
        - user_id 예: "naver:0123456789" → "naver_0123456789" (콜론을 언더스코어로 변환)
        - 목적: 사용자별 후기 이미지 폴더 분리, 중복 제거 방지
        """
        safe_owner = owner_id.replace(":", "_")
        return f"reviews/{safe_owner}/{file_name}"

    def build_public_url(self, object_path: str) -> str:
        """Supabase Storage 파일의 공개 URL을 구성합니다.
        
        2가지 방식:
        1) APP_SUPABASE_STORAGE_PUBLIC_BASE_URL이 설정되면, 그 기반 URL 사용
           → CDN URL이나 커스텀 도메인 (예: "https://cdn.example.com/supabase")
        2) 없으면 Supabase 표준 공개 URL
           → "https://{project-id}.supabase.co/storage/v1/object/public/{bucket}/{path}"
        
        호출처: save_review_image 마지막에 StoredFile.url로 반환
        """
        if self.settings.supabase_storage_public_base_url:
            base_url = self.settings.supabase_storage_public_base_url.rstrip("/")
            return f"{base_url}/{quote(object_path)}"

        return (
            f"{self.settings.supabase_url.rstrip('/')}/storage/v1/object/public/"
            f"{self.settings.supabase_storage_bucket}/{quote(object_path)}"
        )

    def save_review_image(self, *, owner_id: str, file_name: str, content_type: str, raw_bytes: bytes) -> StoredFile:
        """사용자가 리뷰 작성 시 첨부한 이미지를 Supabase Storage에 업로드합니다.
        
        API 흐름:
        1) build_object_path로 저장 경로 구성 (reviews/{user_id}/{file_name})
        2) Supabase Storage v1 object 엔드포인트로 POST 요청
           - Authorization: Bearer {service_role_key 또는 anon_key}
           - x-upsert: false (기존 파일 덮어쓰기 차단)
           - Content-Type: image/jpeg, image/png 등
        3) 성공 시: build_public_url로 공개 URL 생성
        4) 실패 시: HTTPError 또는 URLError 예외 발생
        
        반환: StoredFile (url, file_name, content_type)
        호출처: main.py POST /reviews (image_url 필드 설정)
        """
        object_path = self.build_object_path(owner_id, file_name)
        upload_url = (
            f"{self.settings.supabase_url.rstrip('/')}/storage/v1/object/"
            f"{self.settings.supabase_storage_bucket}/{quote(object_path)}"
        )
        request = Request(
            upload_url,
            data=raw_bytes,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.auth_token}",
                "apikey": self.auth_token,
                "Content-Type": content_type,
                "x-upsert": "false",
            },
        )

        try:
            with urlopen(request) as response:
                response.read()
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="ignore")
            raise ValueError(f"Supabase Storage 업로드에 실패했어요. ({error.code}) {detail}".strip()) from error
        except URLError as error:
            raise ValueError("Supabase Storage에 연결하지 못했어요.") from error

        return StoredFile(
            url=self.build_public_url(object_path),
            file_name=file_name,
            content_type=content_type,
        )


def get_storage_adapter(settings: Settings):
    """환경 설정에 맞는 스토리지 어댑터를 반환합니다."""

    if settings.storage_backend == "supabase":
        return SupabaseStorageAdapter(settings)
    return LocalStorageAdapter(settings)
