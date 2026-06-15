# Task ID Ledger

Status: generated readback
Source: docs/traceability/task-ledger.jsonl
Scope: durable issue, PR, merge, document, and gap traceability for `agent_bootstrap` task artifacts.

## Rules

- Markdown table은 generated readback이며 사람이 직접 row를 append하지 않습니다.
- Canonical readback source는 `docs/traceability/task-ledger.jsonl`입니다.
- GitHub issue/checklist/PR/CI/merge/readback authority를 대체하지 않습니다.
- Completed row는 PR URL, 40-hex merge commit, 문서 경로, 왜 해결, 무슨 문제, 어떻게 해결, 남은 gap을 가져야 합니다.
- Legacy mojibake row는 `legacy-debt`로만 남기며 completion evidence가 아닙니다.

## Ledger

| Task ID | Issue | PR | Merge commit | Document path | Why | Problem | How | Remaining gap | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSK-012-14 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/452 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/453 | a1fe6df9977c0e9d664a21ccbea2f4712ec10a82 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | KTO 관광정보 전체 응답을 지도 마커로 한 번에 생성하면 렌더러가 멈출 수 있는 위험을 완료 근거까지 추적하기 위해 기록한다. | 제품 수정은 main에 반영됐지만 repo-local traceability ledger와 issue tree가 없어 governance finish readback이 막혔다. | PR, merge SHA, 검증 명령, 운영 readback을 구조화된 JSONL 저장소와 Markdown readback에 기록했다. | Graphify source graph 엔진은 이 workspace에서 사용할 수 없어 structure-impact manifest와 issue evidence로 대체했다. | completed |
