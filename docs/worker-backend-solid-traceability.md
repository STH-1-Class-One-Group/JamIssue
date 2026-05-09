# Worker Backend SOLID Traceability

Scope: GitHub issue #206, `worker-docs-release-traceability`

이 문서는 #199 Worker-first backend SOLID hardening 묶음의 완료 근거를 추적하기 위한 repo 기준 문서입니다.

## 운영 기준

JamIssue 운영 백엔드는 Cloudflare Worker입니다. FastAPI는 폐기 대상이 아니라 로컬 검증, 레거시 origin fallback, 일부 과거 구조 비교용 계층으로 유지합니다.

현재 운영 흐름:

```text
React web app
-> Cloudflare Pages
-> Cloudflare Worker API
-> Supabase REST / Storage
```

Worker 내부 책임 목표:

```text
request
-> routing
-> service / use case
-> repository / external adapter
-> mapper / DTO assembler
-> response
```

## 변경 금지 범위

- 외부 REST API 경로 변경 없음
- 응답 shape 변경 없음
- DB schema 변경 없음
- 사용자-facing copy 변경 없음
- Kakao/Naver REST OAuth 성공 경로 변경 없음

## Sub-Issue Trace

| Issue | Branch | PR | Main merge SHA | 완료 근거 |
| --- | --- | --- | --- | --- |
| #200 | `worker-baseline-refactor-gate` | [#224](https://github.com/STH-1-Class-One-Group/JamIssue/pull/224) | `64bd982e1ca8880d81ff3e9608a77ab8f9ce06c3` | 기준선/품질 게이트 문서화 |
| #201 | `worker-contract-boundaries` | [#225](https://github.com/STH-1-Class-One-Group/JamIssue/pull/225) | `4583b15985f832790e3399306f7ba2f7f4ac24a3` | Worker runtime/type contract 정리 |
| #202 | `worker-base-data-read-model` | [#226](https://github.com/STH-1-Class-One-Group/JamIssue/pull/226) | `cdf774a4ec1ea39f332e9c8a3f0fe085c05e5bcc` | base data repository/mapper/assembler 분리 |
| #203 | `worker-review-domain-service` | [#227](https://github.com/STH-1-Class-One-Group/JamIssue/pull/227) | `93d13f7ab58908727c291028486bd6b7159a26e7` | review/comment/notification domain 분리 |
| #204 | `worker-account-community-admin-boundaries` | [#228](https://github.com/STH-1-Class-One-Group/JamIssue/pull/228) | `21dd8d58ac51ea3a980018e68261e493a47d7264` | my/community/admin repository boundary 분리 |
| #205 | `worker-routing-runtime-cleanup` | [#229](https://github.com/STH-1-Class-One-Group/JamIssue/pull/229) | `3da0fdd7bf9aafadd0aeaa5300169ddab7036fd3` | route registry/proxy/handler 분리 |
| #206 | `worker-docs-release-traceability` | TBD in PR | TBD after merge | Wiki/런북/릴리즈 노트 최신화 |

## 검증 기준

각 구현 PR에서 공통으로 확인한 기준:

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- UTF-8 integrity check
- Worker tracked-source one-line blob 방지 검사
- GitHub Actions checks
- CodeQL/Security/Quality checks

FastAPI 파일을 변경한 경우에는 backend pytest를 추가 기준으로 둡니다.

## 1.2.8 후보 범위

`1.2.8` 후보는 `1.2.7` 이후 변경 중 사용자 경험, 운영 안정성, 백엔드 유지보수성에 의미가 있는 변경을 묶습니다.

포함 범위:

- ReviewList/ReviewListItem 렌더링 안정화 추가 보강
- route preview place lookup 성능 개선
- production secret 검증 보강
- filter/place selection 회귀 테스트 보강
- Worker-first backend SOLID hardening #200~#206

제외 범위:

- `1.2.7`에 이미 포함된 #207~#213 변경
- 사용자-facing copy 변경
- DB schema 변경
- 외부 API shape 변경

## 완료 판단

#199 parent issue는 아래 조건을 만족할 때 닫을 수 있습니다.

- #200~#206이 PR, main merge SHA, CI 링크와 함께 닫힘
- Wiki Release Notes에 `1.2.8` 후보가 기록됨
- 배포 런북에 Worker-first 운영 기준이 유지됨
- `Refactor-Roadmap`에 완료된 Worker hardening 결과가 반영됨
- 신규 CodeQL/Security/Quality finding 없음
