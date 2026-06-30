## 2024-06-27 - [Map Refactor Iteration]
**Learning:** When replacing `.map().join()` with a manual string concat loop in a React hook to save an array allocation, reviewers may reject it for sacrificing readability over a negligible micro-optimization.
**Action:** Do not refactor declarative `.map().join()` string building unless the array size is provably massive and creates a confirmed bottleneck.
