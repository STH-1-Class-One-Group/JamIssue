# TSK-006-03 Frontend Hook Navigation Readability

Scope-ID: `TSK-006-03-FRONTEND-HOOK-NAVIGATION-READABILITY`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/306
PR: `TBD-TSK-006-03-FRONTEND-HOOK-NAVIGATION-READABILITY`
Branch: `frontend-hook-navigation-readability`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/306

## Purpose

`src/hooks` 루트에 몰려 있던 app bootstrap, app coordinator, route, stage props, tab loader 계열 hook을 기존 owner folder로 이동해 사람이 읽을 때 탐색해야 하는 루트 파일 수를 줄인다.

## Current Decisions

- 새 abstraction은 추가하지 않는다.
- 동작, 사용자-facing copy, API path, response shape, DB schema, OAuth 성공 경로는 변경하지 않는다.
- public hook import 경로는 실제 이동 위치로 갱신한다.
- compatibility re-export 파일을 루트에 남기지 않는다. 루트 파일 수를 줄이는 것이 이번 child issue의 목적이다.

## PR Scope

- `src/hooks` direct root TS/TSX 파일 수: 62 -> 35
- `src/hooks` direct root tiny 파일 수: 13 -> 9
- app bootstrap/coordinator/route/stage props/tab loader 계열 파일을 owner folder로 이동
- 관련 source-quality test와 affected unit test import 경로 갱신

## Validation Results

- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd exec vitest -- run test/unit/architecture-readability-source-quality.test.ts` 통과
- [x] `npm.cmd exec vitest -- run test/unit/interface-locality-source-quality.test.ts test/unit/useAppRouteState.test.ts` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과
- [ ] PR checks

## Remaining Follow-Up Work

- #307에서 250라인 초과 내부 파일을 업무 언어 기준으로 검토한다.
- #308에서 final readability gate와 Wiki/release traceability를 갱신한다.
