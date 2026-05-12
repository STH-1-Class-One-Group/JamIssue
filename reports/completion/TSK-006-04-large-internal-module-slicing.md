# TSK-006-04 Large Internal Module Slicing

Scope-ID: `TSK-006-04-LARGE-INTERNAL-MODULE-SLICING`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/307
PR: `TBD-TSK-006-04-LARGE-INTERNAL-MODULE-SLICING`
Branch: `large-internal-module-slicing`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/307

## Purpose

250라인을 넘는 내부 구현 파일을 업무 언어 기준으로 나눠 호출자가 facade만 보고 진입할 수 있게 한다.

## Current Decisions

- 동작, 사용자-facing copy, API path, response shape, DB schema, OAuth 성공 경로는 변경하지 않는다.
- `festival-domain/mapper.ts`와 `review-interactions.ts`는 기존 import surface를 유지하는 facade로 축소한다.
- `auth.ts`와 `auth/session.ts`는 보안 흐름의 public boundary 성격이 강하므로 이번 child issue에서는 예외로 남기고 기준선에 명시한다.

## PR Scope

- `festival-domain/mapper.ts` 457라인 구현 파일을 14라인 facade로 축소
- festival mapper 책임을 date, text, coordinate, series, import mapper, response mapper, ID 모듈로 분리
- `review-interactions.ts` 354라인 구현 파일을 13라인 route-facing facade로 축소
- review interaction 책임을 upload, review write, comment, like, shared guard 모듈로 분리
- architecture readability gate의 large file 기준선을 `auth.ts`, `auth/session.ts`만 남도록 갱신

## Validation Results

- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd exec vitest -- run test/unit/architecture-readability-source-quality.test.ts test/unit/worker-source-quality.test.ts test/unit/worker-festival-domain.test.ts test/unit/worker-review-domain.test.ts` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과
- [ ] PR checks

## Remaining Follow-Up Work

- #308에서 auth/auth-session large file 예외와 readability gate 결과를 Wiki/release traceability에 기록한다.
