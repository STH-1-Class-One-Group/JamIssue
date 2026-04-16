# JamIssue Agent Instructions

These rules are top-level repository instructions for maintenance and refactoring work.

## Refactoring Scope

1. Refactoring must only change structure, responsibility boundaries, naming safety, dependency flow, or test coverage.
2. Do not change user-facing copy, wording, tone, punctuation, spacing style, or text nuances unless the user explicitly asks for it.
3. String edits are allowed only when they fix:
   - broken encoding
   - a functional bug
   - an objectively incorrect label or message required by the task
4. Do not make cosmetic text cleanups such as:
   - removing or adding periods
   - rephrasing sentences
   - renaming text for style consistency only
   - rewriting test fixture strings without task-specific need
5. When refactoring, preserve existing product behavior and existing copy by default.

## Working Style

1. Prefer small, isolated branches from the latest `main`.
2. Keep one coherent refactoring theme per branch.
3. Run validation after each substantial refactoring slice.
4. If a change is only aesthetic and not required for the task, do not include it.
