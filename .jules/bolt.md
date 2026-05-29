
## 2024-05-29 - Reduce overhead in recursive loops
**Learning:** `Array.prototype.reduce()` has significant CPU and memory overhead compared to a basic `for...of` loop, particularly when used in recursive functions dealing with arrays, because it creates a new closure allocation on every function call.
**Action:** When counting or aggregating values recursively, replace `.reduce()` with a `for...of` loop and a mutable accumulator variable to reduce GC pressure and unnecessary memory allocations.
