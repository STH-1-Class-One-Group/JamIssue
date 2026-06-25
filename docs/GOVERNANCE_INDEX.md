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

| `TSK-011` | [#376](https://github.com/STH-1-Class-One-Group/JamIssue/issues/376) | Open PR review and triage for existing backlog PRs | child issue purpose branch | PR comments, closed PR readback, merge SHA, validation evidence |
| `TSK-018` | [#571](https://github.com/STH-1-Class-One-Group/JamIssue/issues/571) | Profile avatar Web Front consumer contract, My Page summary avatar, feed/comment author avatar | child issue purpose branch | PR link, merge SHA, avatar contract tests, CI link |
| `TSK-019` | [#582](https://github.com/STH-1-Class-One-Group/JamIssue/issues/582) | Seasonal theme token hardening and raw color literal regression guard | child issue purpose branch | PR link, merge SHA, seasonal token tests, CI link |
| `TSK-021` | [#620](https://github.com/STH-1-Class-One-Group/JamIssue/issues/620) | 앱 내비게이션, 마이페이지, 계정 설정, 앱 설정, 햄버거, 지도 표시 설정 책임 분리 | child issue별 목적형 브랜치 | PR 링크, merge SHA, responsibility matrix, CI 링크 |
| `TSK-022` | [#662](https://github.com/STH-1-Class-One-Group/JamIssue/issues/662) | Dependabot npm security alert remediation for Web Front lockfile dependencies | child issue purpose branch | PR link, merge SHA, Dependabot alert readback, CI link |

| `TSK-023` | [#668](https://github.com/STH-1-Class-One-Group/JamIssue/issues/668) | Visible theme token hardening for scrollbars, forms, drawers, and app surfaces | child issue purpose branch | PR link, merge SHA, visible theme source-quality gate, CI link |
| `TSK-024` | [#682](https://github.com/STH-1-Class-One-Group/JamIssue/issues/682) | App chrome drawer UI kit boundary, drawer primitive composition, and hardcoding regression guard | child issue purpose branch | PR link, merge SHA, drawer kit source-quality gate, CI link |
| `TSK-025` | [#690](https://github.com/STH-1-Class-One-Group/JamIssue/issues/690) | App-wide UI kit foundation, screen rhythm modernization, screen migration, and visual-system quality gates | child issue purpose branch | PR link, merge SHA, UI kit source-quality gate, screen migration evidence, CI link |

## Core Rows

| Core | Parent Issue | Responsibility | Keywords | Misroute examples |
| --- | --- | --- | --- | --- |
| `TSK-012-00-SECOND-UIUX-KTO-MAP-INTEGRATION` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | Web Front KTO 지도 통합과 관광정보 corrective work | kto; tourism; map; marker; uiux; subnav | backend provider contract, DB schema, OAuth flow |
| `TSK-009-00-UIUX-COVERAGE-GATE` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX expectation tracking and TypeScript/Python coverage gate | coverage; uiux; test; e2e; playwright | KTO feature implementation, backend provider contract |
| `TSK-013-00-FIFTH-UIUX-FLOATING-CAPSULE-NAV` | [#466](https://github.com/STH-1-Class-One-Group/JamIssue/issues/466) | 5차 UI/UX 상단 헤더 제거와 지도 플로팅 캡슐 내비게이션 | floating capsule; map nav; splash; notification | backend provider contract, DB schema, OAuth flow |
| `TSK-015-00-SIXTH-UIUX-DRAWER-NAV-PWA-REDESIGN` | [#490](https://github.com/STH-1-Class-One-Group/JamIssue/issues/490) | 6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 홈 아이콘 | bottom drawer; bottom navigation; PWA icon; app icon | backend provider contract, DB schema, OAuth flow |
| `TSK-016-00-UIUX-GLOBAL-CAPSULE-NAV-ACTION-ARCHITECTURE` | [#508](https://github.com/STH-1-Class-One-Group/JamIssue/issues/508) | 7차 UI/UX 전역 캡슐, SideDrawer shell, SpeedDialFAB, overlay regression hardening | app capsule; side drawer; speed dial; fab; z-index | 6차 drawer/nav/PWA icon work, backend provider contract, DB schema |

| `TSK-017-00-FEED-INSTAGRAM-LAYOUT` | [#551](https://github.com/STH-1-Class-One-Group/JamIssue/issues/551) | Feed tab Instagram-like layout polish while preserving JamIssue tone and existing feed behavior | feed; review card; instagram layout; uiux | backend provider contract, DB schema, OAuth flow, KTO map work |

| `TSK-011-00-OPEN-PR-REVIEW-AND-TRIAGE` | [#376](https://github.com/STH-1-Class-One-Group/JamIssue/issues/376) | Review open backlog PRs, salvage useful changes, and close low-value or noisy PRs with rationale | pull request; triage; backlog; merge; close; review | new feature parent, unrelated UI redesign, backend provider contract |
| `TSK-018-00-PROFILE-AVATAR-FRONT-CONSUMPTION` | [#571](https://github.com/STH-1-Class-One-Group/JamIssue/issues/571) | Web Front consumes Backend/Admin profile avatar contract for upload/delete, My Page, feed, and comment avatar rendering | profile avatar; my page; feed author; comment author; consumer API | backend provider implementation, Supabase Storage direct call, DB schema, OAuth flow |
| `TSK-019-00-SEASON-THEME-TOKEN-HARDENING` | [#582](https://github.com/STH-1-Class-One-Group/JamIssue/issues/582) | Seasonal theme tokenization, runtime season resolution, and hardcoded color regression guard | season theme; design token; color token; source quality; app chrome | tab/navigation feature changes, backend provider contract, DB schema, OAuth flow |
| `TSK-021-00-NAVIGATION-SETTINGS-RESPONSIBILITY-SPLIT` | [#620](https://github.com/STH-1-Class-One-Group/JamIssue/issues/620) | 앱 내비게이션, 마이페이지 대시보드, 계정 설정, 앱 설정, 햄버거 메뉴, 지도 표시 설정의 책임 경계 분리 | navigation; settings; my page; account settings; app settings; hamburger; map preferences | TSK-020 activity view work, backend provider contract, DB schema, OAuth flow, unrelated UI redesign |
| `TSK-022-00-DEPENDABOT-NPM-SECURITY-REMEDIATION` | [#662](https://github.com/STH-1-Class-One-Group/JamIssue/issues/662) | Dependabot npm security alert remediation for transitive lockfile dependencies | dependabot; security; npm; package-lock; undici; ws | UI/UX work, backend provider contract, DB schema, OAuth flow, unrelated dependency modernization |

| `TSK-023-00-VISIBLE-THEME-TOKEN-HARDENING` | [#668](https://github.com/STH-1-Class-One-Group/JamIssue/issues/668) | Visible theme token hardening for scrollbars, form controls, drawer surfaces, and raw color source-quality gates | visible theme; scrollbar; form surface; drawer surface; semantic token; source quality | TSK-021 drawer behavior bugs, backend provider contract, DB schema, OAuth flow, KTO provider contract |
| `TSK-024-00-APP-CHROME-DRAWER-UI-KIT` | [#682](https://github.com/STH-1-Class-One-Group/JamIssue/issues/682) | App chrome drawer UI kit boundary for shared drawer shell, section, card, list, form, action, and scrollbar primitives | drawer ui kit; app chrome; side drawer; settings drawer; notification drawer; hardcoding guard | TSK-021 responsibility split, backend provider contract, DB schema, OAuth flow, KTO provider contract |
| `TSK-025-00-APP-WIDE-UI-KIT-SCREEN-RHYTHM` | [#690](https://github.com/STH-1-Class-One-Group/JamIssue/issues/690) | App-wide UI kit foundation, shared screen rhythm, feature screen migration, and visual-system hardcoding gates | app-wide ui kit; screen rhythm; visual system; app surface; content card; section header; feed rhythm; my page rhythm; event course list; map sheet tourism | TSK-024 drawer-only kit, TSK-021 navigation/settings responsibility split, backend provider contract, DB schema, OAuth flow, KTO provider contract |

## TSK-011 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#377](https://github.com/STH-1-Class-One-Group/JamIssue/issues/377) | `open-pr-backlog-triage-20260624` | active | Open PR backlog triage evidence pending |

## TSK-023 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#669](https://github.com/STH-1-Class-One-Group/JamIssue/issues/669) | `visible-theme-hardcoding-audit` | completed | PR [#674](https://github.com/STH-1-Class-One-Group/JamIssue/pull/674), merge `307ffabe2068a22d73df15489c97b03697a94abd` |
| [#670](https://github.com/STH-1-Class-One-Group/JamIssue/issues/670) | `themed-scrollbar-contract` | completed | PR [#674](https://github.com/STH-1-Class-One-Group/JamIssue/pull/674), merge `307ffabe2068a22d73df15489c97b03697a94abd` |
| [#671](https://github.com/STH-1-Class-One-Group/JamIssue/issues/671) | `drawer-form-surface-token-migration` | completed | PR [#674](https://github.com/STH-1-Class-One-Group/JamIssue/pull/674), merge `307ffabe2068a22d73df15489c97b03697a94abd` |
| [#672](https://github.com/STH-1-Class-One-Group/JamIssue/issues/672) | `visible-theme-source-quality-gate` | completed | PR [#676](https://github.com/STH-1-Class-One-Group/JamIssue/pull/676), merge `db5545e14c6ba1cac90effbd89d03479789b548d` |
| [#673](https://github.com/STH-1-Class-One-Group/JamIssue/issues/673) | `theme-polish-traceability` | active | TSK-023 closeout PR pending |

## TSK-022 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#663](https://github.com/STH-1-Class-One-Group/JamIssue/issues/663) | `dependabot-security-alert-remediation` | active | Dependabot alert remediation evidence pending |

## TSK-019 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#583](https://github.com/STH-1-Class-One-Group/JamIssue/issues/583) | `season-theme-audit-baseline` | completed | PR [#589](https://github.com/STH-1-Class-One-Group/JamIssue/pull/589), [#590](https://github.com/STH-1-Class-One-Group/JamIssue/pull/590), [#591](https://github.com/STH-1-Class-One-Group/JamIssue/pull/591) |
| [#584](https://github.com/STH-1-Class-One-Group/JamIssue/issues/584) | `season-theme-token-boundary` | completed | PR [#594](https://github.com/STH-1-Class-One-Group/JamIssue/pull/594) |
| [#585](https://github.com/STH-1-Class-One-Group/JamIssue/issues/585) | `season-theme-runtime-application` | completed | PR [#596](https://github.com/STH-1-Class-One-Group/JamIssue/pull/596) |
| [#586](https://github.com/STH-1-Class-One-Group/JamIssue/issues/586) | `season-theme-component-migration` | completed | PR [#599](https://github.com/STH-1-Class-One-Group/JamIssue/pull/599) |
| [#587](https://github.com/STH-1-Class-One-Group/JamIssue/issues/587) | `season-theme-verification-gate` | completed | PR [#601](https://github.com/STH-1-Class-One-Group/JamIssue/pull/601), [#602](https://github.com/STH-1-Class-One-Group/JamIssue/pull/602) |
| [#588](https://github.com/STH-1-Class-One-Group/JamIssue/issues/588) | `season-theme-docs-traceability` | active | Wiki, QA matrix, release candidate, ledger evidence |

## TSK-021 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#621](https://github.com/STH-1-Class-One-Group/JamIssue/issues/621) | `navigation-settings-responsibility-audit` | completed | responsibility matrix, source-quality guard, PR evidence recorded |
| [#622](https://github.com/STH-1-Class-One-Group/JamIssue/issues/622) | `my-page-dashboard-hierarchy` | completed | My Page dashboard hierarchy evidence recorded |
| [#623](https://github.com/STH-1-Class-One-Group/JamIssue/issues/623) | `account-settings-boundary` | completed | account settings boundary evidence recorded |
| [#624](https://github.com/STH-1-Class-One-Group/JamIssue/issues/624) | `app-settings-panel` | completed | app settings panel evidence recorded |
| [#625](https://github.com/STH-1-Class-One-Group/JamIssue/issues/625) | `map-display-preferences` | completed | map preference behavior evidence recorded |
| [#626](https://github.com/STH-1-Class-One-Group/JamIssue/issues/626) | `hamburger-secondary-menu` | completed | secondary menu policy evidence recorded |
| [#627](https://github.com/STH-1-Class-One-Group/JamIssue/issues/627) | `settings-navigation-regression-tests` | completed | regression and traceability evidence recorded |
| [#642](https://github.com/STH-1-Class-One-Group/JamIssue/issues/642) | `notification-left-drawer` | active | notification left drawer evidence pending |
| [#643](https://github.com/STH-1-Class-One-Group/JamIssue/issues/643) | `app-settings-right-drawer` | planned | app settings right drawer evidence pending |
| [#644](https://github.com/STH-1-Class-One-Group/JamIssue/issues/644) | `my-page-account-entry-hierarchy` | planned | my page account hierarchy evidence pending |
| [#645](https://github.com/STH-1-Class-One-Group/JamIssue/issues/645) | `kto-marker-visibility-polish` | planned | KTO marker visibility evidence pending |
| [#646](https://github.com/STH-1-Class-One-Group/JamIssue/issues/646) | `navigation-settings-polish-traceability` | planned | polish traceability evidence pending |

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
| [#556](https://github.com/STH-1-Class-One-Group/JamIssue/issues/556) | `feed-copy-accessibility-restoration` | active | Feed Korean copy, accessibility labels, and mojibake regression restoration |

## TSK-018 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#572](https://github.com/STH-1-Class-One-Group/JamIssue/issues/572) | `profile-avatar-front-contract-audit` | planned | profile avatar front contract audit |
| [#573](https://github.com/STH-1-Class-One-Group/JamIssue/issues/573) | `profile-avatar-front-consumption` | active | upload/delete consumer, My Page, feed/comment vertical slice |
| [#574](https://github.com/STH-1-Class-One-Group/JamIssue/issues/574) | `my-page-avatar-summary-header` | planned | My Page avatar summary header evidence |
| [#575](https://github.com/STH-1-Class-One-Group/JamIssue/issues/575) | `feed-comment-author-avatar` | planned | feed/comment author avatar evidence |
| [#576](https://github.com/STH-1-Class-One-Group/JamIssue/issues/576) | `profile-avatar-front-traceability` | planned | docs and traceability evidence |

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
- [계절 테마 QA와 운영 기준](season-theme-qa-and-operations.md)
- [JamIssue 1.3.5 후보](release-candidate-1.3.5.md)
- [JamIssue 1.3.6 후보](release-candidate-1.3.6.md)
- [JamIssue 1.3.7 후보](release-candidate-1.3.7.md)
- [TSK-016-01 7차 UI/UX 컴포넌트 아키텍처 Audit](TSK-016-01-seventh-uiux-component-architecture-audit.md)
- [TSK-016-07 7차 UI/UX Docs Traceability](TSK-016-07-seventh-uiux-docs-traceability.md)

## TSK-025 Child Issues

| Child | Branch | Status | Evidence |
| --- | --- | --- | --- |
| [#691](https://github.com/STH-1-Class-One-Group/JamIssue/issues/691) | `visual-system-audit-baseline` | completed | PR [#699](https://github.com/STH-1-Class-One-Group/JamIssue/pull/699), merge `033c938176656489f3c6c56f2b5493e8c05a2e6b` |
| [#692](https://github.com/STH-1-Class-One-Group/JamIssue/issues/692) | `app-ui-kit-foundation` | completed | PR [#700](https://github.com/STH-1-Class-One-Group/JamIssue/pull/700), merge `a3a9b80b10039498cf8315bc26cddc8df0b3ece6` |
| [#693](https://github.com/STH-1-Class-One-Group/JamIssue/issues/693) | `my-page-settings-drawer-migration` | completed | PR [#701](https://github.com/STH-1-Class-One-Group/JamIssue/pull/701), merge `5335e53967715db1f69e0f2e6cb6298f10bab57b` |
| [#694](https://github.com/STH-1-Class-One-Group/JamIssue/issues/694) | `feed-modern-rhythm-migration` | completed | PR [#702](https://github.com/STH-1-Class-One-Group/JamIssue/pull/702), merge `2c6263a0533aee2cb341237b582e6c699c6b0c10` |
| [#695](https://github.com/STH-1-Class-One-Group/JamIssue/issues/695) | `event-course-list-migration` | completed | PR [#703](https://github.com/STH-1-Class-One-Group/JamIssue/pull/703), merge `50c19d402a3344e917347fb642a72f77a793bc5b` |
| [#696](https://github.com/STH-1-Class-One-Group/JamIssue/issues/696) | `map-sheet-tourism-migration` | completed | PR [#704](https://github.com/STH-1-Class-One-Group/JamIssue/pull/704), merge `2221422254875bc7ace0dc3c7a91c3c9b667b7ab` |
| [#697](https://github.com/STH-1-Class-One-Group/JamIssue/issues/697) | `visual-system-quality-gate` | completed | PR [#705](https://github.com/STH-1-Class-One-Group/JamIssue/pull/705), merge `88a1fa8aaf6cd11d4b22f2bb4108fe77d2aa5579` |
| [#698](https://github.com/STH-1-Class-One-Group/JamIssue/issues/698) | `docs-traceability` | active | Docs/QA/release traceability PR pending |
