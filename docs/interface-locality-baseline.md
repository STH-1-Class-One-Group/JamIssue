# Interface Locality Baseline

Scope-ID: `TSK-003-01-INTERFACE-LOCALITY-AUDIT`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/255
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/262
Branch: `interface-locality-audit`
Status: `baseline`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/254
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/255

이 문서는 1.2.9 refactoring candidate의 두 번째 축인 interface-locality 리팩터링 기준선입니다.

## 목적

공용 타입을 없애는 것이 목표가 아닙니다. public API contract와 cross-domain model은 중앙에 유지하고, runtime/service dependency, Supabase row, mapper input, stage/view props처럼 구현 내부에 가까운 인터페이스는 소유 모듈 근처로 이동하는 것이 목표입니다.

## 변경 금지 범위

- 사용자-facing copy 변경 없음
- API path/response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver REST OAuth 성공 경로 변경 없음
- public API DTO 제거 없음
- compatibility facade 즉시 제거 없음

## 초기 기준선

| 영역 | 초기 수치 | 해석 | 후속 이슈 |
| --- | ---: | --- | --- |
| Worker central type exports | 28 | `WorkerEnv`, Supabase row, DTO, service contract, route runtime이 한 파일에 공존 | #256, #257 |
| Worker runtime/service contract mentions in central types | 13 | `RouteRuntime`, `Worker*Service`, review interaction deps가 중앙 types에 존재 | #256 |
| Frontend root `src/types` imports | 106 | API DTO와 presentation/hook import가 같은 barrel을 공유 | #259 |
| Frontend component root type imports | 44 | presentation component가 root barrel을 직접 참조 | #259 |
| Frontend hook root type imports | 43 | coordinator/hook 계층도 root barrel에 넓게 의존 | #259 |
| Wide `AppPageStageProps` coupling references | 11 | feed/course/my view가 넓은 stage props에서 `Pick`으로 일부만 사용 | #258 |
| FastAPI `.models` facade imports | 5 | active backend 일부가 compatibility facade를 직접 import | #260 |

## 후속 작업 매핑

| 이슈 | 목표 |
| --- | --- |
| #256 | Worker runtime/service contract를 runtime/service/domain 소유 위치로 이동 |
| #257 | Supabase row, base-data row, mapper input type을 repository/mapper 근처로 이동 |
| #258 | feed/course/my stage-local props로 `AppPageStageProps` coupling 축소 |
| #259 | root `src/types.ts` barrel import를 domain/local type import로 축소 |
| #260 | FastAPI active app code의 `.models` facade import를 `model_contracts/*` 직접 import로 전환 |
| #261 | 1.2.9 release candidate와 Wiki traceability에 TSK-003 결과 연결 |

## Source Quality Gate

`test/unit/interface-locality-source-quality.test.ts`는 interface locality가 후퇴하지 않도록 막습니다.

현재 게이트:

- 중앙 Worker type export와 runtime/service contract mention 증가 방지
- Worker data row/DTO contract가 중앙 `types.ts`로 되돌아가는 것 방지
- `src/components`와 `src/hooks`의 root `src/types.ts` barrel import 재도입 방지
- page-stage의 `Pick<AppPageStageProps>` 재도입 방지
- FastAPI active app code의 `.models` facade import 재도입 방지

후속 PR에서 수치가 줄어들면 gate threshold도 낮춰 다음 회귀 기준으로 사용합니다.

## 완료 판단

TSK-003-01은 아래 조건을 만족하면 완료입니다.

- baseline 문서가 repo docs index에 연결됨
- source-quality gate가 unit test에 추가됨
- `npm run test:unit`에 포함되어 통과함
- parent issue #254와 child issue #255에 PR, merge SHA, CI 링크가 기록됨
