## 2024-06-14 - [Chained Array Methods Before Sets]
**Learning:** Initializing a `Set` by passing a chained `.filter().map()` expression generates multiple intermediate arrays before garbage collection. This causes measurable memory/GC spikes in frequently updated components, such as marker rendering in `useNaverTourismMarkers`.
**Action:** When extracting a subset of items or IDs into a `Set`, use a single `for...of` loop with a conditional block that performs `Set.add()` to avoid all intermediate allocations.
