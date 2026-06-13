# TSK-012-01 Second UI/UX Audit Baseline

Scope-ID: `TSK-012-01-SECOND-UIUX-AUDIT-BASELINE`
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/405
PR: `TBD-TSK-012-01`
Branch: `second-uiux-audit-baseline`
Status: `validated-local`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/404
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/405

## 목적

2차 UI/UX 구현을 시작하기 전에 현재 `main` 기준의 실제 코드 상태를 고정한다. 이 보고서는 TSK-011이 이미 `Open PR review and triage` 축으로 사용 중임을 분리하고, 2차 UI/UX 작업은 TSK-012 축에서만 진행한다는 근거다.

## 현재 코드 기준 사실

| 항목 | 현재 상태 | 후속 이슈 |
| --- | --- | --- |
| 부모축 분리 | TSK-011은 #376/#377의 Open PR triage 축이며, 2차 UI/UX 구현축이 아니다. | #404 |
| App shell header | `AppShell`은 이미 header/action slot을 갖지만 `FloatingBackButton`과 `phone-shell__utility-slot`이 남아 있다. | #406 |
| Sub navigation | 지도 category strip과 map surface는 아직 CSS overlay/offset 정리 대상이다. | #407, #410 |
| Event tab | `EventTab`은 현재 main에서 tourism segment 없이 행사 전용 상태다. | #408 |
| KTO contract | `src/api/tourismClient.ts`와 `src/tourismTypes.ts`는 현재 main에 없다. 중복 client를 만들지 않고 contract gap으로 기록한다. | #409 |

## Architecture Boundary Gate

- Responsibility map: #405는 구현 전 audit baseline만 소유한다. UI 구조 변경은 #406~#410에서 처리한다.
- Dependency direction: 이 PR은 source audit test와 completion report만 추가하며 런타임 dependency를 추가하지 않는다.
- Test seam: `test/unit/second-uiux-audit-baseline.test.ts`가 repository source file을 읽어 baseline fact를 검증한다.
- Scope map: 변경 파일은 `test/unit/second-uiux-audit-baseline.test.ts`와 이 completion report로 제한한다.
- Architecture risk: baseline test는 전환기 부채를 의도적으로 고정한다. 후속 child issue가 해당 부채를 제거할 때 테스트 기대값도 함께 갱신해야 한다.

## 검증 결과

- [x] `npm.cmd exec vitest -- run test/unit/second-uiux-audit-baseline.test.ts` 통과
- [x] `git diff --check` 통과

## 후속 작업

- #406: floating back button을 header leading action으로 흡수한다.
- #407: subNav slot과 no-subnav app shell grid를 정리한다.
- #408: 이미 충족된 festival-only 상태를 유지할지, 증거 PR로 닫을지 결정한다.
- #409: KTO consumer contract가 main에 없는 상태를 먼저 해결한 뒤 지도 레이어를 구현한다.
- #410: app shell 변경 이후 CSS offset cleanup을 수행한다.
- #411: 구현 PR merge 후 Wiki와 release traceability를 갱신한다.
