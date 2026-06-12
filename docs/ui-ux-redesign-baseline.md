# JamIssue 앱 전환 UI/UX 개편 기준선

기준일: 2026-06-12
Scope-ID: `TSK-012`
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/380

## 목적

`JAM_ISSUE_UIUX_개편안.docx`를 기준으로 현재 Web Front를 앱 셸 구조에 맞춰 정리한다. 이 문서는 구현 세부가 아니라 기준선과 추적 기준을 고정한다.

## 문서 우선 결정

앱 전환 UI/UX 개편안의 정보 구조를 우선 기준으로 둔다.

| 항목 | 기존 상태 | 개편 기준 | 담당 issue |
| --- | --- | --- | --- |
| 앱 셸 | `phone-shell` 내부에 status, utility, body, bottom nav가 섞여 있음 | `Status Safe Area -> App Header -> Sub Navigation -> Content -> Bottom Tab Bar` | #382 |
| 하단 탭 | 타입은 5탭을 지원했지만 일부 문서가 4탭 기준으로 남아 있었음 | `지도 / 행사 / 피드 / 코스 / 마이` 5탭 | #384 |
| 설정 진입 | 전역 floating utility slot 중심 | 앱 셸 slot과 마이 탭 설정 진입을 충돌 없이 유지 | #382, #385 |
| 지도 필터 | 지도 내부 `map-filter-strip` | Sub Navigation 성격으로 유지 | #382, #384 |
| 장소/행사 시트 | `closed / partial / full` 중심 | `hidden / peek / half / full` 앱 시트 상태 계약 | #383 |
| 탭 콘텐츠 | 일부 탭 surface 검증이 약함 | 각 탭 content surface를 E2E로 고정 | #385 |
| 디자인 토큰 | CSS 변수와 config가 일부 존재하지만 반복 layout literal이 남아 있었음 | bottom nav, sheet gap, 기본 sheet height token/gate | #386 |

## 현재 구현 기준

| 영역 | 구현 근거 | 판단 |
| --- | --- | --- |
| Tab type | `src/types/core.ts`의 `Tab = 'map' | 'event' | 'feed' | 'course' | 'my'` | 5탭을 지원 |
| BottomNav | `src/components/BottomNav.tsx` | 5탭 버튼 렌더링 |
| App shell | `src/components/app-shell/AppShell.tsx` | slot 기반 앱 셸 구조 |
| Map sheet | `src/components/map-stage/mapSheetState.ts` | 앱 sheet state와 legacy drawer state adapter |
| Tab surfaces | `data-page-surface` E2E contract | 행사/피드/코스/마이 content slot 검증 |
| Layout token | `src/index.css`, `src/styles/refinements.css` | 반복 bottom/sheet spacing token화 |
| QA gate | `test/e2e/app-shell.spec.ts`, `test/e2e/critical-ui-flow.spec.ts`, `test/unit/layout-token-source-quality.test.ts` | 핵심 UX regression 고정 |

## TSK-012 구현 추적

| Child issue | Branch | PR | Merge SHA | 결과 |
| --- | --- | --- | --- | --- |
| #381 | `uiux-redesign-audit` | #396 | `c7f4c71` | 기준선과 UIUX matrix 추가 |
| #382 | `app-shell-safe-area-layout` | #397 | `8d85a67` | 앱 셸 safe-area layout |
| #383 | `map-bottom-sheet-state-machine` | #398 | `ed5b817` | 시트 상태 계약 |
| #384 | `five-tab-information-architecture` | #399 | `e3f8481` | 5탭 IA 회귀 방지 |
| #385 | `tab-content-layout-polish` | #400 | `7ed1af2` | 탭 content surface E2E |
| #386 | `design-token-layout-system` | #401 | `90f6cec` | design token/layout constant gate |
| #387 | `uiux-redesign-traceability-docs` | #402 | TBD | 문서와 Wiki traceability |

## 후속 PR 체크리스트

UI/UX 개편 PR은 PR 본문에 아래 항목을 기록한다.

- 영향받는 `UIUX-###` ID
- 변경한 앱 셸/탭/시트/token 영역
- 사용자-facing copy 변경 여부와 사유
- API/DB/OAuth 변경 없음 확인
- 실행한 검증 명령
- Playwright 또는 수동 QA 근거
- 관련 child issue와 parent #380 링크

## 완료 기준

- [x] 앱 전환 기준선 문서가 repo에 추가됨
- [x] `screen-spec.md`가 5탭 기준과 충돌하지 않게 갱신됨
- [x] `ui-ux-qa-matrix.md`가 `UIUX-###` ID 기준으로 정리됨
- [x] 앱 셸, 시트, 5탭, tab surface, token gate가 PR/merge SHA로 추적됨
- [ ] Wiki와 release candidate 문서가 #387에서 최종 갱신됨
