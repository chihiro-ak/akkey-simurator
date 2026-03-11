# failure_patterns.md

## Purpose
Track recurring process or implementation mistakes so they can be prevented systematically.

## Entry template
- Pattern ID:
- First seen:
- Frequency:
- Symptom:
- Likely cause:
- Prevention target: AGENTS / Skill / Rubric / Template
- Mitigation:
- Status:

## Starter examples
- Pattern ID: FP-001
  First seen: 2026-03-11
  Frequency: 1
  Symptom: Empty state was not designed for a list page.
  Likely cause: Planning focused only on the happy path.
  Prevention target: `skills/orchestration/feature-planner/SKILL.md`
  Mitigation: Add a mandatory screen states checklist.
  Status: open

- Pattern ID: FP-002
  First seen: 2026-03-11
  Frequency: 1
  Symptom: Mobile view had overflow and clipped CTA.
  Likely cause: Review did not explicitly include responsive checks.
  Prevention target: `skills/quality/responsive-check/SKILL.md`
  Mitigation: Require 360px and 390px width checks before closure.
  Status: open
