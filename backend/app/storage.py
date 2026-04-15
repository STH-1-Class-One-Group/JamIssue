"""Storage adapters and review image upload validation."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import Settings


class UploadValidationError(ValueError):
    """Base class for upload validation failures."""


class InvalidFileTypeError(UploadValidationError):
    pass


class FileTooLargeError(UploadValidationError):
    pass


class StorageConfigurationError(ValueError):
    pass


class StorageUploadError(ValueError):
    pass


@dataclass(slots=True)
class StoredFile:
    url: str
    file_name: str
    content_type: str
    thumbnail_url: str | None = None
    thumbnail_file_name: str | None = None
    thumbnail_content_type: str | None = None


def build_review_thumbnail_file_name(file_name: str) -> str:
    path = Path(file_name)
    suffix = path.suffix.lower() or ".jpg"
    stem = path.stem.removesuffix("-orig")
    return f"{stem}-thumb{suffix}"


def derive_review_thumbnail_url(image_url: str | None) -> str | None:
    if not image_url or "-orig." not in image_url:
        return None
    head, tail = image_url.rsplit("-orig.", 1)
    return f"{head}-thumb.{tail}"


class ImageValidator:
    def __init__(self, settings: Settings):
        self.settings = settings

    def validate(self, *, content_type: str, raw_bytes: bytes) -> None:
        if not content_type.startswith("image/"):
            raise InvalidFileTypeError("이미지 파일만 업로드할 수 있어요.")
        if len(raw_bytes) > self.settings.max_upload_size_bytes:
            raise FileTooLargeError("이미지는 5MB 이하로 올려 주세요.")


class LocalStorageAdapter:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.settings.upload_path.mkdir(parents=True, exist_ok=True)

    def save_review_image(
        self,
        *,
        owner_id: str,
        file_name: str,
        content_type: str,
        raw_bytes: bytes,
        thumbnail_file_name: str | None = None,
        thumbnail_content_type: str | None = None,
        thumbnail_raw_bytes: bytes | None = None,
    ) -> StoredFile:
        target_path = self.settings.upload_path / file_name
        target_path.write_bytes(raw_bytes)

        thumbnail_url: str | None = None
        if thumbnail_file_name and thumbnail_raw_bytes is not None:
            thumbnail_path = self.settings.upload_path / thumbnail_file_name
            thumbnail_path.write_bytes(thumbnail_raw_bytes)
            thumbnail_url = f"{self.settings.upload_base_url}/{thumbnail_file_name}"

        return StoredFile(
            url=f"{self.settings.upload_base_url}/{file_name}",
            file_name=file_name,
            content_type=content_type,
            thumbnail_url=thumbnail_url,
            thumbnail_file_name=thumbnail_file_name,
            thumbnail_content_type=thumbnail_content_type,
        )


class SupabaseStorageAdapter:
    def __init__(self, settings: Settings):
        self.settings = settings
        if not settings.supabase_configured:
            raise StorageConfigurationError("Supabase Storage를 쓰려면 APP_SUPABASE_URL과 인증키가 필요해요.")

    @property
    def auth_token(self) -> str:
        token = self.settings.supabase_service_role_key or self.settings.supabase_anon_key
        if not token:
            raise StorageConfigurationError("Supabase 인증키가 비어 있어요.")
        return token

    def build_object_path(self, owner_id: str, file_name: str) -> str:
        safe_owner = owner_id.replace(":", "_")
        return f"reviews/{safe_owner}/{file_name}"

    def build_public_url(self, object_path: str) -> str:
        if self.settings.supabase_storage_public_base_url:
            base_url = self.settings.supabase_storage_public_base_url.rstrip("/")
            return f"{base_url}/{quote(object_path)}"
        return (
            f"{self.settings.supabase_url.rstrip('/')}"
            f"/storage/v1/object/public/{self.settings.supabase_storage_bucket}/{quote(object_path)}"
        )

    def upload_object(self, *, object_path: str, content_type: str, raw_bytes: bytes) -> None:
        upload_url = (
            f"{self.settings.supabase_url.rstrip('/')}"
            f"/storage/v1/object/{self.settings.supabase_storage_bucket}/{quote(object_path)}"
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
            raise StorageUploadError(f"Supabase Storage 업로드에 실패했어요. ({error.code}) {detail}".strip()) from error
        except URLError as error:
            raise StorageUploadError("Supabase Storage에 연결하지 못했어요.") from error

    def save_review_image(
        self,
        *,
        owner_id: str,
        file_name: str,
        content_type: str,
        raw_bytes: bytes,
        thumbnail_file_name: str | None = None,
        thumbnail_content_type: str | None = None,
        thumbnail_raw_bytes: bytes | None = None,
    ) -> StoredFile:
        object_path = self.build_object_path(owner_id, file_name)
        self.upload_object(object_path=object_path, content_type=content_type, raw_bytes=raw_bytes)

        thumbnail_url: str | None = None
        if thumbnail_file_name and thumbnail_content_type and thumbnail_raw_bytes is not None:
            thumbnail_object_path = self.build_object_path(owner_id, thumbnail_file_name)
            self.upload_object(
                object_path=thumbnail_object_path,
                content_type=thumbnail_content_type,
                raw_bytes=thumbnail_raw_bytes,
            )
            thumbnail_url = self.build_public_url(thumbnail_object_path)

        return StoredFile(
            url=self.build_public_url(object_path),
            file_name=file_name,
            content_type=content_type,
            thumbnail_url=thumbnail_url,
            thumbnail_file_name=thumbnail_file_name,
            thumbnail_content_type=thumbnail_content_type,
        )


class ReviewImageUploadService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.validator = ImageValidator(settings)
        self.storage = get_storage_adapter(settings)

    @staticmethod
    def build_review_file_names(owner_id: str, original_file_name: str | None, *, has_thumbnail: bool) -> tuple[str, str | None]:
        extension = Path(original_file_name or "upload.jpg").suffix.lower() or ".jpg"
        prefix = f"{owner_id.replace(':', '_')}-{uuid4().hex}"
        if not has_thumbnail:
            return f"{prefix}{extension}", None
        original_name = f"{prefix}-orig{extension}"
        return original_name, build_review_thumbnail_file_name(original_name)

    def save_review_image(
        self,
        *,
        owner_id: str,
        original_file_name: str | None,
        content_type: str | None,
        raw_bytes: bytes,
        thumbnail_content_type: str | None = None,
        thumbnail_raw_bytes: bytes | None = None,
    ) -> StoredFile:
        normalized_content_type = content_type or "application/octet-stream"
        self.validator.validate(content_type=normalized_content_type, raw_bytes=raw_bytes)

        normalized_thumbnail_content_type = thumbnail_content_type or normalized_content_type
        if thumbnail_raw_bytes is not None:
            self.validator.validate(content_type=normalized_thumbnail_content_type, raw_bytes=thumbnail_raw_bytes)

        file_name, thumbnail_file_name = self.build_review_file_names(
            owner_id,
            original_file_name,
            has_thumbnail=thumbnail_raw_bytes is not None,
        )
        return self.storage.save_review_image(
            owner_id=owner_id,
            file_name=file_name,
            content_type=normalized_content_type,
            raw_bytes=raw_bytes,
            thumbnail_file_name=thumbnail_file_name,
            thumbnail_content_type=normalized_thumbnail_content_type if thumbnail_file_name else None,
            thumbnail_raw_bytes=thumbnail_raw_bytes,
        )


def uses_local_storage(settings: Settings) -> bool:
    return settings.storage_backend == "local"


def prepare_storage_backend(settings: Settings) -> None:
    if uses_local_storage(settings):
        settings.upload_path.mkdir(parents=True, exist_ok=True)


def mount_storage_backend(app: FastAPI, settings: Settings) -> bool:
    if not uses_local_storage(settings):
        return False
    prepare_storage_backend(settings)
    app.mount(settings.upload_base_url, StaticFiles(directory=settings.upload_path), name="uploads")
    return True


def get_storage_adapter(settings: Settings):
    if not uses_local_storage(settings):
        return SupabaseStorageAdapter(settings)
    return LocalStorageAdapter(settings)


def get_review_image_upload_service(settings: Settings) -> ReviewImageUploadService:
    return ReviewImageUploadService(settings)
