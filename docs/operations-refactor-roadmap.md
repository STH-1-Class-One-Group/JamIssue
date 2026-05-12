# Operations Refactor Roadmap

이 문서는 현재 기능 안정화 이후, 팀 단위로 추진해야 하는 운영 체계성 리팩터링 TODO를 정리한 문서입니다.

중요:
- 아래 항목은 즉시 머지 필수 작업이 아닙니다.
- 현재 앱을 혼자 유지보수하는 수준을 넘어, 팀 규약과 운영 표준을 정하는 작업입니다.
- 따라서 기능 수정처럼 즉흥적으로 진행하지 말고, 선행 조건과 완료 조건을 맞춘 뒤 단계적으로 진행해야 합니다.

## 목적
- 프론트 상태 관리 규칙을 팀 차원에서 정리한다.
- 백엔드 도메인 경계를 더 분명히 하여 책임을 고립한다.
- 운영 배포 후 실제 동작을 자동으로 확인하는 최소 스모크 테스트 체계를 만든다.
- 운영 백엔드는 Worker-first로 두고, FastAPI는 로컬 검증과 레거시 origin fallback 역할로 관리한다.

## 우선순위
1. 운영 스모크 테스트 자동화
2. 프론트 store를 auth/map/review/my 도메인으로 분리
3. FastAPI repository/service 예외 계약 정리
4. Worker route/data/security 경계 분리
5. `repository_normalized.py` 잔여 facade 축소
6. 1.2.9 refactoring release 추적성 정리

## 1. 운영 스모크 테스트 자동화

상태: DONE
우선순위: 높음
성격: 운영 체계 / 배포 안정성

### 배경
현재는 `typecheck`, `build`, `pytest`는 통과해도, 실제 배포 뒤에
- 로그인 붙는지
- 지도 데이터가 로드되는지
- 피드/코스/마이 탭이 비어 있지 않은지
- 관리자 탭이 정상 응답하는지
를 사람이 직접 확인해야 합니다.

### 목표
배포 직후 핵심 사용자 흐름의 실패를 자동으로 감지합니다.

### 완료
- [x] 배포/스모크 순서를 단일 workflow로 고정
- [x] 배포 후 public smoke 실행
- [x] 핵심 API 응답 검증
  - [x] `/api/health`
  - [x] `/api/map-bootstrap`
  - [x] `/api/review-feed`
  - [x] `/api/community-routes`
  - [x] `/api/auth/providers`
- [x] 실패 시 요약 로그 출력

### 남은 후속
- [x] 인증 없는 public smoke와 인증 필요한 protected smoke 분리
- [ ] 브라우저 수준 smoke 시나리오 확장
- [x] protected smoke 토큰 유무에 따른 skip 계약 명시
- [x] protected smoke 엔드포인트 목록 계약 테스트 보강
- [ ] protected smoke 운영 토큰 발급/로테이션 절차 문서화
- [ ] protected smoke 대상 엔드포인트 추가 여부 주기적 점검

### 현재 protected smoke 계약
- `SMOKE_AUTH_BEARER_TOKEN`가 없으면 protected smoke는 실패하지 않고 skip으로 종료한다.
- `SMOKE_AUTH_BEARER_TOKEN`가 있으면 아래 엔드포인트를 인증 상태로 검사한다.
  - `/api/auth/me`
  - `/api/my/summary`
  - `/api/my/notifications`
- public smoke와 protected smoke는 서로 독립적으로 결과를 남긴다.
- protected smoke 엔드포인트 목록과 skip 규칙은 `scripts/smoke/protected.mjs`를 단일 계약 원본으로 사용한다.

### 완료 조건
- 배포 후 최소 1개의 자동 스모크가 실행된다.
- API 단절, 빈 페이지, 로그인 공급자 응답 누락을 자동으로 감지한다.
- 운영자가 브라우저를 열기 전에 실패 여부를 알 수 있다.

## 2. 프론트 store를 auth/map/review/my로 분리

상태: IN PROGRESS
우선순위: 중간
성격: 프론트 구조 표준화

### 배경
현재 Zustand 도입으로 `App.tsx`는 많이 가벼워졌지만, store가 아직 크게 나뉘어 있지 않아 도메인 경계가 완전히 분리된 상태는 아닙니다.

### 목표
도메인별 상태와 액션을 나눠, 새로운 기능 추가 시 영향 범위를 줄입니다.

### 대상 도메인
- `auth-store`
  - 로그인 상태
  - provider 목록
  - 사용자 프로필
  - 관리자 여부
- `map-store`
  - 지도 중심 좌표
  - 줌
  - 선택 장소/행사
  - 카테고리 필터
  - 현재 위치 상태
- `review-store`
  - 피드 목록
  - 리뷰 하이라이트
  - 댓글 시트 상태
  - 리뷰/댓글 페이지네이션
- `my-store`
  - 마이페이지 탭
  - 내 스탬프/피드/댓글/코스 데이터
  - 마이페이지 스크롤 복원 상태

### 진행됨
- [x] `review-ui-store` 1차 분리
  - [x] feed place filter
  - [x] active comment review id
  - [x] highlighted comment/review id
- [x] `my-page-store` 1차 분리
  - [x] my page active tab
- [x] `auth-store` 1차 분리
  - [x] session user
  - [x] auth providers
- [x] `app-map-store` 1차 분리
  - [x] active category
  - [x] selected route preview
- [x] `app-route-store` 1차 분리
  - [x] active tab
  - [x] drawer state
  - [x] selected place / festival id
- [x] `app-runtime-store` 1차 정리
  - [x] notice / current position / map location status
  - [x] review / comment mutation flags
  - [x] feed / my comments pagination flags
- [x] runtime store 2차 분리
  - [x] `app-shell-runtime-store`
  - [x] `app-page-runtime-store`

### 남은 TODO
- [ ] 기존 selector/액션이 어떤 컴포넌트에서 쓰이는지 매핑
- [ ] store 분리 후 컴포넌트별 의존 범위 최소화
- [ ] 전역 notice 같은 cross-cutting 상태는 별도 `ui-shell` 또는 `app-shell` 계층으로 유지할지 결정
- [ ] `App.tsx`가 여러 store를 조합만 하도록 정리

### 완료 조건
- `App.tsx`가 도메인 상태를 직접 많이 들고 있지 않는다.
- 상태 변경 시 무관한 화면 재렌더가 줄어든다.
- 새 기능 추가 시 어느 store를 수정해야 하는지 명확하다.

## 3. `repository_normalized.py`를 도메인별로 분리

상태: IN PROGRESS
우선순위: 중간
성격: 백엔드 구조 표준화

### 배경
헬퍼와 일부 서비스는 이미 분리됐지만, `repository_normalized.py`에는 여전히
- 프로필
- 스탬프
- 리뷰
- 댓글
- 마이페이지 조립
같은 흐름이 많이 남아 있습니다.

### 목표
저장소는 데이터 접근 중심, 서비스는 도메인 흐름 중심이 되도록 경계를 더 분명하게 나눕니다.

### 분리 후보
- `profile_repository.py`
- `stamp_repository.py`
- `review_repository.py`
- `comment_repository.py`
- `my_page_repository.py`

또는 최소한 서비스 우선 분리:
- `ProfileService`
- `StampService`
- `ReviewService`
- `CommentService`

### 진행됨
- [x] review/comment domain repository facade 1차 추가
- [x] `review_service.py`가 review facade를 우선 사용하도록 변경
- [x] `my-page` service/repository 경계 분리
  - [x] `my_page_service.py`
  - [x] `my_page_repository.py`
- [x] `stamp` service/repository 경계 분리
  - [x] `stamp_service.py`
  - [x] `stamp_repository.py`
- [x] `place` service/repository 경계 분리
  - [x] `place_service.py`
  - [x] `place_repository.py`
- [x] `course` service/repository 경계 분리
  - [x] `course_service.py`
  - [x] `course_repository.py`
- [x] `bootstrap` service/repository 경계 분리
  - [x] `bootstrap_service.py`
  - [x] `bootstrap_repository.py`
- [x] `page_service.py`, `page_repository.py` 제거
- [x] service facade 계약 테스트 추가
  - [x] anonymous user 전달값
  - [x] admin flag 전달값
  - [x] not-found / forbidden 매핑
- [x] JWT `crit` 헤더 거부 보안 회귀 복구
- [x] `backend/tests/conftest.py`에서 backend root를 `sys.path`에 고정
- [x] `user_routes_normalized.py`를 호환 facade로 축소하고 실제 로직을 `repositories/route_data_repository.py`로 이동
- [x] repository 예외 계약을 `RepositoryNotFoundError`, `RepositoryValidationError`, `RepositoryPermissionError`로 통일

### 남은 TODO
- [ ] `repository_normalized.py` 공개 함수 목록을 `review/comment/profile/stamp/bootstrap/place/course/my-page` 기준으로 재분류
- [ ] `profile` 경계 분리 여부 결정
- [ ] facade별 import surface를 더 줄일 필요가 있는지 재평가
- [ ] 순차 PR 머지 후 `main` 기준으로 잔여 dead code와 문서 drift 재점검

### 과거 순차 PR 기록

아래 작업은 이미 완료된 FastAPI/Repository 정리 흐름입니다. 새 브랜치 예시로 재사용하지 않습니다.

1. `my-page-service-split`
2. `stamp-service-split`
3. `place-service-split`
4. `course-service-split`
5. `bootstrap-service-split`
6. `page-boundary-cleanup`
7. `facade-contract-tests`

### 완료 조건
- `repository_normalized.py`가 더 이상 프로젝트의 만능 파일이 아니다.
- `main.py -> service -> repository` 흐름이 대부분의 경로에서 일관된다.
- 리뷰/스탬프/프로필 변경 시 관련 파일 경계가 명확하다.

## 3-1. Repo-wide interface locality hardening

상태: DONE
우선순위: 높음
성격: 1.2.9 refactoring release / SOLID / interface locality

### 배경
1.2.9의 config hardening 이후에도 내부 구현 인터페이스 일부가 중앙 barrel 또는 compatibility facade에 남아 있었습니다. 이 상태에서는 실제 소유 모듈과 타입 정의 위치가 멀어져 변경 영향 범위를 판단하기 어렵습니다.

### 목표
공용 타입을 제거하지 않고, public API DTO와 cross-domain model은 중앙에 유지합니다. 대신 runtime/service dependency, Supabase row, mapper input, stage/view props처럼 구현 내부에 가까운 인터페이스는 소유 모듈 근처로 이동합니다.

### 완료
- [x] parent issue #254와 child issue #255~#261로 작업 단위를 materialize
- [x] `docs/interface-locality-baseline.md`와 source-quality gate 추가
- [x] Worker runtime/service contract를 runtime/service/domain 소유 위치로 이동
- [x] Worker data row/DTO contract를 repository/mapper 근처로 이동
- [x] `AppPageStageProps` 중심 `Pick` 의존을 stage-local props로 축소
- [x] `src/components`와 `src/hooks`의 root `src/types.ts` barrel import를 0개로 축소
- [x] FastAPI active app code의 `.models` facade import를 0개로 축소

### 완료 근거
| Issue | PR | Main merge SHA |
| --- | --- | --- |
| #255 | #262 | `852728bda993710c09de8adb07711be0d5cb5968` |
| #256 | #263 | `5d88d6a15536c6ac04ed58bc4d26ca43d01ad8d7` |
| #257 | #264, #265 | `23b65010575e3f033dff44ec04f6801199b02ce8`, `3464b303004ca6409ca4c1b2d1ed96b313844cd5` |
| #258 | #266 | `b7140db222b99cbc15c88e1eaefc0d2f1fc0202e` |
| #259 | #267 | `d589761066188632a72f6adbb6b6099b61fd8a35` |
| #260 | #268 | `3242d0ae6fa88c617f0bbcc681b469926fd06c31` |

### 남은 후속
- [ ] #261에서 1.2.9 Wiki release note와 roadmap mirror를 final SHA 기준으로 갱신
- [ ] 최종 릴리즈 전 Dependabot/code-scanning open alert 상태를 권한 있는 Security 경로로 재확인

## 4. Worker route/data/security 경계 분리

상태: DONE
우선순위: 높음
성격: 운영 백엔드 구조 안정화

### 배경
운영 기준 백엔드는 Cloudflare Worker입니다. 기존 Worker 진입점은 인증, 라우팅, 기본 데이터 로딩, 매핑 책임이 `index.ts`에 같이 섞여 있어 리뷰와 회귀 검증 비용이 컸습니다.

### 진행됨
- [x] Worker 공통 타입 추가
  - [x] `WorkerEnv`
  - [x] `WorkerSessionUser`
  - [x] `SupabaseRequestOptions`
- [x] OAuth/session 발급 시 `APP_SESSION_SECRET` 또는 `APP_JWT_SECRET` 누락을 503으로 차단
- [x] Kakao/Naver provider 설정 회귀 테스트 추가
- [x] OAuth state mismatch, admin 403, public event import token 회귀 테스트 추가
- [x] Worker 소스가 긴 한 줄 blob으로 돌아가지 않도록 unit 품질 게이트 추가
- [x] `index.ts` composition root, `runtime/routing.ts` dispatch, `runtime/route-registry.ts` route registry로 분리
- [x] `runtime/base-data.ts`를 repository, mapper, assembler로 분리
- [x] review/comment/notification 흐름을 domain repository/mapper/service-use-case로 분리
- [x] my/community/admin 흐름을 domain repository/mapper/service boundary로 분리
- [x] fallback proxy를 `runtime/proxy.ts`로 분리

### 완료 근거

| Issue | PR | Main merge SHA |
| --- | --- | --- |
| #200 | #224 | `64bd982e1ca8880d81ff3e9608a77ab8f9ce06c3` |
| #201 | #225 | `4583b15985f832790e3399306f7ba2f7f4ac24a3` |
| #202 | #226 | `cdf774a4ec1ea39f332e9c8a3f0fe085c05e5bcc` |
| #203 | #227 | `93d13f7ab58908727c291028486bd6b7159a26e7` |
| #204 | #228 | `21dd8d58ac51ea3a980018e68261e493a47d7264` |
| #205 | #229 | `3da0fdd7bf9aafadd0aeaa5300169ddab7036fd3` |

### 남은 후속
- [ ] 운영 protected smoke 토큰 발급/로테이션 절차와 Worker 세션 시크릿 로테이션 절차 연결
- [ ] Worker `services/festivals.ts`의 public data adapter 경계 재평가
- [ ] Supabase realtime adapter 경계 분리 여부 검토

### 완료 조건
- Worker `index.ts`가 부트스트랩과 fetch error boundary 중심으로 유지된다.
- 인증/session, route dispatch, base data loading이 서로 다른 파일에서 관리된다.
- 세션 secret 누락, OAuth state mismatch, admin 403, import token 오류가 테스트로 고정된다.

## 실행 원칙
- 현재 동작과 UI를 깨지 않는 범위에서 단계적으로 진행합니다.
- 각 단계마다 아래 검증을 유지합니다.
  - `npm run typecheck`
  - `npm run build`
  - `backend/.venv/Scripts/python.exe -m pytest tests`
- 프론트 훅/스토어 리팩토링 중 실제로 쓰이지 않는 중복 모듈은 즉시 제거합니다.
- 한 번에 전부 하지 않고, 도메인 하나씩 독립 PR로 나눕니다.
- 운영 경로를 건드리는 작업은 배포 전 smoke 절차가 먼저 있어야 합니다.

## 지금 결론
Worker-first backend SOLID hardening은 1차 마감선까지 도달했습니다.
레포 전역 하드코딩 수치/좌표 Config hardening은 별도 parent issue #238과 sub-issue #239~#245로 분리해 1.2.9 후보 범위로 추적합니다.

## 5. 하드코딩 수치/좌표 Config hardening

상태: IN PROGRESS
우선순위: 높음
성격: 레포 전역 유지보수성 / 품질 게이트

### 배경

PR #237에서 Naver marker 선택 업데이트를 O(N)에서 O(1)로 줄이는 과정에서 marker anchor, z-index, zoom, selection offset, geolocation radius, cache TTL, upload limit, UI layout 수치가 여러 계층에 흩어져 있음을 확인했습니다.

### 목표

의미 있는 숫자, 좌표, 위치, 시간, 용량, 레이아웃 값을 owner-specific config class 또는 CSS token으로 옮기고, 새 raw number가 다시 들어오지 않도록 quality gate를 둡니다.

### 완료 근거

| Issue | PR | Main merge SHA |
| --- | --- | --- |
| #239 | #246 | `e70ded4f21bd8f2e9a7fa0644d699e626c9a9897` |
| #240 | #247, #248 | `141f27d1803e499dc74c49bccff2c272074aae1e`, `2597f982e1bff0ece06e98020f8cd624472721e4` |
| #241 | #249 | `1e87b79d113e0376345b5985440f8496982b240b` |
| #242 | #250 | `a20928a7ed64dd88fd91c3b6b9eb85781c1c15be` |
| #243 | #251 | `3bcbbc4fd9e28d3b70f4899461e95dafbb7eb9e4` |
| #244 | #252 | `08bfdcfa9071b69bf84e33828b27f608529ea2b7` |
| #245 | #253 | 문서/릴리즈 traceability PR 진행 중 |

### 기준 문서

- [config-hardening-traceability.md](config-hardening-traceability.md)

다음 리팩터링도 기능 추가와 섞지 말고, 별도 parent issue와 sub-issue를 먼저 만든 뒤 진행합니다.

## 6. Worker residual boundary hardening

상태: IMPLEMENTATION COMPLETE, DOCS IN PROGRESS
우선순위: 높음
성격: 1.2.10 refactoring candidate / Worker backend boundary / source-quality gate

### 배경

1.2.9 이후 실제 Worker 코드 기준으로 다시 확인한 결과, Worker-first backend의 큰 경계는 정리됐지만 일부 잔여 결합 지점이 남아 있었습니다.

- `services/festivals.ts`에 import, normalize, repository, cache, response 책임이 집중되어 있었습니다.
- review/community/my mapper가 `any[]`, `Map<any, any>` row 계약에 의존했습니다.
- admin/stamp/notification/auth/review-interaction handler에 `env:any`, `Promise<any>`, 암묵적 body/deps contract가 남아 있었습니다.

### 완료 범위

| Issue | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- |
| #273 | #279 | `5fddc64d0f8b8a1f94f3505d2fb911958aa49a35` | residual boundary inventory와 source-quality gate 기준선 |
| #274 | #280 | `cb04022cd5fd091ddf0c61d56726f8eb1f818975` | festival repository/mapper/import/cache/use-case 책임 분리 |
| #275 | #281 | `9852b88aafb2fadac60b9d7152e3acf56462d50f` | review/community/my mapper row contract 명시 |
| #276 | #282 | `1470968e80c0c63bfa4bbcce5024ee1e7580e314` | admin/stamp/notification/auth/review-interaction handler contract typing |
| #277 | #283 | TBD | Wiki, roadmap, release candidate traceability 정리 |

### 검증 근거

최신 구현 SHA `1470968e80c0c63bfa4bbcce5024ee1e7580e314` 기준으로 아래 원격 검증이 성공했습니다.

- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362768
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362938
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362433
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362456
- Dependabot open alerts: 0
- Code scanning open alerts: 0

### 남은 후속

- [ ] #277 문서 PR merge 후 parent issue #272에 final main SHA, CI 링크, Security 0건 기록
- [ ] 1.2.10 정식 릴리즈 여부는 #277 merge 이후 열린 PR/이슈/Security 상태를 다시 확인한 뒤 결정
- [ ] FastAPI `repository_normalized.py` 잔여 정리와 브라우저 E2E smoke 확장은 별도 parent issue로 분리

### 기준 문서

- [worker-residual-boundary-traceability.md](worker-residual-boundary-traceability.md)

## 7. Architecture regression hardening

상태: IMPLEMENTATION COMPLETE, DOCS IN PROGRESS
우선순위: 높음
성격: 1.2.11 refactoring candidate / architecture fitness function / interface-locality regression guard

### 배경

TSK-004까지 Worker 내부 경계를 정리했지만, 이후 작업에서 이전 구조로 되돌아갈 가능성을 막는 자동 검증층이 더 필요했습니다. 이번 단계는 새 기능이 아니라 구조 회귀를 막는 source-quality gate와 persistence boundary fitness function을 추가하는 작업입니다.

### 완료 범위

| Issue | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- |
| #287 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | architecture regression baseline과 source-quality gate 기준선 |
| #288 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | `src/types` 역방향 import와 root type barrel 회귀 차단 |
| #289 | #295 | `bbbc572f6fd6c6869d5ba2b810d82d452e458aad` | review read persistence를 repository 경계로 이동 |
| #290 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | Worker source readability/statement-density gate 추가 |
| #291 | #294 | `fc6e8b81f02e1409202c6c03fc5d377fb5503abf` | Naver map SDK `any`를 local contract로 격리 |
| #292 | TBD | TBD | Wiki, release candidate, docs traceability 정리 |
| #296 | #298 | `d8eff3e8d4ed26484f1735fbf4ee9ca3ef83fe4c` | stamp persistence를 repository 경계로 이동 |
| #297 | #299 | `29b89092aeb6dd6dce07e4b09302edea8651564f` | notification persistence와 realtime publisher를 domain 경계로 이동 |

### 회귀 차단 기준

- `src/types/**`가 `src/api/**`를 import하지 못합니다.
- `src/components/**`와 `src/hooks/**`가 root `src/types.ts` barrel import로 회귀하지 못합니다.
- Worker global `types.ts`에 domain row/service contract가 다시 추가되지 못합니다.
- Worker tracked TS 파일이 one-line blob, 초장문 라인, statement-density 과밀 형태로 회귀하지 못합니다.
- Naver map SDK `any`가 local contract 밖으로 새지 못합니다.
- review/stamp/notification service가 repository/adapter 경계 밖에서 `supabaseRequest`를 직접 호출하지 못합니다.

### 검증 근거

최신 구현 SHA `29b89092aeb6dd6dce07e4b09302edea8651564f` 기준으로 아래 원격 검증이 성공했습니다.

- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928658
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928664
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928103
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928111
- Dependabot open alerts: 0
- Code scanning open alerts: 0

### 기준 문서

- [architecture-regression-traceability.md](architecture-regression-traceability.md)
