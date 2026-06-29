## 2024-06-29 - [Combine Array Iterations for Derived State]
**Learning:** When deriving multiple state signatures or lookup structures (like Sets and Maps) from a single array inside a component or hook effect, chaining `.map()` calls creates unnecessary intermediate arrays and forces multiple full passes over the data.
**Action:** Combine these iterations into a single `for...of` loop to calculate all required derived state in one pass (O(N)), reducing memory allocation and improving execution time. Always include comments explaining the optimization.
