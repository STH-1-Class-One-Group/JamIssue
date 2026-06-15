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
| TSK-012-15 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/456 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/460 | 151d9f7f729bed25ed232a8a2d8aacd95e64967d | docs/traceability/task-ledger.jsonl; docs/TASK_ID_LEDGER.md; docs/ISSUE_TREE.md | KTO ON 이후 운영 API 전체 395건을 유지하면서도 모바일 지도 DOM/Naver marker materialization을 config cap 이하로 제한해 렌더 freeze와 hit target 혼잡을 줄이기 위해 처리했다. | TSK-012-14의 fallback cap은 `map.getBounds()`가 없는 상황을 막았지만, 운영 Naver 지도처럼 bounds가 있는 정상 환경에서는 `/api/tourism/places?scope=all` 395건 중 bounds 안 후보가 모두 materialize될 수 있었다. | `NaverMarkerConfig.materialization.tourismViewportMarkerLimit`를 추가하고, bounds 내부 KTO 후보도 지도 중심 거리순 cap을 적용한 뒤 selected KTO place는 cap 밖이어도 포함하도록 `tourismMarkerMaterialization` owner-local helper를 보강했다. | Graphify source graph는 현재 workspace에서 최신 source graph로 사용할 수 없어, issue #456에 `graphify-structure-stale-blocked` 상태와 변경 경로를 기록하고 후속 graph freshness 보강 대상으로 남긴다. | completed |
| TSK-012-18 | https://github.com/STH-1-Class-One-Group/JamIssue/issues/474 | https://github.com/STH-1-Class-One-Group/JamIssue/pull/477 | 4d57037a77afb184320ba06887eb971d33d85044 | GitHub issue #474, parent issue #404 comment, PR #477 body | 지도 플로팅 캡슐 클릭 시 freeze처럼 보이는 회귀와 Naver 기본 컨트롤 침범을 방지하기 위해 해결했다. | `전체` 필터 클릭은 API 호출 없이 즉시 열려야 하는데, 운영에서 renderer freeze 또는 screenshot timeout으로 관찰됐다. | E2E에서 dropdown 400ms 표시, screenshot 1초 성공, tourism API 호출 부재를 검증하고 PR #477로 회귀 테스트를 반영했다. | KTO 최초 전체 로딩 성능은 별도 initial load hardening 범위다. | completed |
