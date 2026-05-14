# TSK-009-02 UI/UX expectation matrix

## 메타

- Scope-ID: `TSK-009-02`
- Parent Issue: `#323`
- Child Issue: `#325`
- Branch: `ui-ux-expectation-matrix`
- Status: matrix drafted

## 변경 요약

- UI/UX 기대 동작을 `UIUX-###` ID로 추적하는 문서를 추가했다.
- 화면 설계 기준 문서와 coverage 운영 기준 문서에서 매트릭스로 연결했다.
- 자동 테스트가 불완전한 모바일 Safari/WebView 항목은 수동 QA 근거가 필요하다고 명시했다.

## 검증 결과

| 명령 | 결과 |
| --- | --- |
| `npm.cmd run check:numeric-literals` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run typecheck` | 통과 |
| `npm.cmd run test:unit` | 통과 |
| `npm.cmd run test:integration` | 통과 |
| `npm.cmd run test:regression` | 통과 |
| `npm.cmd run build` | 통과 |
| `git diff --check` | 통과 |
| `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged` | 통과 |

## 제외 범위

- Playwright 도입은 `TSK-009-03` 범위다.
- E2E 시나리오 구현은 `TSK-009-04` 범위다.
- 95% coverage hard gate는 `TSK-009-05`, `TSK-009-06` 범위다.
