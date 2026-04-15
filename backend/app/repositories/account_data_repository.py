from sqlalchemy.orm import Session

from ..db_models import User
from .errors import RepositoryNotFoundError


def delete_account(db: Session, user_id: str) -> None:
    user = db.get(User, user_id)
    if not user:
        raise RepositoryNotFoundError("사용자 정보를 찾지 못했어요.")
    db.delete(user)
    db.commit()
