# JamIssue 1.3.6 후보

상태: 후보
기준 Scope: `TSK-016`
Parent Issue: [#508](https://github.com/STH-1-Class-One-Group/JamIssue/issues/508)

## 요약

`1.3.6` 후보는 7차 UI/UX 전역 캡슐 네비게이션 및 확장 액션 아키텍처를 정리한 Web Front 릴리즈 후보다. 지도 화면에 국한돼 있던 캡슐 구조를 전역 `AppCapsule` 셸로 승격하고, `SideDrawer` shell과 `SpeedDialFAB` action array contract를 분리했으며, capsule/FAB/bottom nav/bottom sheet/notification panel의 z-index 회귀를 E2E로 고정했다.

## 사용자 관점 변화

- 지도 화면의 캡슐 컨트롤이 전역 `AppCapsule` 셸 안으로 정리돼 메뉴, 뒤로가기, center control, 설정 액션 위치가 일관된다.
- 좌측 햄버거 버튼은 메뉴 IA를 강제하지 않는 `SideDrawer` shell로 연결된다.
- 우측 하단 확장 액션은 `SpeedDialFAB`로 고정돼 지도 quick action을 주입해도 하단 탭과 드로워를 가리지 않는다.
- notification panel, capsule, FAB, bottom nav, bottom sheet의 클릭 우선순위가 semantic z-index token과 E2E hit target 검증으로 고정된다.

## 운영/보안/품질 변화

- API path, response shape, DB schema, OAuth/KTO provider contract 변경 없음.
- 새 icon library 또는 `ti-*` class 도입 없음.
- `/settings` route, `window.history.length` 직접 참조, placeholder menu copy 없이 기존 `GlobalSettingsMenu`, `canNavigateBack`, `onNavigateBack` 계약을 재사용한다.

## 포함 PR / 커밋

| PR | 내용 | Merge SHA |
| --- | --- | --- |
| [#516](https://github.com/STH-1-Class-One-Group/JamIssue/pull/516) | 7차 UI/UX component architecture audit baseline | `9daac606e2e80fb9188085023f1d8dd161445be7` |
| [#519](https://github.com/STH-1-Class-One-Group/JamIssue/pull/519) | `AppCapsule` shell contract 추가 | `eabc8773ea1ec3d865a8d28cef03183ba7a3a737` |
| [#521](https://github.com/STH-1-Class-One-Group/JamIssue/pull/521) | 지도 center controls를 `AppCapsule` slot으로 이동 | `7267dbb3ce95937aef0820a8541bd73f6302f859` |
| [#523](https://github.com/STH-1-Class-One-Group/JamIssue/pull/523) | `SideDrawer` shell foundation 추가 | `14c50d151aab481da00d8c4d98fae7a866ab86fe` |
| [#526](https://github.com/STH-1-Class-One-Group/JamIssue/pull/526) | `SpeedDialFAB` action array contract 추가 | `434aefb99430b121dd0b7b97998c2334810ca027` |
| [#529](https://github.com/STH-1-Class-One-Group/JamIssue/pull/529) | capsule/FAB z-index and E2E regression 고정 | `3d8be5e011eeb115d917034db17882e737accd3a` |
| [#530](https://github.com/STH-1-Class-One-Group/JamIssue/pull/530) | TSK-016-06 traceability readback 보강 | `aaef2dd1b5f99ecb41e6d628d4b6bc017d941156` |
| [#531](https://github.com/STH-1-Class-One-Group/JamIssue/pull/531) | TSK-016-06 closeout PR를 ledger에 반영 | `a2d43c1390930a2e2417c3fe0ec81e6dbb9ae76b` |
| [#532](https://github.com/STH-1-Class-One-Group/JamIssue/pull/532) | renderer shard residual mutation 정리 | `166f0a3978d7c38170f3c4d092b47460f6f785a2` |

## 검증 근거

핵심 구현 PR과 closeout PR에서 아래 검증을 통과했다.

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run build
git diff --check
context finish --dry-run
context finish --apply
```

## 제외 범위

- 6차 바텀드로워/하단 네비/PWA 아이콘 자체 기능 변경
- SideDrawer 실제 메뉴 IA와 새 user-facing copy
- Backend provider contract, DB schema, OAuth flow, KTO provider contract 변경

## 관련 문서

- [TSK-016-01 7차 UI/UX 컴포넌트 아키텍처 Audit](TSK-016-01-seventh-uiux-component-architecture-audit.md)
- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [Governance Index](GOVERNANCE_INDEX.md)
