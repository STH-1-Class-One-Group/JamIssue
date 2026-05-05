## 2024-05-04 - React.memo Optimization in FeedTab
**Learning:** In heavily mapped list components like `ReviewList`, passing inline functions like `onOpenComments={(reviewId) => onOpenComments(reviewId)}` breaks `React.memo` for all child items because the function reference changes on every render.
**Action:** Always pass the function reference directly (e.g., `onOpenComments={onOpenComments}`) when the child component expects the exact same arguments, to preserve memoization and prevent unnecessary re-renders. Avoid using complex `useRef` + `useCallback` hacks to stabilize props unless absolutely necessary, as it bypasses standard React data flow.

## 2024-05-04 - React.memo Optimization with useEventCallback
**Learning:** To prevent unnecessary re-renders in `React.memo` components, all callback props must be referentially stable. However, adding local `useRef` stabilization within the list component itself is an anti-pattern that circumvents standard data flow.
**Action:** Always implement prop stability at the source (in the upper-level custom hooks) using a standard `useEventCallback` pattern. If you convert a regular helper function to a React hook by adding `useEventCallback`, be sure to also update its associated unit tests to use `renderHook` from `@testing-library/react`.
