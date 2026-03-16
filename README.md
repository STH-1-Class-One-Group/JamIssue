# JamIssue

대전 관광 모바일 웹앱 MVP입니다.

핵심 기능:

- 지도 기반 장소 탐색
- 후기 / 댓글 / 좋아요
- 스탬프 적립
- 사용자 생성 추천 경로
- 네이버 로그인 중심 계정 구조

## 기준 아키텍처

메인 기준 아키텍처는 아래입니다.

```text
Frontend
-> Cloudflare Pages

API
-> FastAPI
-> SQLAlchemy

Data
-> Supabase Postgres
-> Supabase Storage
```

중요:

- `Supabase`는 DB/스토리지 서버입니다.
- `SQLAlchemy`는 서버가 아니라 FastAPI 안에서 동작하는 ORM입니다.
- 따라서 분리는 `FastAPI 서버 + Supabase`로 보는 것이 맞습니다.

## 현재 브랜치: `codex/worker-first-poc`

이 브랜치는 `Worker-first` 가능성을 보기 위한 실험 브랜치입니다.

목표:

- 무료 Cloudflare Worker에서도 최소한의 실제 동작을 확인
- 프론트가 읽기 데이터 기준으로 실제 렌더링되는지 확인
- 이후 로그인/쓰기 API는 별도로 판단

현재 이 브랜치에서 Worker가 직접 처리하는 엔드포인트:

- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/auth/me`
- `GET /api/bootstrap`
- `GET /api/reviews`
- `GET /api/community-routes`
- `GET /api/banner/events`

현재 이 브랜치에서 아직 직접 처리하지 않는 영역:

- 로그인 완료 세션 확립
- 후기 작성 / 댓글 작성 / 좋아요 쓰기
- 스탬프 적립 쓰기
- 관리자 수정 작업

즉, 이 브랜치는 **읽기 중심 Worker POC**입니다.

## 현재 배포 상태

- 프론트: `https://jamissue.growgardens.app`
- API: `https://api.jamissue.growgardens.app`
- workers.dev: `https://jamissue-api.yhh4433.workers.dev`

Worker-first 브랜치에서 확인된 실제 응답:

- `/api/health` 정상
- `/api/auth/me` 정상
- `/api/bootstrap` 정상
- `/api/community-routes` 정상

즉, 현재는 Supabase REST를 통해 Worker가 읽기 데이터를 실제로 내려주는 상태입니다.

## Cloudflare Pages 값

프로젝트: `jamissue-web`

```env
PUBLIC_APP_BASE_URL=https://api.jamissue.growgardens.app
PUBLIC_NAVER_MAP_CLIENT_ID=<네이버 지도 Dynamic Map Client ID>
```

## Cloudflare Worker Variables

프로젝트: `jamissue-api`

```env
APP_ENV=worker-first
APP_SESSION_HTTPS=true
APP_FRONTEND_URL=https://jamissue.growgardens.app
APP_CORS_ORIGINS=https://jamissue.growgardens.app
APP_NAVER_LOGIN_CALLBACK_URL=https://api.jamissue.growgardens.app/api/auth/naver/callback
APP_STORAGE_BACKEND=supabase
APP_SUPABASE_URL=https://ifofgcaqrgtiurzqhiyy.supabase.co
APP_SUPABASE_STORAGE_BUCKET=review-images
APP_STAMP_UNLOCK_RADIUS_METERS=120
APP_ORIGIN_API_URL=
```

설명:

- `APP_ORIGIN_API_URL` 는 아직 Worker에 없는 쓰기/로그인 엔드포인트를 FastAPI origin으로 넘기고 싶을 때만 사용합니다.
- 현재 읽기 POC만 볼 때는 비워둘 수 있습니다.

## Cloudflare Worker Secrets

```env
APP_SESSION_SECRET=<랜덤 64자 이상>
APP_JWT_SECRET=<랜덤 64자 이상>
APP_DATABASE_URL=postgres://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
APP_SUPABASE_SERVICE_ROLE_KEY=<Supabase service_role key>
APP_NAVER_LOGIN_CLIENT_ID=<네이버 로그인 Client ID>
APP_NAVER_LOGIN_CLIENT_SECRET=<네이버 로그인 Client Secret>
```

## Supabase 적용 순서

Supabase SQL Editor에서 아래 순서로 실행합니다.

1. [supabase_schema.sql](/D:/Code305/JamIssue/backend/sql/supabase_schema.sql)
2. [supabase_seed.sql](/D:/Code305/JamIssue/backend/sql/supabase_seed.sql)
3. [supabase_storage.sql](/D:/Code305/JamIssue/backend/sql/supabase_storage.sql)

## 네이버 개발자센터 등록값

- 서비스 URL: `https://jamissue.growgardens.app`
- Callback URL: `https://api.jamissue.growgardens.app/api/auth/naver/callback`

## 관련 문서

- [배포 변경 문서](/D:/Code305/JamIssue/docs/deployment-change-2026-03-16.md)
- [growgardens 배포 런북](/D:/Code305/JamIssue/docs/growgardens-deploy-runbook.md)
- [배포 변수/시크릿 상세 가이드](/D:/Code305/JamIssue/docs/deploy-secrets-detailed.md)
- [Cloudflare Pages 설정](/D:/Code305/JamIssue/docs/cloudflare-pages-setup.md)
