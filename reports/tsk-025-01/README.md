# TSK-025-01 Visual Baseline Evidence

Issue: [#691](https://github.com/STH-1-Class-One-Group/JamIssue/issues/691)
Date: 2026-06-25
Target: `https://daejeon.jamissue.com/`

## Captured

Screenshots are stored in `reports/tsk-025-01/screenshots`.

Viewport coverage:

- `360x844`: map, event, feed, course, my
- `390x844`: map, event, feed, course, my, side drawer, settings drawer
- `430x932`: map, event, feed, course, my
- `1280x900`: desktop phone preview for map, event, feed, course, my
- place sheet full state at 360px, 390px, 430px, and desktop phone preview
- side drawer and settings drawer at 360px, 390px, 430px, and desktop phone preview
- KTO sheet at 390px

Capture result file:

- `reports/tsk-025-01/screenshots/capture-results.json`

## KTO Sheet Note

The first KTO locator click attempt failed because another Naver overlay subtree intercepted pointer events. A follow-up capture used a real mouse click at the visible marker bounding box and successfully opened the KTO sheet.

Both results are preserved in `capture-results.json` because they are useful baseline evidence for later map/KTO sheet migration.

## Interpretation

These screenshots are baseline evidence only. They are not acceptance screenshots for a completed redesign. Later TSK-025 implementation children must replace screen-specific visual rhythm with shared UI kit primitives and then refresh this matrix.
