# JamIssue 1.3.7 후보

상태: 후보
기준 Scope: `TSK-019`
Parent Issue: [#582](https://github.com/STH-1-Class-One-Group/JamIssue/issues/582)

## 요약

`1.3.7` 후보는 계절별 색감과 분위기를 `data-season-theme`와 semantic CSS token으로 전환한 Web Front 디자인 토큰 릴리즈 후보다. 봄/여름/가을/겨울 palette를 static CSS로 포함하고, runtime에서 현재 월 또는 허용된 dev/test override 기준으로 root theme를 적용한다.

## 사용자 관점 변화

- 계절에 따라 앱 chrome, 주요 control, progress, card/sheet surface의 색감이 바뀐다.
- 탭, 네비게이션, 라우트, KTO/API 기능 구조는 바뀌지 않는다.
- production 사용자 화면에는 계절 switcher가 노출되지 않는다.

## 운영/보안/품질 변화

- API path, response shape, DB schema, OAuth/KTO provider contract 변경 없음.
- `src/styles/themes/*.css`가 계절 palette를 소유하고, component CSS는 semantic token을 소비한다.
- `test/unit/season-theme-source-quality.test.ts`가 component/app chrome raw seasonal color literal 회귀를 차단한다.
- `test/e2e/season-theme.spec.ts`가 4계절 forced mode, tab 구조 유지, production switcher 미노출을 검증한다.

## 포함 PR / 커밋

| PR | 내용 | Merge SHA |
| --- | --- | --- |
| [#589](https://github.com/STH-1-Class-One-Group/JamIssue/pull/589) | TSK-019 governance index와 baseline 문서 등록 | `dc3a39ac49e7fc56bbae66448ab064737a95585d` |
| [#590](https://github.com/STH-1-Class-One-Group/JamIssue/pull/590) | TSK-019-01 traceability 보강 | `a8bf2a9d93abed583af8c72f610327a3d2eaced2` |
| [#591](https://github.com/STH-1-Class-One-Group/JamIssue/pull/591) | TSK-019-01 closeout evidence 정리 | `11f95ad9b301ee7902c429e90d11ff9291bc3ca6` |
| [#594](https://github.com/STH-1-Class-One-Group/JamIssue/pull/594) | 계절 semantic theme token boundary 추가 | `ef357fae13641cd5871a82dcc1dbb123da117af2` |
| [#596](https://github.com/STH-1-Class-One-Group/JamIssue/pull/596) | runtime `data-season-theme` 적용 | `34f7a3f2feacaca1a9963be1a77679980d8f8acf` |
| [#599](https://github.com/STH-1-Class-One-Group/JamIssue/pull/599) | component surface semantic token migration | `5acd328e481d46b1414dcaf77ea8b37c173fc5e1` |
| [#601](https://github.com/STH-1-Class-One-Group/JamIssue/pull/601) | 4계절 E2E와 source-quality verification gate | `fda2cc95f9776b0569ee8033cec03c22a0e188e6` |
| [#602](https://github.com/STH-1-Class-One-Group/JamIssue/pull/602) | TSK-019-05 traceability readback 보강 | `2081e3b027627be6b9cd6e50d869ef94d48a0a68` |

## 검증 근거

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run build
git diff --check
```

추가 targeted 검증:

```powershell
npx playwright test test/e2e/season-theme.spec.ts
node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run test/unit/season-theme-source-quality.test.ts
```

## 제외 범위

- 계절별 탭, 네비게이션, 라우트 추가
- production 사용자용 계절 switcher
- API path, response shape, DB schema, OAuth/KTO provider contract 변경
- 지도 카테고리 의미 색상과 Naver marker 의미 색상의 무조건 계절화

## 관련 문서

- [계절 테마 QA와 운영 기준](season-theme-qa-and-operations.md)
- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [Governance Index](GOVERNANCE_INDEX.md)

