# 5차 UI/UX 플로팅 캡슐 내비게이션 추적성

Scope-ID: `TSK-013`
Parent Issue: [#466](https://github.com/STH-1-Class-One-Group/JamIssue/issues/466)
릴리즈 후보: [JamIssue 1.3.4 후보](release-candidate-1.3.4.md)

## 목적

지도 화면에서 상단 AppHeader와 subNav가 차지하던 고정 영역을 제거하고, 필터/관광정보/설정 진입점을 지도 위 1줄 플로팅 캡슐로 통합한다.

## Child Issues

| Child issue | Branch | 목적 | 완료 근거 |
| --- | --- | --- | --- |
| [#467](https://github.com/STH-1-Class-One-Group/JamIssue/issues/467) | `fifth-uiux-audit-baseline` | 5차 UI/UX 기준선 | PR TBD |
| [#468](https://github.com/STH-1-Class-One-Group/JamIssue/issues/468) | `app-splash-entry-screen` | 스플래시 1회 표시 | PR TBD |
| [#469](https://github.com/STH-1-Class-One-Group/JamIssue/issues/469) | `map-floating-capsule-nav` | 지도 캡슐 내비게이션 | PR TBD |
| [#470](https://github.com/STH-1-Class-One-Group/JamIssue/issues/470) | `map-header-subnav-removal` | 지도 header/subNav 제거 | PR TBD |
| [#471](https://github.com/STH-1-Class-One-Group/JamIssue/issues/471) | `floating-nav-css-control-offsets` | 캡슐 CSS와 지도 컨트롤 offset | PR TBD |
| [#472](https://github.com/STH-1-Class-One-Group/JamIssue/issues/472) | `fifth-uiux-qa-docs-traceability` | QA/문서/릴리즈 후보 | PR TBD |

## UIUX ID

| ID | 기대 동작 | 자동 테스트 |
| --- | --- | --- |
| `UIUX-023` | 지도 탭에서 AppHeader/subNav가 렌더링되지 않고 1줄 플로팅 캡슐이 표시된다. | `test/e2e/app-shell.spec.ts` |
| `UIUX-024` | 최초 진입 스플래시는 1회 표시 후 사라지고 탭 전환 중 재표시되지 않는다. | `test/unit/splash-screen.test.tsx` |

## 고정 결정

- 지도 화면 우선 적용한다.
- 지도 외 탭의 캡슐 헤더는 별도 명세로 분리한다.
- API path, response shape, DB schema, OAuth 성공 경로는 변경하지 않는다.
- KTO 관광정보 토글과 local displayGroup filtering은 기존 consumer contract를 유지한다.

## 검증 명령

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
```
