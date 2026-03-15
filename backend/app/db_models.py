from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="demo", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    feeds: Mapped[list["Feed"]] = relationship(back_populates="user")
    comments: Mapped[list["UserComment"]] = relationship(back_populates="user")
    stamps: Mapped[list["UserStamp"]] = relationship(back_populates="user")


class MapPlace(Base):
    __tablename__ = "map"

    position_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    vibe_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    visit_time: Mapped[str] = mapped_column(String(50), nullable=False)
    route_hint: Mapped[str] = mapped_column(String(255), nullable=False)
    stamp_reward: Mapped[str] = mapped_column(String(120), nullable=False)
    hero_label: Mapped[str] = mapped_column(String(60), nullable=False)
    jam_color: Mapped[str] = mapped_column(String(20), nullable=False)
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    feeds: Mapped[list["Feed"]] = relationship(back_populates="place")
    course_places: Mapped[list["CoursePlace"]] = relationship(back_populates="place")
    stamps: Mapped[list["UserStamp"]] = relationship(back_populates="place")


class Feed(Base):
    __tablename__ = "feed"

    feed_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id"), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    badge: Mapped[str] = mapped_column(String(50), nullable=False, default="잼메이트")
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    place: Mapped["MapPlace"] = relationship(back_populates="feeds")
    user: Mapped["User"] = relationship(back_populates="feeds")
    comments: Mapped[list["UserComment"]] = relationship(back_populates="feed")


class UserComment(Base):
    __tablename__ = "user_comment"

    comment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feed_id: Mapped[int] = mapped_column(ForeignKey("feed.feed_id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id"), nullable=False, index=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("user_comment.comment_id"), nullable=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    feed: Mapped["Feed"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")
    parent: Mapped["UserComment"] = relationship(remote_side=[comment_id])


class Course(Base):
    __tablename__ = "course"

    course_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    duration: Mapped[str] = mapped_column(String(40), nullable=False)
    note: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    course_places: Mapped[list["CoursePlace"]] = relationship(back_populates="course")


class CoursePlace(Base):
    __tablename__ = "course_place"
    __table_args__ = (UniqueConstraint("course_id", "position_id", name="uq_course_place"),)

    course_place_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("course.course_id"), nullable=False)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="course_places")
    place: Mapped["MapPlace"] = relationship(back_populates="course_places")


class UserStamp(Base):
    __tablename__ = "user_stamp"
    __table_args__ = (UniqueConstraint("user_id", "position_id", name="uq_user_stamp"),)

    stamp_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id"), nullable=False, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="stamps")
    place: Mapped["MapPlace"] = relationship(back_populates="stamps")
