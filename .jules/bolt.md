## 2024-03-24 - Eliminate Array Spread and Intermediate Allocations in Map Marker Loops
**Learning:** In Naver Maps integrations, building derived states (Sets, string signatures, batch operations arrays) from large collections via `.map()`, `.filter()`, and spread operators (`[...arr]`) creates significant GC pressure on every viewport pan.
**Action:** Replace functional array pipelines with direct `for...of` loops, string building, and `.push()` to build structures inline, eliminating multiple O(N) array allocations.
