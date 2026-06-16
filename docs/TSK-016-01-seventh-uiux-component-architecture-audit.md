# TSK-016-01 7차 UI/UX 컴포넌트 아키텍처 Audit

## 메타

| 항목 | 값 |
| --- | --- |
| Scope-ID | `TSK-016-01` |
| Parent Issue | [#508](https://github.com/STH-1-Class-One-Group/JamIssue/issues/508) |
| Child Issue | [#509](https://github.com/STH-1-Class-One-Group/JamIssue/issues/509) |
| Branch | `seventh-uiux-component-architecture-audit` |
| 상태 | 구현 전 기준선 |

## 목적

7차 UI/UX 명세는 지도 화면의 `MapFloatingNav`를 전역 `AppCapsule` 아키텍처로 승격하고, 우측 하단 확장 액션을 `SpeedDialFAB` 계약으로 분리하는 작업이다. 이 문서는 실제 구현 전에 현재 책임 배치와 충돌 지점을 코드 기준으로 고정한다.

이 문서는 구현 PR이 아니라 audit/baseline PR의 산출물이다. 새 컴포넌트 추가는 `TSK-016-02` 이후 child issue에서 진행한다.

## 현재 책임 지도

| 파일 | 현재 책임 | 7차에서 주의할 점 |
| --- | --- | --- |
| `src/components/app-shell/AppShell.tsx` | 앱 shell composition, `AppHeader`, `BottomNav`, `GlobalSettingsMenu` props 전달, `headerMode` 처리 | `AppCapsule` 도입 시 기존 `canNavigateBack`, `onNavigateBack`, `globalUtility` 계약을 재사용해야 한다. |
| `src/components/app-shell/AppHeader.tsx` | 기존 헤더 brand, back button, header action slot, `GlobalSettingsMenu` 렌더링 | 새 `BackButton`이 `window.history.length`를 직접 보지 않도록 기존 shell 계약을 유지해야 한다. |
| `src/components/map-stage/MapFloatingNav.tsx` | 지도 전용 캡슐 UI, category/KTO filter, KTO toggle, floating notification settings menu | 7차의 center controls는 여기서 `AppCapsule` center slot으로 이동하되, KTO/filter 동작 계약은 유지해야 한다. |
| `src/components/GlobalSettingsMenu.tsx` | 설정 트리거, 알림 패널, 피드백 링크, floating notification panel portal | `/settings` route를 새로 만들지 말고 이 컴포넌트를 capsule action slot에서 재사용해야 한다. |
| `src/components/BottomNav.tsx` | 5개 하단 탭, icon/label/active pill, tab change 이벤트 | `SpeedDialFAB`와 z-index/터치 영역 충돌이 없어야 한다. |
| `src/components/map-stage/MapBottomSheet.tsx` | 지도 bottom sheet 공통 shell, handle, close, minimize, scroll content | FAB와 capsule이 drawer의 `peek/half/full` 상태를 침범하지 않아야 한다. |

## 현재 부재 상태

아래 컴포넌트는 현재 코드에 없다. 따라서 실제 추가는 각 child issue에서 public contract와 테스트를 먼저 고정한 뒤 진행해야 한다.

| 예정 컴포넌트 | 구현 child |
| --- | --- |
| `AppCapsule` | `TSK-016-02` |
| `SideDrawer` | `TSK-016-04` |
| `SpeedDialFAB` | `TSK-016-05` |

## 확인된 충돌 지점

| 충돌 지점 | 근거 | 처리 기준 |
| --- | --- | --- |
| 캡슐 책임 중복 | `AppHeader`가 global utility를 갖고, `MapFloatingNav`도 `GlobalSettingsMenu`를 직접 렌더링한다. | `AppCapsule`은 shell만 소유하고, 설정/알림은 기존 `GlobalSettingsMenu`를 slot으로 받는다. |
| back navigation 계약 | 현재 `AppShell`이 `canNavigateBack`, `onNavigateBack`을 내려준다. | 새 hook에서 `window.history.length`를 직접 판단하지 않는다. |
| icon library 전제 | `package.json`에 Tabler 계열 의존성이 없다. | `ti-*` class 또는 새 icon library를 도입하지 않는다. 필요하면 별도 child issue로 분리한다. |
| SideDrawer copy | 메뉴 IA가 확정되지 않았다. | `SideDrawer`는 shell/overlay/close만 만들고 placeholder user-facing copy를 넣지 않는다. |
| FAB 겹침 위험 | `BottomNav`와 `MapBottomSheet`가 모두 하단 영역을 점유한다. | FAB는 `BottomNav`, `MapBottomSheet`, notification panel E2E와 함께 검증한다. |
| mojibake 후보 | `AppHeader`, `MapFloatingNav`, `GlobalSettingsMenu`, `BottomNav`, `MapBottomSheet`에 깨진 label/aria 문자열이 남아 있다. | touched file의 label/aria만 broken encoding 복구 범위로 처리한다. 스타일성 문구 개선은 금지한다. |

## Architecture Boundary Gate

- Responsibility map: `TSK-016-01`은 audit 문서와 baseline 테스트만 소유한다. 런타임 composition 변경은 하지 않는다.
- Dependency direction: source-read 테스트가 현재 파일 구조를 읽어 기준선을 고정한다. 앱 런타임 의존성은 추가하지 않는다.
- Test seam: `test/unit/seventh-uiux-component-architecture-audit.test.ts`가 현재 책임과 부재 상태를 검증한다.
- Scope map: 전역 캡슐, SideDrawer, SpeedDialFAB 구현 전 기준선만 포함한다.
- Architecture risk: audit가 구현 지연 중 stale해질 수 있다. 후속 child는 이 문서와 테스트를 먼저 갱신하거나 명시적으로 대체해야 한다.

## 후속 구현 순서

1. `TSK-016-02`: `AppCapsule` shell contract 추가.
2. `TSK-016-03`: `MapFloatingNav` center controls를 `AppCapsule` center slot으로 이동.
3. `TSK-016-04`: `SideDrawer` shell foundation 추가.
4. `TSK-016-05`: `SpeedDialFAB` actions 계약 추가.
5. `TSK-016-06`: capsule/FAB/drawer/bottom nav/notification z-index E2E 회귀 고정.
6. `TSK-016-07`: Wiki, QA matrix, release candidate, completion evidence 정리.

## 검증 기준

- `npm.cmd run check:numeric-literals`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test:unit`
- `npm.cmd run test:integration`
- `npm.cmd run test:regression`
- `npm.cmd run test:e2e`
- `npm.cmd run build`
- `git diff --check`
- touched files UTF-8 integrity check
- `context finish --dry-run`
- `context finish --apply`
