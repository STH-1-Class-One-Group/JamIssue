# Human-Readable Architecture Traceability

Scope-ID: `TSK-006-00-HUMAN-READABLE-ARCHITECTURE-HARDENING`
Release: `1.2.11 후보`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/303

이 문서는 `1.2.10` 이후 진행한 human-readable architecture hardening의 완료 근거를 추적합니다. 목표는 interface-locality를 되돌리는 것이 아니라, 호출자가 읽는 진입점은 얕게 유지하고 내부 구현은 업무 언어 기준으로 나눠 탐색 비용을 줄이는 것입니다.

## 고정 조건

- 외부 API path, response shape, DB schema 변경 없음
- 사용자-facing copy 변경 없음
- Kakao/Naver OAuth 성공 경로 변경 없음
- global barrel 또는 중앙 타입 덩어리 회귀 없음
- route/runtime/index 계층의 domain internal 직접 참조 없음
- child issue 없이 구현 진행 없음

## 완료 범위

| Scope-ID | Issue | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- |
| `TSK-006-01` | [#304](https://github.com/STH-1-Class-One-Group/JamIssue/issues/304) | [#309](https://github.com/STH-1-Class-One-Group/JamIssue/pull/309) | `4f72cc9fac577ff28a6e9896184ba8507d765e17` | depth, root file count, import hotspot, large file 기준선과 gate 작성 |
| `TSK-006-02` | [#305](https://github.com/STH-1-Class-One-Group/JamIssue/issues/305) | [#310](https://github.com/STH-1-Class-One-Group/JamIssue/pull/310) | `a2ca1376f081fd5a900e5b98977c44ad3d1491e6` | Worker domain public entrypoint 추가, 외부 domain-internal import gate 추가 |
| `TSK-006-03` | [#306](https://github.com/STH-1-Class-One-Group/JamIssue/issues/306) | [#311](https://github.com/STH-1-Class-One-Group/JamIssue/pull/311) | `1e43c298a381548637e3b27d3b3022dd240f3fab` | `src/hooks` direct root 62 -> 35, tiny direct root 13 -> 9 |
| `TSK-006-04` | [#307](https://github.com/STH-1-Class-One-Group/JamIssue/issues/307) | [#312](https://github.com/STH-1-Class-One-Group/JamIssue/pull/312) | `bfb636ae83ca2447030669d81e132a5cda4c1047` | `festival-domain/mapper.ts` 457 -> 14 facade, `review-interactions.ts` 354 -> 13 facade |
| `TSK-006-05` | [#308](https://github.com/STH-1-Class-One-Group/JamIssue/issues/308) | TBD | TBD | Wiki, README, roadmap, release candidate traceability 갱신 |

## 현재 기준선 변화

| 항목 | 1.2.10 이후 기준 | TSK-006 결과 |
| --- | ---: | ---: |
| `src/hooks` direct root files | 62 | 35 |
| `src/hooks` tiny direct root files | 13 | 9 |
| Worker tracked TS max depth | 4 | 4 유지 |
| 250라인 초과 production TS/TSX 파일 | 4 | 2 |
| route/runtime/index의 domain internal 직접 import | 0 | 0 유지 |

## 남은 예외

| 파일 | 사유 |
| --- | --- |
| `deploy/api-worker-shell/services/auth.ts` | OAuth/session public boundary 성격이 강해 이번 slicing 범위에서 제외했습니다. |
| `deploy/api-worker-shell/services/auth/session.ts` | session signing, cookie, secret guard가 얽힌 보안 boundary라 별도 보안 검토 없이 나누지 않았습니다. |

## 검증 명령

각 child PR에서 아래 검증을 통과했습니다.

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
git diff --check
```

추가로 UTF-8 integrity check를 수행했고, Worker/readability 관련 targeted tests를 각 PR 본문과 completion report에 기록했습니다.

## 릴리즈 판단

`1.2.11`은 아직 정식 릴리즈가 아닙니다. #308이 main에 병합되고 최신 main CI, production-smoke, CodeQL, Dependabot/code-scanning 상태가 확인되면 정식 발행 여부를 다시 판단합니다.
