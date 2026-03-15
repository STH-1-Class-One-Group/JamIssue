"""데이터 조회와 저장, 변환 로직을 담당합니다."""

import json
from collections import defaultdict
from datetime import UTC, datetime
from math import asin, cos, radians, sin, sqrt
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload

from .config import Settings
from .db_models import Course, CoursePlace, Feed, MapPlace, User, UserComment, UserStamp
from .models import (
    AdminPlaceOut,
    AdminSummaryResponse,
    BootstrapResponse,
    CategoryFilter,
    CommentCreate,
    CommentOut,
    CourseMood,
    CourseOut,
    MyPageResponse,
    MyStatsOut,
    PlaceOut,
    PublicImportResponse,
    ReviewCreate,
    ReviewOut,
    SessionUser,
    StampState,
)
from .naver_oauth import NaverProfile

LEGACY_PROVIDERS = ("demo", "seed")
BADGE_BY_MOOD = {
    "\uC124\uB818": "\uCCAB \uBC29\uBB38",
    "\uCE5C\uAD6C\uB791": "\uCE5C\uAD6C \uCD94\uCC9C",
    "\uD63C\uC790\uC11C": "\uB85C\uCEEC \uD0D0\uBC29",
    "\uC57C\uACBD\uD53D": "\uC57C\uACBD \uC131\uACF5",
}


def format_datetime(value: datetime) -> str:
    """화면에 쓰기 쉬운 후기 시간 문자열로 변환합니다."""

    return value.strftime("%m\uC6D4 %d\uC77C %H:%M")


def to_place_out(place: MapPlace) -> PlaceOut:
    """장소 ORM 객체를 API 응답 모델로 변환합니다."""

    return PlaceOut(
        id=place.slug,
        name=place.name,
        district=place.district,
        category=place.category,
        jamColor=place.jam_color,
        accentColor=place.accent_color,
        latitude=place.latitude,
        longitude=place.longitude,
        summary=place.summary,
        description=place.description,
        vibeTags=list(place.vibe_tags or []),
        visitTime=place.visit_time,
        routeHint=place.route_hint,
        stampReward=place.stamp_reward,
        heroLabel=place.hero_label,
    )


def build_comment_tree(comments: list[UserComment]) -> list[CommentOut]:
    """댓글 목록을 부모-자식 트리 구조로 묶습니다."""

    ordered_comments = sorted(comments, key=lambda item: (item.created_at, item.comment_id))
    nodes: dict[int, CommentOut] = {}
    roots: list[CommentOut] = []

    for comment in ordered_comments:
        author_name = comment.user.nickname if comment.user else "\uC54C \uC218 \uC5C6\uB294 \uC0AC\uC6A9\uC790"
        body = "\uC0AD\uC81C\uB41C \uB313\uAE00\uC785\uB2C8\uB2E4." if comment.is_deleted else comment.body
        nodes[comment.comment_id] = CommentOut(
            id=str(comment.comment_id),
            userId=comment.user_id,
            author=author_name,
            body=body,
            parentId=str(comment.parent_id) if comment.parent_id else None,
            isDeleted=comment.is_deleted,
            createdAt=format_datetime(comment.created_at),
            replies=[],
        )

    for comment in ordered_comments:
        node = nodes[comment.comment_id]
        if comment.parent_id and comment.parent_id in nodes:
            nodes[comment.parent_id].replies.append(node)
        else:
            roots.append(node)

    return roots


def to_review_out(feed: Feed) -> ReviewOut:
    """후기 ORM 객체를 응답 모델로 변환합니다."""

    comments = list(feed.comments or [])
    return ReviewOut(
        id=str(feed.feed_id),
        userId=feed.user_id,
        placeId=feed.place.slug,
        placeName=feed.place.name,
        author=feed.user.nickname,
        body=feed.body,
        mood=feed.mood,
        badge=feed.badge,
        visitedAt=format_datetime(feed.created_at),
        imageUrl=feed.image_url,
        commentCount=len(comments),
        comments=build_comment_tree(comments),
    )


def to_course_out(course: Course) -> CourseOut:
    """코스 ORM 객체를 응답 모델로 변환합니다."""

    ordered_places = sorted(course.course_places, key=lambda item: item.stop_order)
    return CourseOut(
        id=course.slug,
        title=course.title,
        mood=course.mood,
        duration=course.duration,
        note=course.note,
        color=course.color,
        placeIds=[item.place.slug for item in ordered_places],
    )


def to_session_user(user: User, is_admin: bool, profile_image: str | None = None) -> SessionUser:
    """사용자 ORM 객체를 세션 응답 모델로 변환합니다."""

    return SessionUser(
        id=user.user_id,
        nickname=user.nickname,
        email=user.email,
        provider=user.provider,
        profileImage=profile_image,
        isAdmin=is_admin,
    )


def to_admin_place_out(place: MapPlace, review_count: int) -> AdminPlaceOut:
    """관리 화면용 장소 요약 객체를 만듭니다."""

    return AdminPlaceOut(
        id=place.slug,
        name=place.name,
        district=place.district,
        category=place.category,
        isActive=place.is_active,
        reviewCount=review_count,
        updatedAt=format_datetime(place.updated_at),
    )


def get_or_create_user(
    db: Session,
    user_id: str,
    nickname: str | None = None,
    *,
    email: str | None = None,
    provider: str = "demo",
) -> User:
    """주어진 사용자 ID로 사용자를 찾거나 새로 만듭니다."""

    user = db.get(User, user_id)
    if not user:
        user = User(
            user_id=user_id,
            nickname=nickname or user_id,
            email=email,
            provider=provider,
            created_at=datetime.now(UTC).replace(tzinfo=None),
            updated_at=datetime.now(UTC).replace(tzinfo=None),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    dirty = False
    if nickname and user.nickname != nickname:
        user.nickname = nickname
        dirty = True
    if email is not None and user.email != email:
        user.email = email
        dirty = True
    if provider and user.provider != provider:
        user.provider = provider
        dirty = True

    if dirty:
        user.updated_at = datetime.now(UTC).replace(tzinfo=None)
        db.commit()
        db.refresh(user)

    return user


def upsert_naver_user(db: Session, profile: NaverProfile) -> User:
    """네이버 프로필을 기준으로 사용자를 갱신하거나 생성합니다."""

    nickname = profile.nickname or profile.name or "이름 없음"
    return get_or_create_user(
        db,
        user_id=f"naver:{profile.id}",
        nickname=nickname,
        email=profile.email,
        provider="naver",
    )


def calculate_distance_meters(
    start_latitude: float,
    start_longitude: float,
    end_latitude: float,
    end_longitude: float,
) -> float:
    """두 좌표 사이의 거리를 미터 단위로 계산합니다."""

    earth_radius_meters = 6_371_000
    latitude_delta = radians(end_latitude - start_latitude)
    longitude_delta = radians(end_longitude - start_longitude)
    start_latitude_radians = radians(start_latitude)
    end_latitude_radians = radians(end_latitude)

    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(start_latitude_radians) * cos(end_latitude_radians) * sin(longitude_delta / 2) ** 2
    )
    arc = 2 * asin(sqrt(haversine))
    return earth_radius_meters * arc


def ensure_stamp_can_be_collected(
    place: MapPlace,
    current_latitude: float,
    current_longitude: float,
    radius_meters: int,
) -> None:
    """현재 위치가 스탬프 적립 반경 안인지 검증합니다."""

    distance_meters = calculate_distance_meters(
        current_latitude,
        current_longitude,
        place.latitude,
        place.longitude,
    )

    if distance_meters > radius_meters:
        raise PermissionError(
            f"{place.name} 현장 반경 {radius_meters}m 안에 도착해야 스탬프를 받을 수 있어요. 현재 약 {round(distance_meters)}m 떨어져 있어요."
        )


def list_places(db: Session, category: CategoryFilter = "all") -> list[PlaceOut]:
    """공개된 장소 목록을 카테고리 기준으로 반환합니다."""

    stmt = select(MapPlace).where(MapPlace.is_active.is_(True)).order_by(MapPlace.name.asc())
    if category != "all":
        stmt = stmt.where(MapPlace.category == category)

    return [to_place_out(place) for place in db.scalars(stmt).all()]


def get_place(db: Session, place_id: str) -> PlaceOut:
    """단일 장소 정보를 반환합니다."""

    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")
    return to_place_out(place)


def list_reviews(db: Session, place_id: str | None = None, user_id: str | None = None) -> list[ReviewOut]:
    """장소나 사용자 기준으로 후기 목록을 반환합니다."""

    stmt = (
        select(Feed)
        .options(
            joinedload(Feed.user),
            joinedload(Feed.place),
            joinedload(Feed.comments).joinedload(UserComment.user),
        )
        .order_by(Feed.created_at.desc(), Feed.feed_id.desc())
    )
    if place_id:
        stmt = stmt.join(Feed.place).where(MapPlace.slug == place_id)
    if user_id:
        stmt = stmt.where(Feed.user_id == user_id)

    feeds = db.scalars(stmt).unique().all()
    return [to_review_out(feed) for feed in feeds]


def get_review_comments(db: Session, review_id: str) -> list[CommentOut]:
    """하나의 후기에 달린 댓글 트리를 반환합니다."""

    review_key = parse_review_id(review_id)
    comments = db.scalars(
        select(UserComment)
        .options(joinedload(UserComment.user))
        .where(UserComment.feed_id == review_key)
        .order_by(UserComment.created_at.asc(), UserComment.comment_id.asc())
    ).unique().all()
    return build_comment_tree(comments)


def create_review(db: Session, payload: ReviewCreate, user_id: str, nickname: str) -> ReviewOut:
    """후기를 저장하고 응답 모델로 다시 읽어옵니다."""

    body = payload.body.strip()
    if not body:
        raise ValueError("후기는 한 줄 이상 입력해 주세요.")

    place = db.scalars(select(MapPlace).where(MapPlace.slug == payload.place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    user = get_or_create_user(db, user_id, nickname)
    now = datetime.now(UTC).replace(tzinfo=None)
    feed = Feed(
        position_id=place.position_id,
        user_id=user.user_id,
        body=body,
        mood=payload.mood,
        badge=BADGE_BY_MOOD.get(payload.mood, "현장 기록"),
        image_url=payload.image_url,
        created_at=now,
        updated_at=now,
    )
    db.add(feed)
    db.commit()

    stored_feed = db.scalars(
        select(Feed)
        .options(
            joinedload(Feed.user),
            joinedload(Feed.place),
            joinedload(Feed.comments).joinedload(UserComment.user),
        )
        .where(Feed.feed_id == feed.feed_id)
    ).unique().one()
    return to_review_out(stored_feed)


def create_comment(db: Session, review_id: str, payload: CommentCreate, user_id: str, nickname: str) -> list[CommentOut]:
    """댓글 또는 답글을 저장한 뒤 최신 트리를 반환합니다."""

    body = payload.body.strip()
    if not body:
        raise ValueError("댓글 내용을 입력해 주세요.")

    review_key = parse_review_id(review_id)
    feed = db.get(Feed, review_key)
    if not feed:
        raise ValueError("장소를 찾을 수 없어요.")

    parent_id: int | None = None
    if payload.parent_id:
        parent_id = int(payload.parent_id)
        parent = db.get(UserComment, parent_id)
        if not parent or parent.feed_id != review_key:
            raise ValueError("같은 후기 안에 있는 댓글에만 답글을 달 수 있어요.")

    user = get_or_create_user(db, user_id, nickname)
    now = datetime.now(UTC).replace(tzinfo=None)
    comment = UserComment(
        feed_id=review_key,
        user_id=user.user_id,
        parent_id=parent_id,
        body=body,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(comment)
    db.commit()
    return get_review_comments(db, review_id)


def list_courses(db: Session, mood: CourseMood | None = None) -> list[CourseOut]:
    """무드 기준 코스 목록을 반환합니다."""

    stmt = (
        select(Course)
        .options(joinedload(Course.course_places).joinedload(CoursePlace.place))
        .order_by(Course.display_order.asc(), Course.course_id.asc())
    )
    if mood and mood != "전체":
        stmt = stmt.where(Course.mood == mood)

    return [to_course_out(course) for course in db.scalars(stmt).unique().all()]


def get_stamps(db: Session, user_id: str | None) -> StampState:
    """현재 사용자가 모은 스탬프 목록을 반환합니다."""

    if not user_id:
        return StampState(collectedPlaceIds=[])

    stamps = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.user_id == user_id)
        .order_by(UserStamp.created_at.asc(), UserStamp.stamp_id.asc())
    ).unique().all()
    return StampState(collectedPlaceIds=[stamp.place.slug for stamp in stamps])


def toggle_stamp(
    db: Session,
    user_id: str,
    place_id: str,
    latitude: float,
    longitude: float,
    radius_meters: int,
) -> StampState:
    """현장 반경 검증 후 스탬프를 적립합니다."""

    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    existing = db.scalars(
        select(UserStamp).where(UserStamp.user_id == user_id, UserStamp.position_id == place.position_id)
    ).first()
    if existing:
        return get_stamps(db, user_id)

    ensure_stamp_can_be_collected(place, latitude, longitude, radius_meters)
    db.add(UserStamp(user_id=user_id, position_id=place.position_id, created_at=datetime.now(UTC).replace(tzinfo=None)))
    db.commit()
    return get_stamps(db, user_id)


def get_my_page(db: Session, user_id: str, is_admin: bool) -> MyPageResponse:
    """마이페이지에 필요한 계정 요약 정보를 반환합니다."""

    user = db.get(User, user_id)
    if not user:
        raise ValueError("사용자 정보를 찾을 수 없어요.")

    review_items = list_reviews(db, user_id=user_id)
    stamp_rows = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.user_id == user_id)
        .order_by(UserStamp.created_at.desc(), UserStamp.stamp_id.desc())
    ).unique().all()
    collected_places = [to_place_out(stamp.place) for stamp in stamp_rows if stamp.place and stamp.place.is_active]

    return MyPageResponse(
        user=to_session_user(user, is_admin),
        stats=MyStatsOut(reviewCount=len(review_items), stampCount=len(collected_places)),
        reviews=review_items,
        collectedPlaces=collected_places,
    )


def get_bootstrap(db: Session, user_id: str | None) -> BootstrapResponse:
    """앱 첫 진입에 필요한 장소, 코스, 후기, 스탬프를 묶습니다."""

    places = list_places(db)
    return BootstrapResponse(
        places=places,
        reviews=list_reviews(db),
        courses=list_courses(db),
        stamps=get_stamps(db, user_id),
        hasRealData=bool(places),
    )


def get_admin_summary(db: Session, settings: Settings) -> AdminSummaryResponse:
    """관리 화면에 필요한 운영 지표를 집계합니다."""

    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    place_count = db.scalar(select(func.count()).select_from(MapPlace)) or 0
    review_count = db.scalar(select(func.count()).select_from(Feed)) or 0
    comment_count = db.scalar(select(func.count()).select_from(UserComment)) or 0
    stamp_count = db.scalar(select(func.count()).select_from(UserStamp)) or 0

    place_rows = db.execute(
        select(MapPlace, func.count(Feed.feed_id))
        .outerjoin(Feed, Feed.position_id == MapPlace.position_id)
        .group_by(MapPlace.position_id)
        .order_by(MapPlace.is_active.desc(), MapPlace.name.asc())
    ).all()

    return AdminSummaryResponse(
        userCount=int(user_count),
        placeCount=int(place_count),
        reviewCount=int(review_count),
        commentCount=int(comment_count),
        stampCount=int(stamp_count),
        sourceReady=settings.public_data_file_path.exists() or bool(settings.public_data_source_url),
        places=[to_admin_place_out(place, int(count)) for place, count in place_rows],
    )


def update_place_visibility(db: Session, place_id: str, is_active: bool) -> AdminPlaceOut:
    """장소의 공개 여부를 변경합니다."""

    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id)).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    place.is_active = is_active
    place.updated_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()

    review_count = db.scalar(select(func.count()).select_from(Feed).where(Feed.position_id == place.position_id)) or 0
    return to_admin_place_out(place, int(review_count))


def cleanup_legacy_demo_content(db: Session) -> None:
    """예전 데모 계정과 샘플 데이터를 정리합니다."""

    legacy_user_ids = db.scalars(select(User.user_id).where(User.provider.in_(LEGACY_PROVIDERS))).all()
    if not legacy_user_ids:
        return

    feed_ids = db.scalars(select(Feed.feed_id).where(Feed.user_id.in_(legacy_user_ids))).all()
    if feed_ids:
        db.execute(delete(UserComment).where(UserComment.feed_id.in_(feed_ids)))
        db.execute(delete(Feed).where(Feed.feed_id.in_(feed_ids)))

    db.execute(delete(UserStamp).where(UserStamp.user_id.in_(legacy_user_ids)))
    db.execute(delete(User).where(User.user_id.in_(legacy_user_ids)))
    db.commit()


def load_public_bundle(settings: Settings) -> dict:
    """공공 데이터 번들을 URL 또는 로컬 JSON에서 읽습니다."""

    if settings.public_data_source_url:
        request = Request(settings.public_data_source_url, headers={"Accept": "application/json"})
        try:
            with urlopen(request, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            pass

    if settings.public_data_file_path.exists():
        return json.loads(settings.public_data_file_path.read_text(encoding="utf-8"))

    return {"places": [], "courses": []}


def import_public_bundle(db: Session, settings: Settings) -> PublicImportResponse:
    """공공 데이터 번들을 현재 데이터베이스에 반영합니다."""

    payload = load_public_bundle(settings)
    imported_places = 0
    imported_courses = 0

    for item in payload.get("places", []):
        place = db.scalars(select(MapPlace).where(MapPlace.slug == item["slug"])).first()
        if not place:
            place = MapPlace(slug=item["slug"])
            db.add(place)
            imported_places += 1

        place.name = item["name"]
        place.district = item["district"]
        place.category = item["category"]
        place.latitude = item["latitude"]
        place.longitude = item["longitude"]
        place.summary = item["summary"]
        place.description = item["description"]
        place.vibe_tags = item.get("vibe_tags") or []
        place.visit_time = item["visit_time"]
        place.route_hint = item["route_hint"]
        place.stamp_reward = item["stamp_reward"]
        place.hero_label = item["hero_label"]
        place.jam_color = item["jam_color"]
        place.accent_color = item["accent_color"]
        place.is_active = item.get("is_active", True)
        now = datetime.now(UTC).replace(tzinfo=None)
        if not getattr(place, "created_at", None):
            place.created_at = now
        place.updated_at = now

    db.flush()
    place_by_slug = {place.slug: place for place in db.scalars(select(MapPlace)).all()}

    for item in payload.get("courses", []):
        course = db.scalars(select(Course).where(Course.slug == item["slug"])).first()
        if not course:
            course = Course(
                slug=item["slug"],
                title=item["title"],
                mood=item["mood"],
                duration=item["duration"],
                note=item["note"],
                color=item["color"],
                display_order=item.get("display_order", 0),
            )
            db.add(course)
            imported_courses += 1
        else:
            course.title = item["title"]
            course.mood = item["mood"]
            course.duration = item["duration"]
            course.note = item["note"]
            course.color = item["color"]
            course.display_order = item.get("display_order", 0)

        db.flush()

        db.execute(delete(CoursePlace).where(CoursePlace.course_id == course.course_id))
        for index, slug in enumerate(item.get("place_slugs", []), start=1):
            place = place_by_slug.get(slug)
            if not place:
                continue
            db.add(CoursePlace(course_id=course.course_id, position_id=place.position_id, stop_order=index))

    db.commit()
    return PublicImportResponse(importedPlaces=imported_places, importedCourses=imported_courses)


def parse_review_id(review_id: str) -> int:
    """문자열 후기 ID를 정수 키로 변환합니다."""

    try:
        return int(review_id)
    except ValueError as error:
        raise ValueError("후기 ID 형식이 올바르지 않아요.") from error
