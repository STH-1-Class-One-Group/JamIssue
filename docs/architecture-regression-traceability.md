# Architecture Regression Traceability

Scope-ID: `TSK-005-00-ARCHITECTURE-REGRESSION-HARDENING`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/286
Status: `implementation-complete-docs-in-progress`
Release candidate: `1.2.11`

이 문서는 TSK-004 이후의 Worker-first backend와 interface-locality 구조가 이전 형태로 회귀하지 않도록 추가한 fitness function과 완료 근거를 추적합니다. 기록 기준은 평가 문구가 아니라 실제 회귀 차단 조건, PR, merge SHA, 검증 결과입니다.

## 변경 금지 범위

- 사용자-facing copy 변경 없음
- 외부 REST API path/response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver OAuth 성공 경로 변경 없음
- 신규 사용자 기능 추가 없음

## 작업 범위

| Scope-ID | Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `TSK-005-01` | [#287](https://github.com/STH-1-Class-One-Group/JamIssue/issues/287) | `architecture-regression-audit-gates` | [#293](https://github.com/STH-1-Class-One-Group/JamIssue/pull/293) | `7a9a08f71ed35efeccb52d790cd37af8700575da` | architecture regression baseline과 source-quality gate 기준선 |
| `TSK-005-02` | [#288](https://github.com/STH-1-Class-One-Group/JamIssue/issues/288) | `frontend-interface-regression-gates` | [#293](https://github.com/STH-1-Class-One-Group/JamIssue/pull/293) | `7a9a08f71ed35efeccb52d790cd37af8700575da` | `src/types` 역방향 import와 root type barrel 회귀 차단 |
| `TSK-005-03` | [#289](https://github.com/STH-1-Class-One-Group/JamIssue/issues/289) | `worker-persistence-boundary-review-read` | [#295](https://github.com/STH-1-Class-One-Group/JamIssue/pull/295) | `bbbc572f6fd6c6869d5ba2b810d82d452e458aad` | review read persistence를 `review-domain/read-repository.ts` 경계로 이동 |
| `TSK-005-04` | [#290](https://github.com/STH-1-Class-One-Group/JamIssue/issues/290) | `worker-source-readability-gate` | [#293](https://github.com/STH-1-Class-One-Group/JamIssue/pull/293) | `7a9a08f71ed35efeccb52d790cd37af8700575da` | Worker tracked TS long-line과 statement-density 회귀 차단 |
| `TSK-005-05` | [#291](https://github.com/STH-1-Class-One-Group/JamIssue/issues/291) | `frontend-naver-map-sdk-contract` | [#294](https://github.com/STH-1-Class-One-Group/JamIssue/pull/294) | `fc6e8b81f02e1409202c6c03fc5d377fb5503abf` | Naver map SDK `any`를 local contract로 격리하고 gate를 0으로 낮춤 |
| `TSK-005-06` | [#292](https://github.com/STH-1-Class-One-Group/JamIssue/issues/292) | `architecture-regression-docs-traceability` | TBD | TBD | Wiki/release/docs traceability 정리 |
| `TSK-005-07` | [#296](https://github.com/STH-1-Class-One-Group/JamIssue/issues/296) | `worker-stamp-persistence-boundary` | [#298](https://github.com/STH-1-Class-One-Group/JamIssue/pull/298) | `d8eff3e8d4ed26484f1735fbf4ee9ca3ef83fe4c` | stamp persistence를 `stamp-domain/repository.ts` 경계로 이동 |
| `TSK-005-08` | [#297](https://github.com/STH-1-Class-One-Group/JamIssue/issues/297) | `worker-notification-persistence-boundary` | [#299](https://github.com/STH-1-Class-One-Group/JamIssue/pull/299) | `29b89092aeb6dd6dce07e4b09302edea8651564f` | notification persistence와 realtime broadcast를 domain repository/publisher로 격리 |

## 회귀 차단 규칙

`test/unit/interface-locality-source-quality.test.ts`와 `test/unit/worker-source-quality.test.ts`가 아래 회귀를 차단합니다.

- `src/types/**`가 `src/api/**`를 import하는 경우
- `src/components/**` 또는 `src/hooks/**`가 root `src/types.ts` barrel import로 회귀하는 경우
- Worker global `types.ts`에 domain row/service contract가 다시 추가되는 경우
- Worker service constructor dependency contract가 `any`로 회귀하는 경우
- Worker tracked TS 파일이 one-line blob, 초장문 라인, statement-density 과밀 형태로 회귀하는 경우
- Naver map SDK `any`가 `src/components/naver-map` local contract 밖으로 새는 경우
- review/stamp/notification service가 repository/adapter 경계 밖에서 `supabaseRequest`를 직접 호출하는 경우

## Persistence Boundary 결과

| Service | 이전 직접 호출 | 정리 결과 | Gate |
| --- | ---: | --- | --- |
| `services/reviews.ts` | `supabaseRequest` 23회 | `review-domain/read-repository.ts`로 이동 | direct count 0 |
| `services/stamps.ts` | `supabaseRequest` 10회 | `stamp-domain/repository.ts`로 이동 | direct count 0 |
| `services/notifications.ts` | `supabaseRequest` 11회 | `notification-domain/repository.ts`로 이동 | direct count 0 |
| realtime notification broadcast | service 내부 `fetch` | `notification-domain/publisher.ts`로 이동 | service 내 broadcast endpoint 0 |

## 검증 근거

각 구현 PR에서 공통으로 확인한 로컬 검증입니다.

- `npm.cmd run check:numeric-literals`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test:unit`
- `npm.cmd run build`
- `git diff --check`
- UTF-8 integrity check

최신 구현 SHA `29b89092aeb6dd6dce07e4b09302edea8651564f` 기준 원격 검증입니다.

- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928658
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928664
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928103
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25713928111
- Dependabot open alerts: 0
- Code scanning open alerts: 0

## 남은 범위

- #292 문서 PR merge SHA는 이 PR merge 후 #286/#292 이슈에 기록합니다.
- 1.2.11은 아직 후보이며, 정식 GitHub Release/tag 발행 대상은 아닙니다.
- Node.js 20 GitHub Actions deprecation warning은 이번 TSK-005 범위가 아니며 별도 CI maintenance 이슈로 분리합니다.
