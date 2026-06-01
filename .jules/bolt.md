## 2026-06-01 - Avoid spread operator combined with .filter()
**Learning:** When prepending items to a React state array or performing upserts, using the spread operator combined with `.filter()` (e.g., `[nextItem, ...current.filter(...)]`) creates an unnecessary intermediate array, triggering memory allocation and GC pressure.
**Action:** Use a single-pass `for...of` loop to construct the new array directly, avoiding intermediate allocations.
