# TSK-023-01 Visible Theme Hardcoding Audit

## Scope

This audit belongs to [#669](https://github.com/STH-1-Class-One-Group/JamIssue/issues/669) under [#668](https://github.com/STH-1-Class-One-Group/JamIssue/issues/668).

The problem is not a navigation or drawer behavior bug. The visible app surface still exposes hardcoded colors or browser-native affordances after the seasonal theme work:

- Scrollable app surfaces hide or bypass themed scrollbar tokens.
- Drawer handles and hover affordances still use raw gray/pink literals.
- App form controls need an explicit token-only surface contract.
- `refinements.css` still contains visible `!important` color overrides that can overpower seasonal theme tokens.

## Responsibility Map

| Area | Owner | Audit Result |
| --- | --- | --- |
| Theme tokens | `src/styles/semantic.css`, `src/styles/themes/*.css` | Own raw seasonal palette values and semantic aliases. |
| Visible app chrome CSS | `src/index.css`, `src/styles/refinements.css` | Must consume semantic tokens; current backlog remains. |
| Scrollbar contract | `place-drawer__content`, `app-settings-drawer__content`, `page-panel--scrollable`, `feed-comment-sheet__content`, `tab-overlay--scrollable`, drawer content | Needs one themed thin scrollbar policy. |
| Hidden scrollbar exceptions | horizontal chip/segment rows only | Intentional hiding must stay narrow and documented. |
| External map surface | Naver SDK/tile controls and marker semantic palette | Out of scope for app theme token enforcement. |

## Dependency Direction

CSS component selectors should depend on semantic tokens:

```text
themes/*.css -> semantic.css aliases -> component selectors
```

Component selectors must not depend directly on seasonal raw colors. `refinements.css` can override layout details, but visible colors must flow through semantic tokens.

## Test Seam

The audit is enforced through source-quality tests that read CSS as source text:

- visible scrollable surfaces are enumerated;
- intentionally hidden scrollbar selectors are allowlisted;
- app textareas must keep `resize: none`;
- visible hardcoding backlog remains classified for follow-up migration.

## Follow-Up Split

| Child | Boundary |
| --- | --- |
| `TSK-023-02` | Add the themed scrollbar selector/mixin policy and migrate visible scroll surfaces. |
| `TSK-023-03` | Migrate drawer handles, form controls, attachment fields, cards, borders, and placeholders to semantic tokens. |
| `TSK-023-04` | Tighten raw color source-quality gates after migration. |
| `TSK-023-05` | Record QA, Wiki, release, and completion evidence. |

## Architecture Risk

The main risk is allowing `refinements.css` to remain a stronger visual authority than the theme token layer. The fix must avoid adding another override layer and instead reduce raw visible literals or route them through semantic tokens.
