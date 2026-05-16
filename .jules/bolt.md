## 2024-05-15 - [Avoid Object.fromEntries(array.map(...)) for large collections]
**Learning:** Using `Object.fromEntries(array.map(...))` creates two intermediate arrays: one for the mapped tuples and one for the arguments, leading to O(N) unnecessary memory allocations. In a large collection, this has measurable performance impact.
**Action:** Use a `for...of` loop over the collection to directly populate an empty dictionary object.
