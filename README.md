# Web App AI Orchestrator Template

This template is for web app development where AI manages session routing, task decomposition, review, and continuous improvement.
It is designed for a setup where an external orchestrator controls sessions and Codex acts as the execution layer.

## Included files
- `AGENTS.md`: always-on team rules and routing policy
- `.orchestrator/sessions.json`: session ledger template
- `.orchestrator/decisions.md`: long-lived architecture and process decisions
- `.orchestrator/failure_patterns.md`: recurring issue catalog
- `docs/`: product, architecture, and feature specs
- `skills/`: reusable instructions for orchestration, implementation, review, and improvement
- `evals/rubrics/`: evaluation checklists

## Recommended operating model
1. The user gives a feature request.
2. The Orchestrator reads `AGENTS.md` and `.orchestrator/sessions.json`.
3. The Orchestrator decides whether to:
   - attach to an existing feature,
   - create a new feature,
   - create subtasks,
   - or open a meta session.
4. The Planner updates the relevant feature spec.
5. Builder agents implement UI or API work.
6. QA and Harness evaluate the result using the rubrics.
7. If repeated issues are found, update `failure_patterns.md` and then improve `AGENTS.md`, a Skill, or a rubric.

## How to start using this template
### 1. Customize the project basics
Edit these first:
- `docs/00_product.md`
- `docs/01_architecture.md`
- `AGENTS.md`
- `.orchestrator/sessions.json` project metadata

### 2. Create a feature spec for your first real feature
Copy `docs/features/FEAT-001-user-signup.md` and create a new file such as:
- `docs/features/FEAT-002-dashboard.md`

Update `.orchestrator/sessions.json` with the new feature entry.

### 3. Route each new request through `session-router`
For every incoming task, the Orchestrator should answer:
- Is this part of an existing feature?
- Does it need a new feature session?
- Does it need subtasks such as UI, API, REVIEW, or META?

### 4. Plan before building
Run `feature-planner` to make sure the feature spec includes:
- goal
- user value
- done criteria
- required states
- target files
- risks

### 5. Build with focused sessions
Use one Subtask Session per clearly separate responsibility, for example:
- `S-FEAT-002-UI`
- `S-FEAT-002-API`
- `S-FEAT-002-REVIEW`

### 6. Review against explicit rubrics
Use:
- `skills/quality/review-against-done/SKILL.md`
- `skills/quality/responsive-check/SKILL.md`
- `evals/rubrics/*.md`

Do not close a feature based only on a quick code scan.

### 7. Feed repeated issues back into the system
When an issue repeats, do not just fix the code.
Update:
- `.orchestrator/failure_patterns.md`
- a relevant `SKILL.md`
- or a rubric

## Suggested status values
Use these in `sessions.json`:
- `queued`
- `active`
- `blocked`
- `done`

For features, use:
- `planned`
- `in_progress`
- `done`

## Suggested session naming
- Feature Session: `S-FEAT-002`
- Planner Subtask: `S-FEAT-002-PLAN`
- UI Subtask: `S-FEAT-002-UI`
- API Subtask: `S-FEAT-002-API`
- Review Subtask: `S-FEAT-002-REVIEW`
- Meta Session: `S-FEAT-002-META-01`

## Practical example
User request:
> Add draft save to the product creation form.

Recommended flow:
1. Orchestrator checks whether product creation already exists in `sessions.json`.
2. If yes, attach to that feature.
3. Create or update the feature spec with draft-save behavior and states.
4. Create `UI`, `API`, and `REVIEW` subtasks if responsibilities differ.
5. Implement.
6. Review against done criteria and responsive rubric.
7. If the same empty-state or responsive issue appears again, open a Meta Session and update the relevant Skill.

## How to use with Codex or another coding agent
- Keep `AGENTS.md` short and always relevant.
- Keep feature specs small and current.
- Pass only the relevant feature spec, target files, and rubric to a subtask session.
- Do not rely on one huge chat history. Use the session ledger as the source of truth.

## Suggested next additions
After trying the template once, consider adding:
- `backend-implement` Skill
- `refactor-safe` Skill
- `a11y-check` Skill
- automated screenshot-based UI regression checks
- a small script to update `sessions.json`
