from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import NotificationDeleteResponse, NotificationReadResponse, SessionUser, UserNotificationOut
from ..notification_broker import notification_broker
from ..repositories.errors import RepositoryNotFoundError, RepositoryValidationError
from ..repositories.notification_repository import (
    delete_notification_entry,
    list_user_notification_entries,
    mark_all_notifications_read_entry,
    mark_notification_read_entry,
    read_unread_notification_count,
)


def _map_notification_not_found(error: RepositoryNotFoundError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


def _map_notification_validation_error(error: RepositoryValidationError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


def _publish_notification_event(user_id: str, payload: dict[str, object]) -> None:
    notification_broker.publish(user_id, payload)


def read_notifications_service(db: Session, session_user: SessionUser) -> list[UserNotificationOut]:
    return list_user_notification_entries(db, session_user.id)


def mark_notification_read_service(db: Session, notification_id: str, session_user: SessionUser) -> NotificationReadResponse:
    try:
        response = mark_notification_read_entry(db, notification_id, session_user.id)
    except RepositoryValidationError as error:
        raise _map_notification_validation_error(error) from error
    except RepositoryNotFoundError as error:
        raise _map_notification_not_found(error) from error
    unread_count = read_unread_notification_count(db, session_user.id)
    _publish_notification_event(
        session_user.id,
        {
            "event": "notification.read",
            "notificationId": response.notification_id,
            "unreadCount": unread_count,
        },
    )
    return response


def mark_all_notifications_read_service(db: Session, session_user: SessionUser) -> dict[str, int]:
    updated = mark_all_notifications_read_entry(db, session_user.id)
    _publish_notification_event(
        session_user.id,
        {
            "event": "notification.all-read",
            "updated": updated,
            "unreadCount": 0,
        },
    )
    return {"updated": updated}


def delete_notification_service(db: Session, notification_id: str, session_user: SessionUser) -> NotificationDeleteResponse:
    try:
        response = delete_notification_entry(db, notification_id, session_user.id)
    except RepositoryValidationError as error:
        raise _map_notification_validation_error(error) from error
    except RepositoryNotFoundError as error:
        raise _map_notification_not_found(error) from error
    unread_count = read_unread_notification_count(db, session_user.id)
    _publish_notification_event(
        session_user.id,
        {
            "event": "notification.deleted",
            "notificationId": response.notification_id,
            "unreadCount": unread_count,
        },
    )
    return response
