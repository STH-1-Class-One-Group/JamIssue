# JamIssue 앱 전환 UI/UX 개편 추적성

Scope-ID: `TSK-012`  
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/380  
상태: `1.3.x 후보 문서화 대상`

## 요약

TSK-012는 `JAM_ISSUE_UIUX_개편안.docx`를 기준으로 Web Front의 화면 구조를 앱 셸 기준으로 재정리한 작업 묶음이다.

핵심 방향은 다음과 같다.

- `Status Safe Area -> App Header -> Sub Navigation -> Content -> Bottom Tab Bar` 구조를 공식 화면 기준으로 둔다.
- 하단 탭은 `지도 / 행사 / 피드 / 코스 / 마이` 5탭을 유지한다.
- 지도 장소/행사 시트는 `hidden / peek / half / full` 상태 계약으로 관리한다.
- UI/UX 기대 동작은 `UIUX-###` ID와 Playwright/Vitest 근거로 추적한다.
- 외부 API path, response shape, DB schema, OAuth 경로는 변경하지 않는다.

## 구현 PR

| Child issue | PR | Merge SHA | 내용 | 검증 근거 |
| --- | --- | --- | --- | --- |
| #381 | #396 | `c7f4c71` | UI/UX 기준선과 QA matrix | docs readback, UTF-8 |
| #382 | #397 | `8d85a67` | App shell safe-area layout | E2E app shell |
| #383 | #398 | `ed5b817` | Map bottom sheet state machine | unit + E2E |
| #384 | #399 | `e3f8481` | Five-tab information architecture | E2E five-tab IA |
| #385 | #400 | `7ed1af2` | Tab content layout surfaces | E2E `UIUX-014` |
| #386 | #401 | `90f6cec` | Design token and layout constant gate | `check:numeric-literals` |
| #387 | #402 | TBD | Repo/Wiki traceability docs | docs readback |

## UIUX ID 연결

| ID | 고정된 기대 동작 | 근거 |
| --- | --- | --- |
| `UIUX-001` | 앱 셸과 하단 탭 anchoring | #382, #397 |
| `UIUX-004` | sheet state contract | #383, #398 |
| `UIUX-009` | 모바일 키보드 입력 중 nav/sheet anchoring | existing E2E |
| `UIUX-010` | 피드 댓글/좋아요/장소 CTA | existing E2E |
| `UIUX-011` | 코스 정렬/카드 진입 | existing E2E |
| `UIUX-012` | 마이 탭 로그인 전/후 상태 | existing E2E |
| `UIUX-013` | 5탭 IA와 비지도 탭 지도 숨김 | #384, #399 |
| `UIUX-014` | 탭 content surface 접근성 | #385, #400 |
| `UIUX-017` | Peek 시트와 탭바 간격 | #383, #398 |
| `UIUX-018` | Full 시트에서 탭바 숨김 | #383, #398 |
| `UIUX-020` | layout token/config gate | #386, #401 |

## 검증 명령

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run test:coverage:ts
npm.cmd run build
git diff --check
```

UTF-8 integrity check는 변경 파일 strict decode 기준으로 수행한다.

## 문서 링크

- [화면 설계 기준](screen-spec.md)
- [UI/UX 기대 동작 QA 매트릭스](ui-ux-qa-matrix.md)
- [앱 전환 UI/UX 개편 기준선](ui-ux-redesign-baseline.md)
- [테스트 커버리지 운영 기준](testing-coverage.md)

## 완료 전 남은 작업

- #387 PR merge 후 이 문서의 #387 merge SHA를 이슈 완료 근거에 기록한다.
- Wiki `Home`, `Development-Guide`, `UI-UX-QA-Matrix`, `Release Notes`에 같은 traceability를 연결한다.
- Parent #380에 최종 main SHA, CI, CodeQL, production-smoke 링크를 기록한다.
