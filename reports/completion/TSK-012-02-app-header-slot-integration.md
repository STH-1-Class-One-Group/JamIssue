# TSK-012-02 App Header Slot Integration

Scope-ID: `TSK-012-02-APP-HEADER-SLOT-INTEGRATION`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/406
PR: `TBD-TSK-012-02`
Branch: `app-header-slot-integration`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/404
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/406

## 목적

Wiki 정본 `2차 구현 명세 - 서브내비 헤더 통합 및 KTO 지도 통합`의 헤더 통합 범위를 구현한다. 이번 범위는 `AppHeader` 도입, header leading back button, brand, utility action slot 통합이며, sub navigation grid와 KTO map layer는 각각 #407/#409로 남긴다.

## Current Decisions

- `AppHeader`가 brand, back navigation, utility actions를 소유한다.
- 기존 draggable floating back button overlay는 제거한다.
- 지도 내부 brand header는 앱 헤더와 중복되므로 제거한다.
- 사용자-facing copy, API path, response shape, DB schema, OAuth 경로는 변경하지 않는다.
- 기존 CSS offset과 map filter strip 정리는 #407/#410 범위로 남긴다.

## Out Of Scope / Forbidden Changes

- KTO tourism API client 또는 map layer 추가 금지
- sub navigation grid layout 변경 금지
- map sheet state, drawer state, bottom tab behavior 변경 금지
- 기존 mojibake copy 임의 수정 금지

## Architecture Boundary Gate

- Responsibility map: `AppHeader`는 shell header control만 소유하고, `AppShell`은 composition root 역할만 유지한다.
- Dependency direction: `AppShell -> AppHeader -> GlobalSettingsMenu` 방향으로만 의존한다. page/map stage가 header internals를 알지 않는다.
- Test seam: `test/unit/app-shell-header.test.tsx`가 rendered DOM boundary에서 header brand/action/back behavior를 검증한다.
- Scope map: changed files are `AppHeader`, `AppShell`, `MapTabStage`, runtime config cleanup, tests, and this completion report.
- Architecture risk: `index.css`와 `refinements.css`에는 map offset과 old selector debt가 남아 있으며 #407/#410에서 정리해야 한다.

## Issue Scope

- #404: TSK-012 parent roadmap
- #406: App header slot integration

## PR Scope

- `src/components/app-shell/AppHeader.tsx` 추가
- `src/components/app-shell/AppShell.tsx`에서 floating overlay 제거
- `src/components/MapTabStage.tsx`에서 지도 내부 brand header 제거
- floating back button dead code와 runtime config 제거
- `test/unit/app-shell-header.test.tsx` 추가
- `test/unit/second-uiux-audit-baseline.test.ts` 기대값 갱신

## Validation Results

- [x] `npm.cmd exec vitest -- run test/unit/app-shell-header.test.tsx test/unit/second-uiux-audit-baseline.test.ts test/unit/runtime-limit-config.test.ts` 통과
- [x] `npm.cmd run check:numeric-literals` 통과
- [x] `npm.cmd run test:unit` 통과
- [x] `npm.cmd run test:integration` 통과
- [x] `npm.cmd run test:regression` 통과
- [x] `npm.cmd run test:e2e` 통과
- [x] `npm.cmd run typecheck` 통과
- [x] `npm.cmd run lint` 통과
- [x] `npm.cmd run build` 통과
- [x] `git diff --check` 통과

## Remaining Follow-Up Work

- #407에서 subNav slot과 app shell grid flow를 구현한다.
- #409에서 KTO tourism contract가 main에 없는 gap을 먼저 해결한 뒤 map layer를 구현한다.
- #410에서 old `.app-back-button`, `.map-stage__brand*`, `.phone-shell__utility-slot`, map offset CSS debt를 정리한다.
