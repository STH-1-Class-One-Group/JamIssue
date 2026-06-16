# UI/UX QA Matrix

JamIssue Web Front의 사용자 기대 동작을 `UIUX-###` ID로 추적한다. UI/UX 변경 PR은 영향을 받는 기대 동작, 자동 테스트, 수동 QA 필요 여부, 관련 issue/PR 근거를 남겨야 한다.

## 운영 규칙

| 항목 | 기준 |
| --- | --- |
| ID 형식 | `UIUX-###` |
| 단위 | 사용자가 체감하는 화면 동작 하나 |
| 자동화 기준 | unit, integration, regression, E2E 중 하나로 재현 가능하면 자동 테스트에 연결 |
| 수동 QA 기준 | 실제 iPhone Safari/WebView처럼 자동화가 불완전한 항목은 기기, 브라우저, 일시, 확인자를 기록 |
| 완료 기준 | 자동 테스트 또는 수동 QA 근거 없이 close 금지 |

## 기대 동작

| ID | 영역 | 기대 동작 | 자동 테스트 | 수동 QA |
| --- | --- | --- | --- | --- |
| `UIUX-001` | 앱 셸 | 모바일 기준 콘텐츠와 하단 탭이 shell flow 안에서 겹치지 않는다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-004` | 지도 드로워 | 지도 시트 상태는 `hidden / peek / half / full` 계약을 유지한다. `partial` query는 호환 alias로만 처리한다. | `test/unit/map-sheet-state.test.ts` | 필요 |
| `UIUX-009` | 모바일 키보드 | 리뷰 작성 focus 시 하단 탭과 드로워가 화면 중간으로 떠오르지 않는다. | `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-013` | 5탭 IA | 하단 탭은 `지도 / 행사 / 피드 / 코스 / 마이` 5개를 유지한다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-020` | 지도 드로워 | full 드로워는 명시적 최소화 전까지 peek으로 회귀하지 않고, 하단 탭은 계속 visible/clickable 상태를 유지한다. | `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-021` | KTO 지도 레이어 | KTO 관광정보 레이어는 기본 OFF이고, 사용자가 켤 때만 전체 snapshot을 조회한다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |
| `UIUX-022` | KTO 정보 시트 | 비큐레이션 KTO 장소는 스탬프/후기 액션이 없는 정보 시트로 표시된다. | `test/e2e/tourism-map-layer.spec.ts` | 필요 |
| `UIUX-023` | 플로팅 캡슐 | 지도 탭 플로팅 캡슐은 360/390/430px viewport에서 한 줄을 유지하고 알림/설정 레이어를 가리지 않는다. | `test/e2e/app-shell.spec.ts` | 필요 |
| `UIUX-024` | 스플래시/브랜드 | 최초 진입 스플래시는 JamIssue 브랜드 자산을 사용하고 탭 전환 시 재표시되지 않는다. | `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-025` | 6차 드로워 프레임 | 장소/행사/KTO 시트는 공통 `MapBottomSheet` shell을 사용하고, handle/close/scroll/media frame을 중복 구현하지 않는다. | `test/unit/map-bottom-sheet.test.tsx`, `test/e2e/critical-ui-flow.spec.ts` | 필요 |
| `UIUX-026` | 하단 탭 표현 | 하단 탭은 icon wrapper, label, active pill 구조를 렌더링한다. | `test/unit/bottom-nav.test.tsx`, `test/e2e/app-shell.spec.ts` | 선택 |
| `UIUX-027` | PWA 홈 아이콘 | manifest, favicon, apple-touch-icon은 JamIssue 브랜드 로고 기반 PNG 자산을 가리킨다. | `test/unit/pwa-icon-assets.test.ts` | 필요 |
| `UIUX-028` | Drawer/nav CSS 정책 | drawer/nav CSS는 stale bottom nav hidden 정책을 재도입하지 않는다. | `test/unit/layout-token-source-quality.test.ts` | 선택 |

## TSK-015 구현 근거

| Child issue | PR | Merge SHA | 고정한 기대 동작 |
| --- | --- | --- | --- |
| [#491](https://github.com/STH-1-Class-One-Group/JamIssue/issues/491) | [#498](https://github.com/STH-1-Class-One-Group/JamIssue/pull/498) | `c8cf656aac2d229ae8cf5fc37bc007ff1c179fa8` | 6차 UI/UX baseline |
| [#492](https://github.com/STH-1-Class-One-Group/JamIssue/issues/492) | [#499](https://github.com/STH-1-Class-One-Group/JamIssue/pull/499) | `5e4e90b0346cdcaa1b1911af87104f2c4233452c` | `UIUX-004` |
| [#493](https://github.com/STH-1-Class-One-Group/JamIssue/issues/493) | [#500](https://github.com/STH-1-Class-One-Group/JamIssue/pull/500) | `3fda7885b295586c0e069b61c549b2eb20538c33` | `UIUX-025` |
| [#494](https://github.com/STH-1-Class-One-Group/JamIssue/issues/494) | [#501](https://github.com/STH-1-Class-One-Group/JamIssue/pull/501) | `64e2b82079371f18a4b60677dcdde3e25d607c33` | `UIUX-026` |
| [#495](https://github.com/STH-1-Class-One-Group/JamIssue/issues/495) | [#502](https://github.com/STH-1-Class-One-Group/JamIssue/pull/502) | `0fb872248a35ad06bdc1d02ddefc6a975550e428` | `UIUX-027` |
| [#496](https://github.com/STH-1-Class-One-Group/JamIssue/issues/496) | [#503](https://github.com/STH-1-Class-One-Group/JamIssue/pull/503) | `7053f575ac82378e7d506a0e28b2a28719f534b1` | `UIUX-020`, `UIUX-028` |

## 이슈 템플릿

```markdown
## 기대 동작 ID

- UIUX-###

## 기대 동작

-

## 실제 동작

-

## 재현 경로

1.

## 테스트 상태

- 자동 테스트:
- 수동 QA:

## 관련 근거

- Issue:
- PR:
- Merge SHA:
- CI:
```

## 관련 문서

- [6차 UI/UX Audit Baseline](TSK-015-01-sixth-uiux-audit-baseline.md)
- [UI/UX Redesign Traceability](ui-ux-redesign-traceability.md)
- [Release Candidate 1.3.5](release-candidate-1.3.5.md)
