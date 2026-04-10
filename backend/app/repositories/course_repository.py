from sqlalchemy.orm import Session

from ..models import CourseMood
from ..repository_normalized import list_courses


def list_course_entries(db: Session, mood: CourseMood | None):
    return list_courses(db, mood)
