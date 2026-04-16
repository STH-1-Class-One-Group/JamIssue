"""Core storage models and naming helpers."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


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
