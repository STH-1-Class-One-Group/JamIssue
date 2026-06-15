# TSK-012-08 KTO Canonical Taxonomy Contract Consumption

Scope-ID: `TSK-012-08-KTO-CANONICAL-TAXONOMY-CONSUMPTION`  
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/439  
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/440  
Branch: `kto-canonical-taxonomy-consumption`  
Status: `pr-open`  
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/404  
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/439

## Purpose

Worker API가 배포한 KTO canonical taxonomy contract를 Web Front가 소비하도록 보정했다. KTO 지도 레이어는 `scope=all`과 `displayGroup` 기반 필터를 사용하고, 대표 UI 라벨은 `displayGroup`, 공식 분류 보조 표기는 `officialCategoryLabel`을 사용한다.

## Current Decisions

- Curated `Category`와 KTO `TourismDisplayGroup`은 분리한다.
- KTO ON 상태에서만 `facets.displayGroups` 기반 필터를 사용한다.
- `category`, `ktoFacet`, `ktoContentTypeLabel`은 호환/원천 메타데이터로 유지한다.
- 외부 원문 링크는 다시 추가하지 않는다.

## Out Of Scope

- Backend API, DB schema, OAuth flow 변경.
- KTO provider mapping 규칙 변경.
- Curated place 저장 schema 변경.

## Architecture Evidence

- Responsibility map: `tourismTypes`/`tourismClient`는 consumer contract, `useTourismOverlayEffects`는 KTO fetch orchestration, `tourismTaxonomy`는 UI label/filter mapping, map components는 렌더링만 담당한다.
- Dependency direction: UI -> owner-local taxonomy helper -> tourism client -> Worker API. Front는 KTO OpenAPI, Supabase, admin provider contract를 직접 호출하지 않는다.
- Test seam: API path builder, InfoSheet 렌더링, E2E tourism toggle/filter request를 public boundary로 검증했다.
- Scope map: Issue #439 checklist의 type/query/displayGroup/InfoSheet/broken encoding 항목에 한정했다.
- Residual risk: 기존 `category` 호환 필드는 남아 있으므로 후속 schema migration 완료 전까지 deprecated field drift를 계속 감시해야 한다.

## Validation Results

- `npm.cmd run check:numeric-literals`: passed
- `npm.cmd run lint`: passed
- `npm.cmd run typecheck`: passed
- `npm.cmd run test:unit`: passed
- `npm.cmd run test:integration`: passed
- `npm.cmd run test:regression`: passed
- `npm.cmd run test:e2e`: passed
- `npm.cmd run build`: passed
- `git diff --check`: passed
- UTF-8 integrity check: passed

## Remaining Follow-Up

- CI URL, merge SHA는 PR checks와 main merge 후 이 보고서와 child issue에 보정한다.
