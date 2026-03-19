from __future__ import annotations

import json
import secrets
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from .config import Settings

NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize"
NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me"


@dataclass
class NaverProfile:
    id: str
    nickname: str | None
    email: str | None
    name: str | None
    profile_image: str | None


def build_redirect_url(base_url: str, **params: str) -> str:
    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update({key: value for key, value in params.items() if value})
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def generate_oauth_state() -> str:
    return secrets.token_urlsafe(24)


def ensure_naver_login_config(settings: Settings) -> None:
    if not settings.naver_login_client_id or not settings.naver_login_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="네이버 로그인 환경 변수가 비어 있어요.",
        )


def build_naver_login_url(settings: Settings, state: str) -> str:
    ensure_naver_login_config(settings)
    params = {
        "response_type": "code",
        "client_id": settings.naver_login_client_id,
        "redirect_uri": settings.naver_login_callback_url,
        "state": state,
    }
    return f"{NAVER_AUTHORIZE_URL}?{urlencode(params)}"


def exchange_code_for_token(settings: Settings, code: str, state: str) -> dict:
    """OAuth 권한 코드(code)를 네이버에 제출해 접근토큰와 갱신토큰을 받습니다.
    
    OAuth2 Authorization Code 플로우의 token endpoint 호출:
    1) code: 사용자가 승인 후 리다이렉트 시 받은 권한 코드 (1회용, ~10분 유효)
    2) state: CSRF 검증용 (redirect_uri 검증하지 않으므로 state가 유일한 CSRF 방어)
    3) access_token: 네이버 API 호출에 사용 (유효기간 ~1시간)
    
    이후 fetch_naver_profile에서 access_token으로 사용자 정보(id, nickname 등) 조회합니다.
    """
    ensure_naver_login_config(settings)
    params = {
        "grant_type": "authorization_code",
        "client_id": settings.naver_login_client_id,
        "client_secret": settings.naver_login_client_secret,
        "code": code,
        "state": state,
    }
    request = Request(f"{NAVER_TOKEN_URL}?{urlencode(params)}", headers={"Accept": "application/json"})
    payload = _load_json(request, "네이버 토큰 교환에 실패했어요.")

    if payload.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=payload.get("error_description") or "네이버 토큰 교환에 실패했어요.",
        )

    if not payload.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="네이버 access token 을 받지 못했어요.",
        )

    return payload


def fetch_naver_profile(access_token: str) -> NaverProfile:
    """exchange_code_for_token에서 받은 access_token을 사용해 네이버 사용자 정보를 조회합니다.
    
    GET /v1/nid/me 호출해서 로그인한 사용자의 프로필을 가져옵니다:
    - id: 네이버 고유ID (영구적, 계정 삭제 후 재가입해도 같은 ID 안 줌)
    - nickname: 사용자 프로필명 (비어있을 수 있음 → 신규가입시 입력 강제)
    - email: 네이버 계정 이메일 (사용자 동의 필요, 비어있을 수 있음)
    - profile_image: 프로필 이미지 URL (비어있을 수 있음)
    
    finish_naver_login에서 이 정보로 upsert_naver_user 또는 link_naver_identity 호출합니다.
    """
    request = Request(
        NAVER_PROFILE_URL,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {access_token}",
        },
    )
    payload = _load_json(request, "네이버 사용자 정보를 가져오지 못했어요.")

    if payload.get("resultcode") != "00" or "response" not in payload:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=payload.get("message") or "네이버 사용자 정보를 가져오지 못했어요.",
        )

    response = payload["response"]
    return NaverProfile(
        id=response["id"],
        nickname=response.get("nickname"),
        email=response.get("email"),
        name=response.get("name"),
        profile_image=response.get("profile_image"),
    )


def _load_json(request: Request, default_detail: str) -> dict:
    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = default_detail
        try:
            payload = json.loads(error.read().decode("utf-8"))
            detail = payload.get("error_description") or payload.get("message") or detail
        except Exception:
            detail = detail
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from error
    except URLError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=default_detail) from error
