## 2024-05-28 - Avoid Array.map for O(N) allocation on state update
**Learning:** Using `Array.map` to perform conditional updates (like marking all notifications as read) creates unconditional O(N) memory allocations and object creation. It breaks referential equality for unchanged items, leading to unnecessary React component re-renders.
**Action:** Use a single `for` loop with a `hasChanges` flag to shallow copy the array only once and modify only the affected elements, preserving referential equality for unmodified items and skipping O(N) allocations when no match is found.
