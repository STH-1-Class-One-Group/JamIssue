# API Contract Ownership

이 문서는 MSA 전환을 위해 레포를 분리한 뒤 `STH-1-Class-One-Group/JamIssue` Web Front service에 남아 있는 API 책임과, `ClarusIubar/JamIssue_admin`으로 이관된 backend/API 책임을 구분합니다.

## 결론

이 레포는 **consumer-side API contract**만 소유합니다.

Backend API 구현, Cloudflare Worker handler, DB schema/migration, provider-side contract test, OAuth/backend secret은 `ClarusIubar/JamIssue_admin`이 소유합니다.

## MSA 서비스 분리 기준

| 서비스 | 소유 레포 | 책임 |
| --- | --- | --- |
| Web Front service | `STH-1-Class-One-Group/JamIssue` | React Web Front, Pages 배포, public env, consumer-side API contract |
| Backend/API service | `ClarusIubar/JamIssue_admin` | Worker/API 구현, OAuth/session, provider-side API contract, runtime secret |
| Admin/Data service | `ClarusIubar/JamIssue_admin` | 관리자 기능, DB schema/migration, 데이터 운영, service-role 작업 |

`SPA`는 Web Front service의 구현 방식입니다. API contract 소유권은 MSA 서비스 경계를 기준으로 판단합니다.

## 소유권 구분

| 구분 | 소유 레포 | 의미 |
| --- | --- | --- |
| Consumer-side API client | `STH-1-Class-One-Group/JamIssue` | Web Front가 호출하는 endpoint, request payload, response DTO 기대값 |
| Consumer-side DTO/type | `STH-1-Class-One-Group/JamIssue` | React 화면과 hook이 사용하는 TypeScript 타입 |
| Provider-side API contract | `ClarusIubar/JamIssue_admin` | Worker/API가 실제로 보장해야 하는 endpoint, status, response shape |
| Backend implementation | `ClarusIubar/JamIssue_admin` | Cloudflare Worker, DB access, OAuth, admin API, migration |
| Runtime secret | `ClarusIubar/JamIssue_admin` | OAuth secret, service-role key, Worker runtime secret |

## 이 레포에 남아 있는 API 관련 파일

| 위치 | 책임 |
| --- | --- |
| [../src/api/core.ts](../src/api/core.ts) | `fetchJson`, API base URL, cache, `ApiError`, 인증 만료 이벤트 |
| [../src/api/bootstrapClient.ts](../src/api/bootstrapClient.ts) | bootstrap, map bootstrap, curated courses, festivals, public event banner 호출 |
| [../src/api/authClient.ts](../src/api/authClient.ts) | provider login URL 생성, logout, profile update 호출 |
| [../src/api/reviewsClient.ts](../src/api/reviewsClient.ts) | review, feed, comment, like, upload 호출 |
| [../src/api/myClient.ts](../src/api/myClient.ts) | my page summary, notification, my comments 호출 |
| [../src/api/routesClient.ts](../src/api/routesClient.ts) | community route 생성/조회/like 호출 |
| [../src/api/stampClient.ts](../src/api/stampClient.ts) | stamp claim 호출 |
| [../src/api/adminClient.ts](../src/api/adminClient.ts) | Web Front에서 남아 있는 admin import/visibility 호출부 |
| [../src/types.ts](../src/types.ts) | Web Front consumer DTO barrel |
| [../src/types](../src/types) | auth, core, review, my-page, admin DTO |

## 주요 consumer endpoint 목록

이 목록은 Web Front service가 기대하는 호출면입니다. Provider-side 정본은 `ClarusIubar/JamIssue_admin`에서 관리합니다.

| 영역 | Endpoint |
| --- | --- |
| Bootstrap | `GET /api/bootstrap`, `GET /api/map-bootstrap`, `GET /api/courses/curated` |
| Event | `GET /api/banner/events`, `GET /api/festivals` |
| Auth | `GET /api/auth/{provider}/login`, `POST /api/auth/logout`, `PATCH /api/auth/profile` |
| Review | `GET /api/reviews`, `GET /api/review-feed`, `GET /api/reviews/{reviewId}`, `POST /api/reviews`, `PATCH /api/reviews/{reviewId}`, `DELETE /api/reviews/{reviewId}` |
| Review interaction | `POST /api/reviews/{reviewId}/like`, `GET /api/reviews/{reviewId}/comments`, `POST /api/reviews/{reviewId}/comments`, `PATCH /api/reviews/{reviewId}/comments/{commentId}`, `DELETE /api/reviews/{reviewId}/comments/{commentId}` |
| Upload | `POST /api/reviews/upload` |
| My page | `GET /api/my/summary`, `GET /api/my/notifications`, `GET /api/my/notifications/realtime-channel`, `GET /api/my/comments` |
| Notification | `PATCH /api/notifications/{notificationId}/read`, `PATCH /api/notifications/read-all`, `DELETE /api/notifications/{notificationId}` |
| Stamp | `POST /api/stamps/toggle` |
| Route | `GET /api/community-routes`, `POST /api/community-routes`, `POST /api/community-routes/{routeId}/like` |
| Admin-facing client | `PATCH /api/admin/places/{placeId}`, `POST /api/admin/import/public-data` |

## 변경 규칙

Web Front에서 API client나 DTO를 변경할 때는 아래 기준을 따릅니다.

1. UI 내부 상태 이름 변경은 Web Front service 레포에서 처리할 수 있습니다.
2. Endpoint path, request payload, response DTO shape 변경은 provider-side contract 변경이므로 `ClarusIubar/JamIssue_admin`에서 먼저 확정해야 합니다.
3. Web Front는 provider-side 변경이 병합된 뒤 consumer client와 DTO를 맞춥니다.
4. DB schema, migration, OAuth secret, Worker runtime config는 이 레포에 추가하지 않습니다.
5. API contract 변경 PR에는 관련 provider PR 또는 issue 링크를 남깁니다.

## 검증 기준

Web Front service 레포에서 API 관련 변경을 할 때 최소 검증은 아래와 같습니다.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run build
```

Provider-side API contract 검증, DB migration 검증, Worker route integration test는 `ClarusIubar/JamIssue_admin`에서 수행합니다.

## 현재 남은 문서 리스크

이 레포의 일부 `docs` 문서는 Web Front와 backend가 같은 레포에 있던 시기의 경로를 포함합니다. 예를 들어 `backend/app`, Worker, DB migration 경로가 남아 있을 수 있습니다.

해당 문서는 최신 backend 정본이 아니라 legacy/reference 문서로 봅니다. 최신 소유권은 이 문서와 [README.md](../README.md)를 기준으로 합니다.
