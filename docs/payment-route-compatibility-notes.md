# Payment Route Compatibility Notes

## Issue

Current BE-07 route follows PRD:

- `GET /api/payments/:email`

This keeps frontend compatibility, but `email` in URL is not ideal long-term. A `/me` route is cleaner and avoids exposing user email in path.

If we replace `:email` immediately, existing frontend calls may break.

## Safe Options

1. Keep current route and add a new route:
- Keep: `GET /api/payments/:email`
- Add: `GET /api/payments/me`
- Frontend can migrate gradually.

2. Migrate frontend + backend together:
- Update frontend API usage and backend route contract in same release.

3. Deprecation approach:
- Phase 1: keep old route + add new route.
- Phase 2: migrate frontend to new route.
- Phase 3: remove old route after validation.

## New Route Plan (for now)

Add non-breaking route:

- `GET /api/payments/me`

Behavior:
- Uses `req.user.email` from JWT.
- Returns payment history of logged-in buyer.
- Same response shape as `/api/payments/:email`.

## TODO (Later Cleanup)

- Add and test `/api/payments/me`.
- Update frontend to use `/payments/me`.
- Keep `/payments/:email` during migration.
- Remove `/payments/:email` only after frontend fully migrates.
- Update API docs/PRD notes to mark old route as deprecated.

