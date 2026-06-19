from __future__ import annotations

import json
from pathlib import Path


def find_repo_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / "docs" / "traceability" / "task-ledger.jsonl").exists():
            return candidate
    raise RuntimeError("Could not locate repository root from governance test path.")


ROOT = find_repo_root(Path(__file__).resolve())


def load_ledger_records() -> list[dict[str, object]]:
    ledger_path = ROOT / "docs" / "traceability" / "task-ledger.jsonl"
    return [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines() if line.strip()]


def test_tsk_012_14_traceability_readback_is_complete() -> None:
    record = next(item for item in load_ledger_records() if item["taskId"] == "TSK-012-14")

    assert record["status"] == "completed"
    assert record["issueUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/issues/452"
    assert record["prUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/pull/453"
    assert record["mergeCommit"] == "a1fe6df9977c0e9d664a21ccbea2f4712ec10a82"


def test_tsk_012_15_traceability_readback_is_complete() -> None:
    record = next(item for item in load_ledger_records() if item["taskId"] == "TSK-012-15")

    assert record["status"] == "completed"
    assert record["issueUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/issues/456"
    assert record["prUrl"] == "https://github.com/STH-1-Class-One-Group/JamIssue/pull/460"
    assert record["mergeCommit"] == "151d9f7f729bed25ed232a8a2d8aacd95e64967d"


def test_tsk_012_14_issue_tree_marks_child_complete() -> None:
    issue_tree = (ROOT / "docs" / "ISSUE_TREE.md").read_text(encoding="utf-8")

    assert "- [x] TSK-012-14" in issue_tree
    assert "https://github.com/STH-1-Class-One-Group/JamIssue/issues/452" in issue_tree


def test_tsk_012_15_issue_tree_marks_child_complete() -> None:
    issue_tree = (ROOT / "docs" / "ISSUE_TREE.md").read_text(encoding="utf-8")

    assert "- [x] TSK-012-15" in issue_tree
    assert "https://github.com/STH-1-Class-One-Group/JamIssue/issues/456" in issue_tree
