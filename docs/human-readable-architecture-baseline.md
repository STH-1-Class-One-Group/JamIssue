# Human-Readable Architecture Baseline

Scope-ID: `TSK-006-01-ARCHITECTURE-READABILITY-AUDIT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/304
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/309
Branch: `architecture-readability-audit`
Status: `completed`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/304

## Purpose

이 문서는 1.2.11 후보 작업의 첫 기준선입니다. 목표는 interface-locality를 되돌리는 것이 아니라, 사람이 코드를 읽을 때 어디서 시작해야 하는지 빨리 판단할 수 있게 만드는 것입니다.

## Current Baseline

| Area | Files | Max depth | Average depth | Readability finding |
| --- | ---: | ---: | ---: | --- |
| `src` | 235 | 3 | 2.44 | depth는 낮지만 `src/hooks` 루트가 62개 직접 파일을 가진다. |
| `deploy/api-worker-shell` | 56 | 4 | 3.52 | depth 4는 허용 범위지만 Worker domain 내부 진입점이 반복 이름에 의존한다. |
| `backend/app` | 98 | 3 | 2.67 | 이번 범위의 주 대상은 아니며 legacy/root 파일은 후속 audit 후보로 둔다. |
| `test/unit` | 40 | 2 | 2.00 | 현재 depth 문제는 없다. |

## Source Findings

| Finding | Current value | Follow-up owner |
| --- | ---: | --- |
| `src/hooks` tracked TS/TSX files | 87 | #306 |
| `src/hooks` direct root files | 62 | #306 |
| `src/hooks` tiny direct root files, 15 lines or less | 13 | #306 |
| Worker tracked TS files above depth 4 | 0 | #305 |
| Production TS/TSX files above 250 lines | 4 | #307 |
| Production files with more than 10 import statements | 5 | #305, #306 |

## Large Internal Files

| File | Lines | Follow-up |
| --- | ---: | --- |
| `deploy/api-worker-shell/services/festival-domain/mapper.ts` | 489 | Split by business language in #307. |
| `deploy/api-worker-shell/services/review-interactions.ts` | 354 | Reduce facade/use-case reading cost in #307. |
| `deploy/api-worker-shell/services/auth/session.ts` | 278 | Review whether auth session behavior needs smaller business-language sections in #307. |
| `deploy/api-worker-shell/services/auth.ts` | 266 | Review whether the auth facade still reads as one coherent public entrypoint in #307. |

## Import Hot Spots

| File | Import statements | Follow-up |
| --- | ---: | --- |
| `src/App.tsx` | 18 | #306 |
| `deploy/api-worker-shell/index.ts` | 12 | #305 |
| `src/components/MyPagePanel.tsx` | 11 | #306 |
| `src/hooks/useAppBootstrapLifecycle.ts` | 11 | #306 |
| `src/hooks/useAppTabDataLoaders.ts` | 11 | #306 |

## Gate

`test/unit/architecture-readability-source-quality.test.ts`는 기준선을 고정해 이후 작업이 개선 없이 구조를 악화시키지 못하게 합니다.

The gate currently protects:

- Worker tracked TS max depth 4.
- `src/hooks` direct root file count 35.
- `src/hooks` tiny direct root file count 9.
- Production TS/TSX files above 250 lines remain limited to the two known auth boundary files.
- Import hot spots above 10 imports remain limited to the five known files.
- `src`, Worker, FastAPI, and unit-test tracked source depth do not spike.

## Non-Goals

- No product behavior change.
- No user-facing copy change.
- No API path, response shape, DB schema, or OAuth success-path change.
- No global barrel or central type surface expansion.
- No mass file movement in this audit slice.

## 최신 반영

- #306에서 `src/hooks` direct root files를 62개에서 35개로 줄였습니다.
- #306에서 15라인 이하 direct root tiny hook을 13개에서 9개로 줄였습니다.
- #307에서 `festival-domain/mapper.ts`와 `review-interactions.ts`를 얇은 facade로 축소했습니다.
- 250라인 초과 production TS/TSX 파일은 `auth.ts`, `auth/session.ts`만 남겼고, 두 파일은 보안 boundary 예외로 기록했습니다.
