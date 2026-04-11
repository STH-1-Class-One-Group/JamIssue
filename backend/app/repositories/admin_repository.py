from sqlalchemy.orm import Session

from ..config import Settings
from ..models import AdminPlaceOut, AdminSummaryResponse, PublicImportResponse
from ..repository_normalized import get_admin_summary, import_public_bundle, update_place_visibility


def read_admin_summary_entry(db: Session, app_settings: Settings) -> AdminSummaryResponse:
    return get_admin_summary(db, app_settings)


def update_admin_place_visibility_entry(
    db: Session,
    place_id: str,
    *,
    is_active: bool | None,
    is_manual_override: bool | None,
) -> AdminPlaceOut:
    return update_place_visibility(
        db,
        place_id,
        is_active=is_active,
        is_manual_override=is_manual_override,
    )


def import_public_bundle_entry(db: Session, app_settings: Settings) -> PublicImportResponse:
    return import_public_bundle(db, app_settings)
