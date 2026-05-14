# TSK-009-01 Test coverage baseline

## 메타

- Scope-ID: `TSK-009-01`
- Parent Issue: `#323`
- Child Issue: `#324`
- Branch: `test-coverage-baseline`
- Status: baseline measured

## 변경 요약

- TypeScript coverage provider로 `@vitest/coverage-v8`를 추가했다.
- `npm.cmd run test:coverage:ts` 명령을 추가했다.
- `vitest.config.ts`에 TypeScript coverage baseline 대상을 명시했다.
- FastAPI local requirements에 `pytest-cov==7.0.0`을 추가했다.
- coverage artifact가 Git에 섞이지 않도록 `.gitignore`를 갱신했다.
- baseline 단계 기준 문서를 `docs/testing-coverage.md`에 추가했다.

## Baseline 결과

| 대상 | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| TypeScript | 33.01% | 28.16% | 30.63% | 34.20% |
| FastAPI Python | 74% | 해당 없음 | 해당 없음 | 74.44% raw |

## 실행 명령

```powershell
npm.cmd run test:coverage:ts
```

결과:

- 48 test files passed
- 175 tests passed
- coverage summary generated at `coverage/typescript/coverage-summary.json`

```powershell
cd backend
..\.tools\python313\python.exe -m pip install -r requirements.local.txt
..\.tools\python313\python.exe -m pytest --cov=app --cov-report=term --cov-report=json:coverage.json tests
```

결과:

- 95 tests passed
- pytest 9.0.3
- pytest-cov 7.0.0
- coverage JSON generated at `backend/coverage.json`

## 관찰된 잔여 이슈

- Python test run에서 ResourceWarning과 pytest cache write warning이 남아 있다.
- 이 baseline PR은 warning을 기능 실패로 처리하지 않는다.
- 95% hard gate는 `TSK-009-05`, `TSK-009-06`에서 테스트 보강 후 적용한다.

## 검증 결과

| 명령 | 결과 |
| --- | --- |
| `npm.cmd run check:numeric-literals` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run typecheck` | 통과 |
| `npm.cmd run test:unit` | 통과 |
| `npm.cmd run test:integration` | 통과 |
| `npm.cmd run test:regression` | 통과 |
| `npm.cmd run test:coverage:ts` | 통과 |
| `cd backend; ..\.tools\python313\python.exe -m pytest --cov=app --cov-report=term --cov-report=json:coverage.json tests` | 통과 |
| `npm.cmd run build` | 통과 |
| `git diff --check` | 통과 |
| `.\.tools\python313\python.exe .tmp\check_utf8_integrity.py --staged` | 통과 |

## 제외 범위

- Playwright 도입은 `TSK-009-03` 범위다.
- 핵심 UI flow E2E 작성은 `TSK-009-04` 범위다.
- TypeScript 95% hard gate는 `TSK-009-05` 범위다.
- Python 95% hard gate는 `TSK-009-06` 범위다.
