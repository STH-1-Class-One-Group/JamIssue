# TSK-012-05 KTO Tourism Map Layer and InfoSheet Completion

## Scope

- Scope-ID: `TSK-012-05`
- Issue: `#409`
- Parent Issue: `#404`
- Branch: `kto-tourism-map-layer-infosheet`
- Status: local validation complete, PR pending

## Responsibility Map

- `src/api/tourismClient.ts`: Web Front consumer contract for `/api/tourism/places`.
- `src/tourismTypes.ts`: Web Front-owned KTO tourism DTO contract.
- `src/hooks/useTourismMapState.ts`: Map-stage tourism overlay UI state.
- `src/components/naver-map/useNaverTourismMarkers.ts`: Naver SDK marker mutation for non-curated tourism info items.
- `src/components/TourismInfoSheet.tsx`: Read-only information sheet for `isCurated: false` tourism places.
- `test/e2e/tourism-map-layer.spec.ts`: UIUX-017 regression for default OFF fetch behavior.

## Dependency Direction

- App coordinator -> `tourismClient` -> Worker API path.
- Map stage props -> map stage view -> Naver map owner hooks.
- `naver-map` internals own SDK `any`/marker mutation boundaries.
- Tourism DTOs stay in Web Front consumer contract and are not pushed into Worker provider code.

## Test Seam

- Unit: tourism client path generation and audit baseline contract.
- Integration: existing `MapTabStage` route preview contract updated with disabled tourism defaults.
- E2E: tourism layer remains OFF on initial map load and fetches only after the map subnav toggle.

## Scope Map

- Included: Web Front KTO tourism consumer contract, map toggle, optional marker layer, read-only info sheet, e2e fixture support.
- Excluded: provider/backend schema changes, KTO import/sync implementation, OAuth/session behavior, user review/stamp flows.

## Architecture Risk

- KTO marker click is not browser-E2E clickable in the default test environment because Naver SDK is unavailable without `PUBLIC_NAVER_MAP_CLIENT_ID`.
- Risk is mitigated by keeping SDK mutation inside `src/components/naver-map` and testing default fetch behavior through Playwright route interception.

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
