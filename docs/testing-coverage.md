# 테스트 커버리지 운영 기준

## 목적

TSK-009는 UI/UX 기대 동작을 테스트와 QA 근거로 추적하고, 최종적으로 TypeScript와 FastAPI Python 모두 95% 커버리지 게이트를 적용하기 위한 작업이다.

## 현재 단계

현재 단계는 `TSK-009-01` baseline 측정이다. 이 단계에서는 커버리지 도구와 명령을 추가하지만, 95% hard gate는 아직 켜지 않는다.

## TypeScript baseline

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
- 타입 선언 파일

## FastAPI Python baseline

```powershell
cd backend
python -m pytest --cov=app --cov-report=term --cov-report=json:coverage.json tests
```

최종 hard gate는 `TSK-009-06`에서 아래 기준으로 켠다.

```powershell
cd backend
python -m pytest --cov=app --cov-fail-under=95 tests
```

## 완료 기준

- baseline 수치가 PR과 child issue에 기록되어야 한다.
- 95% 미만이어도 `TSK-009-01`에서는 실패 처리하지 않는다.
- 95% hard gate는 테스트 보강이 끝난 뒤 별도 child issue에서 적용한다.
