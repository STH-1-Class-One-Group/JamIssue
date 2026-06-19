# Governance Index

JamIssue Web Front 작업축과 책임 범위를 빠르게 찾기 위한 repo-local governance index다.

## 현재 기준

| Scope | Parent Issue | 책임 범위 | 구현 브랜치 원칙 | 완료 근거 |
| --- | --- | --- | --- | --- |
| `TSK-012` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | 2차/3차 KTO 지도 통합, 서브내비, 관광정보 토글, KTO marker layer corrective work | child issue별 목적형 브랜치 | PR 링크, merge SHA, QA 문서, release candidate 문서 |
| `TSK-009` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX 기대 동작 추적과 TypeScript/Python 테스트 커버리지 | coverage slice 단위 브랜치 | coverage summary, 테스트 명령, CI 링크 |
| `TSK-013` | [#466](https://github.com/STH-1-Class-One-Group/JamIssue/issues/466) | 5차 UI/UX 상단 헤더 제거와 플로팅 캡슐 내비게이션 | child issue별 목적형 브랜치 | PR 링크, merge SHA, E2E 근거 |
| `TSK-015` | [#490](https://github.com/STH-1-Class-One-Group/JamIssue/issues/490) | 6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 아이콘 개편 | child issue별 목적형 브랜치 | PR 링크, merge SHA, QA matrix, release candidate |
| `TSK-016` | [#508](https://github.com/STH-1-Class-One-Group/JamIssue/issues/508) | 7차 UI/UX 전역 캡슐 네비게이션, SideDrawer shell, SpeedDialFAB, overlay z-index 회귀 방지 | child issue별 목적형 브랜치 | PR 링크, merge SHA, QA matrix, release candidate, Wiki readback |

| `TSK-017` | [#551](https://github.com/STH-1-Class-One-Group/JamIssue/issues/551) | 피드 탭 인스타형 레이아웃 개선 | child issue별 목적형 브랜치 | PR 링크, merge SHA, feed layout QA, CI 링크 |

## Core Rows

| Core | Parent Issue | Responsibility | Keywords | Misroute examples |
| --- | --- | --- | --- | --- |
| `TSK-012-00-SECOND-UIUX-KTO-MAP-INTEGRATION` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | Web Front KTO 지도 통합과 관광정보 corrective work | kto; tourism; map; marker; uiux; subnav | backend provider contract, DB schema, OAuth flow |
| `TSK-009-00-UIUX-COVERAGE-GATE` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX expectation tracking and TypeScript/Python coverage gate | coverage; uiux; test; e2e; playwright | KTO feature implementation, backend provider contract |
| `TSK-013-00-FIFTH-UIUX-FLOATING-CAPSULE-NAV` | [#466](https://github.com/STH-1-Class-One-Group/JamIssue/issues/466) | 5차 UI/UX 상단 헤더 제거와 지도 플로팅 캡슐 내비게이션 | floating capsule; map nav; splash; notification | backend provider contract, DB schema, OAuth flow |
| `TSK-015-00-SIXTH-UIUX-DRAWER-NAV-PWA-REDESIGN` | [#490](https://github.com/STH-1-Class-One-Group/JamIssue/issues/490) | 6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 홈 아이콘 | bottom drawer; bottom navigation; PWA icon; app icon | backend provider contract, DB schema, OAuth flow |
| `TSK-016-00-UIUX-GLOBAL-CAPSULE-NAV-ACTION-ARCHITECTURE` | [#508](https://github.com/STH-1-Class-One-Group/JamIssue/issues/508) | 7차 UI/UX 전역 캡슐, SideDrawer shell, SpeedDialFAB, overlay regression hardening | app capsule; side drawer; speed dial; fab; z-index | 6차 drawer/nav/PWA icon work, backend provider contract, DB schema |

| `TSK-017-00-FEED-INSTAGRAM-LAYOUT` | [#551](https://github.com/STH-1-Class-One-Group/JamIssue/issues/551) | Feed tab Instagram-like layout polish while preserving JamIssue tone and existing feed behavior | feed; review card; instagram layout; uiux | backend provider contract, DB schema, OAuth flow, KTO map work |

## TSK-012 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#405](https://github.com/STH-1-Class-One-Group/JamIssue/issues/405) | `second-uiux-audit-baseline` | completed | PR [#412](https://github.com/STH-1-Class-One-Group/JamIssue/pull/412) |
| [#406](https://github.com/STH-1-Class-One-Group/JamIssue/issues/406) | `app-header-slot-integration` | completed | PR [#413](https://github.com/STH-1-Class-One-Group/JamIssue/pull/413) |
| [#407](https://github.com/STH-1-Class-One-Group/JamIssue/issues/407) | `app-shell-subnav-grid-layout` | completed | PR [#414](https://github.com/STH-1-Class-One-Group/JamIssue/pull/414) |
| [#408](https://github.com/STH-1-Class-One-Group/JamIssue/issues/408) | `event-tab-festival-only-cleanup` | completed | PR [#415](https://github.com/STH-1-Class-One-Group/JamIssue/pull/415) |
| [#409](https://github.com/STH-1-Class-One-Group/JamIssue/issues/409) | `kto-tourism-map-layer-infosheet` | completed | PR [#416](https://github.com/STH-1-Class-One-Group/JamIssue/pull/416) |
| [#410](https://github.com/STH-1-Class-One-Group/JamIssue/issues/410) | `app-shell-css-offset-cleanup` | completed | PR [#417](https://github.com/STH-1-Class-One-Group/JamIssue/pull/417) |
| [#411](https://github.com/STH-1-Class-One-Group/JamIssue/issues/411) | `second-uiux-traceability-docs` | completed | PR [#418](https://github.com/STH-1-Class-One-Group/JamIssue/pull/418) |
| [#439](https://github.com/STH-1-Class-One-Group/JamIssue/issues/439) | `kto-canonical-taxonomy-consumption` | completed | PR [#440](https://github.com/STH-1-Class-One-Group/JamIssue/pull/440) |
| [#441](https://github.com/STH-1-Class-One-Group/JamIssue/issues/441) | `kto-display-rendering-polish` | completed | PR [#442](https://github.com/STH-1-Class-One-Group/JamIssue/pull/442) |
| [#443](https://github.com/STH-1-Class-One-Group/JamIssue/issues/443) | `map-curated-marker-count-fix` | completed | PR [#444](https://github.com/STH-1-Class-One-Group/JamIssue/pull/444) |
| [#446](https://github.com/STH-1-Class-One-Group/JamIssue/issues/446) | `tourism-filter-local-response` | completed | PR [#447](https://github.com/STH-1-Class-One-Group/JamIssue/pull/447) |
| [#448](https://github.com/STH-1-Class-One-Group/JamIssue/issues/448) | `tourism-initial-load-hardening` | active | KTO 최초 로딩 timeout/first response hardening |
| [#449](https://github.com/STH-1-Class-One-Group/JamIssue/issues/449) | `tourism-marker-layer-hierarchy` | planned | KTO marker hierarchy and curated priority |

## TSK-013 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#467](https://github.com/STH-1-Class-One-Group/JamIssue/issues/467) | `fifth-uiux-audit-baseline` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#468](https://github.com/STH-1-Class-One-Group/JamIssue/issues/468) | `app-splash-entry-screen` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#469](https://github.com/STH-1-Class-One-Group/JamIssue/issues/469) | `map-floating-capsule-nav` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#470](https://github.com/STH-1-Class-One-Group/JamIssue/issues/470) | `map-header-subnav-removal` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#471](https://github.com/STH-1-Class-One-Group/JamIssue/issues/471) | `floating-nav-css-control-offsets` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#472](https://github.com/STH-1-Class-One-Group/JamIssue/issues/472) | `fifth-uiux-qa-docs-traceability` | completed | PR [#473](https://github.com/STH-1-Class-One-Group/JamIssue/pull/473) |
| [#476](https://github.com/STH-1-Class-One-Group/JamIssue/issues/476) | `map-capsule-click-freeze-fix` | completed | PR [#477](https://github.com/STH-1-Class-One-Group/JamIssue/pull/477) |
| [#478](https://github.com/STH-1-Class-One-Group/JamIssue/issues/478) | `floating-capsule-label-layer-polish` | active | 알림 패널, 필터 이모지, caret 정렬 보정 |

## TSK-015 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#491](https://github.com/STH-1-Class-One-Group/JamIssue/issues/491) | `sixth-uiux-audit-baseline` | active | baseline evidence pending |
| [#492](https://github.com/STH-1-Class-One-Group/JamIssue/issues/492) | `map-drawer-state-model` | planned | pending |
| [#493](https://github.com/STH-1-Class-One-Group/JamIssue/issues/493) | `map-drawer-shell-visual-redesign` | planned | pending |
| [#494](https://github.com/STH-1-Class-One-Group/JamIssue/issues/494) | `bottom-nav-icon-pill-redesign` | planned | pending |
| [#495](https://github.com/STH-1-Class-One-Group/JamIssue/issues/495) | `pwa-app-icon-brand-assets` | planned | pending |
| [#496](https://github.com/STH-1-Class-One-Group/JamIssue/issues/496) | `drawer-nav-css-policy-cleanup` | planned | pending |
| [#497](https://github.com/STH-1-Class-One-Group/JamIssue/issues/497) | `sixth-uiux-qa-traceability` | completed | PR [#504](https://github.com/STH-1-Class-One-Group/JamIssue/pull/504) |

## TSK-016 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#509](https://github.com/STH-1-Class-One-Group/JamIssue/issues/509) | `seventh-uiux-component-architecture-audit` | completed | PR [#516](https://github.com/STH-1-Class-One-Group/JamIssue/pull/516) |
| [#510](https://github.com/STH-1-Class-One-Group/JamIssue/issues/510) | `app-capsule-shell-contract` | completed | PR [#519](https://github.com/STH-1-Class-One-Group/JamIssue/pull/519) |
| [#511](https://github.com/STH-1-Class-One-Group/JamIssue/issues/511) | `capsule-center-controls-migration` | completed | PR [#521](https://github.com/STH-1-Class-One-Group/JamIssue/pull/521) |
| [#512](https://github.com/STH-1-Class-One-Group/JamIssue/issues/512) | `side-drawer-shell-foundation` | completed | PR [#523](https://github.com/STH-1-Class-One-Group/JamIssue/pull/523) |
| [#513](https://github.com/STH-1-Class-One-Group/JamIssue/issues/513) | `speed-dial-fab-action-contract` | completed | PR [#526](https://github.com/STH-1-Class-One-Group/JamIssue/pull/526) |
| [#514](https://github.com/STH-1-Class-One-Group/JamIssue/issues/514) | `capsule-fab-zindex-and-e2e-regression` | completed | PR [#529](https://github.com/STH-1-Class-One-Group/JamIssue/pull/529), traceability PRs [#530](https://github.com/STH-1-Class-One-Group/JamIssue/pull/530), [#531](https://github.com/STH-1-Class-One-Group/JamIssue/pull/531), [#532](https://github.com/STH-1-Class-One-Group/JamIssue/pull/532) |
| [#515](https://github.com/STH-1-Class-One-Group/JamIssue/issues/515) | `seventh-uiux-docs-traceability` | active | docs, Wiki, QA matrix, release candidate, parent/child readback finalization |

## TSK-017 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#552](https://github.com/STH-1-Class-One-Group/JamIssue/issues/552) | `feed-instagram-layout-polish` | active | Feed Instagram-like layout implementation |

## Scope Guard

| Excluded target | Handling rule |
| --- | --- |
| Backend provider contract changes | 별도 backend/admin contract issue에서 처리 |
| DB schema changes | 별도 migration issue에서 처리 |
| OAuth success path changes | 별도 auth issue에서 처리 |
| KTO provider contract changes | 별도 provider contract issue에서 처리 |
| 사용자-facing copy 스타일 정리 | 명시 요청이 있을 때만 별도 issue에서 처리 |
| SideDrawer menu IA와 새 placeholder copy | 별도 UI copy 또는 IA issue에서 처리 |
| New icon library adoption | 별도 dependency/design-system issue에서 처리 |

## 관련 문서

- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [JamIssue 1.3.5 후보](release-candidate-1.3.5.md)
- [JamIssue 1.3.6 후보](release-candidate-1.3.6.md)
- [TSK-016-01 7차 UI/UX 컴포넌트 아키텍처 Audit](TSK-016-01-seventh-uiux-component-architecture-audit.md)
- [TSK-016-07 7차 UI/UX Docs Traceability](TSK-016-07-seventh-uiux-docs-traceability.md)
