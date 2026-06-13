# Governance Index

이 문서는 JamIssue Web Front 레포에서 현재 진행 중인 작업 축과 책임 범위를 빠르게 찾기 위한 색인입니다.

## 현재 기준

| Scope | Parent Issue | 책임 범위 | 구현 브랜치 원칙 | 완료 근거 |
| --- | --- | --- | --- | --- |
| `TSK-012` | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) | 2차 UI/UX 구현 명세 적용. 헤더 슬롯, 서브내비 flow, 행사 탭 정리, KTO 지도 레이어, CSS offset 정리, 문서 추적성 | child issue별 목적형 브랜치 | PR 링크, merge SHA, CI 링크, QA 문서, release candidate 문서 |
| `TSK-009` | [#323](https://github.com/STH-1-Class-One-Group/JamIssue/issues/323) | UI/UX 기대 동작 추적과 TypeScript 테스트 커버리지 | coverage slice 단위 브랜치 | coverage summary, 테스트 명령, CI 링크 |

## TSK-012 Child Issues

| Child | Branch | 상태 | 핵심 증거 |
| --- | --- | --- | --- |
| [#405](https://github.com/STH-1-Class-One-Group/JamIssue/issues/405) | `second-uiux-audit-baseline` | 완료 | PR #412, merge `dc0c5027` |
| [#406](https://github.com/STH-1-Class-One-Group/JamIssue/issues/406) | `app-header-slot-integration` | 완료 | PR #413, merge `edac1e31` |
| [#407](https://github.com/STH-1-Class-One-Group/JamIssue/issues/407) | `app-shell-subnav-grid-layout` | 완료 | PR #414, merge `bcd1284` |
| [#408](https://github.com/STH-1-Class-One-Group/JamIssue/issues/408) | `event-tab-festival-only-cleanup` | 완료 | PR #415, merge `3ee8f77` |
| [#409](https://github.com/STH-1-Class-One-Group/JamIssue/issues/409) | `kto-tourism-map-layer-infosheet` | 완료 | PR #416, merge `b89b7fc` |
| [#410](https://github.com/STH-1-Class-One-Group/JamIssue/issues/410) | `app-shell-css-offset-cleanup` | 완료 | PR #417, merge `fa67c88` |
| [#411](https://github.com/STH-1-Class-One-Group/JamIssue/issues/411) | `second-uiux-traceability-docs` | 진행 중 | repo docs, Wiki, QA matrix, release candidate note |

## Scope Guard

TSK-012는 Web Front UI/UX 구현 축입니다. 다음 항목은 TSK-012에 섞지 않습니다.

| 제외 대상 | 처리 기준 |
| --- | --- |
| Backend provider contract 변경 | 별도 backend/admin 레포 또는 합의된 contract issue에서 처리 |
| DB schema 변경 | 별도 migration issue에서 처리 |
| OAuth 성공 경로 변경 | auth 전용 issue에서 처리 |
| 사용자-facing copy 스타일 정리 | 명시 요청이 있을 때만 별도 issue에서 처리 |
| KTO/OpenAPI 직접 브라우저 호출 | 금지. Web Front는 consumer contract만 사용 |

## 문서 기준

- Repo 문서: [UI/UX QA 매트릭스](ui-ux-qa-matrix.md), [UI/UX 기준선](ui-ux-redesign-baseline.md), [UI/UX 추적성](ui-ux-redesign-traceability.md)
- Wiki 문서: `Home`, `UI-UX-QA-Matrix`, `UI-UX-Redesign-Traceability`, `Release-Notes-1.3.3`
- Release candidate: [JamIssue 1.3.3 후보](release-candidate-1.3.3.md)
