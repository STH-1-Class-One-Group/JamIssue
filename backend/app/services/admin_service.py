from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import AdminPlaceOut, AdminSummaryResponse, PlaceVisibilityUpdate, PublicImportResponse
from ..repositories.admin_repository import (
    import_public_bundle_entry,
    read_admin_summary_entry,
    update_admin_place_visibility_entry,
)


def _map_admin_not_found(error: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


def read_admin_summary_service(db: Session, app_settings: Settings) -> AdminSummaryResponse:
    return read_admin_summary_entry(db, app_settings)


def patch_admin_place_service(db: Session, place_id: str, payload: PlaceVisibilityUpdate) -> AdminPlaceOut:
    try:
        return update_admin_place_visibility_entry(
            db,
            place_id,
            is_active=payload.is_active,
            is_manual_override=payload.is_manual_override,
        )
    except ValueError as error:
        raise _map_admin_not_found(error) from error


def import_public_data_service(db: Session, app_settings: Settings) -> PublicImportResponse:
    return import_public_bundle_entry(db, app_settings)
