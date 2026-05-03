# Agent Plan Template

## Purpose

Use this template when creating any plan that another agent, model, or future
session must be able to implement without prior conversation context.

The plan is not complete until it explains:

- Why the work exists.
- What problem is being solved.
- What decisions have already been made.
- What must not change.
- How the work is split into parent issue, sub-issues, checklists, and evidence.
- What proves completion.

If a plan cannot answer those points, it is not ready for implementation.

## Template

Copy the sections below into the plan, issue, or handoff document.

```markdown
# <Work Title>

## 1. One-Sentence Summary

<State the work in one sentence. Include the system area and the intended
outcome.>

## 2. Why This Work Exists

<Explain the product, operational, security, maintainability, or architectural
reason this work is needed. Do not only describe the code change. Explain why
doing nothing is risky.>

## 3. Current Context

<Describe the current architecture, runtime path, branch, issue, release,
deployment model, and any recent incidents or constraints needed to understand
the task.>

Required context:

- Operating path:
- Primary backend/frontend/module:
- Current branch:
- Parent issue:
- Relevant sub-issues:
- Recent known failures:

## 4. Problem Statement

<List the concrete problems. Each problem must explain why it matters.>

| Problem | Why it matters |
| --- | --- |
| <problem> | <impact> |

## 5. Decisions Already Made

<Record fixed decisions so the implementer does not reopen settled choices.>

| Decision | Rule |
| --- | --- |
| Branch | `<branch>` |
| API contract | <unchanged / changed intentionally> |
| DB schema | <unchanged / migration required> |
| User-facing copy | <unchanged unless explicitly scoped> |
| Auth/OAuth path | <preserve known-working path> |
| GitHub workflow | <REST/GCM/CLI rules> |

## 6. Scope And Non-Goals

In scope:

- <allowed work>

Out of scope:

- <forbidden work>

Stop and ask before:

- <high-risk boundary>

## 7. Target Design

<Describe the intended architecture or responsibility split. Include a simple
flow diagram when useful.>

```text
<request/input>
-> <boundary>
-> <service/use case>
-> <adapter/repository>
-> <mapper/output>
```

## 8. Issue Structure

Parent issue:

- <#number title>

Sub-issues:

- [ ] <#number title and purpose>
- [ ] <#number title and purpose>

Rule:

- Do not implement work that does not map to a sub-issue.
- Do not close a checklist item without evidence.

## 9. Implementation Order

| Order | Issue | Intent | Completion evidence |
| --- | --- | --- | --- |
| 1 | <#issue> | <intent> | <evidence> |

## 10. Validation Plan

Required local checks:

- `<command>`

Required remote checks:

- <CI / CodeQL / security / deployment check>

Required manual checks:

- <production smoke / UI / OAuth / data check>

## 11. Completion Evidence

The work is complete only when these are recorded:

- [ ] PR link
- [ ] Commit SHA
- [ ] Test command outputs
- [ ] CI links
- [ ] Security/quality review result
- [ ] Main merge commit SHA
- [ ] Release note or documentation link if required

## 12. Handoff Checklist

Before implementation, the agent must confirm:

- [ ] I am on the correct branch.
- [ ] I have read the relevant repository instructions.
- [ ] I know the parent issue and sub-issue.
- [ ] I know what must not change.
- [ ] I know what evidence is required before completion.
- [ ] I will stop if the task crosses an out-of-scope boundary.
```

## Planning Rules

Use this checklist before handing work to another agent.

| Rule | Reason |
| --- | --- |
| State the reason before the solution | Prevents mechanical code changes that miss the actual risk. |
| Lock decisions explicitly | Prevents another model from reopening settled architecture choices. |
| Include non-goals | Prevents scope creep and accidental behavior changes. |
| Require issue hierarchy | Keeps work traceable across parent issue, sub-issue, PR, and release note. |
| Require evidence | Prevents "looks done" from replacing tested completion. |
| Include known failure modes | Prevents repeated mistakes such as UI GitHub login or Markdown escaping damage. |

## Minimum Plan Quality Gate

A plan is not implementation-ready if any answer is missing:

- What problem are we solving?
- Why is this problem worth solving now?
- What has already been decided?
- What must not change?
- Which parent issue and sub-issue owns the work?
- What commands and checks prove completion?
- What exact evidence must be attached before closing the issue?

If any item is missing, produce a handoff draft first instead of implementing.
