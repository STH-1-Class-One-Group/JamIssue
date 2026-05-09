# Worker Backend SOLID Baseline

Scope: GitHub issue #200, `worker-baseline-refactor-gate`

This document records the Worker-first backend baseline before the SOLID hardening sequence. It is a measurement and guardrail document only. It does not approve API, response shape, database schema, OAuth flow, or user-facing copy changes.

## Guardrails

- Implementation branches are per sub-issue: #200 through #206 each use their own purpose-first branch.
- Worker source quality checks inspect tracked `deploy/api-worker-shell/**/*.ts` files only.
- Generated Wrangler files under `.wrangler/` are excluded from source quality gates and must not be staged.
- Kakao/Naver REST OAuth success paths, public REST paths, response shapes, DB schema, and user-facing copy are frozen for this refactor series.

## Baseline Summary

| Metric | Current baseline | Notes |
| --- | ---: | --- |
| Tracked Worker TypeScript files | 21 | From `git ls-files deploy/api-worker-shell/*.ts deploy/api-worker-shell/**/*.ts` |
| `any` matches | 126 | Target for #201 and later type boundary work |
| `supabaseRequest(` call sites | 104 | Target for repository/adapter boundary work |
| Direct `fetch(` call sites | 10 | Includes Worker entrypoint, Supabase adapter, OAuth providers, proxy, realtime, and storage upload |
| Worker files over 100 lines | 7 | Main reviewability hotspots |

## Largest Worker Files

| File | Lines | Follow-up issue |
| --- | ---: | --- |
| `deploy/api-worker-shell/runtime/base-data.ts` | 331 | #202 |
| `deploy/api-worker-shell/services/auth/session.ts` | 239 | #205 |
| `deploy/api-worker-shell/runtime/routing.ts` | 230 | #205 |
| `deploy/api-worker-shell/services/auth.ts` | 220 | #201/#205 |
| `deploy/api-worker-shell/services/festivals.ts` | 192 | #204/#206 |
| `deploy/api-worker-shell/services/review-interactions.ts` | 133 | #203 |
| `deploy/api-worker-shell/services/auth/social-user.ts` | 132 | #201 |

## `any` Baseline By File

| File | Matches | Follow-up issue |
| --- | ---: | --- |
| `deploy/api-worker-shell/runtime/base-data.ts` | 34 | #202 |
| `deploy/api-worker-shell/services/reviews.ts` | 29 | #203 |
| `deploy/api-worker-shell/runtime/routing.ts` | 19 | #201/#205 |
| `deploy/api-worker-shell/services/community-routes.ts` | 17 | #204 |
| `deploy/api-worker-shell/services/my.ts` | 11 | #204 |
| `deploy/api-worker-shell/services/admin.ts` | 7 | #204 |
| `deploy/api-worker-shell/services/festivals.ts` | 3 | #204/#206 |
| `deploy/api-worker-shell/lib/supabase.ts` | 2 | #201 |
| `deploy/api-worker-shell/services/auth.ts` | 2 | #201 |
| `deploy/api-worker-shell/services/auth/social-user.ts` | 2 | #201 |

## Supabase Boundary Baseline

| File | `supabaseRequest(` matches | Follow-up issue |
| --- | ---: | --- |
| `deploy/api-worker-shell/services/reviews.ts` | 22 | #203 |
| `deploy/api-worker-shell/services/community-routes.ts` | 15 | #204 |
| `deploy/api-worker-shell/runtime/base-data.ts` | 14 | #202 |
| `deploy/api-worker-shell/services/review-interactions.ts` | 13 | #203 |
| `deploy/api-worker-shell/services/notifications.ts` | 10 | #203 |
| `deploy/api-worker-shell/services/stamps.ts` | 9 | #203/#204 |
| `deploy/api-worker-shell/services/festivals.ts` | 8 | #204/#206 |
| `deploy/api-worker-shell/services/admin.ts` | 5 | #204 |
| `deploy/api-worker-shell/services/auth/social-user.ts` | 4 | #201 |
| `deploy/api-worker-shell/services/my.ts` | 3 | #204 |
| `deploy/api-worker-shell/services/auth.ts` | 1 | #201 |

## Direct Fetch Baseline

| File | `fetch(` matches | Intended boundary |
| --- | ---: | --- |
| `deploy/api-worker-shell/services/auth/kakao-provider.ts` | 2 | OAuth provider adapter |
| `deploy/api-worker-shell/services/auth/naver-provider.ts` | 2 | OAuth provider adapter |
| `deploy/api-worker-shell/index.ts` | 1 | Worker entrypoint |
| `deploy/api-worker-shell/lib/supabase.ts` | 1 | Supabase REST adapter |
| `deploy/api-worker-shell/runtime/routing.ts` | 1 | origin fallback proxy |
| `deploy/api-worker-shell/services/admin.ts` | 1 | Supabase count helper, to be adapterized in #204 |
| `deploy/api-worker-shell/services/notifications.ts` | 1 | Supabase realtime adapter candidate |
| `deploy/api-worker-shell/services/review-interactions.ts` | 1 | Supabase storage upload adapter candidate |

## Reusable PR Checklist

- [ ] Branch was created from latest `main`.
- [ ] PR body includes `Closes #<sub-issue>`.
- [ ] Public REST API paths and response shapes are unchanged.
- [ ] User-facing copy is unchanged unless explicitly required by the issue.
- [ ] Kakao/Naver REST OAuth success paths are unchanged.
- [ ] DB schema is unchanged.
- [ ] `npm run lint` passed.
- [ ] `npm run typecheck` passed.
- [ ] `npm run test:unit` passed.
- [ ] UTF-8 integrity check passed.
- [ ] Worker tracked-source quality gate passed.
- [ ] PR link, main merge SHA, and CI links are recorded on the child issue.
