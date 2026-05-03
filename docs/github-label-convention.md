# GitHub Label Convention

## Decision

JamIssue uses a small, prefix-based label convention for issues and pull requests.
GitHub's default labels remain available, but new project-management labels must
belong to one of the approved axes below.

This convention exists to keep parent issues, sub-issues, PRs, and completion
evidence searchable without inventing labels per task.

## Basis

- GitHub labels are intended to categorize issues, pull requests, and
  discussions, and GitHub provides default labels such as `bug`,
  `documentation`, and `enhancement` as a standard workflow starting point.
- GitHub's label API treats labels as repository-level metadata that can be
  reused across issues and pull requests.
- Large development organizations commonly separate labels by purpose, such as
  type, priority, status, feature area, and specialization.

References:

- https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels
- https://docs.github.com/en/rest/issues/labels
- https://docs.gitlab.com/development/labels/

## Approved Axes

| Axis | Format | Purpose | Rule |
| --- | --- | --- | --- |
| Type | `type:*` | Work kind | Required, exactly one |
| Area | `area:*` | Code or product area | Required, one or more |
| Priority | `priority:*` | Scheduling urgency | Required, exactly one for planned work |
| Status | `status:*` | Workflow state | Optional, at most one active status |
| Topic | `topic:*` | Cross-cutting concern | Optional, one or more |
| Quality | `quality:*` | Quality principle or gate | Optional, one or more |

## Type Labels

Use `type:*` for the nature of the work.

| Label | Use when |
| --- | --- |
| `type:bug` | Fixing unintended behavior |
| `type:feature` | Adding user-visible capability |
| `type:refactor` | Changing structure without behavior change |
| `type:docs` | Changing documentation only |
| `type:test` | Adding or correcting tests |
| `type:chore` | Maintenance that is not product behavior |
| `type:security` | Security hardening or vulnerability response |

GitHub default labels may still exist, but new planned work should prefer the
`type:*` form so filtering remains consistent.

## Area Labels

Use `area:*` for ownership or implementation location.

| Label | Use when |
| --- | --- |
| `area:worker-backend` | Cloudflare Worker API, BFF, routing, auth, Supabase REST integration |
| `area:fastapi-backend` | FastAPI fallback/local backend |
| `area:frontend` | React UI, hooks, coordinator, client services |
| `area:ci` | GitHub Actions, test gates, deployment workflows |
| `area:docs` | README, docs, wiki, runbooks, release notes |
| `area:data` | Seed data, public event import, storage, data quality |

## Priority Labels

Use one priority label for planned work.

| Label | Meaning |
| --- | --- |
| `priority:critical` | Production-breaking or security-blocking |
| `priority:high` | Required for the current milestone or refactor gate |
| `priority:medium` | Important but not blocking current release |
| `priority:low` | Nice-to-have or backlog cleanup |

## Status Labels

Use status labels only when the issue state is not obvious from open/closed.

| Label | Meaning |
| --- | --- |
| `status:needs-triage` | Needs scope, owner, or completion criteria |
| `status:ready` | Ready to implement |
| `status:in-progress` | Actively being worked |
| `status:blocked` | Waiting on dependency or decision |
| `status:needs-verification` | Implemented, but evidence is not complete |

## Topic And Quality Labels

Use topic and quality labels for cross-cutting concerns, not for ownership.

| Label | Use when |
| --- | --- |
| `topic:architecture` | Responsibility boundaries, dependency flow, module shape |
| `topic:oauth` | Kakao/Naver login and session flow |
| `topic:deployment` | Cloudflare/GitHub Actions deployment behavior |
| `topic:security` | Auth, permission, token, or secret handling |
| `quality:solid` | SOLID principle hardening |
| `quality:codeql` | CodeQL/security-quality findings |
| `quality:utf8` | Encoding integrity gate |

## Parent Issue And Sub-Issue Rule

For planned refactoring, create labels before implementation.

Parent issue:

- Must include `type:refactor`, at least one `area:*`, one `priority:*`, and
  any relevant `topic:*` or `quality:*`.
- Must list sub-issues as checkboxes.
- Must define completion evidence before work starts.

Sub-issue:

- Must link back to the parent issue.
- Must keep the same core labels as the parent unless its area differs.
- Must include a checklist and explicit completion evidence.

PR:

- Must reference the sub-issue it closes.
- Must include test evidence and CI/security-quality evidence.
- Must not introduce new labels unless the label fits an approved axis.

## Current Refactor Label Cleanup

The labels created for the Worker-first SOLID refactor partially match this
convention.

Keep:

- `type:refactor`
- `area:worker-backend`
- `priority:high`

Rename before continuing the refactor issue set:

- `architecture` -> `topic:architecture`
- `solid` -> `quality:solid`

Do not delete and recreate those labels if issues already use them. Rename them
through GitHub so existing issue assignments are preserved.
