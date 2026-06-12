# JamIssue 1.3.2 Release Notes

## Summary

`1.3.2` documents the KTO tourism contract consumption work merged by PR #391
into `typescript-coverage-95`.

This release note does not claim that the work is merged into `main`.

## Metadata

| Item | Value |
| --- | --- |
| Version | `1.3.2` |
| Date | 2026-06-12 |
| Status | Documentation release note for merged feature branch work |
| Base branch | `typescript-coverage-95` |
| Implementation commit | `cb7e858112d3eadb0556065401167270d1532709` |
| Merge commit | `514a6689f0d217548c3cf6af473af12ba11aae54` |
| Pull request | https://github.com/STH-1-Class-One-Group/JamIssue/pull/391 |
| Tracking issue | https://github.com/STH-1-Class-One-Group/JamIssue/issues/390 |

## Included Changes

- Added Worker `GET /api/tourism/places` public read contract.
- Added tourism read domain, repository, mapper, route registration, runtime limits, and stable empty response behavior.
- Added Front `TourismPlacesResponse`, `TourismPlaceItem`, `TourismFacets`, and `getTourismPlaces(params)`.
- Added `행사 / 관광장소` segment inside the existing `행사` tab without adding a new bottom tab.
- Preserved `/api/festivals` and `/api/banner/events` public shapes while applying source and stale-row read guards.
- Kept Front free of direct KTO/OpenAPI/Supabase calls.

## Public API

`GET /api/tourism/places` supports:

- `category`
- `district`
- `ktoContentTypeId`
- `ktoFacet`
- `limit`, default `50`, maximum `100`

Public response fields include `sourceReady`, `sourceName`, `importedAt`,
`facets`, and `items`. Public item mapping exposes only the documented allowlist
and does not expose raw payloads, normalized payloads, service keys, or
secret-bearing URLs.

## Validation

- `npm.cmd run test:unit`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run smoke`: passed, 9/9 public checks.
- `npm.cmd run smoke:worker-tourism`: passed against `https://api.daejeon.jamissue.com/api/tourism/places?limit=3`.
- PR #391 CodeQL checks passed.

## Scope Boundaries

Not included:

- Admin-owned KTO DB migrations.
- Front direct KTO/OpenAPI calls.
- Front direct Supabase calls.
- KTO sync/import buttons in Front.
- New bottom navigation tab.
- Full UI shell redesign.
- Claiming that PR #391 is merged into `main`.
