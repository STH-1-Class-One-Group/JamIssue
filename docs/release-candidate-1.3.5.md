# JamIssue 1.3.5 후보

상태: 후보
기준 Scope: `TSK-015`
Parent Issue: [#490](https://github.com/STH-1-Class-One-Group/JamIssue/issues/490)

## 요약

`1.3.5` 후보는 6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 홈 화면 아이콘 개편을 묶은 Web Front UI/UX 릴리즈 후보다. HTML 시안의 리뷰 콘텐츠는 포함하지 않고, 드로워 상태 모델, 공통 시트 셸, 하단 탭 표현, 브랜드 아이콘 자산, CSS 정책 정리만 반영한다.

## 사용자 관점 변화

- 지도 바텀드로워가 `peek / half / full` 상태 모델로 정리돼 full 상태에서 의도치 않게 peek으로 되돌아가지 않는다.
- 장소/행사/KTO 시트가 공통 `MapBottomSheet` 프레임을 사용해 handle, close, 이미지 영역, 스크롤 구조가 일관된다.
- 하단 탭이 icon + label + active pill 구조로 통일되고 drawer 상태와 무관하게 계속 보인다.
- Safari 홈 화면 추가 시 JamIssue 브랜드 아이콘을 사용한다.

## 운영/보안/품질 변화

- API path, response shape, DB schema, OAuth/KTO provider contract 변경 없음.
- PWA manifest, favicon, apple-touch-icon은 `src/assets/jamissue-logo.png` 기반 자산을 사용한다.
- `bottomTabHidden`, `bottom-nav--hidden`, `app-shell__bottom-tab-slot--hidden` 회귀를 source-quality test로 차단한다.

## 포함 PR / 커밋

| PR | 내용 | Merge SHA |
| --- | --- | --- |
| [#498](https://github.com/STH-1-Class-One-Group/JamIssue/pull/498) | 6차 UI/UX audit baseline 기록 | `c8cf656aac2d229ae8cf5fc37bc007ff1c179fa8` |
| [#499](https://github.com/STH-1-Class-One-Group/JamIssue/pull/499) | 지도 시트 상태 모델 정착 | `5e4e90b0346cdcaa1b1911af87104f2c4233452c` |
| [#500](https://github.com/STH-1-Class-One-Group/JamIssue/pull/500) | 공통 시트 visual redesign | `3fda7885b295586c0e069b61c549b2eb20538c33` |
| [#501](https://github.com/STH-1-Class-One-Group/JamIssue/pull/501) | 하단 탭 icon + active pill 구조 | `64e2b82079371f18a4b60677dcdde3e25d607c33` |
| [#502](https://github.com/STH-1-Class-One-Group/JamIssue/pull/502) | PWA/iOS 브랜드 아이콘 자산 | `0fb872248a35ad06bdc1d02ddefc6a975550e428` |
| [#503](https://github.com/STH-1-Class-One-Group/JamIssue/pull/503) | drawer/nav CSS policy cleanup | `7053f575ac82378e7d506a0e28b2a28719f534b1` |

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

## 제외 범위

- API path, response shape, DB schema 변경
- OAuth/KTO provider contract 변경
- 리뷰/스탬프 기능 로직 변경
- HTML 시안에 포함된 리뷰 콘텐츠 구현

## 관련 문서

- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [6차 UI/UX Audit Baseline](TSK-015-01-sixth-uiux-audit-baseline.md)
