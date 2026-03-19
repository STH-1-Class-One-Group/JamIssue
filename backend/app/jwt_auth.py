"""JWT 발급과 복호화를 담당합니다."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt

from .config import Settings
from .models import SessionUser

ACCESS_TOKEN_COOKIE = "jamissue_access_token"


def issue_access_token(settings: Settings, user: SessionUser) -> str:
    """세션 사용자 정보를 담은 액세스 토큰을 발급합니다."""

    # exp(만료 시간) = 현재 + settings.jwt_access_token_minutes (보통 60분)
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_minutes)
    payload = {
        "sub": user.id,
        "nickname": user.nickname,
        "email": user.email,
        "provider": user.provider,
        "profile_image": user.profile_image,
        "is_admin": user.is_admin,
        "profile_completed_at": user.profile_completed_at,
        "exp": expires_at,
    }
    # HS256 방식으로 서명. main.py에서 쿠키에 저장되는 이 토큰이 앱의 유일한 세션 정보
    # 주의: is_admin은 발급 시점의 값만 저장. 관리자 권한 변경되면 새 로그인 필요
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def read_access_token(settings: Settings, token: str | None) -> SessionUser | None:
    """전달받은 JWT를 읽어 세션 사용자로 복원합니다."""

    if not token:
        return None

    try:
        # JWT 복호화: 만료되었거나 서명 불일치하면 PyJWTError 발생
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        # 모든 JWT 복호화 예외: 1) 만료됨 2) 서명 불일치 3) 형식 오류 → None 반환 (재로그인 필요)
        return None

    # 필수 필드 3가지 확인: sub(ID), nickname, provider. 하나라도 없으면 위조 토큰
    subject = payload.get("sub")
    nickname = payload.get("nickname")
    provider = payload.get("provider")
    if not subject or not nickname or not provider:
        return None

    # SessionUser 모델로 복원
    # email/profileImage/isAdmin은 nullable (profile_image는 필드명이 다름: 토큰은 snake_case, 모델은 camelCase)
    return SessionUser(
        id=subject,
        nickname=nickname,
        email=payload.get("email"),
        provider=provider,
        profileImage=payload.get("profile_image"),
        isAdmin=bool(payload.get("is_admin")),
        profileCompletedAt=payload.get("profile_completed_at"),
    )
