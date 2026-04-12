from sqlalchemy.orm import Session

from ..db_models import User


def delete_account(db: Session, user_id: str) -> None:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("?ъ슜???뺣낫瑜?李얠? 紐삵뻽?댁슂.")
    db.delete(user)
    db.commit()

