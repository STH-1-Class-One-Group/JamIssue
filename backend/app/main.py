"""JamIssue 앱서버의 API 엔드포인트를 정의합니다."""

from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from .config import Settings, get_settings
from .db import Base, SessionLocal, engine, get_db
from .jwt_auth import ACCESS_TOKEN_COOKIE, issue_access_token, read_access_token
from .models import (
    AdminPlaceOut,
    AdminSummaryResponse,
    AuthProviderOut,
    AuthSessionResponse,
    BootstrapResponse,
    CategoryFilter,
    CommentCreate,
    CommentOut,
    CourseMood,
    CourseOut,
    HealthResponse,
    MyPageResponse,
    PlaceOut,
    PlaceVisibilityUpdate,
    PublicImportResponse,
    ReviewCreate,
    ReviewOut,
    SessionUser,
    StampState,
    StampToggleRequest,
    UploadResponse,
)
from .naver_oauth import (
    build_naver_login_url,
    build_redirect_url,
    exchange_code_for_token,
    fetch_naver_profile,
    generate_oauth_state,
)
from .repository import (
    create_comment,
    create_review,
    get_admin_summary,
    get_bootstrap,
    get_my_page,
    get_place,
    get_review_comments,
    get_stamps,
    import_public_bundle,
    list_courses,
    list_places,
    list_reviews,
    to_session_user,
    toggle_stamp,
    update_place_visibility,
    upsert_naver_user,
)
from .seed import seed_database

settings = get_settings()
app = FastAPI(
    title="JamIssue API",
    version="1.0.0",
    summary="\uB300\uC804\uC744 \uD55C \uC785\uC5D0 \uACE0\uB974\uB294 \uBAA8\uBC14\uC77C \uC5EC\uD589 \uC571 \uC11C\uBC84",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site="lax",
    https_only=settings.session_https,
    max_age=60 * 60,
)

settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount(settings.upload_base_url, StaticFiles(directory=settings.upload_path), name="uploads")

PROVIDER_LABELS = {
    "naver": "\uB124\uC774\uBC84",
    "google": "\uAD6C\uAE00",
    "kakao": "\uCE74\uCE74\uC624",
    "apple": "Apple",
}
SUPPORTED_PROVIDERS = tuple(PROVIDER_LABELS.keys())


@app.on_event("startup")
def on_startup() -> None:
    """업로드 디렉터리와 데이터베이스 초기 상태를 준비합니다."""

    settings.upload_path.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db, settings)


def build_auth_providers(app_settings: Settings) -> list[AuthProviderOut]:
    """클라이언트에 노출할 로그인 제공자 목록을 만듭니다."""

    providers: list[AuthProviderOut] = []
    for provider in SUPPORTED_PROVIDERS:
        providers.append(
            AuthProviderOut(
                key=provider,
                label=PROVIDER_LABELS[provider],
                isEnabled=app_settings.provider_enabled(provider),
                loginUrl=f"/api/auth/{provider}/login",
            )
        )
    return providers


def get_session_user(request: Request, app_settings: Settings = Depends(get_settings)) -> SessionUser | None:
    """헤더 또는 쿠키의 JWT를 읽어 현재 사용자를 복원합니다."""

    auth_header = request.headers.get("Authorization", "")
    header_token = auth_header.removeprefix("Bearer ").strip() if auth_header.startswith("Bearer ") else None
    cookie_token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    session_user = read_access_token(app_settings, header_token or cookie_token)
    if not session_user:
        return None
    return session_user.model_copy(update={"is_admin": app_settings.is_admin(session_user.id)})


def require_session_user(session_user: SessionUser | None = Depends(get_session_user)) -> SessionUser:
    """로그인이 필요한 API에서 사용자 정보를 강제합니다."""

    if not session_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD574\uC694.")
    return session_user


def require_admin_user(
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> SessionUser:
    """관리자 전용 API에서 관리자 권한을 검증합니다."""

    if not app_settings.is_admin(session_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD574\uC694.")
    return session_user.model_copy(update={"is_admin": True})


def build_auth_response(session_user: SessionUser | None, app_settings: Settings) -> AuthSessionResponse:
    """현재 인증 상태 응답 객체를 구성합니다."""

    return AuthSessionResponse(
        isAuthenticated=bool(session_user),
        user=session_user,
        providers=build_auth_providers(app_settings),
    )


def get_redirect_target(request: Request, app_settings: Settings) -> str:
    """로그인 완료 뒤 돌아갈 프론트 주소를 결정합니다."""

    return request.session.get("post_login_redirect") or app_settings.frontend_url


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
def health_check(app_settings: Settings = Depends(get_settings)) -> HealthResponse:
    """서버와 연결 설정 상태를 확인합니다."""

    return HealthResponse(
        status="ok",
        env=app_settings.env,
        databaseUrl=app_settings.database_url,
        storagePath=str(app_settings.upload_path),
    )


@app.get("/api/auth/providers", response_model=list[AuthProviderOut], tags=["auth"])
def read_auth_providers(app_settings: Settings = Depends(get_settings)) -> list[AuthProviderOut]:
    """사용 가능한 로그인 제공자 목록을 반환합니다."""

    return build_auth_providers(app_settings)


@app.get("/api/auth/me", response_model=AuthSessionResponse, tags=["auth"])
def read_auth_session(
    session_user: SessionUser | None = Depends(get_session_user),
    app_settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    """현재 로그인 상태를 반환합니다."""

    return build_auth_response(session_user, app_settings)


@app.get("/api/auth/{provider}/login", tags=["auth"])
def start_login(
    provider: str,
    request: Request,
    next: str | None = None,
    app_settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """선택한 로그인 제공자의 인증 흐름을 시작합니다."""

    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uB85C\uADF8\uC778 \uC81C\uACF5\uC790\uC608\uC694.")

    request.session["post_login_redirect"] = next or app_settings.frontend_url

    if provider != "naver":
        if not app_settings.provider_enabled(provider):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{PROVIDER_LABELS[provider]} \uB85C\uADF8\uC778 \uC124\uC815\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694.",
            )
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"{PROVIDER_LABELS[provider]} \uB85C\uADF8\uC778 \uC5F0\uACB0\uC740 \uD658\uACBD \uBCC0\uC218\uB9CC \uC900\uBE44\uB41C \uC0C1\uD0DC\uC608\uC694.",
        )

    state = generate_oauth_state()
    request.session["naver_oauth_state"] = state
    return RedirectResponse(build_naver_login_url(app_settings, state), status_code=status.HTTP_302_FOUND)


@app.get("/api/auth/naver/callback", tags=["auth"])
def finish_naver_login(
    request: Request,
    db: Session = Depends(get_db),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    app_settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """네이버 OAuth 콜백을 처리하고 JWT 쿠키를 발급합니다."""

    redirect_target = get_redirect_target(request, app_settings)
    expected_state = request.session.pop("naver_oauth_state", None)

    if error:
        return RedirectResponse(
            build_redirect_url(redirect_target, auth="naver-error", reason=error_description or error),
            status_code=status.HTTP_302_FOUND,
        )

    if not code or not state or state != expected_state:
        return RedirectResponse(
            build_redirect_url(redirect_target, auth="naver-error", reason="state-mismatch"),
            status_code=status.HTTP_302_FOUND,
        )

    try:
        token_payload = exchange_code_for_token(app_settings, code, state)
        profile = fetch_naver_profile(token_payload["access_token"])
        user = upsert_naver_user(db, profile)
    except HTTPException as oauth_error:
        return RedirectResponse(
            build_redirect_url(redirect_target, auth="naver-error", reason=str(oauth_error.detail)),
            status_code=status.HTTP_302_FOUND,
        )

    session_user = to_session_user(user, app_settings.is_admin(user.user_id), profile.profile_image)
    access_token = issue_access_token(app_settings, session_user)

    response = RedirectResponse(
        build_redirect_url(redirect_target, auth="naver-success"),
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=app_settings.session_https,
        max_age=app_settings.jwt_access_token_minutes * 60,
        path="/",
    )
    return response


@app.post("/api/auth/logout", response_model=AuthSessionResponse, tags=["auth"])
def logout(
    response: Response,
    app_settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    """로그아웃하면서 JWT 쿠키를 제거합니다."""

    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    return build_auth_response(None, app_settings)


@app.get("/api/bootstrap", response_model=BootstrapResponse, tags=["bootstrap"])
def bootstrap(
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> BootstrapResponse:
    """앱 첫 화면에 필요한 데이터를 묶어서 반환합니다."""

    return get_bootstrap(db, session_user.id if session_user else None)


@app.get("/api/places", response_model=list[PlaceOut], tags=["places"])
def read_places(
    category: CategoryFilter = Query(default="all"),
    db: Session = Depends(get_db),
) -> list[PlaceOut]:
    """카테고리 기준으로 공개 장소 목록을 반환합니다."""

    return list_places(db, category)


@app.get("/api/places/{place_id}", response_model=PlaceOut, tags=["places"])
def read_place(place_id: str, db: Session = Depends(get_db)) -> PlaceOut:
    """단일 장소 상세 정보를 반환합니다."""

    try:
        return get_place(db, place_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@app.get("/api/courses", response_model=list[CourseOut], tags=["courses"])
def read_courses(
    mood: CourseMood | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CourseOut]:
    """무드 기준 코스 목록을 반환합니다."""

    return list_courses(db, mood)


@app.get("/api/reviews", response_model=list[ReviewOut], tags=["reviews"])
def read_reviews(
    place_id: str | None = Query(default=None, alias="placeId"),
    user_id: str | None = Query(default=None, alias="userId"),
    db: Session = Depends(get_db),
) -> list[ReviewOut]:
    """장소나 사용자 기준으로 후기 목록을 반환합니다."""

    return list_reviews(db, place_id=place_id, user_id=user_id)


@app.post("/api/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED, tags=["reviews"])
def write_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> ReviewOut:
    """로그인 사용자의 새 후기를 저장합니다."""

    try:
        return create_review(db, payload, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "\uC7A5\uC18C" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


@app.get("/api/reviews/{review_id}/comments", response_model=list[CommentOut], tags=["reviews"])
def read_review_comments(review_id: str, db: Session = Depends(get_db)) -> list[CommentOut]:
    """후기에 달린 댓글 트리를 반환합니다."""

    try:
        return get_review_comments(db, review_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@app.post("/api/reviews/{review_id}/comments", response_model=list[CommentOut], tags=["reviews"])
def write_review_comment(
    review_id: str,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> list[CommentOut]:
    """후기에 댓글이나 답글을 추가합니다."""

    try:
        return create_comment(db, review_id, payload, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "\uD6C4\uAE30" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


@app.post("/api/reviews/upload", response_model=UploadResponse, tags=["reviews"])
async def upload_review_image(
    file: UploadFile = File(...),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> UploadResponse:
    """후기 이미지를 저장하고 접근 가능한 URL을 반환합니다."""

    content_type = file.content_type or "application/octet-stream"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="\uC774\uBBF8\uC9C0 \uD30C\uC77C\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC5B4\uC694.")

    extension = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    raw_bytes = await file.read()
    if len(raw_bytes) > app_settings.max_upload_size_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="\uC774\uBBF8\uC9C0\uB294 5MB \uC774\uD558\uB85C \uC62C\uB824\uC8FC\uC138\uC694.")

    filename = f"{session_user.id.replace(':', '_')}-{uuid4().hex}{extension}"
    target_path = app_settings.upload_path / filename
    target_path.write_bytes(raw_bytes)
    return UploadResponse(url=f"{app_settings.upload_base_url}/{filename}", fileName=filename, contentType=content_type)


@app.get("/api/my/summary", response_model=MyPageResponse, tags=["my"])
def read_my_summary(
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> MyPageResponse:
    """현재 계정의 마이페이지 요약 정보를 반환합니다."""

    try:
        return get_my_page(db, session_user.id, app_settings.is_admin(session_user.id))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@app.get("/api/stamps", response_model=StampState, tags=["stamps"])
def read_stamps(
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> StampState:
    """현재 계정의 스탬프 상태를 반환합니다."""

    return get_stamps(db, session_user.id if session_user else None)


@app.post("/api/stamps/toggle", response_model=StampState, tags=["stamps"])
def write_stamp_toggle(
    payload: StampToggleRequest,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> StampState:
    """현장 반경을 확인한 뒤 스탬프를 적립합니다."""

    try:
        return toggle_stamp(
            db,
            session_user.id,
            payload.place_id,
            payload.latitude,
            payload.longitude,
            app_settings.stamp_unlock_radius_meters,
        )
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@app.get("/api/admin/summary", response_model=AdminSummaryResponse, tags=["admin"])
def read_admin_summary(
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
    app_settings: Settings = Depends(get_settings),
) -> AdminSummaryResponse:
    """관리 화면에 필요한 운영 요약 정보를 반환합니다."""

    return get_admin_summary(db, app_settings)


@app.patch("/api/admin/places/{place_id}", response_model=AdminPlaceOut, tags=["admin"])
def patch_place_visibility(
    place_id: str,
    payload: PlaceVisibilityUpdate,
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
) -> AdminPlaceOut:
    """관리자가 장소 노출 여부를 바꿉니다."""

    try:
        return update_place_visibility(db, place_id, payload.is_active)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@app.post("/api/admin/import/public-data", response_model=PublicImportResponse, tags=["admin"])
def import_public_data(
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
    app_settings: Settings = Depends(get_settings),
) -> PublicImportResponse:
    """공공 데이터 번들을 다시 가져와 갱신합니다."""

    return import_public_bundle(db, app_settings)
