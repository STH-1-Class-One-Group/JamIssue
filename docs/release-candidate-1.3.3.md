# JamIssue 1.3.3 후보

상태: 후보  
기준 Scope: `TSK-012`  
Parent Issue: [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404)

## 요약

`1.3.3` 후보는 2차 UI/UX 구현 명세를 Web Front에 반영한 UI/UX 구조 정리 릴리즈입니다. 주요 변경은 AppHeader 슬롯 통합, AppShell subNav flow, EventTab festival-only 정리, KTO 지도 정보 레이어, legacy CSS offset 제거, 문서 추적성 보강입니다.

## 사용자 관점 변화

- 상단 액션과 뒤로가기가 헤더 내부에 정리되어 화면 위 floating 요소가 줄어듭니다.
- 지도 필터가 지도 위에 겹치는 overlay가 아니라 앱 셸의 보조 내비게이션 흐름에 배치됩니다.
- 행사 탭은 행사 정보에 집중하고, 관광장소 정보는 지도에서 선택적으로 켤 수 있습니다.
- KTO 정보성 관광장소는 스탬프/후기 장소와 구분된 정보 시트로 표시됩니다.

## 운영/보안/품질 변화

- Web Front는 KTO consumer contract만 소유하며, provider contract나 admin import 흐름은 변경하지 않습니다.
- API path, response shape, DB schema, OAuth 성공 경로는 변경하지 않았습니다.
- UI/UX 기대 동작은 `UIUX-###` ID와 E2E/unit 테스트로 추적합니다.
- legacy CSS offset과 무효화된 override를 줄여 레이아웃 회귀 가능성을 낮췄습니다.

## 포함 PR / 커밋

| PR | 내용 | Merge SHA |
| --- | --- | --- |
| [#412](https://github.com/STH-1-Class-One-Group/JamIssue/pull/412) | 2차 UI/UX 기준선 audit | `dc0c5027` |
| [#413](https://github.com/STH-1-Class-One-Group/JamIssue/pull/413) | AppHeader slot 통합 | `edac1e31` |
| [#414](https://github.com/STH-1-Class-One-Group/JamIssue/pull/414) | AppShell subNav grid flow | `bcd1284` |
| [#415](https://github.com/STH-1-Class-One-Group/JamIssue/pull/415) | EventTab festival-only cleanup | `3ee8f77` |
| [#416](https://github.com/STH-1-Class-One-Group/JamIssue/pull/416) | KTO tourism map layer와 InfoSheet | `b89b7fc` |
| [#417](https://github.com/STH-1-Class-One-Group/JamIssue/pull/417) | App shell CSS offset cleanup | `fa67c88` |
| TBD | TSK-012 traceability docs | TBD |

## 검증 근거

공통 검증 기준:

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

각 PR의 실제 실행 결과와 원격 CI 링크는 child issue 완료 댓글과 PR checks에 기록합니다.

## 제외 범위

- Backend provider contract 변경
- DB schema 변경
- OAuth 성공 경로 변경
- KTO/OpenAPI 브라우저 직접 호출
- 사용자-facing copy 스타일 정리

## 관련 문서

- [UI/UX 구현 기준선](ui-ux-redesign-baseline.md)
- [UI/UX 추적성](ui-ux-redesign-traceability.md)
- [UI/UX QA 매트릭스](ui-ux-qa-matrix.md)
- [Governance Index](GOVERNANCE_INDEX.md)
