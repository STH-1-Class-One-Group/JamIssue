## 2026-07-18 - [Optimize Naver Marker Array Allocations]
**Learning:** When working on dynamic map layers and Naver map marker state reconciliation loops, nested array method chains (.map, .filter, ...spread) cause O(N) intermediate array allocations and GC pressure.
**Action:** Use for...of loops and explicit arrays/Sets directly to prevent O(N) intermediate array allocations during frequent interactions.
