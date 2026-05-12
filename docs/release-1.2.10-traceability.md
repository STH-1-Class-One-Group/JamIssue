# JamIssue 1.2.10 Release Traceability

## 릴리즈 메타

| 항목 | 값 |
| --- | --- |
| 버전 | `1.2.10` |
| 상태 | 정식 릴리즈 |
| 릴리즈 날짜 | 2026-05-12 |
| 태그 | `release-v1.2.10` |
| 기준 commit | `3984be45ca5b292c4e0bef7482f87fdf74159e86` |
| 비교 기준 | `release-v1.2.9` 이후 |
| GitHub Release | https://github.com/STH-1-Class-One-Group/JamIssue/releases/tag/release-v1.2.10 |

## 포함 범위

`1.2.10`은 `1.2.9` 이후의 TSK-004, TSK-005, review collection/render allocation 최적화를 하나로 묶은 정식 리팩터링 릴리즈입니다. 기존에 `1.2.11 후보`로 분리했던 TSK-005 범위는 별도 버전으로 발행하지 않고 `1.2.10`에 흡수했습니다.

## 포함 PR

| PR | Main merge SHA | 내용 |
| --- | --- | --- |
| [#278](https://github.com/STH-1-Class-One-Group/JamIssue/pull/278) | `c5f4f1e` | review collection 상태 업데이트 최적화 |
| [#279](https://github.com/STH-1-Class-One-Group/JamIssue/pull/279) | `5fddc64d0f8b8a1f94f3505d2fb911958aa49a35` | Worker residual boundary audit와 source-quality gate 기준선 |
| [#280](https://github.com/STH-1-Class-One-Group/JamIssue/pull/280) | `cb04022cd5fd091ddf0c61d56726f8eb1f818975` | festival domain boundary split |
| [#281](https://github.com/STH-1-Class-One-Group/JamIssue/pull/281) | `9852b88aafb2fadac60b9d7152e3acf56462d50f` | Worker domain mapper row contract typing |
| [#282](https://github.com/STH-1-Class-One-Group/JamIssue/pull/282) | `1470968e80c0c63bfa4bbcce5024ee1e7580e314` | Worker service handler contract typing |
| [#283](https://github.com/STH-1-Class-One-Group/JamIssue/pull/283) | `a9338dc93e57dc61f008b5655b6604a30c98cde6` | Worker boundary traceability docs |
| [#284](https://github.com/STH-1-Class-One-Group/JamIssue/pull/284) | `b5d89b695f02c2e6018f50bd452576505e5d3525` | 1.2.10 후보 문구 정리 |
| [#293](https://github.com/STH-1-Class-One-Group/JamIssue/pull/293) | `7a9a08f71ed35efeccb52d790cd37af8700575da` | architecture regression audit gates |
| [#294](https://github.com/STH-1-Class-One-Group/JamIssue/pull/294) | `fc6e8b81f02e1409202c6c03fc5d377fb5503abf` | Naver map SDK local contract |
| [#295](https://github.com/STH-1-Class-One-Group/JamIssue/pull/295) | `bbbc572f6fd6c6869d5ba2b810d82d452e458aad` | Worker review read persistence boundary |
| [#298](https://github.com/STH-1-Class-One-Group/JamIssue/pull/298) | `d8eff3e8d4ed26484f1735fbf4ee9ca3ef83fe4c` | Worker stamp persistence boundary |
| [#299](https://github.com/STH-1-Class-One-Group/JamIssue/pull/299) | `29b89092aeb6dd6dce07e4b09302edea8651564f` | Worker notification persistence and realtime publisher boundary |
| [#300](https://github.com/STH-1-Class-One-Group/JamIssue/pull/300) | `35f4152f5d638a9ebcb5db1836eb04e45c2d5088` | architecture regression traceability docs |
| [#301](https://github.com/STH-1-Class-One-Group/JamIssue/pull/301) | `3984be45ca5b292c4e0bef7482f87fdf74159e86` | `getKnownMyReviews` intermediate allocation 제거와 회귀 테스트 |

## 최종 검증 근거

- 열린 PR: 0
- 열린 이슈: 0
- Dependabot open alerts: 0
- Code scanning open alerts: 0
- main CI: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942439
- production-smoke: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942430
- CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714941975
- Code Quality CodeQL: https://github.com/STH-1-Class-One-Group/JamIssue/actions/runs/25714942006

## 제외 범위

- 신규 사용자 기능 추가 없음
- API path/response shape 변경 없음
- DB schema 변경 없음
- 사용자-facing copy 변경 없음
- Kakao/Naver OAuth 성공 경로 변경 없음
- Node.js 20 GitHub Actions deprecation warning 정리는 별도 CI maintenance 범위
