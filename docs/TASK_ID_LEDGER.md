# Task ID Ledger

Status: generated readback
Source: docs/traceability/task-ledger/by-task/*.json
Aggregate: docs/traceability/task-ledger.jsonl
Scope: durable issue, PR, merge, document, and gap traceability for `agent_bootstrap` task artifacts.

## Rules

- Markdown table은 generated readback이며 사람이 직접 row를 append하지 않습니다.
- Canonical finish write target은 task별 shard `docs/traceability/task-ledger/by-task/<task-id>.json`입니다.
- Aggregate JSONL은 coordinator/integration render가 생성하는 readback입니다.
- GitHub issue/checklist/PR/CI/merge/readback authority를 대체하지 않습니다.
- Completed row는 PR URL, 40-hex merge commit, 문서 경로, 왜 해결, 무슨 문제, 어떻게 해결, 남은 gap을 가져야 합니다.
- Legacy mojibake row는 `legacy-debt`로만 남기며 completion evidence가 아닙니다.

## Ledger

| Task ID | Issue | PR | Merge commit | Document path | Why | Problem | How | Remaining gap | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSK-012-14 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/452 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/453 | a1fe6df9977c0e9d664a21ccbea2f4712ec10a82 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | Prevent mobile renderer stalls from unbounded KTO marker creation. | The Worker API returned data, but the front end iterated raw KTO candidates in one effect and created map markers too aggressively. | Moved bounds selection, fallback cap, and batch marker creation into an owner-local helper. | Graphify source graph freshness remained a governance follow-up. | completed |
| TSK-012-15 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/456 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/460 | 151d9f7f729bed25ed232a8a2d8aacd95e64967d | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | Keep production KTO marker materialization under a mobile-safe cap. | Normal Naver map bounds could still allow too many KTO candidates to materialize. | Added NaverMarkerConfig materialization limits and center-distance cap selection. | Graphify freshness was recorded as separate governance evidence. | completed |
| TSK-012-18 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/474 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/477 | 4d57037a77afb184320ba06887eb971d33d85044 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | Prevent map floating capsule click freeze and Naver default control overlap. | The all filter should open without API calls, but production showed renderer freeze or screenshot timeout. | Added E2E coverage for dropdown opening, screenshot success, and no tourism API call. | Initial KTO full load performance stayed in a separate hardening scope. | completed |
| TSK-012-20 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/482 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/483 | 4f953b36427aa262528be493d78d1b1abe7b0165 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | Keep KTO map interactions responsive under the 300ms interaction target. | Large marker insertion could still cause screenshot timeout and renderer freeze. | Changed caps, batch size, requestAnimationFrame scheduling, and diff-based SDK mutation. | Payload slimming, edge cache, and server-side viewport query remain backend candidates. | completed |
| TSK-012-21 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/485 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/486 | a7e9a9b161dccd4106566d8a8bcd325d9bec19c6 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | Align Web Front with the KTO scope all KV snapshot compact read model. | The list response total was optional and snapshot not-ready states were not fixed as retryable disabled KTO layer states. | Made total required, kept KTO ON to one scope all call, kept filters local, and lazy-loaded detail by id. | Marker click detail sheet is not covered in E2E without a Naver client id, so lazy-load is covered through hook tests. | completed |
| TSK-015-07 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/497 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/505 | 1b4fefd2dcc78faecc7910549bf8d50c46f19671 | docs/ui-ux-qa-matrix.md; docs/release-candidate-1.3.5.md; reports/completion/TSK-015-07-sixth-uiux-qa-traceability.md; docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | 6차 UI/UX 바텀드로워, 하단 네비게이션, PWA 아이콘 개편 결과가 문서와 Wiki, QA matrix, release candidate, task ledger에서 같은 PR/CI/merge 근거로 추적되어야 후속 에이전트가 완료 범위와 검증 상태를 오판하지 않는다. | TSK-015 구현 PR들은 병합됐지만 6차 UI/UX QA matrix, 1.3.5 후보 문서, Wiki navigation, task ledger, issue tree, parent-child completion evidence가 같은 기준으로 연결되지 않아 완료 근거를 재검증하기 어려웠다. | repo QA matrix, 1.3.5 release candidate, completion report, Wiki release/QA pages를 갱신하고 PR #504/#505, merge SHA, CI URL, concrete test seam, parent-child issue evidence를 #497과 #490에 기록했다. | 추적성 범위의 남은 gap은 없다. 단, 1.3.5는 아직 후보 문서이며 정식 태그와 GitHub Release 발행은 별도 release publication 작업에서 처리한다. | completed |
