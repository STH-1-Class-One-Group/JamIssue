# Docs Guide

JamIssue Web Front 공개 저장소의 문서는 아래 기준으로 관리합니다.

## 1. 현재 정본 문서

- [api-contract-ownership.md](api-contract-ownership.md)
  - Web Front service가 소유하는 consumer-side API contract
  - provider-side API contract와 DB/OAuth/Worker 구현은 이 저장소가 소유하지 않음
- [growgardens-deploy-runbook.md](growgardens-deploy-runbook.md)
  - 공개 저장소의 preview-only 배포 경계
  - production deploy/smoke는 private repo/CI 책임
- [prd-compliance.md](prd-compliance.md)
  - PRD 대비 현재 구현 상태
- [testing-coverage.md](testing-coverage.md)
  - 테스트 커버리지와 Web Front 검증 명령

## 2. 배포 문서 기준

이 공개 저장소는 production 웹 배포 저장소가 아닙니다.

- README, Wiki, runbook은 이 저장소가 preview/build validation만 제공한다고 설명해야 합니다.
- production deploy와 production smoke는 private repo/CI가 소유합니다.
- private repo 이름, URL, secret은 공개 문서에 기록하지 않습니다.
- production 웹 화면 확인은 이 저장소의 preview 배포로 대체하지 않습니다.

## 3. 화면/기능 설계 문서

- [screen-spec.md](screen-spec.md)
- [ui-ux-redesign-baseline.md](ui-ux-redesign-baseline.md)
- [ui-ux-qa-matrix.md](ui-ux-qa-matrix.md)
- [ui-ux-redesign-traceability.md](ui-ux-redesign-traceability.md)
- [community-routes.md](community-routes.md)
- [account-identity-schema.md](account-identity-schema.md)
- [search-recommendation-scope.md](search-recommendation-scope.md)

## 4. 추적성 문서

- [operations-refactor-roadmap.md](operations-refactor-roadmap.md)
- [release-1.2.10-traceability.md](release-1.2.10-traceability.md)
- [architecture-regression-traceability.md](architecture-regression-traceability.md)
- [human-readable-architecture-traceability.md](human-readable-architecture-traceability.md)

## 5. Legacy/Reference 문서

아래 문서는 Web Front와 backend가 같은 저장소에 있던 시기의 설계/분석 기록을 포함합니다. 최신 backend/API 운영 정본으로 사용하지 않습니다.

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

이 문서들에 남은 backend, Worker, DB schema, migration 경로는 현재 Web Front 공개 저장소의 소유권을 의미하지 않습니다.
