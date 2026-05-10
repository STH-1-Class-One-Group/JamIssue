# Interface Locality Traceability

Scope-ID: `TSK-003-00-INTERFACE-LOCALITY-HARDENING`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/254
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/268
Branch: `interface-locality-docs-traceability`
Status: `candidate-docs`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/254
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/261

이 문서는 1.2.9 refactoring candidate의 두 번째 축인 `TSK-003` interface locality hardening 결과를 repo 기준으로 추적합니다.

## 목적

공용 타입을 제거하는 것이 목적이 아닙니다. public API DTO와 cross-domain model은 중앙에 유지하고, 내부 구현 인터페이스는 실제 소유 모듈 근처로 이동해 변경 영향 범위를 줄이는 것이 목적입니다.

## 변경 금지 범위

- 사용자-facing copy 변경 없음
- API path/response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver REST OAuth 성공 경로 변경 없음
- public API DTO 제거 없음
- compatibility facade 즉시 제거 없음

## 설계 결정

| 영역 | 결정 |
| --- | --- |
| Worker public primitive | `deploy/api-worker-shell/types.ts`에는 `WorkerEnv`, session user, JSON primitive만 유지 |
| Worker runtime/service contract | route runtime과 service dependency type은 runtime/service/domain 소유 위치로 이동 |
| Worker row/read model | Supabase row, base-data row, mapper input은 repository/mapper 근처로 이동 |
| Frontend stage props | `AppPageStageProps` 중심 `Pick` 의존을 feed/course/my stage-local props로 분리 |
| Frontend type import | component/hook의 root `src/types.ts` barrel import를 domain type import로 전환 |
| FastAPI contracts | active app code는 `.models` compatibility facade 대신 `model_contracts/*`를 직접 import |

## Sub-Issue Trace

| Scope-ID | Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `TSK-003-01` | [#255](https://github.com/STH-1-Class-One-Group/JamIssue/issues/255) | `interface-locality-audit` | [#262](https://github.com/STH-1-Class-One-Group/JamIssue/pull/262) | `852728bda993710c09de8adb07711be0d5cb5968` | baseline 문서와 source-quality gate 추가 |
| `TSK-003-02` | [#256](https://github.com/STH-1-Class-One-Group/JamIssue/issues/256) | `worker-runtime-contract-locality` | [#263](https://github.com/STH-1-Class-One-Group/JamIssue/pull/263) | `5d88d6a15536c6ac04ed58bc4d26ca43d01ad8d7` | Worker runtime/service contract locality 정리 |
| `TSK-003-03` | [#257](https://github.com/STH-1-Class-One-Group/JamIssue/issues/257) | `worker-data-contract-locality` | [#264](https://github.com/STH-1-Class-One-Group/JamIssue/pull/264), [#265](https://github.com/STH-1-Class-One-Group/JamIssue/pull/265) | `23b65010575e3f033dff44ec04f6801199b02ce8`, `3464b303004ca6409ca4c1b2d1ed96b313844cd5` | Worker data row/DTO contract locality 정리 |
| `TSK-003-04` | [#258](https://github.com/STH-1-Class-One-Group/JamIssue/issues/258) | `frontend-stage-prop-locality` | [#266](https://github.com/STH-1-Class-One-Group/JamIssue/pull/266) | `b7140db222b99cbc15c88e1eaefc0d2f1fc0202e` | stage-local props 분리 |
| `TSK-003-05` | [#259](https://github.com/STH-1-Class-One-Group/JamIssue/issues/259) | `frontend-type-import-locality` | [#267](https://github.com/STH-1-Class-One-Group/JamIssue/pull/267) | `d589761066188632a72f6adbb6b6099b61fd8a35` | component/hook root barrel import 0개로 축소 |
| `TSK-003-06` | [#260](https://github.com/STH-1-Class-One-Group/JamIssue/issues/260) | `fastapi-contract-import-locality` | [#268](https://github.com/STH-1-Class-One-Group/JamIssue/pull/268) | `3242d0ae6fa88c617f0bbcc681b469926fd06c31` | FastAPI `.models` facade import 0개로 축소 |
| `TSK-003-07` | [#261](https://github.com/STH-1-Class-One-Group/JamIssue/issues/261) | `interface-locality-docs-traceability` | TBD | TBD | Wiki, roadmap, release note traceability 정리 |

## Source Quality Gate

`test/unit/interface-locality-source-quality.test.ts`가 다음 회귀를 막습니다.

- Worker central type surface가 다시 커지는 경우
- Worker runtime/service/data contract가 central `types.ts`로 되돌아가는 경우
- `src/components` 또는 `src/hooks`에서 root `src/types.ts` barrel import가 다시 생기는 경우
- page-stage에서 `Pick<AppPageStageProps>`가 되살아나는 경우
- FastAPI active app code가 `.models` facade import로 되돌아가는 경우

## 검증 기준

각 구현 PR에서 공통으로 확인한 기준입니다.

- `npm.cmd run check:numeric-literals`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test:unit`
- `npm.cmd run build`
- `git diff --check`
- UTF-8 integrity check
- GitHub Actions CI
- CodeQL

FastAPI 변경 PR에서는 아래 검증을 추가했습니다.

- `cd backend`
- `..\.tools\python313\python.exe -m pytest tests`

## 1.2.9 후보 범위

`1.2.9`는 1.2.8 이후 refactoring candidate입니다.

포함 범위:

- `TSK-002` repo-wide config hardening
- `TSK-003` repo-wide interface-locality hardening
- numeric literal quality gate
- interface-locality source-quality gate
- Worker-first BFF와 FastAPI local/fallback 경계 문서화

제외 범위:

- 신규 사용자 기능
- API 계약 변경
- DB migration
- OAuth provider 동작 변경
- 시각 redesign

## 남은 확인

현재 GitHub CLI token에는 `security_events` scope가 없어 Dependabot/code-scanning alert endpoint가 404/401을 반환합니다. 최종 릴리즈 전에는 권한 있는 GitHub Security 경로로 open alert 상태를 재확인해야 합니다.
