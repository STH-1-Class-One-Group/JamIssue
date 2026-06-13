# TSK-014-04 KTO 사용자 가치 정보 시트 수정

## 메타데이터

| 항목 | 값 |
| --- | --- |
| Scope-ID | `TSK-014-04` |
| Issue | `#434` |
| Parent Issue | `#425` |
| Branch | `kto-info-sheet-user-value` |
| PR | `#435` |
| Status | `merged` |
| Base SHA | `dba8b3214d5bd61a56560383feac76ae65c2a306` |
| Merge SHA | `4cdb4133e523481f1318b60ff81385ed542b8140` |

## 요약

KTO 지도 정보 시트가 목록 응답의 제한된 필드와 외부 원문 링크에 의존하던 문제를 수정했다.
프론트는 Worker consumer contract만 사용하며, 선택된 KTO 장소에 대해 `GET /api/tourism/places/{id}` 상세 API를 lazy-load한다.

## Architecture Boundary Gate

| Gate | 근거 |
| --- | --- |
| Responsibility map | `tourismClient`는 Worker tourism API path만 소유하고, coordinator effect는 상세 lazy-load와 cache만 소유한다. `TourismInfoSheet`는 list/detail DTO를 사용자 화면으로 렌더링한다. |
| Dependency direction | Frontend는 KTO 원천, Supabase, admin import API를 직접 보지 않고 Worker `/api/tourism/places`와 `/api/tourism/places/{id}`만 소비한다. |
| Test seam | API client path test, sheet rendering unit test, Playwright API fixture detail route로 회귀를 고정했다. |
| Scope map | API path/response shape, DB schema, OAuth flow는 변경하지 않았다. 사용자 UI는 provider metadata/link 제거와 상세 정보 표시 범위만 변경했다. |
| Architecture risk | 상세 API 지연 시 UX가 멈추지 않도록 timeout/error state를 유지한다. 상세 없는 항목은 목록 수준 정보로 fallback한다. |

## 변경 내용

- KTO 상세 DTO를 추가했다: `TourismPlaceDetailResponse`, `TourismPlaceDetailItem`, `displaySections`, `images`.
- `getTourismPlaceDetail(placeId)`를 추가해 상세 API를 Worker consumer contract로 호출한다.
- 선택된 KTO 장소에 대해 상세 정보를 lazy-load하고 `tourismDetailsById`에 cache한다.
- KTO 정보 시트는 `contact`, `images`, `displaySections`를 렌더링한다.
- 사용자에게 불필요한 provider metadata를 숨겼다: KTO 내부 코드, 좌표, 업데이트 날짜, 실패 가능한 외부 원문 링크.
- 상세 로딩/에러 상태를 시트 내부에 표시한다.

## 검증 근거

| 항목 | 결과 |
| --- | --- |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run test:unit -- tourism-info-sheet tourism-client` | Pass |
| `npm.cmd run test:e2e` | Pass |
| `npm.cmd run check:numeric-literals` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run test:unit` | Pass |
| `npm.cmd run build` | Pass |
| `git diff --check` | Pass |
| UTF-8 integrity check for changed files | Pass |
| PR checks | `frontend`, `deploy-pages`, `CodeQL`, `Analyze (actions)`, `Analyze (javascript-typescript)` success |
| Main checks | `frontend`, `deploy-pages`, `smoke`, `protected-smoke`, `Analyze (actions)`, `Analyze (javascript-typescript)` success |

## 링크

- PR: `https://github.com/STH-1-Class-One-Group/JamIssue/pull/435`
- Issue: `https://github.com/STH-1-Class-One-Group/JamIssue/issues/434`
- Main merge SHA: `4cdb4133e523481f1318b60ff81385ed542b8140`
- Main production smoke: `https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27472564353`
- Main CodeQL/Analyze: `https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27472563946`, `https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/27472563949`
