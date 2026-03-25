# Notification Route Compatibility Notes

## Issue

Current BE-08 route follows PRD:

- `GET /api/notifications/:email`

This keeps frontend compatibility, but email in route path is not ideal long-term.
Using `/me` (or user id internally) is cleaner and reduces exposure of user identifiers in URL path.

If we replace `:email` immediately, existing frontend calls may break.

## Safe Options

1. Keep current route and add a new one:
- Keep: `GET /api/notifications/:email`
- Add: `GET /api/notifications/me`

2. Migrate frontend and backend together:
- Update frontend route usage in same release.

3. Deprecate in phases:
- Phase 1: keep old route + add new route.
- Phase 2: migrate frontend to new route.
- Phase 3: remove old route after verification.

## New Route Plan (for now)

Add non-breaking route:

- `GET /api/notifications/me`

Behavior:
- Uses `req.user.email` from token.
- Returns notifications sorted by newest first.
- Same response shape as `/api/notifications/:email`.

## TODO (Later Cleanup)

- Add and test `/api/notifications/me`.
- Update frontend to use `/notifications/me`.
- Keep `/notifications/:email` during migration period.
- Remove `/notifications/:email` after full frontend migration.
- Update API docs/PRD notes to mark old route as deprecated.

