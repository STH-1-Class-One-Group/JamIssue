# TSK-014-02 KTO 관광정보 상세 시트 보강 완료 보고

## 메타데이터

- Scope-ID: `TSK-014-02`
- Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/428
- PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/429
- Branch: `tourism-info-rich-fields-fix`
- Status: `implemented-merged`
- Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/425
- Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/428

## 변경 요약

- KTO 관광정보 시트가 이름과 주소 중심으로만 보이던 문제를 수정했다.
- 운영 API가 제공하는 `imageUrl`, `summary`, `ktoContentTypeLabel`, `ktoFacet`, `district`, `address`, `latitude`, `longitude`, KTO 내부 분류 코드, `sourceName`, `sourceUpdatedAt`을 시트 안에서 직접 렌더링한다.
- `sourcePageUrl`과 `homepageUrl`은 `http`/`https` URL일 때만 링크로 노출한다.
- 유효하지 않은 원문 URL은 클릭 가능한 링크로 만들지 않고, 현재 시트 정보를 기준으로 확인하라는 안내를 표시한다.
- `TourismPlaceItem` consumer contract에 KTO 내부 분류 코드/라벨 필드를 추가했다.
- KTO 상세 시트가 공통 `MapBottomSheet` shell을 계속 사용하는지 회귀 테스트로 고정했다.

## Architecture Boundary Gate

- Responsibility map: `TourismInfoSheet`는 Worker가 내려준 KTO consumer DTO를 읽기 전용 시트로 렌더링한다. `tourismTypes.ts`는 Web Front consumer contract만 소유한다.
- Dependency direction: UI component -> `TourismPlaceItem` DTO -> Worker API response contract 방향만 유지한다. 브라우저에서 KTO OpenAPI나 admin/provider contract를 직접 호출하지 않는다.
- Test seam: React Testing Library로 시트의 public rendered output, URL validation, shared bottom-sheet class 구조를 검증한다.
- Scope map: 변경 범위는 `TourismInfoSheet`, `tourismTypes`, 해당 unit test, 최소 CSS 스타일이다. API path, response shape, DB schema, OAuth flow는 변경하지 않았다.
- Architecture risk: KTO API가 추가 필드를 더 제공할 경우 표시 우선순위 정책이 필요할 수 있다. 이번 수정은 현재 운영 API contract에 존재하는 필드만 소비한다.

## 검증 결과

- `npm.cmd run check:numeric-literals`: 통과
- `npm.cmd run lint`: 통과
- `npm.cmd run typecheck`: 통과
- `npm.cmd run test:unit`: 통과
- `npm.cmd run test:integration`: 통과
- `npm.cmd run test:regression`: 통과
- `npm.cmd run test:e2e`: 통과
- `npm.cmd run build`: 통과
- `git diff --check`: 통과
- UTF-8 integrity check: 통과

## 원격 근거

- PR URL: https://github.com/STH-1-Class-One-Group/JamIssue/pull/429
- main merge SHA: `0f5294780ed108121836907240b4a32df94d8177`
- CI URL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27467236652/job/81191624614
- production-smoke URL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27467236660/job/81191654547
- CodeQL/Code Quality URL:
  - https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27467236421/job/81191624884
  - https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27467236421/job/81191624876

## 잔여 항목

- #428과 #425에 merge SHA, CI, production-smoke, CodeQL/Code Quality 근거를 기록한다.
