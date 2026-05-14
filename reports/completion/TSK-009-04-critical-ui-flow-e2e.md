# TSK-009-04 Critical UI flow E2E

## 메타

- Scope-ID: `TSK-009-04`
- Parent Issue: `#323`
- Child Issue: `#327`
- Branch: `critical-ui-flow-e2e`
- Status: local validation passed, PR pending

## 변경 요약

- Playwright API fixture를 `test/e2e/fixtures.ts`로 분리했다.
- 모바일 app shell E2E가 공통 fixture를 사용하도록 정리했다.
- `test/e2e/critical-ui-flow.spec.ts`를 추가해 핵심 UI 기대 동작을 자동화했다.
- `docs/ui-ux-qa-matrix.md`에 자동화된 `UIUX-###` 근거를 갱신했다.

## 자동화된 기대 동작

- `UIUX-001`: 모바일 app shell과 하단 탭 노출
- `UIUX-004`: 장소 드로워 `full`/`partial` 상태 노출
- `UIUX-005`: 장소 상세 드로워의 장소 정보와 후기 영역 노출
- `UIUX-008`: 당일 스탬프 상태에서 후기 작성 진입
- `UIUX-009`: 후기 textarea focus 후 하단 nav 위치 유지
- `UIUX-010`: 피드 댓글 작성, 좋아요, 장소 이동 CTA
- `UIUX-011`: 코스 `좋아요순`/`최신순` 정렬
- `UIUX-012`: 로그인 후 마이페이지 기록과 내부 탭 노출

## 검증 결과

| 명령 | 결과 |
| --- | --- |
| `npm.cmd run check:numeric-literals` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run typecheck` | 통과 |
| `npm.cmd run test:unit` | 통과 |
| `npm.cmd run test:integration` | 통과 |
| `npm.cmd run test:regression` | 통과 |
| `npm.cmd run test:e2e` | 통과 |
| `npm.cmd run build` | 통과 |
| `git diff --check` | 통과 |
| UTF-8 integrity check | 통과 |

## 제외 범위

- 실제 iPhone Safari/WebView 수동 QA는 별도 수동 근거로 남겨야 한다.
- 95% coverage hard gate는 `TSK-009-05`, `TSK-009-06` 범위다.
