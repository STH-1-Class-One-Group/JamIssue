## 2024-05-11 - Bypass State Unnecessary Re-renders
**Learning:** In React, unconditional state array mapping (e.g. `setReviews(current => current.map(...))`) creates a new array reference every time, causing components to re-render even if the array contents logically haven't changed (e.g. the patched ID wasn't in that specific array).
**Action:** When writing state updater functions that target specific IDs across multiple parallel collections, use `.some()` to check if the target exists first. If not, return the `current` unmodified reference to completely bypass the React update.
