## 2024-05-18 - Prevent O(N) array allocation in count operations
**Learning:** Using `array.filter(condition).length` to count elements creates a full intermediate array in memory, causing O(N) memory allocation and subsequent garbage collection. For large arrays like notifications or stamp logs, this puts unnecessary pressure on the GC, particularly if calculated during state updates or renders.
**Action:** Replace `array.filter(condition).length` with a standard `for` loop and a counter variable (`let count = 0; ... count++;`). This achieves the same count with O(1) memory complexity.
