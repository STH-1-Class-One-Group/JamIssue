## 2025-05-12 - Prevent intermediate array allocations with spread operator
**Learning:** In frontend performance, building multiple lookup mechanisms using the spread operator (`[...a, ...b]`) inside frequent getters creates intermediate arrays, causing unnecessary memory allocation overhead.
**Action:** Replace `[...a, ...b]` with sequential loops like `for...of` when inserting items into a `Map` or searching for elements.
