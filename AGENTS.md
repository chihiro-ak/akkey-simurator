# AGENTS.md

## Purpose
This repository is operated by a human Product Owner and AI agents.
The AI side manages feature sessions, subtask sessions, evaluation, and improvement feedback.
Codex is used as the execution layer for implementation and review tasks. The orchestrator is the control layer.

## Primary roles
- Human Product Owner: sets business priority, approves major decisions, reviews outcomes.
- Orchestrator: routes requests, manages sessions, creates feature/subtask/meta sessions, replans after review.
- Planner: clarifies scope, user value, done criteria, states, and risks.
- Frontend Agent: implements UI and client logic.
- Backend Agent: implements API, DB, and server-side behavior.
- QA Agent: validates against acceptance criteria and review rubric.
- Harness Agent: evaluates recurring failure patterns and proposes process updates.

## Session policy
- Create one Feature Session per user-facing feature or coherent business goal.
- Attach new work to an existing Feature Session when the goal and done criteria are unchanged.
- Create a Subtask Session only when responsibility clearly differs, such as UI, API, review, refactor, or investigation.
- Create a Meta Session when repeated failure, rework, or rubric misses are detected.
- Prefer short-lived Subtask Sessions and long-lived Feature Sessions.

## Routing rules
Create a new Feature Session when:
- the goal changes,
- the done criteria change,
- the primary user value changes,
- the affected surface area grows materially.

Attach to an existing Feature Session when:
- the same user outcome is being improved,
- the same screen or API group is involved,
- the existing done criteria still apply.

Create a new Subtask Session when:
- UI and API work can proceed independently,
- review should be isolated from implementation,
- a risky investigation is needed,
- a separate worktree would reduce change conflicts.

Create a Meta Session when:
- the same class of issue appears more than once,
- a preventable rework loop occurred,
- AGENTS, Skills, or rubrics should be updated.

## Execution policy
Before implementation:
- Read the relevant feature spec, done criteria, and target files.
- Restate the intended change, affected files, risks, and validation plan.
- Reuse existing components, tokens, patterns, and utilities whenever possible.

During implementation:
- Keep one responsibility per change set.
- Avoid introducing new UI patterns unless the existing system cannot support the need.
- Preserve naming consistency and existing architectural boundaries.
- Prefer small, reviewable commits or patches.

Before closure:
- Validate normal, loading, empty, error, success, and disabled states where applicable.
- Check mobile and desktop layouts for clipping, overflow, and awkward spacing.
- Review against done criteria, not only against the implementation plan.

## Quality policy
All review must explicitly consider:
- requirement fit,
- UI integrity,
- responsiveness,
- accessibility basics,
- maintainability,
- test coverage impact,
- regression risk.

## Improvement policy
- Do not only fix issues. Record recurring issues in `.orchestrator/failure_patterns.md`.
- When a recurring issue is detected, propose an update to one of:
  - `AGENTS.md`
  - `skills/**/SKILL.md`
  - `evals/rubrics/*`
  - reusable templates
- Prefer improving the system over repeating human reminders.

## File conventions
- `.orchestrator/sessions.json`: machine-readable session ledger.
- `.orchestrator/decisions.md`: high-level architectural and process decisions.
- `.orchestrator/failure_patterns.md`: recurring mistakes and mitigation rules.
- `docs/features/*.md`: feature-level scope and done criteria.
- `skills/**/SKILL.md`: reusable task instructions.
- `evals/rubrics/*.md`: review checklists and evaluation criteria.

## Default operating flow
1. Intake request.
2. Route to existing Feature Session or create a new one.
3. Plan scope, states, risks, and done criteria.
4. Create Subtask Sessions if needed.
5. Execute implementation.
6. Review with QA and Harness.
7. Replan, close, or open a Meta Session.
8. Feed improvements back into rules, skills, or rubrics.
