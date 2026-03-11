# frontend-implement

## Purpose
Implement or modify frontend code while minimizing regressions and visual drift.

## Inputs
- Feature spec
- Done criteria
- Relevant target files
- Existing components, tokens, and layout patterns

## Outputs
- Updated frontend code
- Brief change summary
- Validation notes

## Execution steps
1. Restate the intended UI behavior and target files.
2. Reuse existing components, tokens, and utility patterns whenever possible.
3. Implement the primary path first.
4. Add required states such as loading, empty, error, success, and disabled where applicable.
5. Check for responsive issues, clipping, and overflow.
6. Summarize changed files and validation performed.

## Guardrails
- Avoid introducing a new component pattern if an existing one can be adapted.
- Keep presentational and business logic concerns separated.
- Do not close the task without considering mobile width.
