# postmortem-to-skill-update

## Purpose
Turn repeated mistakes into durable process improvements.

## Inputs
- Review findings
- Harness findings
- `.orchestrator/failure_patterns.md`
- Relevant Skills and rubrics

## Outputs
- Failure pattern entry or update
- Proposed prevention target
- Draft wording for AGENTS, Skill, or rubric update

## Steps
1. Summarize what went wrong.
2. Decide whether the issue is one-off or recurring.
3. If recurring, record or update a failure pattern entry.
4. Choose the best prevention target:
   - AGENTS.md for always-on rules
   - Skill for task-specific guidance
   - Rubric for review-time enforcement
   - Template for repeated setup issues
5. Write a small concrete rule change instead of a vague reminder.

## Guardrails
- Prefer the smallest durable fix.
- Avoid adding long, noisy rules when a short precise rule is enough.
