from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_tsk_012_14_traceability_readback_is_complete() -> None:
    ledger_path = ROOT / "docs" / "traceability" / "task-ledger.jsonl"
    records = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    record = next(item for item in records if item["taskId"] == "TSK-012-14")

    assert record["status"] == "completed"
    assert record["issueUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/issues/452"
    assert record["prUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/pull/453"
    assert record["mergeCommit"] == "a1fe6df9977c0e9d664a21ccbea2f4712ec10a82"


def test_tsk_012_14_issue_tree_marks_child_complete() -> None:
    issue_tree = (ROOT / "docs" / "ISSUE_TREE.md").read_text(encoding="utf-8")

    assert "- [x] TSK-012-14" in issue_tree
    assert "https://github.com/STH-1-Class-One-Group/JamIssue/issues/452" in issue_tree
