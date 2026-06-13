# TSK-014-01 Mobile map location and tourism sheet layout fix

## Metadata

- Scope-ID: `TSK-014-01`
- Issue: `#426`
- Parent Issue: `#425`
- Branch: `mobile-map-location-sheet-fix`
- Status: ready for PR

## Summary

모바일 지도 화면의 내 위치 찾기와 KTO 관광정보 바텀시트 UX 회귀를 복구했다. 위치 확인 메시지가 지도 상태 컴포넌트까지 전달되도록 고쳤고, `watchPosition` 콜백이 동기 실행될 때 `watchId` 초기화 전에 접근하던 결함을 제거했다. KTO 정보 시트는 공통 `MapBottomSheet` wrapper로 조립하고 기본 full 상태로 열어 이미지 이후 본문, 위치, 출처, 상세 링크까지 접근 가능하게 했다.

## Architecture Boundary Gate

- Responsibility map: `geolocation.ts`는 브라우저 위치 API를 promise 경계로 변환하고, `NaverMapStatus`는 지도 위치 버튼과 피드백 표시를 담당하며, `MapBottomSheet`는 지도 바텀시트 공통 shell을 담당한다.
- Dependency direction: map stage -> Naver map/status -> geolocation action 흐름을 유지한다. KTO 시트는 `TourismPlaceItem` presentation만 담당하고 KTO/OpenAPI 또는 Worker를 직접 호출하지 않는다.
- Test seam: geolocation unit test는 browser API mock으로 성공/권한 거부를 검증하고, NaverMapStatus unit test는 버튼/메시지 public UI를 검증하며, TourismInfoSheet unit test는 공통 bottom sheet shell과 full 상태를 검증한다.
- Scope map: frontend map UX 복구만 변경했다. API path, response shape, DB schema, OAuth flow, Worker/Admin KTO import flow는 변경하지 않았다.
- Architecture risk: full sheet와 bottom nav z-index가 겹치는 구조가 남아 있어 full sheet content padding으로 접근성을 보강했다. bottom tab hide 정책은 별도 앱 셸 상태 설계가 필요하면 후속 이슈로 분리한다.

## Validation

- `npm.cmd run typecheck` passed.
- `npm.cmd run test:unit -- geolocation naver-map-status tourism-info-sheet map-config` passed.
- `npm.cmd run check:numeric-literals` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test:integration` passed.
- `npm.cmd run test:regression` passed.
- `npm.cmd run test:e2e` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- UTF-8 strict read passed for changed source/test files.

## Remote Evidence

- PR: TBD
- Main merge SHA: TBD
- CI: TBD
- production-smoke: TBD
- CodeQL / Code Quality: TBD
