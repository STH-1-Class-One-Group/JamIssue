# UI/UX QA Matrix

JamIssue Web Front의 기대 동작을 `UIUX-###` ID로 추적한다. UI/UX 변경 PR은 영향을 받는 기대 동작, 자동 테스트, 수동 QA 필요 여부, 관련 issue/PR 근거를 함께 남긴다.

## 운영 규칙

| 항목 | 기준 |
| --- | --- |
| ID 형식 | `UIUX-###` |
| 단위 | 사용자가 체감하는 화면 동작 1개 |
| 자동화 기준 | unit, integration, regression, E2E 중 하나 이상으로 재현 가능하면 자동 테스트에 연결 |
| 수동 QA 기준 | 실제 iPhone Safari/WebView처럼 자동화가 불완전한 항목은 기기, 브라우저, 일시, 확인자를 기록 |
| 완료 기준 | 자동 테스트 또는 수동 QA 근거 없이 close 금지 |

## 기대 동작

| ID | 영역 | 기대 동작 | 자동 테스트 | 수동 QA |
| --- | --- | --- | --- | --- |
| `UIUX-001` | 앱 셸 | 모바일 기준 콘텐츠가 하단 탭과 shell flow 안에서 겹치지 않는다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-004` | 지도 시트 | 지도 시트 상태는 `hidden / peek / half / full` 계약을 유지한다. `partial` query는 호환 alias로만 처리한다. | `test/unit/map-sheet-state.test.ts` | 필요 |
| `UIUX-009` | 모바일 키보드 | 리뷰 작성 focus 시 하단 탭과 시트가 화면 중간으로 떠오르지 않는다. | `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-013` | 5탭 IA | 하단 탭은 `지도 / 행사 / 피드 / 코스 / 마이` 5개를 유지한다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-020` | 바텀 드로워 | full 드로워는 명시적 최소화 전까지 peek으로 돌아가지 않고, 하단 탭은 계속 visible/clickable 상태를 유지한다. | `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-021` | KTO 지도 레이어 | KTO 관광정보 레이어는 기본 OFF이며, 사용자가 켰을 때만 `scope=all` snapshot을 조회한다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |
| `UIUX-022` | KTO 정보 시트 | 비큐레이션 KTO 장소는 스탬프/후기 액션 없이 정보 시트로만 표시한다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |
| `UIUX-023` | 플로팅 캡슐 | 지도 전역 캡슐은 360/390/430px viewport에서 한 줄을 유지하고 알림/설정 레이어에 가려지지 않는다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-024` | 스플래시/브랜드 | 최초 진입 스플래시는 JamIssue 브랜드 자산을 사용하고 탭 전환 시 재표시되지 않는다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-025` | 공통 MapBottomSheet | 장소/행사/KTO 시트는 공통 `MapBottomSheet` shell을 사용하고 handle/close/scroll/media frame을 중복 구현하지 않는다. | `test/unit/map-bottom-sheet.test.tsx`, `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-026` | BottomNav 표현 | 하단 탭은 icon wrapper, label, active pill 구조를 렌더링한다. | `test/unit/bottom-nav.test.tsx`, `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-027` | PWA 앱 아이콘 | manifest, favicon, apple-touch-icon은 JamIssue 브랜드 로고 기반 자산을 가리킨다. | `test/unit/pwa-icon-assets.test.ts` | 필요 |
| `UIUX-028` | Drawer/nav CSS 정책 | drawer/nav CSS에 stale `bottom nav hidden` 정책이 다시 들어오지 않는다. | `test/unit/layout-token-source-quality.test.ts` | 선택 |
| `UIUX-029` | AppCapsule shell | `AppCapsule`은 back/menu/center/right slot 조합을 유지하고 `canNavigateBack`, `onNavigateBack`, `GlobalSettingsMenu` 계약만 사용한다. | `test/unit/app-capsule.test.tsx` | 선택 |
| `UIUX-030` | SideDrawer shell | `SideDrawer`는 shell/overlay/close 동작만 제공하고 새 메뉴 IA나 placeholder copy를 노출하지 않는다. | `test/unit/app-capsule.test.tsx`, `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-031` | SpeedDialFAB | `SpeedDialFAB`는 action array 계약으로 동작하고 지도 quick action을 주입해도 하단 탭/드로워/알림 패널을 가리지 않는다. | `test/unit/app-capsule.test.tsx`, `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-032` | Overlay z-index | notification panel, capsule, FAB, bottom nav, bottom sheet의 겹침 회귀가 semantic z-index token과 E2E hit target 검증으로 차단된다. | `test/unit/layout-token-source-quality.test.ts`, `test/e2e/app-shell.spec.ts` | 필요 |

## TSK-016 구현 근거

| Child issue | PR | Merge SHA | 고정한 기대 동작 |
| --- | --- | --- | --- |
| [#509](https://github.com/STH-1-Class-One-Group/JamIssue/issues/509) | [#516](https://github.com/STH-1-Class-One-Group/JamIssue/pull/516) | `9daac606e2e80fb9188085023f1d8dd161445be7` | `UIUX-029`, `UIUX-030`, `UIUX-031`, `UIUX-032` baseline |
| [#510](https://github.com/STH-1-Class-One-Group/JamIssue/issues/510) | [#519](https://github.com/STH-1-Class-One-Group/JamIssue/pull/519) | `eabc8773ea1ec3d865a8d28cef03183ba7a3a737` | `UIUX-029` |
| [#511](https://github.com/STH-1-Class-One-Group/JamIssue/issues/511) | [#521](https://github.com/STH-1-Class-One-Group/JamIssue/pull/521) | `7267dbb3ce95937aef0820a8541bd73f6302f859` | `UIUX-023`, `UIUX-029` |
| [#512](https://github.com/STH-1-Class-One-Group/JamIssue/issues/512) | [#523](https://github.com/STH-1-Class-One-Group/JamIssue/pull/523) | `14c50d151aab481da00d8c4d98fae7a866ab86fe` | `UIUX-030` |
| [#513](https://github.com/STH-1-Class-One-Group/JamIssue/issues/513) | [#526](https://github.com/STH-1-Class-One-Group/JamIssue/pull/526) | `434aefb99430b121dd0b7b97998c2334810ca027` | `UIUX-031` |
| [#514](https://github.com/STH-1-Class-One-Group/JamIssue/issues/514) | [#529](https://github.com/STH-1-Class-One-Group/JamIssue/pull/529) | `3d8be5e011eeb115d917034db17882e737accd3a` | `UIUX-023`, `UIUX-031`, `UIUX-032` |

## 관련 문서

- [TSK-016-01 7차 UI/UX 컴포넌트 아키텍처 Audit](TSK-016-01-seventh-uiux-component-architecture-audit.md)
- [Release Candidate 1.3.6](release-candidate-1.3.6.md)
- [Governance Index](GOVERNANCE_INDEX.md)
