# 테스트 커버리지 운영 기준

## 목적

UI/UX 기대 동작과 코드 품질을 자동 테스트와 QA 근거로 추적한다.

UI/UX 기대 동작은 [UI/UX 기대 동작 QA 매트릭스](ui-ux-qa-matrix.md)의 `UIUX-###` ID와 연결한다.

## 현재 단계

현재 단계는 TypeScript coverage와 Playwright E2E가 이미 도입된 상태다.

이 문서는 커버리지 수치를 꾸미기 위한 문서가 아니라, PR이 어떤 검증 명령으로 사용자 기대 동작을 증명해야 하는지 정리하는 운영 기준이다.

## TypeScript coverage

```powershell
npm.cmd run test:coverage:ts
```

대상:

- `src/**/*.ts`
- `src/**/*.tsx`
- `scripts/**/*.ts`
- `deploy/api-worker-shell/**/*.ts`

제외:

- 테스트 파일
- 문서
- 빌드 결과물
- coverage 결과물
- 생성 산출물

## UI/UX E2E

```powershell
npm.cmd run test:e2e
```

UI/UX 관련 PR은 영향받는 `UIUX-###` ID와 연결되는 Playwright 시나리오를 우선 추가한다.

자동화가 어려운 실제 iPhone Safari/WebView 항목은 수동 QA 근거를 이슈 또는 PR에 남긴다.

## 공통 검증 명령

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run test:coverage:ts
npm.cmd run build
git diff --check
```

## 수치/토큰 게이트

일부 상위 계획은 `npm.cmd run check:numeric-literals`를 공통 검증으로 언급하지만, 현재 기준 `main`의 `package.json`에는 해당 script가 없다.

앱 전환 UI/UX 개편에서 shell, sheet, tabbar, spacing 수치를 token/config로 고정하는 작업과 numeric literal gate 도입은 #386의 범위로 둔다. #381 기준선 PR은 존재하지 않는 명령을 완료 근거로 사용하지 않는다.

## 완료 기준

- baseline 수치와 테스트 결과가 PR과 child issue에 기록되어야 한다.
- UI/UX 동작 변경은 관련 `UIUX-###` ID 없이 완료 처리하지 않는다.
- 자동 테스트가 없으면 수동 QA 근거를 남긴다.
- 문서와 이슈 본문은 UTF-8 no BOM으로 readback한다.
