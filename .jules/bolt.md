## 2024-06-23 - [Eliminate intermediate tuple array and GC pressure]
**Learning:** Initializing Maps using `new Map(visiblePlaces.map(...))` or `new Set(visiblePlaces.map(...))` creates intermediate array allocations that can increase GC pressure, especially in busy render cycles.
**Action:** Replace `new Map(array.map(...))` and `new Set(array.map(...))` with imperative `for...of` loops, and document the optimization with comments. Also, when concatenating strings from arrays, avoid `.map().join()` in favor of incremental building inside a `for` loop to avoid intermediate array allocation.
