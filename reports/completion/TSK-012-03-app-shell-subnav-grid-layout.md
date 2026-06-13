# TSK-012-03 App Shell SubNav Grid Layout

Scope-ID: `TSK-012-03-APP-SHELL-SUBNAV-GRID-LAYOUT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/407
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/414
Branch: `app-shell-subnav-grid-layout`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/404
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/407

## 목적

2차 UI/UX 구현 명세의 #407 범위를 구현한다. 앱 셸에 optional `subNav` 슬롯을 추가하고, 지도 카테고리 필터를 지도 본문 오버레이가 아니라 헤더 아래 48px flow 레이어로 이동한다.

## 변경 요약

- `AppShell`에 `subNav` prop과 `app-shell--with-subnav` / `app-shell--no-subnav` 변형을 추가했다.
- 지도 탭에서는 `AppMapStageSubNav`가 `MapStageCategoryStrip`을 shell subNav 슬롯에 렌더링한다.
- `MapTabStage`는 지도 표면과 시트만 담당하도록 축소했다.
- `.app-shell__sub-nav-slot`과 subNav 내부 `.map-filter-strip` 오버라이드를 추가했다.
- #410 범위인 광범위한 absolute/fixed CSS debt cleanup은 수행하지 않았다.

## Architecture Boundary Gate

- Responsibility map: `AppShell`은 header, optional subNav, content, bottom tab 슬롯을 소유한다. `AppMapStageSubNav`는 map stage의 subNav composition을 소유한다. `MapTabStage`는 map surface와 sheet 렌더링만 소유한다.
- Dependency direction: `App.tsx -> AppShell`이 shell slot을 조립하고, `AppMapStageView.tsx -> MapStageCategoryStrip` 방향으로 map-local UI를 위임한다. stage 내부가 shell layout을 직접 수정하지 않는다.
- Test seam: `test/unit/app-shell-subnav.test.tsx`와 `test/e2e/app-shell.spec.ts`가 AppShell public DOM slot과 active tab behavior를 검증한다.
- Scope map: 변경 파일은 App shell composition, map stage composition, 최소 CSS layout override, unit/e2e tests, completion report로 제한했다.
- Architecture risk: 기존 `.map-filter-strip`와 `.map-surface-frame` absolute offset debt는 남아 있으며 #410에서 정리해야 한다. 이번 PR은 subNav 슬롯 이동과 flow 배치 증명까지만 다룬다.

## 검증 결과

- [x] `npm.cmd run check:numeric-literals`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run test:unit`
- [x] `npm.cmd run test:integration`
- [x] `npm.cmd run test:regression`
- [x] `npm.cmd run test:e2e`
- [x] `npm.cmd run build`
- [x] `git diff --check`
- [x] UTF-8 integrity check

## 남은 후속 작업

- #408: Event tab festival-only 정리.
- #409: KTO tourism map layer 구현.
- #410: app shell CSS offset cleanup과 남은 absolute/fixed debt 제거.
