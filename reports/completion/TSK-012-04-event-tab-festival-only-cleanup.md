# TSK-012-04 Event Tab Festival-Only Cleanup

Scope-ID: `TSK-012-04-EVENT-TAB-FESTIVAL-ONLY-CLEANUP`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/408
PR: https://github.com/STH-1-Class-One-Group/JamIssue/pull/415
Branch: `event-tab-festival-only-cleanup`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/404
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/408

## 목적

2차 UI/UX 구현 명세의 행사 탭 범위를 완료 근거로 고정한다. 행사 탭은 행사 콘텐츠만 표시하고 KTO 관광장소 세그먼트와 `/api/tourism/places` 호출을 소유하지 않는다.

## 변경 요약

- 현재 코드 기준 `EventTab`이 이미 festival-only 상태임을 확인했다.
- `EventTab`은 `FestivalItem[]`만 props로 받고 tourism API/client/type을 import하지 않는다.
- `UIUX-016` e2e 테스트를 추가해 행사 탭에서 tourism segment가 없고 `/api/tourism/places` 요청이 발생하지 않음을 고정했다.
- KTO 지도 레이어와 InfoSheet 구현은 #409 범위로 유지했다.

## Architecture Boundary Gate

- Responsibility map: `EventTab`은 festival/event presentation만 소유한다. KTO tourism presentation은 지도 레이어 #409가 소유한다.
- Dependency direction: event tab UI는 tourism API/client/types에 의존하지 않는다.
- Test seam: `test/e2e/event-tab.spec.ts`가 browser-level event tab behavior와 network request absence를 검증한다.
- Scope map: 변경 파일은 e2e regression test와 completion report로 제한했다.
- Architecture risk: KTO tourism contract가 main에 아직 없으면 #409에서 consumer contract gap을 다시 확인해야 한다.

## 검증 결과

- [x] `npm.cmd run test:e2e -- event-tab`

## 남은 후속 작업

- #409: KTO tourism map layer와 InfoSheet 구현.
- #410: app shell CSS offset cleanup.
- #411: 2차 UI/UX traceability docs.
