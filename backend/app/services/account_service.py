from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..repositories.account_repository import delete_account_entry


def delete_my_account_service(db: Session, user_id: str) -> None:
    try:
        delete_account_entry(db, user_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자 정보를 찾지 못했어요.",
        ) from error
