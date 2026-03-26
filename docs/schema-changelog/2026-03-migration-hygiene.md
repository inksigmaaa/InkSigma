# 2026-03 Migration Hygiene Batch

## Version

- Batch tag: `0016_authz_query_indexes`
- Date: 2026-03-26

## Why

- Ensure migration replay from zero is deterministic.
- Remove duplicate migration collisions for hostname and custom-domain lifecycle.
- Improve authorization and notification query performance with focused indexes.

## Included changes

1. Hardened duplicate migrations to be idempotent:
   - `backend/drizzle/0012_nice_bucky.sql`
   - `backend/drizzle/0014_broad_frog_thor.sql`
2. Added authz/query indexes:
   - `idx_publication_member_publication_user`
   - `idx_publication_member_user_publication`
   - `idx_publication_member_publication_role`
   - `idx_notification_user_created_desc`
   - `idx_notification_user_is_read`
3. Archived non-journal legacy SQL to `backend/drizzle/manual/`.
4. Retired stale `backend/drizzle/relations.ts`; canonical relations now live in
   `backend/models/relations.ts`.
5. Added CI migration verification workflow:
   - `.github/workflows/backend-migration-verify.yml`

## Compatibility and rollout

- Backward compatible with existing environments.
- Duplicate migration files now no-op safely when objects already exist.
- Index additions are additive and use `IF NOT EXISTS`.

## Verification

- Local/CI command sequence:
  - `npm run db:migrate`
  - `npm run verify:migrations`
  - `npm run test:domains`
