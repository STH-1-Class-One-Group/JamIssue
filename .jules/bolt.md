## 2024-05-24 - [Naver Maps Marker Reconciliation Optimization]
**Learning:** Naver Maps marker reconciliation often requires deriving multiple data structures (like Sets of IDs, Maps of entities, and signature strings) from a single array of visible places.
**Action:** Always combine multiple `.map()` operations into a single `for...of` loop to prevent unnecessary O(N) memory allocations and reduce GC pressure during rapid panning and zooming.
