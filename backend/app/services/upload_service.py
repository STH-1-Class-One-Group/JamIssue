from fastapi import UploadFile

from ..config import Settings
from ..models import SessionUser, UploadResponse
from ..storage import get_review_image_upload_service


async def upload_review_image_service(
    file: UploadFile,
    thumbnail: UploadFile | None,
    session_user: SessionUser,
    app_settings: Settings,
) -> UploadResponse:
    upload_service = get_review_image_upload_service(app_settings)
    raw_bytes = await file.read()
    thumbnail_raw_bytes = await thumbnail.read() if thumbnail else None
    stored_file = upload_service.save_review_image(
        owner_id=session_user.id,
        original_file_name=file.filename,
        content_type=file.content_type,
        raw_bytes=raw_bytes,
        thumbnail_content_type=thumbnail.content_type if thumbnail else None,
        thumbnail_raw_bytes=thumbnail_raw_bytes,
    )
    return UploadResponse(
        url=stored_file.url,
        fileName=stored_file.file_name,
        contentType=stored_file.content_type,
        thumbnailUrl=stored_file.thumbnail_url,
    )
