# TSK-025-01 Visual System Audit Baseline

Issue: [#691](https://github.com/STH-1-Class-One-Group/JamIssue/issues/691)
Parent: [#690 TSK-025-00](https://github.com/STH-1-Class-One-Group/JamIssue/issues/690)
Branch: `visual-system-audit-baseline`
Date: 2026-06-25

## Purpose

This baseline records the design decisions behind TSK-025 before any app-wide visual refactor starts. The objective is not to patch another single drawer or screen. The objective is to stop feature screens from owning their own visual systems and migrate the app toward shared UI primitives.

TSK-025 is valid only if later implementation PRs preserve behavior while consolidating surface, section, card, list, form, button, chip, metric, media, and scrollbar rhythm into a reusable UI kit.

## Design Handoff Decision

Source folder reviewed:

`C:\Users\PC\OneDrive\바탕 화면\공모전\Jamissue\design_handoff_jamissue`

Files referenced:

- `README.md`
- `drawer-spec.md`
- `comment-tourism-spec.md`
- `season-theme-spec.md`

Implementation decisions:

- The handoff is a visual-system reference, not copy-paste implementation source.
- Live app behavior remains the source of truth for routes, data, API contracts, auth, KTO, and interactions.
- Prototype HTML/JSX inline styles must not be copied into production components.
- Seasonal theme examples must be translated to semantic CSS custom properties.
- Drawer/AppShell examples must be translated to app-owned shell boundaries, not nested layout islands.
- Any mojibake in handoff text is not a source for product copy. Existing product copy must be preserved unless the task fixes broken encoding or a functional label.

## Architecture Boundary Gate

Responsibility map:

- `src/components/ui-kit`: reusable visual primitives only. No domain data, API calls, route decisions, auth behavior, or KTO behavior.
- Feature screens: compose primitives and own domain behavior only.
- `src/components/app-shell`: app chrome ownership, overlay ownership, navigation ownership.
- `src/components/app-shell/drawer-kit.tsx`: current drawer-only primitive layer. TSK-025 should either absorb or adapt it into the app-wide kit.
- `src/styles/semantic.css` and `src/styles/themes/*`: token source of truth.
- `src/styles/refinements.css`: current largest legacy override hotspot. It must not continue growing as the visual-system implementation surface.

Dependency direction:

`AppShell/AppChrome -> feature screens -> ui-kit primitives -> semantic tokens`

Allowed:

- Feature components import UI kit primitives.
- Feature components pass content, actions, and state into primitives.
- UI kit primitives consume semantic tokens and expose small visual variants.

Not allowed:

- UI kit imports feature components.
- Feature components define new visual token systems.
- Feature CSS adds raw seasonal colors, ad hoc box shadows, ad hoc radii, or visible `!important` overrides.
- App shell overlays render inside capsule subtrees.

Test seam:

- Primitive behavior: unit tests.
- Feature migration: integration tests verifying behavior preservation.
- Visual-system gates: source-quality tests for raw colors, nested cards, and feature-owned visual surface classes.
- Mobile layout: E2E at 360, 390, and 430px.
- Desktop phone preview: E2E at desktop viewport with shell width constraint.

Scope map:

- In scope: shared UI primitive foundation, screen rhythm migration, source-quality gates, screenshot/code baseline, docs/traceability.
- Out of scope: API path changes, DB schema changes, OAuth changes, KTO provider changes, user-facing copy rewrite, new icon library, production dev theme switcher.

Architecture risk:

- The repo already has a large legacy override layer. Adding another UI kit without migration gates would make the problem worse.
- The drawer-only kit proves the need for primitives but is too narrow for app-wide screen rhythm.
- Some source files already contain broken encoded labels. Visual migration must not silently rewrite product copy outside touched functional labels.

## Current Hotspots

### CSS Override Hotspot

`src/styles/refinements.css` is the primary visual-system risk.

Observed from source scan:

- 824 matches for raw visual indicators or override patterns such as `rgba(`, `pink`, `box-shadow`, `border-radius`, and `!important`.
- Many early rules use `!important` for layout and sheet overrides.
- Several later rules define review, course, drawer, map route, and card visual rhythm directly in the legacy override file.

Representative evidence:

- `src/styles/refinements.css`: map sheet and bottom-nav z-index overrides with `!important`.
- `src/styles/refinements.css`: repeated `review-card`, `course-card`, `secondary-button`, and `place-drawer` rules.
- `src/styles/refinements.css`: raw rgba and raw hex visible styles around review card, drawer, route preview, and comment-log areas.

Decision:

TSK-025 implementation must not continue adding visual rules to `refinements.css` as the primary solution. Later PRs should move stable visual rhythm into UI kit classes and leave only short-lived compatibility selectors where needed.

### Component-Owned Visual Rhythm

Class scan shows multiple screens/components owning their own surface/card/list/button rhythm.

High class-density candidates:

- `src/components/TourismInfoSheet.tsx`
- `src/components/EventTab.tsx`
- `src/components/my-page/MyStampTabSection.tsx`
- `src/components/my-page/MyPageOverviewSection.tsx`
- `src/components/my-page/ProfileAccountSettings.tsx`
- `src/components/my-page/MyFeedReviewCard.tsx`
- `src/components/course/CommunityRouteCard.tsx`
- `src/components/FeedCommentSheet.tsx`
- `src/components/map-stage/MapBottomSheet.tsx`
- `src/components/app-shell/drawer-kit.tsx`

Decision:

These components are not all wrong, but they prove that the app currently has several local visual dialects. TSK-025 should migrate by screen area, not by global search-and-replace.

### Existing UI Kit Seeds

Existing reusable pieces:

- `src/components/app-shell/drawer-kit.tsx`
- `src/components/common/ToggleSwitch.tsx`
- seasonal tokens in `src/styles/semantic.css`
- theme files in `src/styles/themes/*`

Gap:

The drawer kit only covers drawer primitives. It does not cover normal page surfaces, list items, metric tiles, feed cards, event cards, course cards, map sheets, media frames, or form fields.

Decision:

TSK-025-02 must create an app-wide kit rather than extending drawer-specific classes into every screen.

## Screen Baseline

### App Shell and Chrome

Current state:

- `AppChrome` owns capsule plus left/right overlays.
- `AppCapsule` is closer to presentational shell than earlier implementations.
- Legacy header paths still exist and must not regain drawer/settings ownership.

Decision:

App-wide UI kit must not disturb shell ownership. New primitives should be content primitives, not new chrome owners.

### Drawer and Settings

Current state:

- `drawer-kit.tsx` provides `DrawerStack`, `DrawerSection`, `DrawerCard`, `DrawerActionRow`, `DrawerFormGroup`, `DrawerSegmentControl`, and `DrawerListItem`.
- `AppSettingsDrawer.tsx` already consumes drawer kit primitives, but source contains broken encoded labels.
- Drawer UI still has inconsistencies because some visual rules remain in feature CSS and legacy selectors.

Decision:

TSK-024 drawer work can be absorbed as a specialized subset, but TSK-025 should define broader primitives and prevent drawer-specific patterns from becoming the app-wide API.

### My Page

Current state:

- `MyPagePanel.tsx` composes header, overview, and tab content.
- Subcomponents own their own metric/card/tab/list rhythm.
- Activity list/calendar work exists separately and should be treated as domain behavior, not visual foundation.

Decision:

My Page is the first migration target because it has repeated metrics, account summary, activity tabs, cards, and list/calendar view composition. It is the best proving ground for `AppSurface`, `SectionHeader`, `MetricTile`, `FilterChip`, `ContentCard`, and `ListItem`.

### Feed

Current state:

- `FeedTab.tsx` uses `page-panel` and `ReviewList`.
- Feed cards are governed by `review-card` rules heavily customized in `refinements.css`.
- The source currently contains broken encoded empty-state strings.

Decision:

Feed migration must preserve like/comment/place navigation behavior but move card rhythm to app-wide `ListItem`, `ContentCard`, `MediaFrame`, and `ActionButton` composition. It must also avoid rewriting product copy while fixing touched mojibake where functionally required.

### Event

Current state:

- `EventTab.tsx` is a separate page rhythm with event-specific card/list styling.
- Event data and CMS behavior are out of scope for visual-system work.

Decision:

Event migration should be later than My Page and Feed. It should use `SectionHeader`, `ListItem`, `FilterChip`, and `EmptyState` primitives without changing CMS/event contracts.

### Course

Current state:

- Course cards use separate `course-card` and shared `review-card` action patterns.
- Route publishing/opening behavior must remain stable.

Decision:

Course should migrate with Event in TSK-025-05 because both are list-oriented screens with filters, summaries, empty states, and navigation actions.

### Map Sheets and Tourism

Current state:

- `MapBottomSheet`, `PlaceDetailSheet`, `TourismInfoSheet`, and `FeedCommentSheet` each have sheet/card/form/media rhythm.
- KTO tourism sheet is informational and must not inherit curated stamp/review actions.

Decision:

Map sheet migration should happen after normal page primitives exist. It must share sheet/content rhythm but preserve KTO provider contract, marker behavior, and curated/KTO feature differences.

## Raw Visual Exceptions

Allowed exceptions for TSK-025 source-quality gates:

- `src/styles/themes/*`: theme token source files.
- `src/styles/semantic.css`: semantic token source file.
- `src/components/naver-map/*`: external SDK marker HTML boundary, until a dedicated marker visual adapter is created.
- Test fixtures that intentionally assert raw color token values.

Not allowed after migration:

- raw seasonal colors in feature CSS.
- feature-owned box-shadow/radius definitions for app surfaces.
- new visible `!important` overrides in `refinements.css`.
- production UI switchers for developer-only theme checks.

## Migration Decisions

### TSK-025-02 App UI Kit Foundation

Create primitives:

- `AppSurface`
- `SectionHeader`
- `ContentCard`
- `ActionButton`
- `FilterChip`
- `ListItem`
- `EmptyState`
- `MetricTile`
- `FormField`
- `MediaFrame`
- `InlineMeta`

Rules:

- Sections own rhythm, not card visuals.
- Repeated data items may be cards.
- Card inside card is not allowed unless explicitly justified by a media/content shell boundary.
- Feature components should not define visible surface colors, shadows, radii, or raw seasonal colors.

### TSK-025-03 My Page and Settings Migration

Target:

- `MyPagePanel`
- `MyPageHeader`
- `MyPageOverviewSection`
- `MyPageTabContent`
- `AppSettingsDrawer`
- `ProfileAccountSettings`

Reason:

This area currently shows the strongest nested-surface and inconsistent section rhythm symptoms.

### TSK-025-04 Feed Migration

Target:

- `FeedTab`
- `ReviewList`
- feed review cards
- comment sheet form/card rhythm

Reason:

Feed is the highest-visibility content surface and should define the modern app rhythm with JamIssue tone preserved.

### TSK-025-05 Event and Course Migration

Target:

- `EventTab`
- `CourseTab`
- route/event cards
- filters and empty states

Reason:

These screens are list-heavy and should not keep separate homepage-like visual systems.

### TSK-025-06 Map Sheet and Tourism Migration

Target:

- `MapBottomSheet`
- `PlaceDetailSheet`
- `TourismInfoSheet`
- `FeedCommentSheet`

Reason:

Sheets require consistent shell/content behavior, but they have higher regression risk due map, marker, drawer, and KTO interactions. They should move after normal primitives are proven.

### TSK-025-07 Quality Gate

Target checks:

- raw color/hardcoded visual style gate.
- no nested content card gate.
- no production dev switcher gate.
- no new `refinements.css` visual override gate.
- no mojibake/replacement character in touched files.

## Current Non-Goals

- Do not rewrite user-facing copy for style.
- Do not add a new icon package.
- Do not change KTO, OAuth, DB, or Worker API contracts.
- Do not merge prototype code from the handoff.
- Do not attempt one massive all-screen redesign PR.

## Audit Acceptance State

This baseline is sufficient for TSK-025 implementation planning when:

- The parent and all child issues exist.
- The governance index includes TSK-025.
- This document records the design-handoff decisions, code hotspots, migration order, and quality gates.
- A PR or issue comment links this baseline before TSK-025-02 starts.

Visual evidence captured so far:

- `reports/tsk-025-01/README.md`
- `reports/tsk-025-01/screenshots/capture-results.json`
- stable tab screenshots for map, event, feed, course, and my page at 360px, 390px, 430px, and desktop phone preview.
- place sheet full-state screenshots at 360px, 390px, 430px, and desktop phone preview.
- side drawer and settings drawer screenshots at 360px, 390px, 430px, and desktop phone preview.
- KTO sheet screenshot at 390px.
- KTO sheet capture also recorded a pointer-interception failure from the Naver overlay layer before the successful mouse-coordinate click capture.

Remaining work for later children:

- Implement the foundation primitives.
- Migrate screens incrementally.
- Enforce source-quality gates after migrations reduce legacy exceptions.
