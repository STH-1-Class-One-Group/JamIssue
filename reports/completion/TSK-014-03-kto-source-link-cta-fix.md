# TSK-014-03 KTO 원문 링크 CTA 보정 완료 보고

## 메타데이터

- Scope-ID: `TSK-014-03`
- Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/431
- PR: `TBD-TSK-014-03`
- Branch: `kto-source-link-cta-fix`
- Status: `implemented-local`
- Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/425
- Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/431

## 변경 요약

- KTO 관광정보 시트에서 `KTO 원문 보기` 주요 CTA를 제거했다.
- `sourcePageUrl`이 URL 형태로 존재해도 앱 내부 시트에서 외부 원문 링크를 렌더링하지 않도록 고정했다.
- 외부 원문 페이지가 열리지 않을 수 있음을 출처 메타 영역에 안내하고, 앱에서 확인 가능한 KTO 필드만 보여준다.
- `TourismInfoSheet`와 단위 테스트에 남아 있던 mojibake 문자열을 UTF-8 한글로 복구했다.

## Architecture Boundary Gate

- Responsibility map: `TourismInfoSheet`는 Worker consumer DTO를 앱 내부 read-only 정보 시트로 렌더링한다.
- Dependency direction: UI -> `TourismPlaceItem` -> Worker API response contract 방향만 유지한다.
- Test seam: React Testing Library로 URL이 있어도 `KTO 원문 보기`/`자세히 보기` 링크가 렌더링되지 않는지 검증한다.
- Scope map: 프론트 표시 계층과 테스트만 변경했다. API path, response shape, DB schema, OAuth flow는 변경하지 않았다.
- Architecture risk: KTO 상세 URL의 실시간 유효성은 브라우저에서 안정적으로 검증할 수 없으므로, 앱 내부 정보 표시를 기준 동작으로 유지한다.

## 검증 결과

- `npm.cmd run check:numeric-literals`: 통과
- `npm.cmd run lint`: 통과
- `npm.cmd run typecheck`: 통과
- `npm.cmd run test:unit`: 통과
- `npm.cmd run test:e2e`: 통과
- `npm.cmd run build`: 통과
- `git diff --check`: 통과
- UTF-8 integrity check: 통과

## 원격 근거

- PR URL: `TBD-TSK-014-03`
- main merge SHA: `TBD-TSK-014-03`
- CI URL: `TBD-TSK-014-03`
- production-smoke URL: `TBD-TSK-014-03`
- CodeQL/Code Quality URL: `TBD-TSK-014-03`

## 잔여 항목

- PR 생성 후 PR URL과 원격 check 결과를 이 보고서와 #431에 반영한다.
- main merge 후 #425 parent에 #431 완료 근거를 기록한다.
