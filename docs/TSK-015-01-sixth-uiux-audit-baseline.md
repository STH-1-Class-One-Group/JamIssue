# TSK-015-01 6차 UI/UX Audit Baseline

Scope-ID: `TSK-015-01`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/491
PR: `TBD-TSK-015-01-PR`
Branch: `sixth-uiux-audit-baseline`
Status: `in progress`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/490
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/491

## 목적

6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 아이콘 개편을 구현하기 전에 현재 코드 기준선을 고정한다. 이 문서는 구현 변경이 아니라 후속 child issue가 건드려야 할 책임 경계, 호환 지점, 테스트 seam을 정리하는 baseline evidence다.

## 입력 기준

- 사용자 제공 6차 구현 명세: 바텀드로워 및 네비게이션 리디자인.
- 사용자 제공 시안: `drawer_01_peek.html`, `drawer_02_half.html`, `drawer_03_full.html`.
- 시안 내 리뷰 콘텐츠는 범위에서 제외하고, drawer state/frame/spacing/image/nav/icon policy만 참조한다.

## 현재 Drawer State 기준선

현재 타입 기준은 [src/types/core.ts](../src/types/core.ts)의 `DrawerState = 'closed' | 'partial' | 'full'`이다. 반면 [src/components/map-stage/mapSheetState.ts](../src/components/map-stage/mapSheetState.ts)는 `MapSheetState = 'hidden' | 'peek' | 'half' | 'full'`를 이미 선언하지만 `resolveMapSheetState`는 `partial -> peek`, `full -> full`, 그 외 `hidden`만 반환한다. 즉 `half`는 타입에만 있고 실제 route/state transition에는 아직 없다.

`partial`은 다음 레이어에 남아 있다.

- route parsing: [src/hooks/app-route/authQueryState.ts](../src/hooks/app-route/authQueryState.ts)
- route emission: [src/hooks/app-route/routeHistoryState.ts](../src/hooks/app-route/routeHistoryState.ts)
- selection action: [src/hooks/useAppStageActions.ts](../src/hooks/useAppStageActions.ts), [src/hooks/app-navigation/tabNavigation.ts](../src/hooks/app-navigation/tabNavigation.ts)
- drawer drag/click: [src/components/place/usePlaceDrawerHandle.ts](../src/components/place/usePlaceDrawerHandle.ts)
- map sheet tests: [test/unit/map-sheet-state.test.ts](../test/unit/map-sheet-state.test.ts), [test/e2e/critical-ui-flow.spec.ts](../test/e2e/critical-ui-flow.spec.ts)

후속 `TSK-015-02`는 `partial`을 public query compatibility alias로만 유지하고 새 route/state emission은 `peek | half | full | hidden`으로 전환해야 한다.

## 현재 MapBottomSheet 책임 기준선

[src/components/map-stage/MapBottomSheet.tsx](../src/components/map-stage/MapBottomSheet.tsx)는 이미 공통 shell 역할을 일부 수행한다. 현재 소유 책임은 section, handle, control rail, close/minimize button, scrollable content slot이다.

남은 gap은 다음과 같다.

- control UI가 텍스트 버튼 중심이다. 6차 명세는 drag handle과 icon close 중심이다.
- `onHandleClick` 기본값이 `drawerState === 'partial' ? onExpand : undefined`라 `half` 상태 전이를 표현하지 못한다.
- `MapBottomSheet`가 media/full-bleed image slot을 소유하지 않고, domain sheet가 content 내부에서 이미지를 각자 배치한다.
- 접근성 label 일부는 현재 파일 readback에서 mojibake로 보이며, 6차 작업 범위에서 aria label 복구가 필요하다.

후속 `TSK-015-03`은 `MapBottomSheet`를 common visual shell로 승격하고 domain sheet는 본문 content만 제공하도록 정리해야 한다.

## 현재 Domain Sheet 기준선

장소, 행사, KTO sheet는 모두 `MapBottomSheet`를 사용하지만 본문 구조와 media 배치가 통일되어 있지 않다.

- [src/components/PlaceDetailSheet.tsx](../src/components/PlaceDetailSheet.tsx)는 hero image를 `place-drawer__hero`로 content 내부에 둔다.
- [src/components/FestivalDetailSheet.tsx](../src/components/FestivalDetailSheet.tsx)는 공통 shell을 쓰지만 행사 이미지/full-bleed frame 기준이 분리되어 있지 않다.
- [src/components/TourismInfoSheet.tsx](../src/components/TourismInfoSheet.tsx)는 `TourismInfoSheetState = 'partial' | 'full'`를 별도로 두고 내부에서 `partial -> peek`으로 변환한다.

후속 구현은 domain content가 직접 drawer chrome, close/minimize control, shell padding을 소유하지 않게 해야 한다.

## 현재 BottomNav 기준선

[src/components/BottomNav.tsx](../src/components/BottomNav.tsx)는 5개 탭을 text-only button으로 렌더링한다. active state는 `bottom-nav__item is-active`와 `aria-current="page"`만 사용한다. 6차 명세가 요구하는 icon wrapper, label, active pill 구조는 아직 없다.

[src/components/app-shell/AppShell.tsx](../src/components/app-shell/AppShell.tsx)는 `bottomTabHidden` prop과 `app-shell__bottom-tab-slot--hidden` class를 유지한다. 6차 명세는 drawer 상태와 무관하게 하단 탭을 항상 표시하는 방향이므로 `TSK-015-04`에서 bottom nav hiding policy를 다시 검증해야 한다.

## 현재 PWA/Icon 기준선

브랜드 원본 자산은 [src/assets/jamissue-logo.png](../src/assets/jamissue-logo.png)이며 1024x1024 RGBA PNG다.

그러나 현재 build script는 PWA 아이콘을 logo PNG가 아니라 generated SVG로 만든다.

- [scripts/build-frontend.mjs](../scripts/build-frontend.mjs): `createIconSvg()`, `/icons/jamissue-icon.svg`, SVG favicon link 생성.
- [scripts/build-frontend.ps1](../scripts/build-frontend.ps1): 동일하게 `/icons/jamissue-icon.svg` 생성.
- `apple-touch-icon` link는 현재 build output template에 없다.

후속 `TSK-015-05`는 Node/PowerShell build script 양쪽에서 동일한 브랜드 icon policy를 적용해야 한다. 최소 기준은 manifest icon, favicon, `apple-touch-icon`이 JamIssue logo 기반 자산을 가리키는 것이다.

## 현재 CSS 기준선

drawer/nav CSS는 여러 세대의 override가 누적되어 있다.

- [src/index.css](../src/index.css)는 `.place-drawer`, `.place-drawer--partial`, `.place-drawer--full`, `.bottom-nav` 규칙을 여러 구간에서 반복 정의한다.
- [src/styles/refinements.css](../src/styles/refinements.css)는 drawer/nav 관련 `!important` override를 다수 포함한다.
- full drawer는 현재 여러 위치에서 height/top/bottom/z-index가 재정의되어 후속 디자인 변경 시 회귀 위험이 높다.

후속 `TSK-015-06`은 단순 추가 CSS가 아니라 중복 selector와 `!important` 우선순위를 정리하는 cleanup child로 유지해야 한다.

## Architecture Boundary Evidence

- Responsibility map: `MapBottomSheet`는 drawer chrome과 interaction shell을 소유하고, Place/Festival/Tourism sheet는 domain content만 소유해야 한다. `BottomNav`는 tab presentation과 tab change event만 소유해야 한다. build scripts는 PWA static asset emission만 소유해야 한다.
- Dependency direction: `AppMapStageView -> MapStageSheets -> MapBottomSheet -> domain content`, `AppShell -> BottomNav`, build script -> source asset -> static output 방향만 허용한다.
- Test seam: state transition은 pure helper/unit test, shell structure는 integration test, 360/390/430px layout은 Playwright E2E로 검증한다.
- Scope map: `TSK-015-02` state model, `TSK-015-03` drawer shell, `TSK-015-04` bottom nav, `TSK-015-05` PWA icon, `TSK-015-06` CSS cleanup, `TSK-015-07` docs/evidence.
- Architecture risk: 기존 `partial` route compatibility와 CSS override가 동시에 존재하므로, 한 PR에서 전부 바꾸면 원인 추적이 어렵다. child issue별로 state, shell, nav, asset, CSS cleanup을 분리해야 한다.

## 후속 Child별 검증 대상

| Child | 검증 대상 |
| --- | --- |
| `TSK-015-02` | `partial` query alias, `peek/half/full/hidden` 상태 전이, drag up/down transition |
| `TSK-015-03` | 공통 `MapBottomSheet` shell, icon close, full-bleed media slot, domain sheet control 중복 제거 |
| `TSK-015-04` | BottomNav icon wrapper, label, active pill, drawer full 상태에서도 visible/clickable |
| `TSK-015-05` | `jamissue-logo.png` 기반 manifest/favicon/apple-touch-icon build output |
| `TSK-015-06` | drawer/nav selector 중복 제거, 불필요한 `!important` 제거, z-index policy 고정 |
| `TSK-015-07` | Wiki, UI/UX QA matrix, release candidate, issue completion evidence |

## 검증 결과

이 문서 생성 시점에는 구현 파일 동작을 변경하지 않았다. 필수 검증 결과는 completion evidence에 기록한다.
