"""Validation helpers for review image uploads."""

from __future__ import annotations

from .config import Settings
from .storage_core import FileTooLargeError, InvalidFileTypeError


class ImageValidator:
    def __init__(self, settings: Settings):
        self.settings = settings

    def validate(self, *, content_type: str, raw_bytes: bytes) -> None:
        if not content_type.startswith("image/"):
            raise InvalidFileTypeError("이미지 파일만 업로드할 수 있어요.")
        if len(raw_bytes) > self.settings.max_upload_size_bytes:
            raise FileTooLargeError("이미지는 5MB 이하로 올려 주세요.")
