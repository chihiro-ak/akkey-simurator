# decisions.md

## Purpose
Store high-level decisions that should survive individual sessions.

## Template
- Date:
- Decision:
- Context:
- Why:
- Trade-offs:
- Follow-up:

## Initial decisions
- Date: 2026-03-11
- Decision: Use Feature Session -> Subtask Session -> Meta Session hierarchy.
- Context: AI orchestrator is responsible for routing and tracking work.
- Why: Keeps implementation tasks small while preserving long-lived feature context.
- Trade-offs: Requires maintaining a session ledger.
- Follow-up: Refine status transitions once real projects expose edge cases.
