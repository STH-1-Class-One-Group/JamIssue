## 2024-03-24 - [O(1) state aggregation]
**Learning:** In state stores (like Zustand), performing O(N) array aggregations (like counting unread items) inside state reducers can be optimized.
**Action:** When updating single items, incrementally adjust dependent counts (like `unreadCount`) in O(1) time based on the specific item's state change, rather than recounting the entire array.
