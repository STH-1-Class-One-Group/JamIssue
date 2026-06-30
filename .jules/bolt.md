## 2024-06-26 - [Avoid chaining array mapping for generating signatures and Lookups]
**Learning:** [Array mapping (e.g. `array.map(x).join('|')`, `new Map(array.map(x))`, `new Set(array.map(x))`) creates intermediate arrays which incurs unnecessary O(N) memory allocations and GC overhead. In large, frequently updating react components like Naver markers, this can build up over time causing poor performance and frame drops.]
**Action:** [Use a single `for...of` or `for` loop to accumulate multiple data structures such as signatures, Maps, and Sets together.]
