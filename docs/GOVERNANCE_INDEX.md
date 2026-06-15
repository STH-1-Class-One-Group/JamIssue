# Governance Index

JamIssue Web Front 작업축과 책임 범위를 빠르게 찾기 위한 repo-local governance index입니다.

## 현재 기준

| Scope | Parent Issue | 책임 범위 | 구현 브랜치 원칙 | 완료 근거 |
| --- | --- | --- | --- | --- |
| `TSK-012` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | 2차/3차 KTO 지도 통합, 앱 셸 서브내비, 관광정보 토글, KTO marker layer corrective work | child issue별 목적형 브랜치 | PR 링크, merge SHA, CI 링크, QA 문서, release candidate 문서 |
| `TSK-009` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX 기대 동작 추적과 TypeScript 테스트 커버리지 | coverage slice 단위 브랜치 | coverage summary, 테스트 명령, CI 링크 |

## Core Rows

| Core | Parent Issue | Responsibility | Keywords | Misroute examples |
| --- | --- | --- | --- | --- |
| `TSK-012-00-SECOND-UIUX-KTO-MAP-INTEGRATION` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | Web Front KTO 지도 통합과 3차 관광정보 corrective work | kto; tourism; map; marker; uiux; subnav | backend provider contract, DB schema, OAuth flow |
| `TSK-009-00-UIUX-COVERAGE-GATE` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX expectation tracking and TypeScript/Python coverage gate | coverage; uiux; test; e2e; playwright | KTO feature implementation, backend provider contract |

## TSK-012 Child Issues

| Child | Branch | 상태 | 완료/진행 근거 |
| --- | --- | --- | --- |
| [#405](https://github.com/STH-1-Class-One-Group/JamIssue/issues/405) | `second-uiux-audit-baseline` | 완료 | PR #412 |
| [#406](https://github.com/STH-1-Class-One-Group/JamIssue/issues/406) | `app-header-slot-integration` | 완료 | PR #413 |
| [#407](https://github.com/STH-1-Class-One-Group/JamIssue/issues/407) | `app-shell-subnav-grid-layout` | 완료 | PR #414 |
| [#408](https://github.com/STH-1-Class-One-Group/JamIssue/issues/408) | `event-tab-festival-only-cleanup` | 완료 | PR #415 |
| [#409](https://github.com/STH-1-Class-One-Group/JamIssue/issues/409) | `kto-tourism-map-layer-infosheet` | 완료 | PR #416 |
| [#410](https://github.com/STH-1-Class-One-Group/JamIssue/issues/410) | `app-shell-css-offset-cleanup` | 완료 | PR #417 |
| [#411](https://github.com/STH-1-Class-One-Group/JamIssue/issues/411) | `second-uiux-traceability-docs` | 완료 | PR #418 |
| [#439](https://github.com/STH-1-Class-One-Group/JamIssue/issues/439) | `kto-canonical-taxonomy-consumption` | 완료 | PR #440 |
| [#441](https://github.com/STH-1-Class-One-Group/JamIssue/issues/441) | `kto-display-rendering-polish` | 완료 | PR #442 |
| [#443](https://github.com/STH-1-Class-One-Group/JamIssue/issues/443) | `map-curated-marker-count-fix` | 완료 | PR #444 |
| [#446](https://github.com/STH-1-Class-One-Group/JamIssue/issues/446) | `tourism-filter-local-response` | 완료 | PR #447 |
| [#448](https://github.com/STH-1-Class-One-Group/JamIssue/issues/448) | `tourism-initial-load-hardening` | 진행 중 | KTO 최초 로딩 timeout/first response hardening |
| [#449](https://github.com/STH-1-Class-One-Group/JamIssue/issues/449) | `tourism-marker-layer-hierarchy` | 대기 | KTO marker hierarchy and curated priority |

## Scope Guard

TSK-012는 Web Front UI/UX와 KTO 지도 consumer work를 소유합니다. 다음 항목은 TSK-012에서 직접 처리하지 않습니다.

| 제외 대상 | 처리 기준 |
| --- | --- |
| Backend provider contract 변경 | 별도 backend/admin repo 또는 합의된 contract issue에서 처리 |
| DB schema 변경 | 별도 migration issue에서 처리 |
| OAuth 성공 경로 변경 | auth 전용 issue에서 처리 |
| 사용자-facing copy 스타일 정리 | 명시 요청이 있을 때만 별도 issue에서 처리 |
| KTO/OpenAPI 직접 브라우저 호출 | 금지. Web Front는 Worker consumer contract만 사용 |

## 문서 기준

- Repo 문서: [UI/UX QA Matrix](ui-ux-qa-matrix.md), [UI/UX 기준선](ui-ux-redesign-baseline.md), [UI/UX 추적성](ui-ux-redesign-traceability.md)
- Wiki 문서: `Home`, `UI-UX-QA-Matrix`, `UI-UX-Redesign-Traceability`, `Release-Notes-1.3.3`
- Release candidate: [JamIssue 1.3.3 후보](release-candidate-1.3.3.md)
