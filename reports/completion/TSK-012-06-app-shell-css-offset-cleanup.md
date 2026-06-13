# TSK-012-06 App Shell CSS Offset Cleanup Completion

## Scope

- Scope-ID: `TSK-012-06`
- Issue: `#410`
- Parent Issue: `#404`
- Branch: `app-shell-css-offset-cleanup`
- Status: local validation complete, PR pending

## Responsibility Map

- `src/index.css`: app-shell map flow canonical rules and active layout ownership.
- `src/styles/refinements.css`: legacy visual refinements only; no longer owns map filter/surface/back-button layout overrides.
- `src/hooks/map/useTourismMapState.ts`: map-owner hook locality for KTO tourism UI state.
- `test/unit/second-uiux-audit-baseline.test.ts`: source guard for the removed legacy override selectors.

## Dependency Direction

- App shell owns header/subnav/body slots.
- Map stage owns map content flow inside the app-shell body.
- `refinements.css` may style residual visual details but must not override app-shell map flow with `!important`.
- Map domain hooks remain owner-local instead of increasing root `src/hooks` sprawl.

## Test Seam

- Source-quality unit test verifies that removed utility/back-button selectors do not return.
- E2E app-shell and critical UI flows verify map filters, drawer, bottom navigation, and KTO toggle positioning.

## Scope Map

- Included: CSS offset cleanup, legacy app back/utility selector removal, map-surface canonical flow, hook locality correction triggered by #409.
- Excluded: UI copy changes, API/DB/OAuth changes, new KTO provider behavior, broad visual redesign.

## Architecture Risk

- `src/styles/refinements.css` still contains unrelated historical `!important` refinements outside this child scope.
- This PR removes only the app-shell map/back-button/utility overlap covered by #410 and leaves unrelated visual debt for separate issues.

## Validation

- `npm.cmd run check:numeric-literals`: passed
- `npm.cmd run lint`: passed
- `npm.cmd run typecheck`: passed
- `npm.cmd run test:unit`: passed
- `npm.cmd run test:integration`: passed
- `npm.cmd run test:regression`: passed
- `npm.cmd run test:e2e`: passed
- `npm.cmd run build`: passed
- `git diff --check`: passed, CRLF warnings only

## Remote Evidence

- PR: pending
- Merge SHA: pending
- CI URL: pending
