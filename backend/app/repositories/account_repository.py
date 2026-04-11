from sqlalchemy.orm import Session

from ..repository_normalized import delete_account


def delete_account_entry(db: Session, user_id: str) -> None:
    delete_account(db, user_id)
