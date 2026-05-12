# TSK-006-01 Architecture Readability Audit

Scope-ID: `TSK-006-01-ARCHITECTURE-READABILITY-AUDIT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/304
PR: `TBD-TSK-006-01-ARCHITECTURE-READABILITY-AUDIT`
Branch: `architecture-readability-audit`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/304

## Purpose

TSK-006의 첫 작업으로 human-readable architecture 기준선을 실제 코드 수치로 고정한다. 이 작업은 파일 이동이나 구조 변경을 수행하지 않고, 후속 child issue가 낮춰야 할 navigation cost를 테스트와 문서로 잠근다.

## Current Decisions

- `services/*.ts` public facade와 interface-locality 경계는 유지한다.
- 이번 PR은 audit/gate slice이며 mass file movement를 하지 않는다.
- 외부 API path, response shape, DB schema, 사용자-facing copy, Kakao/Naver OAuth 성공 경로는 변경하지 않는다.
- 후속 #305~#307은 이 기준선을 낮추거나, 예외가 필요하면 근거를 남기고 gate를 갱신해야 한다.

## Issue Scope

- #303: TSK-006 parent roadmap
- #304: architecture readability audit and baseline gate
- #305: Worker domain entrypoint readability
- #306: Frontend hook navigation readability
- #307: Large internal module slicing
- #308: Readability gates and docs

## PR Scope

- `test/unit/architecture-readability-source-quality.test.ts` 추가
- `docs/human-readable-architecture-baseline.md` 추가
- 이 completion report 추가

## Validation Results

- [x] `npm.cmd exec vitest -- run test/unit/architecture-readability-source-quality.test.ts` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과: `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged`
- [ ] PR checks: PR 생성 후 기록

## Remaining Follow-Up Work

- #305에서 Worker domain public entrypoint와 internal reading path를 정리한다.
- #306에서 `src/hooks` 루트 62개 직접 파일을 owner folder 기준으로 낮춘다.
- #307에서 250라인 초과 production TS/TSX 파일 4개를 업무 언어 기준으로 검토한다.
- #308에서 최종 gate와 Wiki/release traceability를 정리한다.
