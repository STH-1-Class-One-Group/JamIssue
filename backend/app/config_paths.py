"""Path and simple collection helpers for Settings."""

from __future__ import annotations

from pathlib import Path


def split_csv_values(raw_value: str) -> list[str]:
    return [value.strip() for value in raw_value.split(",") if value.strip()]


def split_csv_set(raw_value: str) -> set[str]:
    return set(split_csv_values(raw_value))


def resolve_repo_relative_path(*, backend_dir: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    return path if path.is_absolute() else (backend_dir / path).resolve()
