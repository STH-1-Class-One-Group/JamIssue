# TSK-009-03 Playwright E2E harness

## 메타

- Scope-ID: `TSK-009-03`
- Parent Issue: `#323`
- Child Issue: `#326`
- Branch: `playwright-e2e-harness`
- Status: local validation passed, PR pending

## 변경 요약

- `@playwright/test`를 devDependency로 추가했다.
- `npm.cmd run test:e2e` 명령을 추가했다.
- 빌드 산출물을 로컬에서 서빙하는 `scripts/serve-static-site.mjs`를 추가했다.
- 모바일 390px 기준 Playwright config를 추가했다.
- API fixture 기반 app shell smoke E2E를 추가했다.

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
| `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged` | 통과 |

## 검증 메모

- Playwright browser 실행은 headless Chromium process를 띄우므로 로컬 sandbox 밖에서 실행했다.
- sandbox 안에서는 Chromium spawn이 `EPERM`으로 차단됐다.

## 제외 범위

- 지도 드로워, 스탬프, 리뷰, 댓글 상세 E2E flow는 `TSK-009-04` 범위다.
- 95% coverage hard gate는 `TSK-009-05`, `TSK-009-06` 범위다.
