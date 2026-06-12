# UI/UX 기대 동작 QA 매트릭스

## 목적

화면이 사용자가 기대하는 방식으로 동작하는지 `UIUX-###` ID로 추적한다.

UI/UX 관련 이슈와 PR은 영향을 받는 기대 동작 ID, 재현 경로, 자동 테스트 여부, 수동 QA 여부, 관련 PR/issue를 기록한다. 근거 없이 UI/UX 이슈를 닫지 않는다.

## 운영 규칙

| 항목 | 기준 |
| --- | --- |
| ID 형식 | `UIUX-###` |
| 단위 | 사용자가 인지하는 화면 동작 하나 |
| 자동화 기준 | unit, integration, regression, E2E 중 하나로 재현 가능하면 자동 테스트에 연결 |
| 수동 QA 기준 | iPhone Safari/WebView처럼 자동화가 불완전한 항목은 수동 확인 근거 기록 |
| 완료 기준 | 자동 테스트 또는 수동 QA 근거 없이 close 금지 |

## 기대 동작 ID

| ID | 영역 | 기대 동작 | 재현 경로 | 자동화 상태 | 수동 QA |
| --- | --- | --- | --- | --- | --- |
| `UIUX-001` | 전역 앱 셸 | 모바일 기준 폭에서 하단 탭은 화면 하단에 고정되고 주요 패널과 겹치지 않는다. | 앱 진입 -> 탭 전환 | Playwright: `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-002` | 탭 전환 | `지도` 외 탭에서는 지도 배경이 보이지 않고 각 탭이 독립 화면처럼 보인다. | 지도 -> 행사/피드/코스/마이 | Playwright: `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-003` | 지도 레이어 | 상단 카드, 필터, 지도, 드로워, 알림/피드백 진입점, Naver attribution이 서로 잘못 올라오지 않는다. | 지도 -> 알림/피드백 열기 | Playwright + 수동 QA 필요 | 필요 |
| `UIUX-004` | 장소 시트 | 장소/행사 선택 후 시트가 `hidden / peek / half / full` 상태 계약을 유지한다. | 지도 -> 마커 선택 -> 시트 전환 | `test/unit/map-sheet-state.test.ts`, Playwright | 필요 |
| `UIUX-005` | 장소 정보 | 장소 시트는 장소명, 구, 요약, 카테고리, 방문/스탬프 상태, 후기 작성 가능 여부, 후기 목록을 보여준다. | 지도 -> 장소 선택 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-006` | 행사 정보 | 행사 탭은 독립 탭으로 접근되고 지도 배경과 섞이지 않는다. | 행사 탭 진입 | Playwright: `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-007` | 스탬프 버튼 | 로그아웃, 반경 밖, 반경 안, 오늘 완료 상태가 각각 기대 상태로 표시된다. | 지도 -> 장소 선택 -> 스탬프 버튼 | service/E2E 추가 필요 | 필요 |
| `UIUX-008` | 후기 작성 진입 | 후기는 당일 해당 장소 스탬프가 있을 때만 열리고, GPS 진입만으로는 열리지 않는다. | 스탬프 전/후 -> 후기 작성 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-009` | 모바일 키보드 | 리뷰 작성 textarea focus 시 키보드가 떠도 하단 탭과 드로워가 화면 중간으로 떠오르지 않는다. | 지도 -> 장소 -> 스탬프 완료 -> 후기 textarea focus | unit/integration + Playwright | 필수 |
| `UIUX-010` | 피드 탭 | 피드 탭은 실제 방문 후기 소비 중심이며 댓글, 좋아요, 장소 이동 CTA가 동작한다. | 피드 -> 댓글/좋아요/장소 이동 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-011` | 코스 탭 | 코스 탭은 정렬, 추천 코스 카드, 코스 상세 진입을 제공한다. | 코스 -> 정렬 -> 카드 선택 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-012` | 마이 탭 | 로그인 전에는 로그인 유도만, 로그인 후에는 개인 통계와 내 활동이 표시된다. | 마이 -> 로그인 전/후 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 선택 |
| `UIUX-013` | 5탭 IA | 하단 탭은 `지도 / 행사 / 피드 / 코스 / 마이` 5개를 유지하고 비지도 탭에서 지도 stage를 숨긴다. | 탭 전환 | Playwright: `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-014` | 탭 콘텐츠 surface | 행사/피드/코스/마이 콘텐츠는 앱 셸 content slot 안에서 접근 가능하다. | 행사/피드/코스/마이 탭 전환 | Playwright: `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-015` | 앱 헤더 | 앱 헤더는 safe area 아래에 있고 주요 액션은 앱 셸 슬롯 안에서 관리된다. | 앱 진입 -> 탭 전환 | Playwright: `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-016` | 서브 내비게이션 | 카테고리/필터 칩은 Sub Navigation 성격으로 콘텐츠와 시각적으로 분리된다. | 지도/행사 -> 필터 확인 | 추가 E2E 필요 | 필요 |
| `UIUX-017` | Peek 시트 | Peek 시트는 탭바 위 간격을 두고 floating card처럼 보인다. | 지도 -> 마커 선택 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 필수 |
| `UIUX-018` | Half/Full 시트 | Half/Full 시트에서는 탭바가 숨고 시트와 탭바가 동시에 겹쳐 보이지 않는다. | Peek -> Full 전환 | Playwright: `test/e2e/critical-ui-flow.spec.ts` | 필수 |
| `UIUX-019` | 내 위치 FAB | 내 위치 찾기 버튼은 지도 조작과 시트 상태를 방해하지 않는다. | 지도 -> 마커 선택 | 추가 E2E 필요 | 필요 |
| `UIUX-020` | 디자인 토큰 | shell, spacing, sheet, tabbar 값은 token/config 기준으로 관리된다. | UI PR diff 검토 | `npm.cmd run check:numeric-literals` | 필요 |

## TSK-012 구현 근거

| Child issue | PR | Merge SHA | 핵심 근거 |
| --- | --- | --- | --- |
| #381 | #396 | `c7f4c71` | 기준선 문서와 UIUX ID 체계 |
| #382 | #397 | `8d85a67` | 앱 셸 safe-area layout |
| #383 | #398 | `ed5b817` | `hidden / peek / half / full` sheet state |
| #384 | #399 | `e3f8481` | 5탭 IA regression |
| #385 | #400 | `7ed1af2` | 탭 content surface E2E |
| #386 | #401 | `90f6cec` | layout token gate와 `check:numeric-literals` |

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

## PR 체크 기준

- UI/UX 관련 PR은 영향을 받는 `UIUX-###` ID를 PR 본문에 기록한다.
- 자동 테스트가 있으면 테스트 파일과 명령을 기록한다.
- 자동화가 불완전한 항목은 수동 기기, 브라우저, 일시, 확인자를 기록한다.
- 기대 동작이 새로 생기면 이 문서에 ID를 먼저 추가한다.

## 관련 문서

- [화면 설계 기준](screen-spec.md)
- [앱 전환 UI/UX 개편 기준선](ui-ux-redesign-baseline.md)
- [테스트 커버리지 운영 기준](testing-coverage.md)
