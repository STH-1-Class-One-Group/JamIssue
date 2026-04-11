from sqlalchemy.orm import Session

from ..models import NotificationDeleteResponse, NotificationReadResponse, UserNotificationOut
from ..repository_normalized import (
    delete_notification,
    get_unread_notification_count,
    list_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


def list_user_notification_entries(db: Session, user_id: str) -> list[UserNotificationOut]:
    return list_user_notifications(db, user_id)


def mark_notification_read_entry(db: Session, notification_id: str, user_id: str) -> NotificationReadResponse:
    return mark_notification_read(db, notification_id, user_id)


def mark_all_notifications_read_entry(db: Session, user_id: str) -> int:
    return mark_all_notifications_read(db, user_id)


def delete_notification_entry(db: Session, notification_id: str, user_id: str) -> NotificationDeleteResponse:
    return delete_notification(db, notification_id, user_id)


def read_unread_notification_count(db: Session, user_id: str) -> int:
    return get_unread_notification_count(db, user_id)
