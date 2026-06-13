## 2024-06-13 - [React.memo in Mapped Lists]
**Learning:** React.memo is highly effective for list items mapped in a parent component, provided that the callback props are stabilized (e.g., using `useEventCallback` in upper-level hooks). Replacing `new Map(array.map(...))` with imperative loops for small arrays is considered an unreadable micro-optimization.
**Action:** Prioritize identifying unmemoized list item components before looking for low-level memory allocation micro-optimizations, as React reconciliation is often the primary bottleneck in UI performance.
