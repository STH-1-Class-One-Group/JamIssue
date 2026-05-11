# TSK-004-02 Worker Festival Boundary Split

Scope-ID: `TSK-004-02-WORKER-FESTIVAL-BOUNDARY-SPLIT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/274
PR: `TBD-TSK-004-02-WORKER-FESTIVAL-BOUNDARY-SPLIT`
Branch: `worker-festival-boundary-split`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/274

## Purpose

`deploy/api-worker-shell/services/festivals.ts`에 섞여 있던 public handler, cache, Supabase repository, import orchestration, mapper 책임을 `festival-domain` 내부 모듈로 분리한다. 외부 REST endpoint와 응답 shape는 유지한다.

## Current Decisions

- public handler entry point는 `handleFestivals`, `handleBannerEvents`, `handleFestivalImport` 그대로 유지한다.
- Supabase 호출은 `services/festival-domain/repository.ts`로 이동한다.
- normalize, merge, deduplicate, card/banner mapping은 `services/festival-domain/mapper.ts`로 이동한다.
- import sequence는 `services/festival-domain/import-service.ts`로 이동한다.
- in-memory festival cache는 `services/festival-domain/cache.ts`로 이동한다.
- festival read model assembly는 `services/festival-domain/read-service.ts`로 이동한다.
- 사용자-facing copy, REST path, response shape, DB schema, OAuth 흐름은 변경하지 않는다.

## Before And After Inventory

| File | Before | After |
| --- | ---: | ---: |
| `deploy/api-worker-shell/services/festivals.ts` lines | 194 | 92 |
| `deploy/api-worker-shell/services/festivals.ts` chars | 22,310 | 3,670 |
| `deploy/api-worker-shell/services/festivals.ts` `supabaseRequest` | 9 | 0 |
| `deploy/api-worker-shell/services/festivals.ts` `any` | 3 | 0 |
| `deploy/api-worker-shell/services/festival-domain/repository.ts` `supabaseRequest` | 해당 없음 | 9 |
| `deploy/api-worker-shell/services/festival-domain/mapper.ts` `any` | 해당 없음 | 0 |

## Issue Scope

- #274: festival service boundary split
- #273: baseline gate completed by PR #279
- #275~#277: 후속 mapper/handler/docs 작업

## PR Scope

이번 PR은 아래만 포함한다.

- `services/festival-domain/*` 모듈 추가
- `services/festivals.ts` thin handler화
- festival read/import/cache/mapper 회귀 테스트 추가
- numeric literal baseline 갱신

## Validation Results

로컬 검증 결과는 아래와 같다.

- [x] targeted Vitest: `worker-festival-domain`, `worker-auth-security`, `worker-source-quality`, `numeric-literal-audit` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과: `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged`
- [ ] PR checks: PR 생성 후 기록

## Remaining Follow-Up Work

- #275에서 review/community/my mapper row contract를 좁힌다.
- #276에서 admin/stamp/notification/auth/review-interaction handler contract를 좁힌다.
- #277에서 release candidate와 parent/child evidence를 정리한다.
