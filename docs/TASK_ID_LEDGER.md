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
| TSK-012-14 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/452 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/453 | a1fe6df9977c0e9d664a21ccbea2f4712ec10a82 | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | KTO 관광정보 전체 응답 395건을 Naver SDK 마커로 한 번에 생성하면 모바일 브라우저 렌더러가 멈출 수 있어, 지도 조작성과 화면 응답성을 지키기 위해 처리했다. | backend API는 정상 응답했지만 `useNaverTourismMarkers`가 raw KTO 후보 전체를 한 effect에서 순회하며 Marker 생성과 갱신을 수행했다. | `src/components/naver-map/tourismMarkerMaterialization.ts`를 추가해 bounds 기반 후보 선별, fallback cap, batch marker creation을 owner-local helper로 분리했다. | Graphify source graph는 현재 workspace에서 로컬 진단 산출물로만 사용하며, repo-local structure-impact manifest와 task-pack receipt로 맥락 보존 근거를 남겼다. | completed |
