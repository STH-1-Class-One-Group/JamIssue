# Docs Guide

JamIssue Web Front service 문서는 아래 기준으로 관리합니다.

## 1. 현재 정본 문서

- [api-contract-ownership.md](api-contract-ownership.md)
  - MSA 분리 이후 Web Front service가 소유하는 consumer-side API contract
  - `ClarusIubar/JamIssue_admin`이 소유하는 provider-side API contract
  - 현재 레포에 남아 있는 API 관련 파일 위치
- [prd-compliance.md](prd-compliance.md)
  - PRD 대비 현재 구현 상태
  - 구현됨 / 부분 구현 / 미구현 구분
- [testing-coverage.md](testing-coverage.md)
  - 테스트/커버리지 기준
  - Web Front service 검증 명령

## 2. 운영 문서

- [growgardens-deploy-runbook.md](growgardens-deploy-runbook.md)
  - 현재 문서는 historical/reference 성격이 강합니다.
  - backend/API/Worker 운영 정본으로 사용하지 않습니다.
- [data-operations-runbook.md](data-operations-runbook.md)
  - 현재 문서는 historical/reference 성격이 강합니다.
  - DB 재적재와 운영 데이터 절차의 최신 정본은 `ClarusIubar/JamIssue_admin`에서 확인합니다.

주의: Backend/API/Worker/DB/admin 운영 절차의 정본은 `ClarusIubar/JamIssue_admin`입니다. 이 레포의 runbook은 Web Front service 관점의 참조만 유지합니다.

## 3. 화면/기능 설계 문서

- [screen-spec.md](screen-spec.md)
- [community-routes.md](community-routes.md)
- [account-identity-schema.md](account-identity-schema.md)
- [search-recommendation-scope.md](search-recommendation-scope.md)

## 4. 추적성 문서

- [operations-refactor-roadmap.md](operations-refactor-roadmap.md)
- [release-1.2.10-traceability.md](release-1.2.10-traceability.md)
- [architecture-regression-traceability.md](architecture-regression-traceability.md)
- [human-readable-architecture-traceability.md](human-readable-architecture-traceability.md)

## 5. Legacy/Reference 문서

아래 문서는 Web Front와 backend가 같은 레포에 있던 시기의 설계/분석 기록을 포함할 수 있습니다. 최신 backend/API 정본으로 사용하지 않습니다.

- [code-flow-diagrams.md](code-flow-diagrams.md)
- [notification-sse-architecture.md](notification-sse-architecture.md)
- [issue-55-improved.md](issue-55-improved.md)
- [worker-first-poc.md](worker-first-poc.md)
- [worker-backend-solid-baseline.md](worker-backend-solid-baseline.md)
- [worker-backend-solid-traceability.md](worker-backend-solid-traceability.md)
- [worker-residual-boundary-traceability.md](worker-residual-boundary-traceability.md)
- [comment-performance-fix.md](comment-performance-fix.md)
- [review-image-loading.md](review-image-loading.md)
- [config-hardening-traceability.md](config-hardening-traceability.md)
- [interface-locality-baseline.md](interface-locality-baseline.md)
- [interface-locality-traceability.md](interface-locality-traceability.md)

이 문서들에 `backend/`, Worker, DB schema, migration 경로가 남아 있어도 현재 Web Front service 레포의 소유권을 의미하지 않습니다. 최신 구현과 운영 정본은 `ClarusIubar/JamIssue_admin`에서 확인합니다.
