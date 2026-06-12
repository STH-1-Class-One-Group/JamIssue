# JamIssue 앱 전환 UI/UX 개편 기준선

기준일: 2026-06-12  
Scope-ID: `TSK-012-01`  
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/380  
Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/381

## 목적

`JAM_ISSUE_UIUX_개편안.docx`를 기준으로 앱 전환 UI/UX 개편 전에 현재 구현 상태와 후속 작업 기준을 고정한다.

이 문서는 구현 문서가 아니라 기준선 문서다. 실제 앱 셸, 바텀시트, 5탭 IA, 디자인 토큰 변경은 #382~#386에서 수행한다.

## 문서 우선 결정

개편안의 정보구조를 우선 기준으로 한다.

| 항목 | 현재 기준 | 개편안 기준 | 후속 이슈 |
| --- | --- | --- | --- |
| 앱 셸 | `phone-shell` 안에 status, utility, body, bottom nav가 절대 배치됨 | `Status Safe Area -> App Header -> Sub Navigation -> Content -> Bottom Tab Bar` | #382 |
| 하단 탭 | `map / event / feed / course / my` 타입은 이미 5탭이지만 기존 `screen-spec.md`는 4탭으로 남아 있음 | `지도 / 행사 / 피드 / 코스 / 마이` 5탭을 공식 기준으로 고정 | #384 |
| 설정 진입 | `phone-shell__utility-slot`에 전역 floating 설정 메뉴 배치 | 마이 탭 안으로 통합하고 헤더는 화면 타이틀 책임으로 단순화 | #384, #385 |
| 지도 필터 | 지도 내부 `map-filter-strip`로 배치 | 고정 Sub Navigation 영역으로 이동 | #382, #384 |
| 장소/행사 시트 | `closed / partial / full` | `hidden / peek / half / full` | #383 |
| 탭바/시트 충돌 | `bottom-nav-offset`과 absolute bottom 값으로 회피 | Peek은 탭바 위 floating, Half/Full은 탭바 숨김 | #383 |
| 디자인 토큰 | CSS 변수와 config가 일부 존재하나 shell/sheet/tab 기준이 분산됨 | spacing/color/type/layout token을 역할별로 정리 | #386 |

## 현재 구현 기준선

| 영역 | 현재 구현 근거 | 기준선 판단 |
| --- | --- | --- |
| Tab type | `src/types/core.ts`의 `Tab = 'map' | 'event' | 'feed' | 'course' | 'my'` | 타입은 5탭을 지원하지만 문서 기준이 뒤처져 있음 |
| BottomNav | `src/components/BottomNav.tsx`가 5개 탭 버튼을 렌더링 | 개편안의 5탭 방향과 일치 |
| App shell | `src/App.tsx`가 `map-app-shell`, `phone-shell`, `phone-shell__utility-slot`, `phone-shell__body`를 조립 | 앱 셸 책임이 header/subnav/content/tabbar로 명확히 분리되어 있지 않음 |
| Settings | `GlobalSettingsMenu`가 전역 utility slot에 있음 | 개편안의 마이 탭 통합 기준과 충돌 |
| Map header | `MapStageBrandHeader`가 지도 탭 내부 header 역할 수행 | 전체 앱 header가 아니라 지도 화면 전용 header |
| Category filter | `MapStageCategoryStrip`와 `.map-filter-strip` | 개편안은 Sub Navigation 고정 영역으로 이동 요구 |
| Map surface | `.map-surface-frame`의 absolute inset과 하단 계산값 사용 | 폭/높이 기준이 앱 셸 단위로 통일되어 있지 않음 |
| Drawer state | `DrawerState = 'closed' | 'partial' | 'full'` | 개편안의 `hidden / peek / half / full`로 재정의 필요 |
| Place/Festival drawer | `PlaceDetailSheet`, `FestivalDetailSheet`가 `place-drawer` class 공유 | 장소와 행사 시트 모두 새 state machine 영향을 받음 |
| E2E | `test/e2e/app-shell.spec.ts`, `test/e2e/critical-ui-flow.spec.ts` 존재 | 일부 테스트 문자열이 mojibake 상태라 QA 근거로 쓰기 전 복구 필요 |

## 개편안 요구사항 매핑

| 요구사항 | 구현 축 | 완료 판단 |
| --- | --- | --- |
| safe area 포함 5단 앱 셸 | #382 | 모바일 viewport에서 header/subnav/content/tabbar 폭과 padding이 일관됨 |
| 지도 바텀시트 상태 전환 | #383 | Peek/Half/Full 전환과 탭바 표시 규칙이 E2E로 고정됨 |
| 행사 독립 탭과 설정 위치 정리 | #384 | 5탭 IA와 마이 탭 설정 진입이 테스트로 고정됨 |
| 행사/피드/코스/마이 콘텐츠 polish | #385 | 각 탭이 앱 셸 안에서 지도 배경 없이 독립 페이지처럼 동작함 |
| 디자인 토큰 정리 | #386 | 새 numeric literal이 config/token 또는 allowlist로 분류됨 |
| QA/문서 추적성 | #387 | Wiki, `screen-spec.md`, `ui-ux-qa-matrix.md`가 같은 IA를 가리킴 |

## 후속 PR 체크리스트

UI/UX 개편 PR은 PR 본문에 아래 항목을 기록한다.

- 영향받는 `UIUX-###` ID
- 변경한 앱 셸/탭/시트/토큰 영역
- 사용자-facing copy 변경 여부와 사유
- API/DB/OAuth 무변경 확인
- 실행한 검증 명령
- Playwright 또는 수동 QA 근거
- 관련 child issue와 parent #380 링크

## #381 완료 기준

- 이 기준선 문서가 repo에 추가됨
- `ui-ux-qa-matrix.md`가 UTF-8 한국어 문서로 복구됨
- `screen-spec.md`가 문서 우선 5탭 기준과 충돌하지 않게 갱신됨
- `testing-coverage.md`가 읽을 수 있는 한국어 문서로 복구됨
- PR과 CI 근거가 #381에 기록됨
