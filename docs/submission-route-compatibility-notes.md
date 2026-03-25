# Submission Route Compatibility Notes

## Issue

Current BE-05 route follows PRD:

- `GET /api/submissions/buyer/:email`

This works, but using `email` in URL is not ideal long-term. A route like `/me` or `:id` is cleaner and more stable.

If we replace `:email` immediately, existing frontend calls will break.

## Safe Options

1. Keep current route and add a new route:
- Keep: `GET /api/submissions/buyer/:email`
- Add: `GET /api/submissions/buyer/me`
- Frontend can migrate gradually.

2. Change frontend and backend together:
- Replace all frontend calls at once.
- Deploy both changes together.

3. Deprecate in phases:
- Phase 1: keep old route + add new route.
- Phase 2: migrate frontend to new route.
- Phase 3: remove old route after verification.

## New Route Plan (for now)

Add new route (non-breaking):

- `GET /api/submissions/buyer/me`

Behavior:
- Uses `req.user.email` from token.
- Returns pending submissions for logged-in buyer.
- Same response shape as `/buyer/:email`.

## TODO (Later Cleanup)

- Add and test `/api/submissions/buyer/me`.
- Update frontend to use `/buyer/me`.
- Keep `/buyer/:email` during migration period.
- Remove `/buyer/:email` only after frontend fully switches.
- Update PRD/API docs to mark old route as deprecated (or update contract).

