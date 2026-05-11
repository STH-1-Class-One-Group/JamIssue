# TSK-004-04 Worker Service Handler Contracts

Scope-ID: `TSK-004-04-WORKER-SERVICE-HANDLER-CONTRACTS`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/276
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/282
Branch: `worker-service-handler-contracts`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/276

## Purpose

Worker admin/stamp/notification/auth/review-interaction handler의 `env`, JSON body, dependency contract를 명시 타입으로 좁혔다. 외부 REST endpoint, response shape, DB schema, 사용자-facing copy, Kakao/Naver OAuth 성공 경로는 변경하지 않았다.

## Current Decisions

- admin dependency contract는 `services/admin-domain/contracts.ts`가 소유한다.
- stamp dependency contract는 `services/stamp-domain/contracts.ts`가 소유한다.
- notification row/create payload 계약은 notification service 내부에 둔다.
- auth/review-interaction JSON body는 `WorkerJsonRecord`로 좁힌다.
- Naver profile response는 upsert social user 계약에 맞게 명시 shape로 변환한다.
- global Worker type barrel인 `deploy/api-worker-shell/types.ts`에는 domain handler 타입을 추가하지 않았다.

## Before And After Inventory

| File | Metric | Before | After |
| --- | --- | ---: | ---: |
| `deploy/api-worker-shell/services/admin.ts` | `any` | 6 | 0 |
| `deploy/api-worker-shell/services/admin.ts` | `env:any` | 5 | 0 |
| `deploy/api-worker-shell/services/admin.ts` | `category:any` | 1 | 0 |
| `deploy/api-worker-shell/services/auth.ts` | `Promise<any>` | 2 | 0 |
| `deploy/api-worker-shell/services/review-interactions.ts` | `Promise<any>` | 1 | 0 |
| `deploy/api-worker-shell/services/notifications.ts` | implicit env handler signatures | 10 | 0 |
| `deploy/api-worker-shell/services/stamps.ts` | implicit env handler signatures | 1 | 0 |
| `deploy/api-worker-shell/services/stamps.ts` | implicit `readJsonBody(request)` | 1 | 0 |

## Issue Scope

- #276: Worker service handler contract typing
- #273~#275: 완료된 선행 child issue
- #277: 문서와 release traceability 후속 작업

## PR Scope

이번 PR은 아래만 포함한다.

- admin service deps/env/body 타입 명시
- auth profile update JSON body와 social profile callback 타입 명시
- review interaction JSON command body 타입 명시
- stamp service deps/env/body 타입 명시
- notification env/id/payload/row 타입 명시
- source-quality gate를 handler contract `any` 회귀 차단 기준으로 강화

## Validation Results

로컬 검증 결과는 아래와 같다.

- [x] targeted Vitest: `worker-source-quality`, `worker-review-domain`, `worker-account-community-admin-boundaries`, `worker-auth-security` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] `git diff --cached --check` 통과
- [x] UTF-8 integrity check 통과: `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged`
- [ ] PR checks: PR 생성 후 기록
- [ ] main merge SHA: PR merge 후 기록
- [ ] main CI/production-smoke/CodeQL: PR merge 후 기록
- [ ] Dependabot/code scanning open alert 0건: PR merge 후 기록

## Validation Note

`npm.cmd run test:unit`는 sandbox cwd에서 `D:/JamIssue/test/setup.ts`를 못 찾는 경로 문제로 한 번 실패했다. 동일 명령을 실제 workspace `D:\JamIssue`에서 재실행해 통과했으며, 코드 실패는 아니었다.

## Remaining Follow-Up Work

- #277에서 TSK-004 전체 Wiki, roadmap, release candidate, parent/child evidence를 정리한다.
