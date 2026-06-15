# JamIssue 1.3.4 후보

상태: 후보
기준 Scope: `TSK-013`
Parent Issue: [#466](https://github.com/STH-1-Class-One-Group/JamIssue/issues/466)

## 요약

`1.3.4` 후보는 5차 UI/UX 명세를 Web Front 지도 화면에 반영하는 UI/UX 구조 개선 릴리즈입니다. 지도 탭에서 상단 AppHeader와 subNav가 차지하던 고정 영역을 제거하고, 지도 위 1줄 플로팅 캡슐 내비게이션으로 필터, 관광정보, 설정 진입점을 통합합니다.

## 사용자 관점 변화

- 앱 최초 진입 시 브랜드 스플래시를 1회 표시하고, 메인 지도 화면에서는 브랜드 헤더를 제거합니다.
- 지도 화면의 필터는 가로 스크롤 칩 대신 작은 드롭다운으로 선택합니다.
- 관광정보 토글과 설정 진입점은 지도 위 캡슐 안에서 한 줄로 정리됩니다.
- 지도 상단 고정 영역이 줄어 지도와 장소 탐색 공간이 넓어집니다.

## 운영/보안/품질 변화

- API path, response shape, DB schema, OAuth 성공 경로는 변경하지 않습니다.
- KTO 관광정보는 기존 Web Front consumer contract와 local filtering 동작을 유지합니다.
- UIUX-023, UIUX-024 기준으로 E2E 회귀 테스트를 보강합니다.

## 포함 PR / 커밋

| PR | 내용 | Merge SHA |
| --- | --- | --- |
| TBD | TSK-013 5차 UI/UX 플로팅 캡슐 내비게이션 | TBD |

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

- 지도 외 행사/피드/코스/마이 탭의 별도 캡슐 헤더
- Backend provider contract 변경
- DB schema 변경
- OAuth 경로 변경
- KTO/OpenAPI 브라우저 직접 호출

## 관련 문서

- [Governance Index](GOVERNANCE_INDEX.md)
- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [UI/UX Redesign Traceability](ui-ux-redesign-traceability.md)
