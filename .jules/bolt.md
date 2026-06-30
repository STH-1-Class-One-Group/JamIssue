## 2024-06-30 - [Array Iteration Optimization in useNaverTourismMarkers]
**Learning:** Consolidating multiple `.map()` operations on the same array into a single loop reduces garbage collection pressure and intermediate allocations.
**Action:** Look out for chained or sequentially executed map iterations and collapse them into unified single-pass loops where possible. Ensure that explanatory comments are preserved.
