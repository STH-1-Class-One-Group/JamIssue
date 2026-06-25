# JamIssue 1.3.8 Candidate

Status: candidate  
Scope: `TSK-025`  
Parent Issue: [#690](https://github.com/STH-1-Class-One-Group/JamIssue/issues/690)

## Summary

`1.3.8` is the app-wide UI kit and screen rhythm modernization candidate. It consolidates shared surface, card, button, chip, form, list, metric, media, sheet, and metadata rhythm behind reusable primitives while preserving existing app behavior.

## User-Visible Change

- My Page, settings drawer, feed, event, course, and map sheets use a more consistent app rhythm.
- Feed, event, course, map, and my page actions continue to behave as before.
- Seasonal theme token behavior remains unchanged.
- No new production developer switcher, icon library, API, auth, KTO, DB, or map provider contract was introduced.

## Included PRs

| PR | Scope | Merge SHA |
| --- | --- | --- |
| [#699](https://github.com/STH-1-Class-One-Group/JamIssue/pull/699) | TSK-025-01 visual-system audit baseline | `033c938176656489f3c6c56f2b5493e8c05a2e6b` |
| [#700](https://github.com/STH-1-Class-One-Group/JamIssue/pull/700) | TSK-025-02 app UI kit foundation | `a3a9b80b10039498cf8315bc26cddc8df0b3ece6` |
| [#701](https://github.com/STH-1-Class-One-Group/JamIssue/pull/701) | TSK-025-03 My Page and settings drawer migration | `5335e53967715db1f69e0f2e6cb6298f10bab57b` |
| [#702](https://github.com/STH-1-Class-One-Group/JamIssue/pull/702) | TSK-025-04 Feed rhythm migration | `2c6263a0533aee2cb341237b582e6c699c6b0c10` |
| [#703](https://github.com/STH-1-Class-One-Group/JamIssue/pull/703) | TSK-025-05 Event and Course rhythm migration | `50c19d402a3344e917347fb642a72f77a793bc5b` |
| [#704](https://github.com/STH-1-Class-One-Group/JamIssue/pull/704) | TSK-025-06 Map sheet and tourism sheet migration | `2221422254875bc7ace0dc3c7a91c3c9b667b7ab` |
| [#705](https://github.com/STH-1-Class-One-Group/JamIssue/pull/705) | TSK-025-07 Visual-system quality gate | `88a1fa8aaf6cd11d4b22f2bb4108fe77d2aa5579` |

## Validation Evidence

TSK-025 child PRs collectively ran the standard Web Front validation set:

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run build
git diff --check
```

TSK-025-07 additionally hardened the source-quality gate in `test/unit/app-ui-kit-source-quality.test.ts` to prevent migrated feature files from regressing to raw visual ownership.

## Out of Scope

- API path, response shape, DB schema, OAuth, KTO, or Naver map provider changes.
- User-facing copy rewrite.
- Production design/dev switcher.
- New icon package.
- One-shot app-wide redesign outside the child migration order.

## Related Documents

- [TSK-025-01 Visual System Audit Baseline](TSK-025-01-visual-system-audit-baseline.md)
- [TSK-025-08 App-wide UI Kit Traceability](TSK-025-08-app-wide-ui-kit-traceability.md)
- [UI/UX QA Matrix](ui-ux-qa-matrix.md)
- [Governance Index](GOVERNANCE_INDEX.md)
