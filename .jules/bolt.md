
## 2026-06-11 - [Avoid Inline Dynamic Type Imports]
**Learning:** Adding inline dynamic type imports (e.g., `import('../../types/auth').ProviderKey[]`) to avoid modifying imports at the top of the file creates ugly, unmaintainable code that violates readability guidelines, and will lead to PR rejection.
**Action:** When fixing typing errors, always use standard static `import type` statements at the top of the file.

## 2026-06-11 - [Avoid Over-Optimizing Small Arrays]
**Learning:** Refactoring simple array map and filter operations into verbose `for...of` loops on inherently small arrays (like social login providers) degrades readability without providing any measurable performance benefit.
**Action:** Do not optimize array iteration methods unless the array is known to be large or the operation happens frequently in a critical path.
