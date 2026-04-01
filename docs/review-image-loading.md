# Review Image Loading Optimization

## What Changed

This change set reduces review image transfer cost in the feed without changing the review detail image contract.

1. Frontend upload preparation now creates two JPEG assets from the selected review image: a primary upload and a lightweight thumbnail.
2. The review image upload API now accepts an optional `thumbnail` multipart field and returns `thumbnailUrl` when a thumbnail variant is stored.
3. Backend storage writes the original and thumbnail as a linked pair using `-orig` and `-thumb` file naming so the API can derive `thumbnailUrl` without a schema migration.
4. Feed cards now render the thumbnail first and automatically fall back to the original image if the thumbnail cannot be loaded.
5. Review detail and edit flows still keep `imageUrl` as the original image path, so only the small-card surfaces switch to the lighter asset.

## Why The Tests Changed

The test changes are required because the image response contract is now larger and the feed rendering behavior changed.

- A new frontend unit test verifies that `ReviewImageFrame` prefers `thumbnailSrc` and falls back to the original image after a load failure.
- Backend storage tests now verify that upload-time thumbnail variants are persisted and exposed through the stored file metadata.
- Backend repository tests now verify that a review response derives `thumbnailUrl` correctly when the original image path uses the new `-orig` naming convention.

These assertions are necessary to prevent regressions where the feed silently goes back to loading the full-size image on every card.

## Validation Target

GitHub Actions `ci.yml` remains the validation baseline for this work:

- Frontend: `npm run typecheck`, `npm run build`, `npm run test:all`
- Backend: `python -m pytest tests`
