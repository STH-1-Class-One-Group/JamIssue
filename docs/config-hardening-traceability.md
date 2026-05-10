# Config Hardening Traceability

Scope-ID: `TSK-002-00-NUMERIC-CONFIG-HARDENING`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/238
PR: `TBD-TSK-002-07-CONFIG-HARDENING-DOCS-TRACEABILITY`
Branch: `config-hardening-docs-traceability`
Status: `candidate-docs`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/238
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/245

이 문서는 PR #237 이후 시작한 레포 전역 하드코딩 수치/좌표 Config 분리 작업의 완료 근거를 repo 기준으로 추적합니다.

## 목적

지도 좌표, marker anchor, z-index, zoom, pan delay, geolocation radius, API cache TTL, upload limit, pagination, Worker 운영 limit, FastAPI fallback 상수가 여러 파일에 raw number로 흩어져 있으면 다음 문제가 생깁니다.

| 문제 | 영향 |
| --- | --- |
| 수치의 소유권 불명확 | 지도, UI, API, Worker, FastAPI 중 어느 계층의 정책인지 리뷰가 어려움 |
| 회귀 검증 어려움 | 값 이동이 동작 보존인지 시각/계약 변경인지 구분하기 어려움 |
| 새 하드코딩 재유입 | 리팩터 이후 같은 문제가 다시 반복될 수 있음 |
| 앱 레포 공유 어려움 | 웹과 앱이 같은 백엔드/계약을 믿기 위한 기준 문서가 부족함 |

## 변경 금지 범위

- 사용자-facing copy 변경 없음
- API path/response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver REST OAuth 성공 경로 변경 없음
- 시각 redesign 없음
- 단일 거대 constants 파일 생성 없음

## 목표 구조

```text
production code
-> owner-specific config class / CSS token
-> unit or quality gate validation
-> issue / PR / release traceability
```

## Config 소유권

| 영역 | 기준 파일 | 소유 값 |
| --- | --- | --- |
| Frontend map/geo | `src/config/mapConfig.ts` | 대전 중심 좌표, zoom, marker anchor, marker z-index, selection pan/offset, geolocation threshold |
| Frontend UI token | `src/config/uiTokenConfig.ts`, `src/styles/tokens.css` | marker visual size, review image frame style, shell/overlay/sheet/navigation token |
| Frontend runtime limit | `src/config/runtimeLimitConfig.ts` | API cache TTL, image upload resize/quality, autoload, feedback radius/delay, pagination, floating button runtime |
| Worker runtime | `deploy/api-worker-shell/config/runtime.ts` | session cookie age, Supabase list limit, festival cache/window/display limit, notification limit, stamp radius |
| FastAPI runtime | `backend/app/runtime_config.py` | local/fallback auth defaults, public data timeout/limit, upload max, stamp/route/notification constants |
| Quality gate | `scripts/check-numeric-literals.mjs`, `config/numeric-literal-allowlist.json` | production numeric literal inventory and allowlist |

## Sub-Issue Trace

| Scope-ID | Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `TSK-002-01` | [#239](https://github.com/STH-1-Class-One-Group/JamIssue/issues/239) | `config-hardcoded-value-audit` | [#246](https://github.com/STH-1-Class-One-Group/JamIssue/pull/246) | `e70ded4f21bd8f2e9a7fa0644d699e626c9a9897` | literal inventory, allowlist, numeric gate |
| `TSK-002-02` | [#240](https://github.com/STH-1-Class-One-Group/JamIssue/issues/240) | `frontend-map-geo-config`, `frontend-map-geo-marker-regression` | [#247](https://github.com/STH-1-Class-One-Group/JamIssue/pull/247), [#248](https://github.com/STH-1-Class-One-Group/JamIssue/pull/248) | `141f27d1803e499dc74c49bccff2c272074aae1e`, `2597f982e1bff0ece06e98020f8cd624472721e4` | map/marker/geolocation config, O(1) marker selection regression |
| `TSK-002-03` | [#241](https://github.com/STH-1-Class-One-Group/JamIssue/issues/241) | `frontend-ui-token-config` | [#249](https://github.com/STH-1-Class-One-Group/JamIssue/pull/249) | `1e87b79d113e0376345b5985440f8496982b240b` | CSS token and UI visual config split |
| `TSK-002-04` | [#242](https://github.com/STH-1-Class-One-Group/JamIssue/issues/242) | `frontend-runtime-limit-config` | [#250](https://github.com/STH-1-Class-One-Group/JamIssue/pull/250) | `a20928a7ed64dd88fd91c3b6b9eb85781c1c15be` | API TTL, upload, autoload, feedback, pagination runtime config |
| `TSK-002-05` | [#243](https://github.com/STH-1-Class-One-Group/JamIssue/issues/243) | `worker-runtime-config` | [#251](https://github.com/STH-1-Class-One-Group/JamIssue/pull/251) | `3bcbbc4fd9e28d3b70f4899461e95dafbb7eb9e4` | Worker auth/session/festival/notification/stamp runtime config |
| `TSK-002-06` | [#244](https://github.com/STH-1-Class-One-Group/JamIssue/issues/244) | `fastapi-runtime-config-review` | [#252](https://github.com/STH-1-Class-One-Group/JamIssue/pull/252) | `08bfdcfa9071b69bf84e33828b27f608529ea2b7` | FastAPI local/fallback runtime config boundary |
| `TSK-002-07` | [#245](https://github.com/STH-1-Class-One-Group/JamIssue/issues/245) | `config-hardening-docs-traceability` | `TBD-TSK-002-07-CONFIG-HARDENING-DOCS-TRACEABILITY` | `TBD` | Wiki, runbook, release traceability |

## 검증 기준

각 구현 PR에서 공통으로 확인한 기준:

- `npm run check:numeric-literals`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
- UTF-8 integrity check
- GitHub Actions CI
- CodeQL
- Dependabot/code scanning open alert 확인

FastAPI 파일을 변경한 경우:

- `cd backend`
- `..\.tools\python313\python.exe -m pytest tests`

## 1.2.9 후보 범위

`1.2.9`는 `1.2.8` 이후의 config hardening 후보 릴리즈입니다.

포함 범위:

- PR #237 Naver marker selection O(1) 최적화
- TSK-002-01~TSK-002-07 config hardening 작업
- 숫자/좌표/시간/용량/레이아웃 값의 소유권 문서화
- numeric literal quality gate 유지

제외 범위:

- 새 사용자 기능
- API 계약 변경
- DB migration
- OAuth provider 동작 변경
- 시각 redesign

## 완료 판단

TSK-002 parent issue는 아래 조건을 만족할 때 닫을 수 있습니다.

- #239~#245가 PR, main merge SHA, CI 링크와 함께 닫힘
- Wiki Release Notes에 `1.2.9` 후보가 기록됨
- 배포 런북에 config ownership 기준이 기록됨
- 리팩터 로드맵에 TSK-002 완료 범위가 반영됨
- 신규 CodeQL/Security/Quality finding 없음
