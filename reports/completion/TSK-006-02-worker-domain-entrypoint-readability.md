# TSK-006-02 Worker Domain Entrypoint Readability

Scope-ID: `TSK-006-02-WORKER-DOMAIN-ENTRYPOINT-READABILITY`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/305
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/310
Branch: `worker-domain-entrypoint-readability`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/305

## Purpose

Worker domain 외부 caller가 `contracts`, `mapper`, `repository` 같은 내부 파일명을 직접 알지 않아도 되도록 domain-local public entrypoint를 추가한다. 이 작업은 global barrel 회귀가 아니라 각 domain 소유 경계 안에서 읽기 시작점을 명확히 하는 작업이다.

## Current Decisions

- `services/*.ts` HTTP/service facade는 유지한다.
- `*-domain/index.ts`는 domain-local public entrypoint로만 사용한다.
- global `deploy/api-worker-shell/types.ts`에는 domain contract를 추가하지 않는다.
- 외부 API path, response shape, DB schema, 사용자-facing copy, OAuth 성공 경로는 변경하지 않는다.

## PR Scope

- Worker `*-domain/index.ts` public entrypoint 추가
- Worker service/runtime/index 계층의 `*-domain/contracts`, `mapper`, `repository` 직접 import를 domain root import로 전환
- `worker-source-quality`에 domain internal import 회귀 방지 gate 추가

## Validation Results

- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd exec vitest -- run test/unit/worker-source-quality.test.ts` 통과
- [x] `npm.cmd exec vitest -- run test/unit/architecture-readability-source-quality.test.ts` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과
- [ ] PR checks

## Remaining Follow-Up Work

- #306에서 frontend hook navigation 구조를 정리한다.
- #307에서 250라인 초과 내부 파일을 업무 언어 기준으로 검토한다.
- #308에서 최종 readability 문서와 release traceability를 갱신한다.
