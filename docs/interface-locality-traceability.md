# Interface Locality Traceability

Scope-ID: `TSK-003-00-INTERFACE-LOCALITY-HARDENING`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/254
Status: `release-reissue-ready`
Release: `release-v1.2.9`

이 문서는 `1.2.9` interface-locality 리팩터링의 실제 구현 근거를 repo 기준으로 추적합니다. 목적은 공용 타입을 없애는 것이 아니라, public API DTO와 cross-domain model은 중앙에 유지하고 내부 구현 인터페이스는 소유 모듈 근처로 이동하는 것입니다.

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
| Worker public primitive | `deploy/api-worker-shell/types.ts`에는 `WorkerEnv`, `WorkerSessionUser`, `WorkerJsonRecord`, `AuthProviderKey`만 유지 |
| Worker runtime/service contract | route runtime과 service dependency type은 runtime/service/domain 소유 위치에 유지 |
| Worker row/read model | Supabase row, base-data row, mapper input은 base-data repository/mapper 근처에 유지 |
| Frontend stage props | `AppPageStageProps`의 넓은 `Pick` 의존을 stage-local props로 축소 |
| Frontend type import | `src/components`와 `src/hooks`의 root `src/types.ts` barrel import를 0개로 유지 |
| FastAPI contracts | active app code는 `.models` compatibility facade 대신 `model_contracts/*`를 직접 import |

## Sub-Issue Trace

| Scope-ID | Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `TSK-003-01` | [#255](https://github.com/STH-1-Class-One-Group/JamIssue/issues/255) | `interface-locality-audit` | [#262](https://github.com/STH-1-Class-One-Group/JamIssue/pull/262), [#270](https://github.com/STH-1-Class-One-Group/JamIssue/pull/270) | `852728bda993710c09de8adb07711be0d5cb5968`, `da277d7f446198912cbfed2dffb5980cffeef2ea` | source-quality gate 추가 및 실제 코드 기준 회귀 조건 보강 |
| `TSK-003-02` | [#256](https://github.com/STH-1-Class-One-Group/JamIssue/issues/256) | `worker-runtime-contract-locality` | [#263](https://github.com/STH-1-Class-One-Group/JamIssue/pull/263), [#270](https://github.com/STH-1-Class-One-Group/JamIssue/pull/270) | `5d88d6a15536c6ac04ed58bc4d26ca43d01ad8d7`, `da277d7f446198912cbfed2dffb5980cffeef2ea` | `RouteRuntime`에서 Supabase row/mapper dependency 제거 |
| `TSK-003-03` | [#257](https://github.com/STH-1-Class-One-Group/JamIssue/issues/257) | `worker-data-contract-locality` | [#264](https://github.com/STH-1-Class-One-Group/JamIssue/pull/264), [#265](https://github.com/STH-1-Class-One-Group/JamIssue/pull/265), [#270](https://github.com/STH-1-Class-One-Group/JamIssue/pull/270) | `23b65010575e3f033dff44ec04f6801199b02ce8`, `3464b303004ca6409ca4c1b2d1ed96b313844cd5`, `da277d7f446198912cbfed2dffb5980cffeef2ea` | base-data row/mapper contract를 route surface 밖으로 격리 |
| `TSK-003-04` | [#258](https://github.com/STH-1-Class-One-Group/JamIssue/issues/258) | `frontend-stage-prop-locality` | [#266](https://github.com/STH-1-Class-One-Group/JamIssue/pull/266) | `b7140db222b99cbc15c88e1eaefc0d2f1fc0202e` | stage-local props 분리 |
| `TSK-003-05` | [#259](https://github.com/STH-1-Class-One-Group/JamIssue/issues/259) | `frontend-type-import-locality` | [#267](https://github.com/STH-1-Class-One-Group/JamIssue/pull/267) | `d589761066188632a72f6adbb6b6099b61fd8a35` | component/hook root barrel import 0개 |
| `TSK-003-06` | [#260](https://github.com/STH-1-Class-One-Group/JamIssue/issues/260) | `fastapi-contract-import-locality` | [#268](https://github.com/STH-1-Class-One-Group/JamIssue/pull/268) | `3242d0ae6fa88c617f0bbcc681b469926fd06c31` | FastAPI `.models` facade active import 0개 |
| `TSK-003-07` | [#261](https://github.com/STH-1-Class-One-Group/JamIssue/issues/261) | `release-129-reissue-traceability` | [#269](https://github.com/STH-1-Class-One-Group/JamIssue/pull/269), docs follow-up PR | `f765939d78558e6f1fbb9fd575f4412c49842951`, final docs merge SHA는 PR merge 후 issue/wiki에 기록 | release note, roadmap, issue evidence 갱신 |

## Source Quality Gate

`test/unit/interface-locality-source-quality.test.ts`와 `test/unit/worker-source-quality.test.ts`가 아래 회귀를 막습니다.

- Worker central type surface가 다시 커지는 경우
- Worker runtime/service/data contract가 central `types.ts`로 되돌아가는 경우
- `RouteRuntime`이 Supabase row, mapper, static row loader를 다시 노출하는 경우
- Worker test가 global Worker type barrel에서 local contract를 import하는 경우
- Worker service constructor dependency가 `any`로 회귀하는 경우
- `src/components` 또는 `src/hooks`에서 root `src/types.ts` barrel import가 다시 생기는 경우
- page-stage에서 `Pick<AppPageStageProps>`가 되살아나는 경우
- FastAPI active app code가 `.models` facade import로 되돌아가는 경우

## 검증 기준

최종 보정 PR #270에서 아래 검증을 통과했습니다.

- `npm.cmd run check:numeric-literals`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test:unit`
- `npm.cmd run build`
- `git diff --check`
- UTF-8 integrity check
- `cd backend`
- `..\.tools\python313\python.exe -m pytest tests`
- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25645927280
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25645927278
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25645926730, https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25645926750
- Dependabot open alert: 0건
- Code scanning open alert: 0건

## 1.2.9 재발행 범위

포함 범위:

- `TSK-002` repo-wide config hardening
- `TSK-003` repo-wide interface-locality hardening
- numeric literal quality gate
- interface-locality source-quality gate
- Worker-first BFF와 FastAPI local/fallback 경계 문서화
- 실제 코드 기준 Worker interface-locality 보정 PR #270

제외 범위:

- 신규 사용자 기능
- API 계약 변경
- DB migration
- OAuth provider 동작 변경
- 시각 redesign

## 최종 확인

`release-v1.2.9`는 docs follow-up PR merge 후 새 final main SHA를 기준으로 삭제 후 재생성합니다. 최종 tag target, Wiki commit, issue close 근거는 #254와 #261에 기록합니다.
