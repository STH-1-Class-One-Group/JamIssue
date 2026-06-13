# JamIssue 2차 UI/UX 구현 기준선

기준일: 2026-06-13
Scope-ID: `TSK-012`
Parent Issue: [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404)

## 목적

2차 구현 명세인 `서브내비 헤더 통합 및 KTO 지도 통합`을 Web Front 코드 기준으로 추적합니다. 이 문서는 구현 결과를 포장하는 문서가 아니라, 어떤 화면 구조와 테스트 근거를 기준으로 다음 작업을 검토할지 고정합니다.

## 기준 결정

| 항목 | 현재 기준 |
| --- | --- |
| 화면 구조 | `Status Safe Area -> App Header -> Sub Navigation -> Content -> Bottom Tab Bar` |
| 앱 헤더 | 뒤로가기, 설정, 알림, 피드백 액션을 header slot에서 관리 |
| 서브내비 | 지도 필터와 보조 조작을 content 위 absolute overlay가 아니라 shell flow 안에서 관리 |
| 하단 탭 | `지도 / 행사 / 피드 / 코스 / 마이` 5탭 유지 |
| 행사 탭 | 행사 콘텐츠만 표시. 관광장소 세그먼트는 지도 KTO 레이어로 이동 |
| KTO 지도 레이어 | 기본 OFF. 사용자가 토글할 때만 Web Front consumer contract로 관광장소를 조회 |
| KTO 정보 시트 | `isCurated: false` 관광장소는 스탬프/후기 액션 없는 `TourismInfoSheet`로 표시 |
| CSS offset | legacy absolute/fixed 누적 offset과 무효화된 `!important` 패치를 제거 |

## 코드 기준

| 영역 | 기준 파일 | 판단 |
| --- | --- | --- |
| App shell | `src/components/app-shell/AppShell.tsx` | header, subNav, content, bottomNav slot 소유 |
| Header | `src/components/app-shell/AppHeader.tsx` | leading back button과 action slot 소유 |
| Map stage props | `src/hooks/usePageStageProps.ts` | KTO 상태와 shell slot props 전달 |
| Tourism API consumer | `src/api/tourismClient.ts`, `src/tourismTypes.ts` | Web Front가 소유하는 consumer contract |
| Tourism markers | `src/components/naver-map/useNaverTourismMarkers.ts` | KTO 정보성 마커 레이어 |
| Tourism info sheet | `src/components/TourismInfoSheet.tsx` | 비큐레이션 관광장소 정보 표시 |
| Event tab | `src/components/EventTab.tsx` | festival-only |
| CSS cleanup | `src/index.css`, `src/styles/refinements.css` | legacy utility/back/filter offset 제거 |

## API/DB/OAuth 범위

TSK-012는 Web Front UI/UX 구현 축입니다.

- API path 변경 없음
- response shape 변경 없음
- DB schema 변경 없음
- Kakao/Naver OAuth 성공 경로 변경 없음
- KTO/OpenAPI를 브라우저에서 직접 호출하지 않음

## 완료 기준

| 조건 | 근거 |
| --- | --- |
| child issue별 PR과 merge SHA 기록 | [UI/UX 추적성](ui-ux-redesign-traceability.md) |
| 기대 동작 ID와 테스트 연결 | [UI/UX QA 매트릭스](ui-ux-qa-matrix.md) |
| release candidate 기록 | [JamIssue 1.3.3 후보](release-candidate-1.3.3.md) |
| Wiki 반영 | `UI-UX-QA-Matrix`, `UI-UX-Redesign-Traceability`, `Release-Notes-1.3.3` |
