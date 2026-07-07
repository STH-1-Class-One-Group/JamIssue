## 2024-07-07 - Refactoring Naver Map Markers
**Learning:** Chaining `.map`, `.filter`, and spread operators to build batched closures or sets in React map layers triggers massive GC spikes during pan/zoom due to intermediate array allocations.
**Action:** Use single `for...of` loops and `.push()` / `.add()` for reconciliation structures (`nextIds`, `visibleSignature`, `placeById`, `operations`) to ensure O(1) allocation overhead per frame.
