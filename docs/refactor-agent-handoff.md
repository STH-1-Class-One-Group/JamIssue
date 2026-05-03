# Refactor Agent Handoff

## Purpose

This document is the handoff source for agents working on the Worker-first
backend refactor.

The goal is not to add product features. The goal is to make the operating
backend easier to trust, review, test, and extend while preserving current
product behavior.

Any agent that works on this refactor must read this document before changing
code, issues, labels, pull requests, or release notes.

This handoff follows `docs/agent-plan-template.md`. Future plans that need to be
safe across agents, models, or context resets should use that template before
implementation starts.

## Current Context

JamIssue currently runs as a Worker-first service.

The production path is:

```text
React web app
-> Cloudflare Pages
-> Cloudflare Worker API
-> Supabase REST / Storage
```

FastAPI is still part of the repository, but it is not the primary production
backend. Treat FastAPI as local validation, legacy origin, or fallback context
unless a task explicitly targets FastAPI.

The frontend is a SPA client that consumes Worker-shaped API responses. The
Worker is therefore acting as a BFF: it assembles responses that are convenient
for the web app and future app clients.

## Why We Are Refactoring

The project has already gone through several rounds of feature work, security
fixes, release documentation, Kakao login integration, UTF-8 validation, and
GitHub workflow repair. The remaining risk is no longer "can the service work";
the risk is whether the backend can be safely maintained by humans and agents
without breaking production behavior.

The main problems are:

| Problem | Why it matters |
| --- | --- |
| Worker is the operating backend but still contains mixed responsibilities | Routing, service orchestration, data loading, DTO mapping, and external API access can become hard to review when mixed together. |
| Some Worker services still depend too directly on Supabase REST details | Direct external-system calls inside service logic weaken dependency boundaries and make tests harder. |
| Some types are still too broad | `any` or loosely shaped rows make it harder to prove API response compatibility and permission safety. |
| Completion criteria were previously implicit | Work must not proceed as ad hoc refactoring without parent issue, sub-issue, checklist, and evidence. |
| GitHub automation had repeated failure modes | UI login prompts, label drift, and PowerShell Markdown escaping caused avoidable friction. |

This refactor exists to remove those risks without changing what users see.

## Decisions Already Made

These decisions are fixed unless the repository owner explicitly changes them.

| Decision | Rule |
| --- | --- |
| Work branch | All implementation happens on `refactor`. Do not work directly on `main`. |
| Issue structure | Parent issue -> sub-issue -> checklist -> completion evidence is mandatory. |
| Parent issue | #199 `Epic: Worker-first backend SOLID hardening` |
| Sub-issues | #200 through #206 |
| Label convention | Use prefix labels documented in `docs/github-label-convention.md`. |
| Refactor scope | Structure, responsibility boundaries, naming safety, dependency flow, and tests only. |
| Product behavior | Preserve existing behavior by default. |
| User-facing copy | Do not edit wording, punctuation, spacing style, tone, or nuance unless fixing broken encoding, a functional bug, or an objectively incorrect label. |
| API contract | Do not change external REST API paths, response shape, or status semantics. |
| Database | Do not change DB schema as part of this refactor. |
| OAuth | Keep the successful Kakao/Naver REST OAuth path unchanged. |
| GitHub access | Prefer GitHub REST with `gh auth token` or Git Credential Manager token. Do not trigger browser/UI login flows. |

## Issue Map

| Issue | Role | Purpose |
| --- | --- | --- |
| #199 | Parent | Track the overall Worker-first SOLID hardening epic. |
| #200 | Sub-issue | Establish baseline audit and refactor gate. |
| #201 | Sub-issue | Define Worker contracts and dependency boundaries. |
| #202 | Sub-issue | Split base data read-model responsibilities. |
| #203 | Sub-issue | Split review/comment/notification domain service responsibilities. |
| #204 | Sub-issue | Clarify my/community/admin service boundaries. |
| #205 | Sub-issue | Clean up routing runtime and composition root responsibilities. |
| #206 | Sub-issue | Document final architecture, release traceability, and evidence. |

Before implementing a task, identify the sub-issue it belongs to. If it does not
fit one of the sub-issues, stop and create or request a new sub-issue first.

## Label Convention

The active refactor issue labels must follow this shape:

```text
type:refactor
area:worker-backend
priority:high
topic:architecture
quality:solid
```

Do not create ad hoc labels.

If a new label is required, it must fit one approved axis from
`docs/github-label-convention.md`:

```text
type:*
area:*
priority:*
status:*
topic:*
quality:*
```

Do not delete and recreate labels already attached to issues. Rename labels so
existing assignments are preserved.

## Target Architecture

The Worker should move toward this internal shape:

```text
request
-> routing
-> use case / service
-> repository or external adapter
-> mapper / DTO assembler
-> response
```

The intended responsibilities are:

| Layer | Responsibility |
| --- | --- |
| Routing | Match request path and method, call the correct handler, no business logic. |
| Composition root | Build shared services and dependencies once, no request-specific logic. |
| Use case / service | Apply business rules, permission checks, and orchestration. |
| Repository / adapter | Own Supabase REST, Storage, OAuth provider, and external-system details. |
| Mapper / DTO assembler | Convert rows or provider payloads into API response DTOs. |
| Tests | Prove behavior is unchanged and security gates still hold. |

This is still a modular monolith/BFF, not MSA. Do not introduce service
boundaries, queues, or distributed architecture unless explicitly requested.

## SOLID Outcome

The refactor is considered successful only if it improves these principles in
practice, not just in naming:

| Principle | Target outcome |
| --- | --- |
| SRP | Routing, data access, business rules, and DTO mapping are not mixed in the same large function. |
| OCP | Adding a route, provider, or mapper should mostly add a module instead of editing unrelated logic. |
| LSP | Runtime contracts are narrow enough that interchangeable helpers can be tested safely. |
| ISP | Worker dependencies expose only the methods each handler needs. |
| DIP | Services depend on small internal contracts, not directly on Supabase REST implementation details. |

## Non-Negotiable Guardrails

Do not make these changes during the refactor:

- Do not change public API paths.
- Do not change response shape unless a sub-issue explicitly says so.
- Do not change user-facing Korean copy for style.
- Do not change DB schema.
- Do not replace the known-working Kakao/Naver REST OAuth flow.
- Do not introduce UI-based GitHub login or account selection flows.
- Do not close checkboxes without evidence.
- Do not merge to `main` before the parent issue evidence is complete.

If a task requires one of those changes, stop and ask for an explicit new issue
or scope change.

## GitHub And Markdown Safety

Use REST-based GitHub operations where possible.

Preferred token path:

```text
1. Try `gh auth token`.
2. If unavailable, read the GitHub token from Git Credential Manager.
3. Use GitHub REST API with `Authorization: Bearer <token>`.
```

PowerShell warning:

PowerShell treats the backtick as an escape character in double-quoted strings
and expandable here-strings. When writing GitHub issue bodies that contain
Markdown code spans such as `refactor` or `npm run typecheck`, use single-quoted
here-strings or another UTF-8 safe method.

Known failure mode:

```text
`refactor` can become \refactor if the backtick is consumed incorrectly.
```

After patching issue bodies, verify at least:

```text
no "\refactor"
no literal "\n"
expected Markdown code spans still contain backticks
```

## Implementation Order

Work in sub-issue order unless a blocking dependency is discovered.

| Order | Issue | Implementation intent |
| --- | --- | --- |
| 1 | #200 | Record baseline: `any`, Supabase direct calls, route/service/mapper hotspots. |
| 2 | #201 | Add or narrow Worker runtime contracts and dependency interfaces. |
| 3 | #202 | Split bootstrap/map-bootstrap data loading and mapping. |
| 4 | #203 | Split review/comment/notification domain responsibilities. |
| 5 | #204 | Split my/community/admin boundaries and permission checks. |
| 6 | #205 | Keep `index.ts` as composition root and `routing.ts` as dispatch layer. |
| 7 | #206 | Update docs, release notes, and final evidence links. |

Keep each commit coherent. If a change touches multiple sub-issues, split it or
record why the boundary could not be split.

## Completion Evidence

Each sub-issue must include evidence before it is checked off.

| Evidence | Required when |
| --- | --- |
| PR link | Always |
| Commit SHA | Always |
| `npm run lint` | Always for Worker/frontend TypeScript changes |
| `npm run typecheck` | Always for Worker/frontend TypeScript changes |
| `npm run test:unit` | Always for Worker changes |
| `python -m pytest tests` | Required when FastAPI code or shared backend behavior changes |
| UTF-8 integrity check | Always before PR is marked ready |
| tracked `.ts` one-line blob check | Always before PR is marked ready |
| CodeQL/Security/Quality review | Required before parent issue is closed |
| main merge commit SHA | Required before parent issue is closed |
| CI links | Required before parent issue is closed |

Do not mark a checklist item complete because the code "looks right". The
completion basis is command output, CI result, review finding resolution, or
explicit linked evidence.

## Acceptance Criteria

The parent refactor is complete only when all of the following are true:

- #200 through #206 are closed with evidence.
- `refactor -> main` PR is merged.
- Worker route, use case/service, repository/adapter, and mapper responsibilities are visibly separated.
- Supabase REST calls are isolated behind repository/adapter-style boundaries where practical.
- `any` usage is removed or intentionally contained at external boundaries.
- Kakao/Naver OAuth REST login still works.
- Existing external API paths and response shapes are preserved.
- User-facing copy is preserved except for explicitly approved fixes.
- Required validation commands and CI checks pass.
- Final release notes or documentation link back to #199 and the merged PR.

## Agent Handoff Checklist

Before starting work, an agent must confirm:

- [ ] I am on the `refactor` branch.
- [ ] I know which sub-issue I am working on.
- [ ] I have read `AGENTS.md`.
- [ ] I have read `docs/github-label-convention.md`.
- [ ] I have read this handoff document.
- [ ] I will not change public API shape, DB schema, OAuth success flow, or user-facing copy unless explicitly scoped.
- [ ] I will update the relevant issue or PR with evidence before marking work complete.

If any checkbox is false, do not implement yet.
