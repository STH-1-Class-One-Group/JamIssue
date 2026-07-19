## 2024-07-19 - Avoid O(N) intermediate arrays during viewport map panning
**Learning:** During highly frequent user interactions like viewport map panning, creating multiple intermediate arrays (`.map`, `.filter`, `...spread`) causes significant garbage collection pressure and blocks the main thread.
**Action:** Favor a single `for...of` loop or an imperative `for` loop to build structures or operation arrays (`push()`), and populate sets individually rather than creating chained array passes.
