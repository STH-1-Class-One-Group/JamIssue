"""Storage backend mounting helpers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import Settings


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
