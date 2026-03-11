# session-router

## Purpose
Route a new request into the correct session structure.
Decide whether to attach work to an existing Feature Session, create a new Feature Session, create new Subtask Sessions, or open a Meta Session.

## Inputs
- The latest user request
- `.orchestrator/sessions.json`
- Relevant feature specs if a matching feature exists

## Outputs
- Routing decision
- Updated or proposed session records
- Short rationale

## Decision rules
1. Attach to an existing Feature Session when the goal and done criteria are substantially unchanged.
2. Create a new Feature Session when the user outcome, done criteria, or primary surface area changes.
3. Create a Subtask Session when responsibility differs clearly, such as UI, API, review, refactor, or investigation.
4. Open a Meta Session when repeated failure, rework, or rubric misses are detected.

## Required checks
- Compare against existing feature goal, done criteria, and target files.
- Avoid creating duplicate Feature Sessions.
- Prefer fewer sessions when separation does not improve clarity or safety.

## Output format
- `decision:`
- `feature_id:`
- `new_sessions:`
- `rationale:`
