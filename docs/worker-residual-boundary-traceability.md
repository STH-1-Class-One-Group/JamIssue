# Worker Residual Boundary Traceability

Scope-ID: `TSK-004-00-WORKER-RESIDUAL-BOUNDARY-HARDENING`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/272
Status: `implementation-complete-docs-in-progress`
Release candidate: `1.2.10`

이 문서는 1.2.9 이후 실제 Worker 코드에서 확인된 잔여 결합 지점을 어떤 PR로 제거했는지 추적합니다. 평가 문구를 맞추기 위한 문서가 아니라, `festivals.ts` 책임 과밀, mapper 계층의 `any` row 계약, handler contract 미정형화를 코드 기준으로 줄인 근거를 기록합니다.

## 변경 금지 범위

- 사용자-facing copy 변경 없음
- 외부 REST API path/response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver OAuth 성공 경로 변경 없음
- `deploy/api-worker-shell/types.ts`에 domain-local row/mapper/service 타입 추가 없음

## 작업 범위

| Scope-ID | Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `TSK-004-01` | [#273](https://github.com/STH-1-Class-One-Group/JamIssue/issues/273) | `worker-residual-boundary-audit` | [#279](https://github.com/STH-1-Class-One-Group/JamIssue/pull/279) | `5fddc64d0f8b8a1f94f3505d2fb911958aa49a35` | residual boundary inventory와 source-quality gate 기준선 작성 |
| `TSK-004-02` | [#274](https://github.com/STH-1-Class-One-Group/JamIssue/issues/274) | `worker-festival-boundary-split` | [#280](https://github.com/STH-1-Class-One-Group/JamIssue/pull/280) | `cb04022cd5fd091ddf0c61d56726f8eb1f818975` | festival handler를 유지하면서 repository/mapper/import/cache 책임 분리 |
| `TSK-004-03` | [#275](https://github.com/STH-1-Class-One-Group/JamIssue/issues/275) | `worker-domain-mapper-contracts` | [#281](https://github.com/STH-1-Class-One-Group/JamIssue/pull/281) | `9852b88aafb2fadac60b9d7152e3acf56462d50f` | review/community/my mapper의 `any[]`, `Map<any, any>` row 계약 제거 |
| `TSK-004-04` | [#276](https://github.com/STH-1-Class-One-Group/JamIssue/issues/276) | `worker-service-handler-contracts` | [#282](https://github.com/STH-1-Class-One-Group/JamIssue/pull/282) | `1470968e80c0c63bfa4bbcce5024ee1e7580e314` | admin/stamp/notification/auth/review-interaction handler contract typing |
| `TSK-004-05` | [#277](https://github.com/STH-1-Class-One-Group/JamIssue/issues/277) | `worker-boundary-traceability-docs` | TBD | TBD | Wiki, roadmap, release candidate note, issue evidence 정리 |

## 제거한 결합 지점

| 영역 | 이전 문제 | 정리 결과 |
| --- | --- | --- |
| Festival service | import, normalize, repository, cache, response 책임이 `services/festivals.ts`에 집중 | public handler는 유지하고 내부 책임을 `festival-domain` 하위 repository/mapper/import/cache/use-case로 분리 |
| Domain mapper | review/community/my mapper가 `any[]`, `Map<any, any>` row 계약에 의존 | 각 domain-local `contracts.ts`에서 row/read-model 타입을 소유하고 mapper 입력을 명시 |
| Admin handler | `env:any`, `category:any` contract가 handler/service 경계에 남음 | `WorkerEnv`, `WorkerAdminServiceDeps`, `unknown` input narrowing으로 축소 |
| Auth/review interactions | `readJsonBody(): Promise<any>`가 command body 경계를 흐림 | `WorkerJsonRecord` 기반 JSON body contract로 축소 |
| Stamp/notification handler | env/body/payload/id contract가 암묵적 파라미터로 남음 | `WorkerEnv`, `WorkerJsonRecord`, domain-local row/body 타입으로 명시 |

## Source Quality Gate

`test/unit/worker-source-quality.test.ts`가 아래 회귀를 차단합니다.

- festival boundary가 다시 단일 과밀 파일로 회귀하는 경우
- review/community/my mapper에 `any[]`, `Map<any, any>`가 재도입되는 경우
- admin service에 `env:any`, `category:any`가 재도입되는 경우
- auth/review-interactions에 `Promise<any>` JSON body reader가 재도입되는 경우
- stamp/notification handler에 암묵적 env/body contract가 재도입되는 경우

## 검증 근거

각 구현 PR에서 공통으로 확인한 로컬 검증:

- `npm.cmd run check:numeric-literals`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test:unit`
- `npm.cmd run build`
- `git diff --check`
- UTF-8 integrity check

최신 구현 SHA `1470968e80c0c63bfa4bbcce5024ee1e7580e314` 기준 원격 검증:

- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362768
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362938
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362433
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25652362456
- Dependabot open alerts: 0
- Code scanning open alerts: 0

## 남은 예외

- #277 문서 PR merge SHA는 이 문서 PR이 main에 merge된 뒤 #272/#277 이슈 evidence에 기록합니다.
- FastAPI `repository_normalized.py` 잔여 정리는 TSK-004 범위가 아닙니다.
- 브라우저 수준 E2E smoke 확장은 별도 운영 테스트 이슈로 분리합니다.
