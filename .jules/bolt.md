## 2024-06-18 - Avoid Array.from + filter for map keys
**Learning:** Using `Array.from(map.keys()).filter(...)` creates an unnecessary intermediate array just to filter the keys, causing O(N) memory allocation and GC pressure.
**Action:** Replace it with a `for...of` loop iterating directly over `map.keys()` and pushing matching keys to a new array.
