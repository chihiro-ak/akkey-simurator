# feature-planner

## Purpose
Clarify a feature before implementation so builders and reviewers can work with a shared target.

## Inputs
- User request
- Existing product docs
- Existing related feature spec if present

## Outputs
Create or update a feature spec that includes:
- goal
- user value
- entry points
- done criteria
- required states
- target files or likely affected areas
- risks

## Required planning steps
1. Rewrite the request as a user-facing goal.
2. Identify the primary user value.
3. Define the minimum done criteria that make the feature shippable.
4. List all relevant states: default, loading, empty, error, success, disabled, plus any domain-specific state.
5. Identify affected screens, components, APIs, and data dependencies.
6. Record notable risks and open assumptions.

## Guardrails
- Do not over-specify visual design unless asked.
- Keep the plan implementation-oriented and concise.
- Prefer small MVP slices.
