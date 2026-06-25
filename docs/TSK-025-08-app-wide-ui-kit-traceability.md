# TSK-025-08 App-wide UI Kit Traceability

Parent: [#690 TSK-025-00](https://github.com/STH-1-Class-One-Group/JamIssue/issues/690)  
Child: [#698 TSK-025-08](https://github.com/STH-1-Class-One-Group/JamIssue/issues/698)  
Branch: `docs-traceability`  
Date: 2026-06-25

## Purpose

This document records the final TSK-025 UI kit contract and migration evidence. It is not a new redesign spec. It explains how the design handoff was interpreted, which implementation decisions were made, which child issues landed, and which gates now prevent the app from returning to screen-specific visual systems.

## Design Handoff Interpretation

The design handoff package was treated as a visual-system reference, not production code.

Implementation decisions:

- Prototype HTML, JSX, inline styles, and raw colors are not implementation authority.
- Live app behavior remains authoritative for routes, data, auth, map, KTO, feed, event, course, my page, drawer, and sheet interactions.
- Seasonal examples map to semantic CSS variables, not per-component hardcoded palettes.
- Drawer and sheet examples map to app-owned shell boundaries, not nested layout islands.
- UI modernization is a layout, composition, and token migration. It is not a user-facing copy rewrite.
- New icon package adoption remains out of scope.

## Handoff-To-Implementation Decision Map

The handoff package was not used as a loose visual mood board. Each source file was converted into an explicit implementation decision and boundary:

| Handoff source | Relevant direction | Implementation decision | Explicit non-goal |
| --- | --- | --- | --- |
| `README.md` | Live app is the production baseline; prototype code must not be copied directly; layout wrapping and overflow bugs are P0; seasonal theme, drawer/app shell, activity view, comment sheet, and tourism sheet are migration targets. | TSK-025 keeps live behavior as source of truth, builds reusable primitives first, then migrates My Page/settings, Feed, Event/Course, and Map sheets in separate child PRs. Overflow/wrapping rules are enforced through primitives and source-quality tests instead of per-screen patching. | No prototype HTML/JSX copy-paste, no one-shot all-screen redesign, no behavior rewrite just to match a prototype. |
| `drawer-spec.md` | AppCapsule, left SideDrawer, and right AppSettingsDrawer should share one shell and not open simultaneously; AppChrome owns drawer composition. | TSK-025 documentation records this as an app-chrome ownership rule. Drawer-specific implementation remains in TSK-021/TSK-024, while app-wide primitives must not reintroduce nested layout islands inside drawers. | TSK-025-08 does not move drawer state or change drawer runtime behavior. |
| `season-theme-spec.md` | Seasonal tone should be driven by semantic CSS variables, not component-level hardcoded colors. | UI kit primitives consume semantic tokens, and TSK-025-07 adds source-quality gates to block migrated feature files from owning raw visible styles or production theme switchers. | No production season switcher, no raw prototype palette copied into feature components. |
| `comment-tourism-spec.md` | FeedCommentSheet and TourismInfoSheet should share sheet rhythm; KTO remains informational and does not gain curated review/stamp behavior. | TSK-025-06 migrated map sheets and KTO sheet toward shared sheet/content primitives while preserving KTO informational-only behavior and existing API contracts. | No KTO API/provider change, no KTO stamp/review actions, no external-source-link behavior change. |
| Design screenshots/prototypes | Modern surface rhythm should reduce nested containers and screen-specific card/button styles. | `AppSurface`, `SectionHeader`, `ContentCard`, `ActionButton`, `FilterChip`, `ListItem`, `MetricTile`, `FormField`, `MediaFrame`, and `InlineMeta` define the shared rhythm. Feature screens pass domain data/actions into primitives. | No new visual system inside individual feature screens. |

Decision summary:

- The design package defined the target composition model, not source code.
- The app-wide answer is primitive ownership plus migration order, not repeated CSS fixes.
- Existing product behavior is preserved unless a child issue explicitly says otherwise.
- Documentation must distinguish implemented evidence from future/refactoring direction.

## UI Kit Contract

The app-wide UI kit lives under `src/components/ui-kit`.

| Primitive | Owner responsibility | Non-goal |
| --- | --- | --- |
| `AppSurface` | Page, panel, section, sheet, and subtle surface rhythm | Domain data, fetching, routing |
| `SectionHeader` | Eyebrow, title, description, and optional section actions | Card or list item ownership |
| `ContentCard` | Real content item, summary, form, or repeated item surface | Nested card composition |
| `ActionButton` | Shared button variants and sizes | Navigation policy |
| `FilterChip` | Shared selected/unselected filter chip rhythm | Domain filtering logic |
| `ListItem` | Shared media/title/meta/description/badge/action row composition | Data mapping |
| `MetricTile` | Numeric summary tile rhythm | Analytics calculation |
| `FormField` | Label, helper, error, and field layout | Form submission behavior |
| `MediaFrame` | Image/media frame rhythm | Image provider contract |
| `InlineMeta` | Compact metadata row rhythm | Date or author derivation |

Composition rules:

- Feature screens may import UI kit primitives.
- UI kit primitives must not import feature screens, API clients, auth stores, map SDK, KTO clients, or domain stores.
- `ContentCard` must not be nested inside another `ContentCard`.
- Feature components must not define a new visual token system.
- Feature CSS must not reintroduce raw seasonal colors, hardcoded pink, ad hoc visible shadows, ad hoc radii, or production developer switchers.

## Migration Order And Evidence

| Scope | Issue | PR | Merge SHA | Evidence |
| --- | --- | --- | --- | --- |
| Audit baseline | [#691](https://github.com/STH-1-Class-One-Group/JamIssue/issues/691) | [#699](https://github.com/STH-1-Class-One-Group/JamIssue/pull/699) | `033c938176656489f3c6c56f2b5493e8c05a2e6b` | `docs/TSK-025-01-visual-system-audit-baseline.md`, `reports/tsk-025-01/README.md` |
| UI kit foundation | [#692](https://github.com/STH-1-Class-One-Group/JamIssue/issues/692) | [#700](https://github.com/STH-1-Class-One-Group/JamIssue/pull/700) | `a3a9b80b10039498cf8315bc26cddc8df0b3ece6` | `src/components/ui-kit`, `src/styles/ui-kit.css`, `test/unit/app-ui-kit.test.tsx` |
| My Page and settings drawer migration | [#693](https://github.com/STH-1-Class-One-Group/JamIssue/issues/693) | [#701](https://github.com/STH-1-Class-One-Group/JamIssue/pull/701) | `5335e53967715db1f69e0f2e6cb6298f10bab57b` | My Page/settings drawer primitive consumption and regression tests |
| Feed rhythm migration | [#694](https://github.com/STH-1-Class-One-Group/JamIssue/issues/694) | [#702](https://github.com/STH-1-Class-One-Group/JamIssue/pull/702) | `2c6263a0533aee2cb341237b582e6c699c6b0c10` | Feed card/comment rhythm migration and behavior preservation tests |
| Event and Course migration | [#695](https://github.com/STH-1-Class-One-Group/JamIssue/issues/695) | [#703](https://github.com/STH-1-Class-One-Group/JamIssue/pull/703) | `50c19d402a3344e917347fb642a72f77a793bc5b` | Event/Course list, filter, empty-state migration tests |
| Map sheet and tourism migration | [#696](https://github.com/STH-1-Class-One-Group/JamIssue/issues/696) | [#704](https://github.com/STH-1-Class-One-Group/JamIssue/pull/704) | `2221422254875bc7ace0dc3c7a91c3c9b667b7ab` | Map sheet, place sheet, KTO informational sheet migration tests |
| Visual-system quality gate | [#697](https://github.com/STH-1-Class-One-Group/JamIssue/issues/697) | [#705](https://github.com/STH-1-Class-One-Group/JamIssue/pull/705) | `88a1fa8aaf6cd11d4b22f2bb4108fe77d2aa5579` | `test/unit/app-ui-kit-source-quality.test.ts` |
| Docs traceability | [#698](https://github.com/STH-1-Class-One-Group/JamIssue/issues/698) | pending | pending | This document, QA matrix, release candidate note, ledger readback |

## Behavior Preservation

TSK-025 did not change API, DB, OAuth, KTO, Naver, route, or provider contracts.

Preserved behavior:

- Bottom navigation keeps the five primary tabs.
- Map/KTO behavior stays governed by existing KTO contracts and marker caps.
- Feed like, comment, place navigation, and card actions remain in place.
- Event tab remains festival/CMS oriented and does not become a KTO event renderer.
- Course sorting, filtering, route opening, and route publishing behavior remain intact.
- My Page activity and account/settings boundaries remain separate from app settings ownership.
- Drawer and sheet interactions remain covered by existing app-shell and critical-flow E2E tests.

## Quality Gate Readback

TSK-025-07 added explicit protection for the completed migration slice:

- Approved `ContentCard` feature migration files are allowlisted.
- Migrated feature files are checked for raw visible style ownership.
- Nested `ContentCard` composition is blocked.
- Production developer-only visual switchers are blocked.
- UI kit dependency direction remains guarded.

## Known Residual Risk

Legacy docs and some historic ledger rows still contain mojibake from older work. TSK-025 did not rewrite those historical records because this child is a traceability closeout for the app-wide UI kit work, not a repository-wide documentation encoding cleanup.

No product behavior gap remains for TSK-025-01 through TSK-025-07.
