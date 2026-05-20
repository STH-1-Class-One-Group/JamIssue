# Docs Guide

JamIssue Web Front 문서는 아래 기준으로 관리합니다.

## 1. 현재 정본 문서

- [api-contract-ownership.md](api-contract-ownership.md)
  - Web Front가 소유하는 consumer-side API contract
  - `ClarusIubar/JamIssue_admin`이 소유하는 provider-side API contract
  - backend 제거 이후 이 레포에 남아 있는 API 관련 파일 위치
- [prd-compliance.md](prd-compliance.md)
  - PRD 대비 현재 구현 상태
  - 구현됨 / 부분 구현 / 미구현 구분
- [ui-ux-qa-matrix.md](ui-ux-qa-matrix.md)
  - UI/UX 기대 동작 추적
  - 자동 테스트와 수동 QA 근거 연결
- [testing-coverage.md](testing-coverage.md)
  - 테스트/커버리지 기준
  - Web Front 검증 명령

## 2. 배포 기준 문서

- [growgardens-deploy-runbook.md](growgardens-deploy-runbook.md)
  - `main` 배포 기준
  - GitHub Actions 배포 방식
  - GitHub / Cloudflare / Naver / Kakao에 넣어야 할 키 위치
- [data-operations-runbook.md](data-operations-runbook.md)
  - 장소, 이미지, 공공데이터 운영 수정 절차
  - 전체 리셋 및 재적재 절차

주의: Backend/API/Worker/DB/admin 운영 절차의 정본은 `ClarusIubar/JamIssue_admin`입니다. 이 레포의 runbook은 Web Front 관점에서 필요한 참조만 유지합니다.

## 3. 화면/기능 설계 문서

- [screen-spec.md](screen-spec.md)
- [community-routes.md](community-routes.md)
- [account-identity-schema.md](account-identity-schema.md)
- [search-recommendation-scope.md](search-recommendation-scope.md)

## 4. 리팩터링과 추적성 문서

- [operations-refactor-roadmap.md](operations-refactor-roadmap.md)
- [worker-backend-solid-traceability.md](worker-backend-solid-traceability.md)
- [config-hardening-traceability.md](config-hardening-traceability.md)
- [interface-locality-baseline.md](interface-locality-baseline.md)
- [interface-locality-traceability.md](interface-locality-traceability.md)
- [architecture-regression-traceability.md](architecture-regression-traceability.md)
- [human-readable-architecture-baseline.md](human-readable-architecture-baseline.md)
- [human-readable-architecture-traceability.md](human-readable-architecture-traceability.md)
- [release-1.2.10-traceability.md](release-1.2.10-traceability.md)

## 5. Legacy/reference 문서

아래 문서는 Web Front와 backend가 같은 레포에 있던 시기의 설계/분석 기록을 포함할 수 있습니다. 최신 backend/API 정본으로 사용하지 않습니다.

- [code-flow-diagrams.md](code-flow-diagrams.md)
- [notification-sse-architecture.md](notification-sse-architecture.md)
- [issue-55-improved.md](issue-55-improved.md)
- [worker-first-poc.md](worker-first-poc.md)
- [worker-backend-solid-baseline.md](worker-backend-solid-baseline.md)
- [worker-residual-boundary-traceability.md](worker-residual-boundary-traceability.md)
- [comment-performance-fix.md](comment-performance-fix.md)
- [review-image-loading.md](review-image-loading.md)

이 문서들에 `backend/`, Worker, DB schema, migration 경로가 남아 있어도 현재 Web Front 레포의 소유권을 의미하지 않습니다. 최신 구현과 운영 정본은 `ClarusIubar/JamIssue_admin`에서 확인합니다.
