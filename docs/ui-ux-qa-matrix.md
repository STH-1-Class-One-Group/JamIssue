# UI/UX 기대 동작 QA 매트릭스

이 문서는 Web Front에서 사용자가 기대하는 화면 동작을 `UIUX-###` ID로 추적합니다. UI/UX 관련 PR은 영향을 받는 ID, 자동 테스트, 수동 QA 여부, 관련 issue/PR을 남겨야 합니다.

## 운영 규칙

| 항목 | 기준 |
| --- | --- |
| ID 형식 | `UIUX-###` |
| 단위 | 사용자가 체감하는 화면 동작 하나 |
| 자동화 기준 | unit, integration, regression, E2E 중 하나로 재현 가능하면 자동 테스트에 연결 |
| 수동 QA 기준 | 실제 iPhone Safari/WebView처럼 자동화가 불완전한 항목은 기기, 브라우저, 일시, 확인자를 기록 |
| 완료 기준 | 자동 테스트 또는 수동 QA 근거 없이 close 금지 |

## 기대 동작 ID

| ID | 영역 | 기대 동작 | 자동 테스트 | 수동 QA |
| --- | --- | --- | --- | --- |
| `UIUX-001` | 앱 셸 | 모바일 기준 헤더, 콘텐츠, 하단 탭이 겹치지 않고 shell flow에 배치된다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-002` | 탭 전환 | 비지도 탭에서는 지도 배경이 노출되지 않고 각 탭이 독립 화면처럼 보인다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-003` | 지도 레이아웃 | 헤더, 서브내비, 지도, 시트, Naver attribution이 서로 겹치지 않는다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-004` | 장소 시트 | 장소/정보 시트는 `hidden / peek / half / full` 상태 계약을 유지한다. | `test/unit/map-sheet-state.test.ts` | 필요 |
| `UIUX-005` | 장소 정보 | 장소 시트에는 장소명, 카테고리, 스탬프/후기 상태, 후기 목록이 표시된다. | `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-006` | 행사 탭 | 행사 탭은 행사 콘텐츠만 표시하고 관광장소 세그먼트를 노출하지 않는다. | `test/e2e/event-tab.spec.ts` | 선택 |
| `UIUX-007` | 스탬프 | 로그인, 반경, 완료 상태별 스탬프 버튼 상태가 올바르게 표시된다. | E2E 보강 대상 | 필요 |
| `UIUX-008` | 후기 작성 | 후기 작성은 해당 장소 스탬프 완료 상태에서만 진입된다. | `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-009` | 모바일 키보드 | 리뷰 작성 textarea focus 시 키보드가 떠도 하단 탭과 드로워가 화면 중간으로 떠오르지 않는다. | unit/integration + E2E | 필수 |
| `UIUX-010` | 피드 | 피드 탭에서 댓글, 좋아요, 장소 이동 CTA가 동작한다. | `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-011` | 코스 | 코스 탭에서 정렬, 추천 코스 카드, 상세 진입이 동작한다. | `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-012` | 마이 | 로그인 전/후 마이 탭 상태가 구분되고 내 활동으로 진입할 수 있다. | `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-013` | 5탭 IA | 하단 탭은 `지도 / 행사 / 피드 / 코스 / 마이` 5개를 유지한다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-014` | 탭 콘텐츠 | 행사/피드/코스/마이 콘텐츠는 공통 content slot 안에서 접근 가능하다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-015` | 앱 헤더 | 뒤로가기, 설정, 알림, 피드백 액션은 absolute utility slot이 아니라 header slot에서 관리된다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-016` | 서브내비 | 지도 필터와 탭별 보조 조작은 content 위 absolute overlay가 아니라 subNav flow에 배치된다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-017` | Peek 시트 | Peek 시트는 하단 탭과 간격을 두고 floating card처럼 보인다. | `test/e2e/critical-ui-flow.spec.ts` | 필수 |
| `UIUX-018` | Half/Full 시트 | Half/Full 시트에서는 하단 탭이 숨고 시트와 탭바가 동시에 겹쳐 보이지 않는다. | `test/e2e/critical-ui-flow.spec.ts` | 필수 |
| `UIUX-019` | 지도 FAB | 현재 위치 버튼과 지도 보조 액션은 지도 조작과 시트 상태를 방해하지 않는다. | E2E 보강 대상 | 필요 |
| `UIUX-020` | 디자인 토큰 | shell, spacing, sheet, tabbar 값은 token/config 기준으로 관리된다. | `npm.cmd run check:numeric-literals` | 필요 |
| `UIUX-021` | KTO 지도 레이어 | KTO 정보성 레이어는 기본 OFF이며, 사용자가 켤 때만 관광장소를 불러온다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |
| `UIUX-022` | KTO 정보 시트 | `isCurated: false` 관광장소 선택 시 스탬프/후기 액션 없는 정보 시트가 열린다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |

## TSK-012 구현 근거

| Child issue | PR | Merge SHA | 고정된 기대 동작 |
| --- | --- | --- | --- |
| [#405](https://github.com/STH-1-Class-One-Group/JamIssue/issues/405) | [#412](https://github.com/STH-1-Class-One-Group/JamIssue/pull/412) | `dc0c5027` | 2차 UI/UX 기준선과 코드 증거 |
| [#406](https://github.com/STH-1-Class-One-Group/JamIssue/issues/406) | [#413](https://github.com/STH-1-Class-One-Group/JamIssue/pull/413) | `edac1e31` | `UIUX-015` header slot |
| [#407](https://github.com/STH-1-Class-One-Group/JamIssue/issues/407) | [#414](https://github.com/STH-1-Class-One-Group/JamIssue/pull/414) | `bcd1284` | `UIUX-016` subNav flow |
| [#408](https://github.com/STH-1-Class-One-Group/JamIssue/issues/408) | [#415](https://github.com/STH-1-Class-One-Group/JamIssue/pull/415) | `3ee8f77` | `UIUX-006` 행사 탭 festival-only |
| [#409](https://github.com/STH-1-Class-One-Group/JamIssue/issues/409) | [#416](https://github.com/STH-1-Class-One-Group/JamIssue/pull/416) | `b89b7fc` | `UIUX-021`, `UIUX-022` KTO 지도 레이어 |
| [#410](https://github.com/STH-1-Class-One-Group/JamIssue/issues/410) | [#417](https://github.com/STH-1-Class-One-Group/JamIssue/pull/417) | `fa67c88` | legacy absolute/fixed offset 제거 |

## 이슈 템플릿

```markdown
## 기대 동작 ID

- UIUX-###

## 기대 동작

-

## 실제 동작

-

## 재현 경로

1.

## 테스트 상태

- 자동 테스트:
- 수동 QA:

## 관련 근거

- Issue:
- PR:
- Merge SHA:
- CI:
```

## 관련 문서

- [화면 설계 기준](screen-spec.md)
- [UI/UX 개편 기준선](ui-ux-redesign-baseline.md)
- [UI/UX 추적성](ui-ux-redesign-traceability.md)
- [테스트 커버리지 운영 기준](testing-coverage.md)
