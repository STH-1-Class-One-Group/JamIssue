# TSK-019-01 계절 테마 하드코딩 색상 기준선

## 메타데이터

- Scope-ID: `TSK-019-01-SEASON-THEME-AUDIT-BASELINE`
- Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/583
- PR: TBD
- Branch: `season-theme-audit-baseline`
- Status: active
- Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/582
- Child Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/583

## 기준선 요약

계절 테마의 첫 단계는 기존 색상을 즉시 모두 바꾸는 것이 아니라, 어떤 raw color literal이 앱 chrome/theme 후보이고 어떤 값이 category/marker 의미 색상인지 분리하는 것이다.

`test/unit/season-theme-source-quality.test.ts`는 아래 두 가지를 고정한다.

- 새 raw color literal 파일이 생기면 실패한다.
- 기존 raw color owner의 count가 증가하면 실패한다.

## 현재 raw color owner

| 파일 | 현재 count | 분류 | 후속 처리 |
| --- | ---: | --- | --- |
| `src/index.css` | 195 | 앱 chrome/component CSS legacy 색상 | TSK-019-02~04에서 semantic token으로 이동 |
| `src/styles/refinements.css` | 140 | legacy refinement override 색상 | TSK-019-02~04에서 semantic token으로 이동 |
| `src/lib/categories.ts` | 8 | 카테고리 의미 색상 | 계절 테마와 분리, 필요 시 category token으로 별도 처리 |
| `src/config/uiTokenConfig.ts` | 9 | Naver marker visual config | 지도 marker 의미 색상으로 분리 |
| `src/components/map-stage/MapStageCategoryStrip.tsx` | 2 | 카테고리 palette bridge | category token 전환 전까지 allowlist |
| `src/components/place/PlaceBadgeRow.tsx` | 1 | 카테고리 palette bridge | category token 전환 전까지 allowlist |
| `src/components/naver-map/markerContent.ts` | 21 | Naver SDK HTML marker content | 지도 marker 의미 색상으로 분리 |
| `src/components/RoadmapBannerPreview.tsx` | 2 | roadmap preview accent | production seasonal app chrome 범위 밖 |
| `src/components/naver-map/useNaverRoutePreviewOverlay.ts` | 1 | route preview stroke | 지도 overlay 의미 색상으로 분리 |

## 후속 child 기준

- TSK-019-02는 `semantic.css`와 4계절 theme 파일을 추가하고 기존 pink 계열을 semantic alias로 연결한다.
- TSK-019-03은 클라이언트 월 기준 `data-season-theme` runtime contract를 추가한다.
- TSK-019-04는 app shell, capsule, switch/chip/button, bottom nav, feed card/progress/sheet surface가 semantic token을 소비하도록 이동한다.
- TSK-019-05는 4계절 E2E와 더 강한 raw color literal gate를 추가한다.

## Architecture Boundary Gate

- Responsibility map: 이 문서와 source-quality test는 audit/gate 기준선만 소유한다.
- Dependency direction: production code는 audit/test에 의존하지 않는다.
- Test seam: `test/unit/season-theme-source-quality.test.ts`
- Scope map: 계절 테마 하드코딩 색상 inventory와 회귀 방지 기준선
- Architecture risk: category/marker 의미 색상을 무조건 계절화하면 장소 분류와 지도 marker semantics가 깨질 수 있다.
