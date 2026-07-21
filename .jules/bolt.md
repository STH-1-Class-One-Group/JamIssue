## 2024-07-21 - [Avoid chained maps and spreads in tight React rendering/effects]
**Learning:** When building arrays, sets, maps, or string signatures for batch operations in tight update loops (like Naver Maps viewport marker materialization), chained `.map().filter()`, `.map().join()`, and spread operators (`[...arr.map(...)]`) create significant garbage collection pressure by allocating intermediate arrays.
**Action:** Replace these declarative method chains with explicit `for...of` loops, pushing items to arrays or setting them directly in Sets/Maps to achieve O(1) memory complexity.
