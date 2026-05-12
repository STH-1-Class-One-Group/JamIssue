# JamIssue

JamIssue는 대전 지역 방문 필드, 스탬프, 코스, 축제 정보를 하나의 모바일 웹 서비스로 연결하는 프로젝트입니다.

- 운영 웹: [https://daejeon.jamissue.com](https://daejeon.jamissue.com)
- 운영 API: [https://api.daejeon.jamissue.com](https://api.daejeon.jamissue.com)
- 운영 구조: Cloudflare Pages + Cloudflare Worker + Supabase
- 운영 기준: Worker-first BFF, FastAPI는 local/fallback 성격
- 최신 정식 릴리즈: `1.2.10`
- 최신 릴리즈 태그: [`release-v1.2.10`](https://github.com/STH-1-Class-One-Group/JamIssue/releases/tag/release-v1.2.10)
- 다음 릴리즈 후보: `1.2.11` human-readable architecture hardening

## 운영 구조

기본 배포 브랜치는 `main`입니다.

- Frontend: Cloudflare Pages
- Backend API: Cloudflare Worker
- Database/Storage: Supabase
- Legacy/local backend: FastAPI

Worker는 운영 API 진입점이며 인증, 리뷰/댓글, 스탬프, 코스, 축제, 알림, 마이페이지 요청을 처리합니다. FastAPI 백엔드는 운영 주 경로가 아니라 로컬 검증과 레거시 fallback 성격으로 유지합니다.

## 1.2.10 릴리즈 기준

`1.2.10`은 `1.2.9` 이후 진행한 리팩터링과 회귀 방지 작업을 하나로 묶은 정식 릴리즈입니다.

- 기준 commit: `3984be45ca5b292c4e0bef7482f87fdf74159e86`
- 포함 범위: TSK-004 Worker residual boundary hardening, TSK-005 architecture/interface-locality regression hardening, review collection/render allocation 최적화
- 제외 범위: 신규 사용자 기능, API path/response shape 변경, DB schema 변경, 사용자-facing copy 변경, Kakao/Naver OAuth 성공 경로 변경
- 릴리즈 노트: [GitHub Release 1.2.10](https://github.com/STH-1-Class-One-Group/JamIssue/releases/tag/release-v1.2.10)
- Wiki 릴리즈 노트: [Release Notes 1.2.10](https://github.com/STH-1-Class-One-Group/JamIssue/wiki/Release-Notes-1.2.10)

## 1.2.11 후보 기준

`1.2.11`은 정식 릴리즈가 아니라 `1.2.10` 이후의 human-readable architecture hardening 후보입니다.

- 포함 범위: TSK-006 architecture readability audit, Worker domain entrypoint 정리, frontend hook owner folder 정리, 큰 내부 Worker 모듈 slicing
- 기준 원칙: interface-locality를 되돌리지 않고, 호출자가 읽는 진입점은 얕게 유지하며 내부 구현은 업무 언어 기준으로 나눕니다.
- 제외 범위: 신규 사용자 기능, API path/response shape 변경, DB schema 변경, 사용자-facing copy 변경, Kakao/Naver OAuth 성공 경로 변경
- 추적 문서: [docs/human-readable-architecture-traceability.md](docs/human-readable-architecture-traceability.md)

## 배포 파이프라인

PR에서는 아래 검증이 먼저 실행됩니다.

- `backend`
- `frontend`
- `deploy-pages`
- `validate-worker`
- `Analyze (python)`
- `Analyze (javascript-typescript)`

`main`에 반영되면 운영 배포와 smoke 검증이 실행됩니다.

1. `deploy-pages`
2. `deploy-worker`
3. `smoke`
4. `protected-smoke`

운영 smoke는 커스텀 도메인이 아니라 실제 배포 origin 기준으로 확인합니다.

- Pages origin: `https://daejeon-jamissue-pages.pages.dev`
- Worker origin: `https://daejeon-jamissue-api.yhh4433.workers.dev`

## Smoke 체크

Public smoke는 공개 경로가 정상인지 확인합니다.

- `GET /`
- `GET /app-config.js`
- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/map-bootstrap`
- `GET /api/review-feed?limit=1`
- `GET /api/community-routes`
- `GET /api/festivals`
- `GET /api/my/summary` 비로그인 응답

Protected smoke는 `SMOKE_AUTH_BEARER_TOKEN`이 있을 때만 보호 경로를 확인합니다.

- 토큰이 없으면 실패가 아니라 `skip` 처리
- 토큰이 있으면 인증이 필요한 운영 경로를 실제로 확인

로컬 실행:

```powershell
npm.cmd run smoke:public
npm.cmd run smoke:protected
```

## 로컬 검증

Frontend/Worker 공통 검증:

```powershell
cd D:\JamIssue
npm.cmd install
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
```

Backend 검증:

```powershell
cd D:\JamIssue\backend
python -m pytest tests
```

공공 행사 동기화 dry-run:

```powershell
cd D:\JamIssue
tsx scripts/sync-daejeon-events.ts --dry-run
```

## 주요 환경 변수

### GitHub Repository Secrets

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository secrets`

```env
CLOUDFLARE_API_TOKEN=<Cloudflare API token>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare account id>
EVENT_IMPORT_TOKEN=<random long token>
PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SMOKE_AUTH_BEARER_TOKEN=<protected smoke token>
```

### GitHub Repository Variables

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository variables`

```env
PUBLIC_APP_BASE_URL=https://api.daejeon.jamissue.com
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_MAP_CLIENT_ID>
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```

### Cloudflare Worker Variables

```env
APP_ENV=worker-first
APP_SESSION_HTTPS=true
APP_FRONTEND_URL=https://daejeon.jamissue.com
APP_CORS_ORIGINS=https://daejeon.jamissue.com
APP_NAVER_LOGIN_CLIENT_ID=<NAVER_LOGIN_CLIENT_ID>
APP_NAVER_LOGIN_CALLBACK_URL=https://api.daejeon.jamissue.com/api/auth/naver/callback
APP_KAKAO_LOGIN_CLIENT_ID=<KAKAO_REST_API_KEY>
APP_KAKAO_LOGIN_CALLBACK_URL=https://api.daejeon.jamissue.com/api/auth/kakao/callback
APP_STORAGE_BACKEND=supabase
APP_SUPABASE_URL=https://<project-ref>.supabase.co
APP_SUPABASE_STORAGE_BUCKET=review-images
APP_STAMP_UNLOCK_RADIUS_METERS=120
```

### Cloudflare Worker Secrets

```env
APP_SESSION_SECRET=<random 64+ chars>
APP_JWT_SECRET=<random 64+ chars>
APP_DATABASE_URL=postgres://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
APP_SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
APP_NAVER_LOGIN_CLIENT_SECRET=<NAVER_LOGIN_CLIENT_SECRET>
APP_KAKAO_LOGIN_CLIENT_SECRET=<KAKAO_CLIENT_SECRET>
APP_EVENT_IMPORT_TOKEN=<same value as GitHub EVENT_IMPORT_TOKEN>
```

## 참고 문서

- [docs/README.md](docs/README.md)
- [docs/growgardens-deploy-runbook.md](docs/growgardens-deploy-runbook.md)
- [docs/operations-refactor-roadmap.md](docs/operations-refactor-roadmap.md)
- [docs/worker-residual-boundary-traceability.md](docs/worker-residual-boundary-traceability.md)
- [docs/architecture-regression-traceability.md](docs/architecture-regression-traceability.md)
- [backend/README.md](backend/README.md)

## CI 메모

문서만 수정하는 main 커밋에서 Actions와 배포를 함께 건너뛰려면 커밋 메시지에 `[skip ci]`를 포함합니다.
