# TSK-012-07 Second UI/UX Traceability Docs

## 메타데이터

| 항목 | 값 |
| --- | --- |
| Scope-ID | `TSK-012-07-SECOND-UIUX-TRACEABILITY-DOCS` |
| Parent Issue | [#404](https://github.com/STH-1-Class-One-Group/JamIssue/issues/404) |
| Child Issue | [#411](https://github.com/STH-1-Class-One-Group/JamIssue/issues/411) |
| Branch | `second-uiux-traceability-docs` |
| PR | TBD |
| Merge SHA | TBD |
| Status | PR 전 로컬 문서 정리 |

## 변경 요약

- repo 문서의 UI/UX QA 매트릭스, 기준선, 추적성 문서를 TSK-012 기준으로 복구했습니다.
- `1.3.3` 후보 릴리즈 노트를 추가했습니다.
- TSK-012 child issue #405~#410의 PR과 merge SHA를 문서 근거로 연결했습니다.
- Wiki 반영 대상 문서는 `Home`, `_Sidebar`, `UI-UX-QA-Matrix`, `UI-UX-Redesign-Traceability`, `Release-Notes-1.3.3`입니다.
- 현재 `origin/main`의 `src/hooks` 추적 파일 수가 88개인데 source-quality gate 기준선이 87개로 남아 있어, 제품 동작 변경 없이 기준선을 실제 코드 상태와 맞췄습니다.

## Architecture Boundary Gate

| 항목 | 근거 |
| --- | --- |
| Responsibility map | repo docs는 Web Front 구현 추적성, Wiki는 운영자가 보는 정본 링크, issue는 완료 증거를 소유합니다. |
| Dependency direction | 문서는 코드 계약을 바꾸지 않고, 구현 PR과 issue 증거를 참조만 합니다. |
| Test seam | docs readback, UTF-8 strict decode, markdown diff check, Wiki slug link 확인입니다. |
| Scope map | TSK-012 문서/추적성만 포함합니다. API/DB/OAuth/provider contract는 제외합니다. |
| Architecture risk | 문서가 구현보다 앞서가면 false traceability가 생기므로 PR/merge SHA가 있는 항목만 완료로 표기합니다. |

## 검증

PR 생성 전 실행 예정:

```powershell
git diff --check
npm.cmd run test:unit -- second-uiux-audit-baseline
```

최종 PR 전 UTF-8 strict read와 Wiki link readback을 추가로 확인합니다.
