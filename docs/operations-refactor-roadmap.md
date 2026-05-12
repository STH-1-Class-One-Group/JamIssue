# Operations Refactor Roadmap

이 문서는 JamIssue의 리팩터링 흐름, 완료 근거, 릴리즈 반영 상태를 추적합니다. 리팩터링은 구조, 책임 경계, 이름 안전성, 의존성 흐름, 테스트/품질 게이트 보강에 한정합니다.

## 공통 원칙

- 사용자-facing copy 변경 금지
- 외부 API path/response shape 변경 금지
- DB schema 변경 금지
- Kakao/Naver OAuth 성공 경로 변경 금지
- parent issue와 child issue 없이 대규모 구현 진행 금지
- 완료 판단은 PR, merge SHA, CI, CodeQL, 보안 alert 상태, 로컬 검증 명령으로 기록

## 릴리즈 반영 현황

| 릴리즈 | 상태 | 포함 범위 | 기준 commit |
| --- | --- | --- | --- |
| `1.2.8` | 정식 릴리즈 | Worker-first SOLID hardening 이전 안정화 | `ee7bde3f76f0d700ff774e2527b2061ce68d0108` |
| `1.2.9` | 정식 릴리즈 | repo-wide numeric/config hardening, interface-locality hardening | `6385c2172d17bb3e22794dd21619409ebef00acd` |
| `1.2.10` | 정식 릴리즈 | Worker residual boundary hardening, architecture/interface-locality regression hardening, review allocation 최적화 | `3984be45ca5b292c4e0bef7482f87fdf74159e86` |

## TSK-004 Worker Residual Boundary Hardening

Status: completed
Release: `1.2.10`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272

### 목적

`1.2.9` 이후 실제 Worker 코드 기준으로 남아 있던 잔여 결합을 제거했습니다. 핵심 대상은 festival 책임 과밀, mapper `any` row 계약, handler env/body/deps contract 미정형화였습니다.

### 완료 범위

| Issue | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- |
| #273 | #279 | `5fddc64d0f8b8a1f94f3505d2fb911958aa49a35` | residual boundary inventory와 source-quality gate 기준선 |
| #274 | #280 | `cb04022cd5fd091ddf0c61d56726f8eb1f818975` | festival repository/mapper/import/cache/use-case 책임 분리 |
| #275 | #281 | `9852b88aafb2fadac60b9d7152e3acf56462d50f` | review/community/my mapper row contract 명시 |
| #276 | #282 | `1470968e80c0c63bfa4bbcce5024ee1e7580e314` | admin/stamp/notification/auth/review-interaction handler contract typing |
| #277 | #283 | `a9338dc93e57dc61f008b5655b6604a30c98cde6` | Wiki, roadmap, release traceability 정리 |

### 기준 문서

- [worker-residual-boundary-traceability.md](worker-residual-boundary-traceability.md)

## TSK-005 Architecture and Interface-Locality Regression Hardening

Status: completed
Release: `1.2.10`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/286

### 목적

TSK-004까지 정리한 Worker-first backend와 interface-locality 경계가 이후 작업에서 이전 구조로 회귀하지 않도록 fitness function을 보강했습니다. 기존에 `1.2.11 후보`로 기록했던 범위는 정식 발행 시점에 `1.2.10`으로 흡수했습니다.

### 완료 범위

| Issue | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- |
| #287 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | architecture regression baseline과 source-quality gate 기준선 |
| #288 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | `src/types` 역방향 import와 root type barrel 회귀 차단 |
| #289 | #295 | `bbbc572f6fd6c6869d5ba2b810d82d452e458aad` | review read persistence를 repository 경계로 이동 |
| #290 | #293 | `7a9a08f71ed35efeccb52d790cd37af8700575da` | Worker source readability/statement-density gate 추가 |
| #291 | #294 | `fc6e8b81f02e1409202c6c03fc5d377fb5503abf` | Naver map SDK `any`를 local contract로 격리 |
| #292 | #300 | `35f4152f5d638a9ebcb5db1836eb04e45c2d5088` | Wiki, release, docs traceability 정리 |
| #296 | #298 | `d8eff3e8d4ed26484f1735fbf4ee9ca3ef83fe4c` | stamp persistence를 repository 경계로 이동 |
| #297 | #299 | `29b89092aeb6dd6dce07e4b09302edea8651564f` | notification persistence와 realtime publisher를 domain 경계로 이동 |

### 기준 문서

- [architecture-regression-traceability.md](architecture-regression-traceability.md)

## Performance Maintenance Included in 1.2.10

| PR | Main merge SHA | 완료 근거 |
| --- | --- | --- |
| #278 | `c5f4f1e` | review collection 상태 업데이트에서 불필요한 React state update 우회 |
| #301 | `3984be45ca5b292c4e0bef7482f87fdf74159e86` | `getKnownMyReviews` 중간 배열 allocation 제거와 precedence 회귀 테스트 |

## 1.2.10 최종 검증 근거

- 열린 PR: 0
- 열린 이슈: 0
- Dependabot open alerts: 0
- Code scanning open alerts: 0
- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942439
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942430
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714941975
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942006

## 현재 회귀 방지 게이트

- numeric literal audit
- interface-locality source-quality gate
- Worker source-quality gate
- Worker one-line blob/long-line/statement-density gate
- Worker persistence boundary gate
- Naver map SDK local contract gate
- UTF-8 integrity check

## 다음 후보

다음 리팩터링은 새 parent issue와 child issue를 먼저 만든 뒤 진행합니다.

- Node.js 20 GitHub Actions deprecation warning 정리
- FastAPI `repository_normalized.py` 잔여 정리
- 브라우저 수준 E2E smoke 확장
- 앱 레포와 공유할 API contract test 보강

## 중단 조건

아래 상황이면 리팩터링을 멈추고 별도 설계 이슈로 분리합니다.

- API response shape 변경 필요
- DB schema 변경 필요
- OAuth 성공 경로 변경 필요
- 사용자-facing copy 변경 필요
- 관리자 권한 모델 변경 필요
- 테스트 없는 대규모 이동 필요
- child issue 없는 작업 발견
