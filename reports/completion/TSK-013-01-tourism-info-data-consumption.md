# TSK-013-01 KTO tourism info sheet data consumption and timeout guard

## Metadata

- Scope-ID: `TSK-013-01`
- Issue: `#421`
- Parent Issue: `#420`
- Branch: `tourism-info-data-consumption-fix`
- Status: ready for PR

## Summary

KTO tourism place data is now consumed by the information sheet beyond title/address. The sheet renders image, summary, description, category, district, address, source, and homepage link when those fields are present. The tourism places request also receives an abort signal so a stalled `/api/tourism/places` response cannot leave the UI in an endless loading state.

## Architecture Boundary Gate

- Responsibility map: `tourismClient` owns the Worker consumer request; `useAppCoordinatorEffects` owns UI request lifecycle and timeout; `TourismInfoSheet` owns presentation of already-normalized `TourismPlaceItem` data.
- Dependency direction: UI effect -> API client -> `fetchJson`; presentation component -> `TourismPlaceItem`; no browser code calls KTO/OpenAPI, Supabase, or admin import APIs directly.
- Test seam: unit tests assert rendered KTO fields at component boundary and `RequestInit.signal` forwarding at API client boundary.
- Scope map: frontend data consumption and timeout guard only. API path, response shape, DB schema, OAuth flow, and curated place review/stamp flow are unchanged.
- Architecture risk: adding UI fields can accidentally turn KTO information pins into curated place actions. The component continues to render information-only content without stamp/review/feed actions.

## Validation

- `npm.cmd run check:numeric-literals` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run test:unit -- tourism-info-sheet tourism-client` passed.
- `npm.cmd run test:unit` passed.
- `npm.cmd run test:integration` passed.
- `npm.cmd run test:regression` passed.
- `npm.cmd run test:e2e` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- UTF-8 strict read passed for all changed source/test files.

## Remote Evidence

- PR: TBD
- Main merge SHA: TBD
- CI: TBD
- CodeQL / code scanning: TBD
