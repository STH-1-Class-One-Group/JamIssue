## 2024-05-07 - Conditional Props for List Memoization
**Learning:** For flat mapped lists like `ReviewList`, passing globally active IDs (like `highlightedReviewId`) to all items breaks `React.memo` for the inactive $N-1$ items when the active item changes, causing O(N) re-renders.
**Action:** Conditionally pass active IDs (e.g., `id === review.id ? id : null`) to the child component. This keeps props referentially stable for inactive items, reducing re-renders to O(1). Do not use this for nested recursive components.
