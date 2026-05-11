# TSK-004-03 Worker Domain Mapper Contracts

Scope-ID: `TSK-004-03-WORKER-DOMAIN-MAPPER-CONTRACTS`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/275
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/281
Branch: `worker-domain-mapper-contracts`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/275

## Purpose

Worker review/community/my domain mapper가 `any[]`, `Map<any, any>`에 의존하던 잔여 계약을 domain-local row/read-model 타입으로 대체했다. 외부 REST endpoint, response shape, DB schema, 사용자-facing copy, Kakao/Naver OAuth 성공 경로는 변경하지 않았다.

## Current Decisions

- review mapper row 계약은 `services/review-domain/contracts.ts`가 소유한다.
- community route mapper row 계약은 `services/community-domain/contracts.ts`가 소유한다.
- my-page comment mapper row 계약은 `services/my-domain/contracts.ts`가 소유한다.
- repository가 mapper에 넘기는 row도 같은 domain-local 타입으로 좁혔다.
- global Worker type barrel인 `deploy/api-worker-shell/types.ts`에는 domain row/mapper 타입을 추가하지 않았다.
- `scripts/numeric-literal-baseline.json`은 최신 main의 festival-domain split 파일을 포함하도록 재생성했다. 이는 #275 변경으로 생긴 수치가 아니라 공통 게이트 복구용 보정이다.

## Before And After Inventory

| File | Metric | Before | After |
| --- | --- | ---: | ---: |
| `deploy/api-worker-shell/services/review-domain/mapper.ts` | `any` | 24 | 0 |
| `deploy/api-worker-shell/services/review-domain/mapper.ts` | `Map<any` | 4 | 0 |
| `deploy/api-worker-shell/services/review-domain/mapper.ts` | `any[]` | 9 | 0 |
| `deploy/api-worker-shell/services/community-domain/mapper.ts` | `any` | 7 | 0 |
| `deploy/api-worker-shell/services/community-domain/mapper.ts` | `Map<any` | 2 | 0 |
| `deploy/api-worker-shell/services/community-domain/mapper.ts` | `any[]` | 2 | 0 |
| `deploy/api-worker-shell/services/my-domain/mapper.ts` | `any` | 5 | 0 |
| `deploy/api-worker-shell/services/my-domain/mapper.ts` | `Map<any` | 1 | 0 |
| `deploy/api-worker-shell/services/my-domain/mapper.ts` | `any[]` | 1 | 0 |
| `deploy/api-worker-shell/services/community-domain/repository.ts` | `row: any` | 2 | 0 |
| `deploy/api-worker-shell/services/my-domain/repository.ts` | `row: any` | 1 | 0 |

## Issue Scope

- #275: Worker domain mapper row contracts
- #273: baseline gate completed by PR #279
- #274: festival boundary split completed by PR #280
- #276~#277: handler contract/docs 작업은 후속 child issue 범위

## PR Scope

이번 PR은 아래만 포함한다.

- review/community/my domain-local row/read-model 타입 추가
- mapper 입력 타입을 `any`에서 명시 타입으로 변경
- repository가 mapper에 넘기는 row 타입 정리
- base-data repository와 review read service의 review row 타입 연결
- source-quality gate를 mapper/repository `any` 회귀 차단 기준으로 강화
- numeric literal baseline을 최신 main tracked production files 기준으로 갱신

## Validation Results

로컬 검증 결과는 아래와 같다.

- [x] targeted Vitest: `worker-source-quality`, `worker-bootstrap-shape`, `worker-account-community-admin-boundaries`, `worker-review-domain`, `worker-routing-runtime` 통과
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

## Remaining Follow-Up Work

- #276에서 admin/stamp/notification/auth/review-interaction handler contract를 명시 타입으로 좁힌다.
- #277에서 TSK-004 전체 Wiki, release candidate, parent/child evidence를 정리한다.
