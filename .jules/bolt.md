## 2024-07-02 - Eliminate O(N) Memory Allocations in Naver Map Tourism Markers
**Learning:** Nested array method chains (`.map()`, `.filter()`, `...spread`) inside high-frequency map hook renders (like viewport panning) create multiple O(N) intermediate array allocations, causing heavy garbage collection pressure and frame drops.
**Action:** Replace declarative array method chains with explicit, mutable `for...of` loops when aggregating multiple collections (`Set`, `Map`, concatenated `String`) and building operation batches in dynamic map layers.
