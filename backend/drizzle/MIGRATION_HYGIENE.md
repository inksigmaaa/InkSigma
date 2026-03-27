# Migration Hygiene

## Source of truth

- Drizzle schema source: `backend/models/schema.ts`
- Drizzle relations source: `backend/models/relations.ts`
- Migration journal: `backend/drizzle/meta/_journal.json`

The old `backend/drizzle/relations.ts` file was retired because it drifted from
the actual schema and caused invalid imports.

## Managed vs manual SQL

- Managed migration files live directly under `backend/drizzle/*.sql` and must
  have matching journal entries.
- Historical one-off scripts are archived under `backend/drizzle/manual/` and
  are not part of the replay chain.

## Replay-from-zero checklist

1. Start a fresh Postgres database.
2. Run `npm run db:migrate` from `backend/`.
3. Run `npm run verify:migrations`.
4. Run `npm run test:domains`.
