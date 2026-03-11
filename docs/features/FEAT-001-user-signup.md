# FEAT-001 User signup flow

## Goal
Allow a new user to create an account with email and password.

## User value
A first-time visitor can start using the service without manual admin support.

## Entry points
- Public landing page
- Login page secondary CTA

## Done criteria
- Signup page is reachable.
- Valid input creates an account.
- Validation errors are shown near fields.
- Loading and error states are visible.
- UI is usable on mobile and desktop.

## Required states
- default
- loading
- error
- success
- disabled

## Target files
- src/app/signup/page.tsx
- src/components/signup-form.tsx
- src/api/auth/signup.ts

## Risks
- Validation mismatch between client and server.
- Regressions in shared auth utilities.
