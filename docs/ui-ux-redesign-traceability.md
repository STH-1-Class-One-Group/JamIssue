# JamIssue 2차 UI/UX 구현 추적성

Scope-ID: `TSK-012`
Parent Issue: [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404)
릴리즈 후보: `1.3.3`

## 요약

TSK-012는 2차 구현 명세인 `서브내비 헤더 통합 및 KTO 지도 통합`을 Web Front 코드에 반영한 작업 묶음입니다.

핵심 방향은 다음과 같습니다.

- 앱 셸을 header, subNav, content, bottomNav 슬롯으로 정리합니다.
- 설정/알림/피드백/뒤로가기 액션을 floating absolute UI가 아니라 header slot으로 통합합니다.
- 지도 필터를 subNav flow로 이동합니다.
- 행사 탭은 festival-only로 정리하고, 관광장소는 지도 KTO 레이어에서 다룹니다.
- KTO 정보성 장소는 스탬프/후기 액션이 없는 정보 시트로 분리합니다.
- legacy CSS offset과 무효화된 override를 제거합니다.

## 구현 PR

| Child issue | Branch | PR | Merge SHA | 내용 | 검증 근거 |
| --- | --- | --- | --- | --- | --- |
| [#405](https://github.com/STH-1-Class-One-Group/JamIssue/issues/405) | `second-uiux-audit-baseline` | [#412](https://github.com/STH-1-Class-One-Group/JamIssue/pull/412) | `dc0c5027` | 기준선 audit | code evidence, E2E baseline |
| [#406](https://github.com/STH-1-Class-One-Group/JamIssue/issues/406) | `app-header-slot-integration` | [#413](https://github.com/STH-1-Class-One-Group/JamIssue/pull/413) | `edac1e31` | AppHeader slot 통합 | unit, E2E |
| [#407](https://github.com/STH-1-Class-One-Group/JamIssue/issues/407) | `app-shell-subnav-grid-layout` | [#414](https://github.com/STH-1-Class-One-Group/JamIssue/pull/414) | `bcd1284` | AppShell subNav grid flow | unit, E2E |
| [#408](https://github.com/STH-1-Class-One-Group/JamIssue/issues/408) | `event-tab-festival-only-cleanup` | [#415](https://github.com/STH-1-Class-One-Group/JamIssue/pull/415) | `3ee8f77` | EventTab festival-only | E2E |
| [#409](https://github.com/STH-1-Class-One-Group/JamIssue/issues/409) | `kto-tourism-map-layer-infosheet` | [#416](https://github.com/STH-1-Class-One-Group/JamIssue/pull/416) | `b89b7fc` | KTO 지도 레이어와 정보 시트 | unit, E2E |
| [#410](https://github.com/STH-1-Class-One-Group/JamIssue/issues/410) | `app-shell-css-offset-cleanup` | [#417](https://github.com/STH-1-Class-One-Group/JamIssue/pull/417) | `fa67c88` | legacy CSS offset 정리 | unit, E2E, source-quality |
| [#411](https://github.com/STH-1-Class-One-Group/JamIssue/issues/411) | `second-uiux-traceability-docs` | TBD | TBD | repo/Wiki 추적성 문서 | docs readback, UTF-8 |

## UIUX ID 연결

| ID | 고정한 기대 동작 | 근거 |
| --- | --- | --- |
| `UIUX-001` | 앱 셸과 하단 탭 anchoring | #407, PR #414 |
| `UIUX-003` | 지도 레이아웃 겹침 방지 | #407, #410 |
| `UIUX-004` | sheet state contract | 기존 `map-sheet-state` 테스트 |
| `UIUX-006` | 행사 탭 festival-only | #408, PR #415 |
| `UIUX-013` | 5탭 IA 유지 | 기존 app-shell E2E |
| `UIUX-015` | header slot 통합 | #406, PR #413 |
| `UIUX-016` | subNav flow | #407, PR #414 |
| `UIUX-021` | KTO 레이어 기본 OFF와 토글 조회 | #409, PR #416 |
| `UIUX-022` | KTO 정보 시트 분리 | #409, PR #416 |

## 검증 명령

TSK-012 구현 PR 공통 검증 기준입니다.

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

문서 PR은 UTF-8 strict read와 Wiki link readback을 추가로 확인합니다.

## 문서 링크

- [Governance Index](GOVERNANCE_INDEX.md)
- [UI/UX QA 매트릭스](ui-ux-qa-matrix.md)
- [UI/UX 구현 기준선](ui-ux-redesign-baseline.md)
- [JamIssue 1.3.3 후보](release-candidate-1.3.3.md)
