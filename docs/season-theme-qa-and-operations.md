# 계절 테마 QA와 운영 기준

TSK-019 계절 테마는 앱의 색감과 분위기를 계절별 semantic token으로 바꾸는 작업이다. 탭, 네비게이션, 라우트, API, DB, OAuth, KTO provider contract는 변경하지 않는다.

## Public Contract

| 항목 | 기준 |
| --- | --- |
| Runtime DOM | `document.documentElement.dataset.seasonTheme` |
| Theme 값 | `spring`, `summer`, `autumn`, `winter` |
| 기본 계절 | 클라이언트 현재 월 기준 |
| 월 매핑 | 3~5월 `spring`, 6~8월 `summer`, 9~11월 `autumn`, 12/1/2월 `winter` |
| 개발 override | dev/test 검증용으로만 허용 |
| production UI | 계절 switcher 버튼 노출 금지 |
| Component CSS | semantic token 소비 |

## 책임 경계

| 계층 | 소유 책임 |
| --- | --- |
| `src/styles/themes/*.css` | 계절별 palette 값 |
| `src/styles/semantic.css` | component-facing semantic alias |
| `src/lib/seasonTheme.ts` | 계절 판정과 override 허용 정책 |
| `src/main.tsx` | root `data-season-theme` 적용 |
| Component CSS | raw seasonal color가 아니라 semantic token 소비 |
| Source-quality/E2E | raw color 회귀, 4계절 적용, production switcher 미노출 검증 |

## QA Matrix

| QA ID | 확인 대상 | 자동 검증 |
| --- | --- | --- |
| `UIUX-033` | 현재 월 기준 계절 theme가 root dataset에 적용된다. | `test/unit/season-theme-runtime.test.ts` |
| `UIUX-034` | spring/summer/autumn/winter forced mode에서 app chrome token computed style이 달라진다. | `test/e2e/season-theme.spec.ts` |
| `UIUX-035` | 계절 변경은 `지도 / 행사 / 피드 / 코스 / 마이` 탭 구조를 바꾸지 않는다. | `test/e2e/season-theme.spec.ts` |
| `UIUX-036` | production 사용자 경로에는 계절 switcher가 노출되지 않는다. | `test/e2e/season-theme.spec.ts` |
| `UIUX-037` | component/app chrome CSS raw seasonal color literal이 증가하지 않는다. | `test/unit/season-theme-source-quality.test.ts` |

## TSK-019 Evidence

| Child | Issue | PR | Merge SHA | 근거 |
| --- | --- | --- | --- | --- |
| TSK-019-01 | [#583](https://github.com/STH-1-Class-One-Group/JamIssue/issues/583) | [#589](https://github.com/STH-1-Class-One-Group/JamIssue/pull/589); [#590](https://github.com/STH-1-Class-One-Group/JamIssue/pull/590); [#591](https://github.com/STH-1-Class-One-Group/JamIssue/pull/591) | `dc3a39ac49e7fc56bbae66448ab064737a95585d`; `a8bf2a9d93abed583af8c72f610327a3d2eaced2`; `11f95ad9b301ee7902c429e90d11ff9291bc3ca6` | hardcoded color inventory와 source-quality baseline |
| TSK-019-02 | [#584](https://github.com/STH-1-Class-One-Group/JamIssue/issues/584) | [#594](https://github.com/STH-1-Class-One-Group/JamIssue/pull/594) | `ef357fae13641cd5871a82dcc1dbb123da117af2` | semantic token과 4계절 theme CSS boundary |
| TSK-019-03 | [#585](https://github.com/STH-1-Class-One-Group/JamIssue/issues/585) | [#596](https://github.com/STH-1-Class-One-Group/JamIssue/pull/596) | `34f7a3f2feacaca1a9963be1a77679980d8f8acf` | `SeasonTheme` resolver와 root dataset 적용 |
| TSK-019-04 | [#586](https://github.com/STH-1-Class-One-Group/JamIssue/issues/586) | [#599](https://github.com/STH-1-Class-One-Group/JamIssue/pull/599) | `5acd328e481d46b1414dcaf77ea8b37c173fc5e1` | app chrome/feed/sheet/button semantic token migration |
| TSK-019-05 | [#587](https://github.com/STH-1-Class-One-Group/JamIssue/issues/587) | [#601](https://github.com/STH-1-Class-One-Group/JamIssue/pull/601); [#602](https://github.com/STH-1-Class-One-Group/JamIssue/pull/602) | `fda2cc95f9776b0569ee8033cec03c22a0e188e6`; `2081e3b027627be6b9cd6e50d869ef94d48a0a68` | 4계절 E2E와 raw color literal gate |

## 제외 범위

- 계절별 탭, 네비게이션, 라우트 추가
- production 사용자용 계절 switcher
- API path, response shape, DB schema, OAuth/KTO provider contract 변경
- 지도 카테고리 의미 색상과 Naver marker 의미 색상의 무조건 계절화

