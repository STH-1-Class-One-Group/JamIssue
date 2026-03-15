"""FastAPI 요청과 응답에 사용하는 Pydantic 모델을 정의합니다."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CategoryType = Literal["landmark", "food", "cafe", "night"]
CategoryFilter = Literal["all", "landmark", "food", "cafe", "night"]
CourseMood = Literal["전체", "데이트", "사진", "힐링", "비 오는 날"]
ReviewMood = Literal["설렘", "친구랑", "혼자서", "야경픽"]
ProviderKey = Literal["naver", "google", "kakao", "apple"]


class ApiModel(BaseModel):
    """ORM 객체를 응답 모델로 바로 변환할 수 있도록 공통 설정을 둡니다."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SessionUser(ApiModel):
    """로그인한 사용자의 세션 정보를 표현합니다."""

    id: str
    nickname: str
    email: str | None = None
    provider: str
    profile_image: str | None = Field(default=None, alias="profileImage")
    is_admin: bool = Field(default=False, alias="isAdmin")


class AuthProviderOut(ApiModel):
    """클라이언트에 노출할 로그인 제공자 상태입니다."""

    key: ProviderKey
    label: str
    is_enabled: bool = Field(alias="isEnabled")
    login_url: str | None = Field(default=None, alias="loginUrl")


class AuthSessionResponse(ApiModel):
    """현재 인증 상태와 제공자 목록을 함께 반환합니다."""

    is_authenticated: bool = Field(alias="isAuthenticated")
    user: SessionUser | None = None
    providers: list[AuthProviderOut] = []


class PlaceOut(ApiModel):
    """지도와 상세 화면에 노출할 장소 정보를 담습니다."""

    id: str
    name: str
    district: str
    category: CategoryType
    jam_color: str = Field(alias="jamColor")
    accent_color: str = Field(alias="accentColor")
    latitude: float
    longitude: float
    summary: str
    description: str
    vibe_tags: list[str] = Field(alias="vibeTags")
    visit_time: str = Field(alias="visitTime")
    route_hint: str = Field(alias="routeHint")
    stamp_reward: str = Field(alias="stampReward")
    hero_label: str = Field(alias="heroLabel")


class CommentOut(ApiModel):
    """후기 아래에 붙는 댓글과 답글 구조입니다."""

    id: str
    user_id: str = Field(alias="userId")
    author: str
    body: str
    parent_id: str | None = Field(default=None, alias="parentId")
    is_deleted: bool = Field(alias="isDeleted")
    created_at: str = Field(alias="createdAt")
    replies: list["CommentOut"] = []


class ReviewOut(ApiModel):
    """장소 후기와 연결된 부가 정보를 담습니다."""

    id: str
    user_id: str = Field(alias="userId")
    place_id: str = Field(alias="placeId")
    place_name: str = Field(alias="placeName")
    author: str
    body: str
    mood: ReviewMood
    badge: str
    visited_at: str = Field(alias="visitedAt")
    image_url: str | None = Field(default=None, alias="imageUrl")
    comment_count: int = Field(alias="commentCount")
    comments: list[CommentOut] = []


class CourseOut(ApiModel):
    """코스 탭에서 사용하는 추천 동선을 표현합니다."""

    id: str
    title: str
    mood: CourseMood
    duration: str
    note: str
    color: str
    place_ids: list[str] = Field(alias="placeIds")


class StampState(ApiModel):
    """현재 계정이 모은 스탬프 목록입니다."""

    collected_place_ids: list[str] = Field(alias="collectedPlaceIds")


class BootstrapResponse(ApiModel):
    """앱 첫 진입에 필요한 핵심 데이터를 한 번에 제공합니다."""

    places: list[PlaceOut]
    reviews: list[ReviewOut]
    courses: list[CourseOut]
    stamps: StampState
    has_real_data: bool = Field(alias="hasRealData")


class ReviewCreate(ApiModel):
    """후기 작성 요청 본문입니다."""

    place_id: str = Field(alias="placeId")
    body: str
    mood: ReviewMood
    image_url: str | None = Field(default=None, alias="imageUrl")


class CommentCreate(ApiModel):
    """댓글 작성 요청 본문입니다."""

    body: str
    parent_id: str | None = Field(default=None, alias="parentId")


class StampToggleRequest(ApiModel):
    """현장 스탬프 적립을 위한 위치 확인 요청입니다."""

    place_id: str = Field(alias="placeId")
    latitude: float
    longitude: float


class MyStatsOut(ApiModel):
    """마이페이지 상단 요약 수치입니다."""

    review_count: int = Field(alias="reviewCount")
    stamp_count: int = Field(alias="stampCount")


class MyPageResponse(ApiModel):
    """마이페이지에서 쓰는 계정 요약 데이터입니다."""

    user: SessionUser
    stats: MyStatsOut
    reviews: list[ReviewOut]
    collected_places: list[PlaceOut] = Field(alias="collectedPlaces")


class PlaceVisibilityUpdate(ApiModel):
    """관리자가 장소 노출 상태를 바꿀 때 쓰는 요청입니다."""

    is_active: bool = Field(alias="isActive")


class AdminPlaceOut(ApiModel):
    """관리 화면에서 쓰는 장소 요약 정보입니다."""

    id: str
    name: str
    district: str
    category: CategoryType
    is_active: bool = Field(alias="isActive")
    review_count: int = Field(alias="reviewCount")
    updated_at: str = Field(alias="updatedAt")


class AdminSummaryResponse(ApiModel):
    """관리 화면의 전체 운영 지표입니다."""

    user_count: int = Field(alias="userCount")
    place_count: int = Field(alias="placeCount")
    review_count: int = Field(alias="reviewCount")
    comment_count: int = Field(alias="commentCount")
    stamp_count: int = Field(alias="stampCount")
    source_ready: bool = Field(alias="sourceReady")
    places: list[AdminPlaceOut]


class UploadResponse(ApiModel):
    """후기 이미지 업로드 결과입니다."""

    url: str
    file_name: str = Field(alias="fileName")
    content_type: str = Field(alias="contentType")


class PublicImportResponse(ApiModel):
    """공공 데이터 재가져오기 결과입니다."""

    imported_places: int = Field(alias="importedPlaces")
    imported_courses: int = Field(alias="importedCourses")


class HealthResponse(ApiModel):
    """헬스 체크 응답입니다."""

    status: str
    env: str
    database_url: str = Field(alias="databaseUrl")
    storage_path: str = Field(alias="storagePath")
