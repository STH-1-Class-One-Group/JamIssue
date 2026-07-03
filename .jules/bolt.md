## 2024-07-03 - [Optimize Notification State Unread Count Calculation]
**Learning:** Found an O(N) array iteration used inside state actions during notification marking as read and deletion. This calculation was doing a full loop over the notifications array just to compute the unread count.
**Action:** Replaced the full array O(N) iteration loop with an O(1) incremental calculation by updating `unreadCount` based on its previous value and the properties of the updated item.
