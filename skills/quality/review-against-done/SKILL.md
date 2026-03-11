# review-against-done

## Purpose
Review work against explicit done criteria instead of reviewing only for style or local code quality.

## Inputs
- Feature spec
- Done criteria
- Changed files or diff
- Relevant rubrics under `evals/rubrics/`

## Outputs
- PASS / FAIL / PARTIAL per done criterion
- Findings grouped by severity
- Rework recommendation

## Review steps
1. Read the done criteria before looking at implementation details.
2. For each criterion, mark PASS, FAIL, or PARTIAL.
3. Check state coverage.
4. Check likely regression points.
5. Produce a concise list of blockers and non-blockers.

## Severity model
- Blocker: the feature should not close.
- Major: should be fixed in the same feature cycle.
- Minor: can be addressed before release or in a follow-up.
