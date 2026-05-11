# TSK-004-01 Worker Residual Boundary Audit

Scope-ID: `TSK-004-01-WORKER-RESIDUAL-BOUNDARY-AUDIT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/273
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/279
Branch: `worker-residual-boundary-audit`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/273

## Purpose

Worker-first backend의 잔여 경계 문제를 정성 평가가 아니라 실제 코드 계측값으로 고정한다. 이 보고서는 #274~#276 구현 전에 기준선을 만들고, 후속 PR이 같은 결합을 늘리지 못하도록 source-quality gate를 추가한 근거다.

## Current Decisions

- 이 작업은 구현 전 audit/gate 슬라이스다.
- 외부 REST API path, response shape, DB schema, 사용자-facing copy, Kakao/Naver OAuth 성공 경로는 변경하지 않는다.
- `deploy/api-worker-shell/.wrangler/tmp` 생성물은 생산 source-quality gate 대상에서 제외한다.
- 후속 child issue는 이 기준선보다 결합 수치를 줄이거나, 불가피한 예외를 명시 근거와 함께 갱신해야 한다.

## Audit Method

재검증 명령은 아래와 같다.

```powershell
rg -n "\bany\b|Promise<any>|env:\s*any|Map<any|any\[\]|category:\s*any" deploy/api-worker-shell --glob "*.ts"
rg -n "supabaseRequest|export async function|export function|handleFestivals|handleBannerEvents|handleFestivalImport" deploy/api-worker-shell/services/*.ts deploy/api-worker-shell/services/*-domain/*.ts
```

추가 계측은 `Path.read_text(encoding="utf-8")` 기반의 line/char/pattern counter로 수행했다.

## Inventory

| File | Lines | Chars | Objective Findings |
| --- | ---: | ---: | --- |
| `deploy/api-worker-shell/services/festivals.ts` | 194 | 22,310 | `supabaseRequest` 9, exported handlers 3, `any` 3, `env:any` 1, `any[]` 1 |
| `deploy/api-worker-shell/services/admin.ts` | 118 | 4,040 | `any` 6, `env:any` 5, `category:any` 1 |
| `deploy/api-worker-shell/services/notifications.ts` | 61 | 8,420 | `supabaseRequest` 11, exported handlers 5, implicit env signatures 10 |
| `deploy/api-worker-shell/services/stamps.ts` | 53 | 6,778 | `supabaseRequest` 10, implicit request body reader 1, implicit env signature 1 |
| `deploy/api-worker-shell/services/auth.ts` | 257 | 8,750 | `Promise<any>` 2, exported handlers 8 |
| `deploy/api-worker-shell/services/review-interactions.ts` | 353 | 13,779 | `Promise<any>` 1, exported handlers 8 |
| `deploy/api-worker-shell/services/review-domain/mapper.ts` | 116 | 4,568 | `any` 24, `Map<any` 4, `any[]` 9 |
| `deploy/api-worker-shell/services/community-domain/mapper.ts` | 45 | 1,606 | `any` 7, `Map<any` 2, `any[]` 2 |
| `deploy/api-worker-shell/services/my-domain/mapper.ts` | 26 | 1,233 | `any` 5, `Map<any` 1, `any[]` 1 |

## Issue Scope

- #273: 기준선 inventory와 source-quality gate 추가
- #274: `services/festivals.ts` 책임 분리
- #275: review/community/my mapper row contract typing
- #276: admin/stamp/notification/auth/review-interaction handler contract typing
- #277: 구현 PR merge 후 문서와 release traceability 정리

## PR Scope

이번 PR은 아래만 포함한다.

- `test/unit/worker-source-quality.test.ts`에 TSK-004 residual boundary 기준선 gate 추가
- `reports/completion/TSK-004-01-worker-residual-boundary-audit.md` 추가

## Validation Results

로컬 검증 결과는 아래와 같다.

- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과
- [x] UTF-8 integrity check 통과: `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged`
- [ ] PR checks: PR 생성 후 기록

## Remaining Follow-Up Work

- #274에서 festival domain split을 수행한다.
- #275에서 mapper row contract를 domain-local 타입으로 좁힌다.
- #276에서 service/handler contract를 명시 타입으로 좁힌다.
- #277에서 최종 release candidate 문서와 이슈 evidence를 갱신한다.
