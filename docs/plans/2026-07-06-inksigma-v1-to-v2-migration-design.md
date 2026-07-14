# InkSigma v1 → v2 Migration — Design & Runbook (Zero Data Loss)

**Date:** 2026-07-06
**Status:** Design — awaiting approval to implement
**Cutover model:** Scheduled maintenance window (freeze → ETL → verify → DNS flip → unfreeze)
**Goal:** Migrate all v1 data into v2 with **zero data loss**, at production quality.

---

## 1. Context

This is a **re-platforming**, not a version bump:

| Layer | v1 (`Desktop/Zemuria/inksigma`) | v2 (this repo, "Miami") |
|---|---|---|
| Stack | Python 3.14 / Django 6 (monolith SSR) | Next.js 16 + Express + TypeScript |
| ORM | Django ORM | Drizzle |
| Multi-tenancy | **schema-per-publication** | single shared schema + `publicationId` |
| Auth | Django `auth.User`, **PBKDF2** hashes, allauth | **Better Auth**, **scrypt** hashes |
| User PK | `BigAutoField` (int) | `text` (UUID) |
| Storage | **Wasabi S3** | **Wasabi S3** (v2 migrating off Cloudinary) |
| Delivery | direct S3 | Cloudflare edge + Image Transformations |

### Locked decisions
1. **Cutover:** scheduled maintenance window (a few hours of downtime acceptable).
2. **Passwords:** import PBKDF2 hashes untouched; custom Better Auth `password.verify` detects Django format and verifies; transparent re-hash to scrypt on success. **No forced resets.**
3. **Media:** v2 adopts the **same Wasabi bucket** → legacy image URLs stay valid → **no image ETL**. v2's Cloudinary integration is replaced with an S3 client (separate work stream).
4. **Delivery:** Wasabi origin → Cloudflare CDN (free egress via Bandwidth Alliance) → Cloudflare Image **Transformations ON** → `next/image` custom loader.
5. **Zero loss:** v2 schema is **extended** (2 new tables + a few columns) so every v1 field has a home.

---

## 2. Zero-loss gap analysis (what has no home in v2 today)

| v1 data | Loss type without action | Resolution |
|---|---|---|
| `PublicationSubscribers` | No table | **New `subscriber` table** |
| `Transactions` (payment) | No table | **New `transaction` table** |
| `PostAnalytics` (view/revisit counts) | No column | **`blog.legacyViewCount`** + `migrationMeta` |
| `PostSEO.MetaData` (meta_title, canonical, alt…) | No column | **`blog.seoMetadata` jsonb** |
| `PostComments.analysis` / `flags` | No column | **`comment.metadata` jsonb** |
| `Publication.config`, `Publication_Auth.domain_auth` | Partial | **`publication.legacyMetadata` jsonb** |
| `Users.user_auth` flags | Partial | **`user.legacyMetadata` jsonb** |
| `PublicPost.post_details`, `key`, revisits | No column | **`blog.migrationMeta` jsonb** |
| `Feedback`, `EmailJobs` | No table | **Archive to CSV** (preserved out-of-band) |
| Constraint collisions (global `slug`, non-null `description`, dup emails) | **Silent row rejection** | Pre-flight resolution pass (§5) |

Everything else maps cleanly (users, passwords, OAuth links, publications, posts, comment text) or is safely droppable (tokens, sessions, rate-limit state, caches — all transient).

---

## 3. v2 Schema changes (additive, non-breaking)

All additions are nullable (or defaulted), so existing v2 code and rows are unaffected. Add `jsonb` to the `drizzle-orm/pg-core` import in `backend/models/schema.ts`.

### 3.1 New enums
```ts
export const subscriberTypeEnum = pgEnum("subscriber_type", ["free", "paid"]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "failed", "cancelled", "completed", "pending",
]);
```

### 3.2 New table: `subscriber`  (from v1 `PublicationSubscribers`, per-tenant → `publicationId`)
```ts
export const subscriber = pgTable("subscriber", {
  id: serial("id").primaryKey(),
  publicationId: integer("publicationId").notNull()
    .references(() => publication.id, { onDelete: "cascade" }),
  name: text("name"),                 // v1 Subscriber
  email: text("email").notNull(),     // v1 SubsEmail
  type: subscriberTypeEnum("type").notNull().default("free"), // v1 SubsType 0/1
  unsubscribedAt: timestamp("unsubscribedAt"),               // newsletter hygiene
  source: text("source").default("v1"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (t) => ({
  pubEmailUnique: uniqueIndex("subscriber_publication_email_unique")
    .on(t.publicationId, t.email),
  pubCreatedIdx: index("idx_subscriber_publication_created")
    .on(t.publicationId, t.createdAt),
}));
```

### 3.3 New table: `transaction`  (from v1 `Transactions`, user-scoped)
```ts
export const transaction = pgTable("transaction", {
  id: serial("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "set null" }), // preserve financial history on user delete
  externalId: text("externalId"),     // v1 transac_id
  amount: integer("amount").notNull(),// v1 amount (minor units)
  currency: text("currency"),
  purpose: text("purpose"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  remarks: text("remarks"),
  planCycle: jsonb("planCycle"),      // v1 plan_cycle
  extraInfo: jsonb("extraInfo"),      // v1 extra_info
  source: text("source").default("v1"),
  createdAt: timestamp("createdAt").notNull().defaultNow(), // v1 time
  completedAt: timestamp("completedAt"),                    // v1 completion_time
}, (t) => ({
  userCreatedIdx: index("idx_transaction_user_created").on(t.userId, t.createdAt),
}));
```

### 3.4 Column additions to existing tables
```ts
// user
legacyMetadata: jsonb("legacyMetadata"),   // v1 user_auth flags, AuthType, sourceUserId

// publication
legacyMetadata: jsonb("legacyMetadata"),   // v1 config leftovers, domain_auth, seed, provenance

// blog
legacyViewCount: integer("legacyViewCount").notNull().default(0), // v1 PostAnalytics views
seoMetadata: jsonb("seoMetadata"),         // v1 PostSEO.MetaData (meta_title, canonical, alt…)
migrationMeta: jsonb("migrationMeta"),     // sourceSchema, sourcePostId, key, post_details, revisits

// comment
metadata: jsonb("metadata"),               // v1 analysis, flags, is_reply, original user JSON, provenance
```

### 3.5 Relations (`backend/models/relations.ts`)
- `subscriber` → one `publication`; `publication` → many `subscriber`.
- `transaction` → one `user`; `user` → many `transaction`.

### 3.6 View-count read model
Public total views = `blog.legacyViewCount + COUNT(blog_view)`. Update the view-count read path (viewTrackingService / blog read) to add the baseline. New views accrue in `blog_view` as normal.

### 3.7 Migration bookkeeping (not part of app schema)
The ETL creates and later drops:
```sql
CREATE TABLE IF NOT EXISTS migration_id_map (
  entity text NOT NULL, source_key text NOT NULL, target_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (entity, source_key)
);
```
Used for FK resolution across phases and **idempotent re-runs**. User IDs are deterministic (`uuidv5("v1-user-"+djangoId)`), so user load is upsertable without the map; serial-PK entities use the map.

**Delivery:** edit `schema.ts` + `relations.ts` → `npm run db:generate` → review `backend/drizzle/0021_*.sql` (idempotent style: `DO $$ … EXCEPTION …` enums, `IF NOT EXISTS`) → `npm run db:migrate`. Add `subscriber`, `transaction` to `verify-migration-smoke.mjs` required tables.

---

## 4. Password migration (PBKDF2 → scrypt shim)

Better Auth (v1.4.9) uses **scrypt** and currently sets **no** custom `password` object. Add one in `backend/config/betterAuth.ts`:

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: isEmailConfigured(),
  password: {
    hash: async (password) => betterAuthHashPassword(password), // scrypt (default)
    verify: async ({ hash, password }) => {
      if (hash.startsWith("pbkdf2_sha256$") || hash.startsWith("pbkdf2_sha1$")
          || hash.startsWith("argon2") || hash.startsWith("bcrypt")) {
        return verifyDjangoHash(password, hash);  // handle all v1 PASSWORD_HASHERS
      }
      return betterAuthVerifyPassword({ hash, password }); // native scrypt
    },
  },
  sendResetPassword: /* unchanged */,
},
```

- `verifyDjangoHash` implements Django's `pbkdf2_sha256` (base64 salt+hash, iterations) and the other hashers present in v1's `PASSWORD_HASHERS`. **Pre-flight: scan v1 to confirm which hasher prefixes actually occur.**
- **Transparent upgrade:** on successful legacy verify, re-hash to scrypt and update `account.password` (via a sign-in `after` hook or a lazy update in the verify path). Optional but recommended; legacy hashes keep working indefinitely regardless.
- OAuth (`providerId="google"`) users are unaffected.

---

## 5. ETL design (`backend/scripts/migrate-v1-to-v2.mjs`, wired to `migrate:data`)

- **Client:** `pg.Pool` to v1 (read-only) and v2 (mirrors existing `migrate-images-to-cloudinary.mjs`).
- **Dry-run by default**; `--execute` to write. Structured logging; per-entity reconciliation counters.
- **No silent skips:** every rejected/ambiguous row is logged with full context and either resolved or aborts the phase. `try/catch: continue` is forbidden.
- **Transactions:** per-phase (users, publications) and **per-publication** for tenant data, so a failure rolls back cleanly and re-runs resume via `migration_id_map`.

### Pre-flight (before `--execute`)
1. Enumerate tenant schemas from `InternalSystem_domainschema` + `Accounts_publication`.
2. **Duplicate-email scan** on `auth_user` (Django email is not unique) → merge/rename list.
3. **Global slug-collision scan** across all tenant `PublicPost.slug` → collision resolution map (prefix loser with subdomain; original → `blog_slug_history`).
4. **Hasher-prefix scan** on `auth_user.password` → confirm `verifyDjangoHash` covers all.
5. **Category id→name** map from v1 `categorylist.txt`.
6. **Null/empty backfill** rules: `blog.description` NOT NULL ← first N chars of content when null.

### Load order (FK-safe)
1. **Users** → `user` (uuidv5 id), `account` (credential w/ PBKDF2 password; google from `SocialAccounts`), `user.legacyMetadata`. Derive `emailVerified`.
2. **Publications** → `publication` (+`legacyMetadata`), `publication_hostname` (subdomain + custom_domain rows), `publication_member` (owner). Map `config` → columns.
3. **Per tenant schema:**
   - **Blogs** (`PublicPost`+`PostStatus`+`PostSEO`+`PostAnalytics`) → `blog` (status map, category names, thumbnail→image, MetaData→seoMetadata, views→legacyViewCount, rest→migrationMeta); seed `blog_slug_history` with current slug.
   - **Comments** (`PostComments`) → `comment`, **two-pass** for `parentId` (replies); user JSON → `authorId` (if mappable) else `guestName`/`guestEmail`; analysis/flags → `metadata`.
   - **Subscribers** (`PublicationSubscribers`) → `subscriber`.
4. **Transactions** → `transaction` (user via map).
5. **Archive** `Feedback`, `EmailJobs` → CSV in cold storage.

### Reconciliation (must pass before opening v2)
- Row counts: v1 source vs v2 inserted vs archived vs consciously-dropped — **no unexplained deltas**.
- FK integrity: 0 orphans.
- Spot checks: N migrated logins (PBKDF2), N posts render with valid Wasabi images, Google login, a threaded comment, a subscriber list, view-count baseline shows.

---

## 6. Storage work stream (Wasabi swap in v2) — required before cutover

Legacy URLs already resolve (same bucket), but v2 must serve/optimize via Wasabi+Cloudflare:
1. Replace `backend/utils/cloudinary.ts` with an S3 module (`@aws-sdk/client-s3` + `@aws-sdk/lib-storage`): `upload` (public-read + cache-control), `delete`, `copy`, URL helpers. Add `sharp` for upload-time WebP.
2. Swap call sites (8 files): `uploadRoutes`, `profileRoutes`, `blogRoutes`, `publicationRoutes` (logo/favicon/og), `blogService`, `appConfig`, migration script.
3. Env: drop `CLOUDINARY_*`; add `WASABI_ACCESS_KEY_ID/SECRET/BUCKET/ENDPOINT/REGION` (reuse v1's).
4. **CSP** (`helmet` `img-src`) + `next.config` `images.remotePatterns` → add Wasabi host. Configure `next/image` **custom Cloudflare loader**; enable Cloudflare Image Transformations.

> ⚠️ CSP/loader must ship **before** cutover or migrated images are blocked in v2.

---

## 7. Cutover runbook

### Pre-window (no downtime)
1. Deploy schema migration `0021` to prod v2 DB (additive, safe anytime).
2. Deploy code: PBKDF2 shim, Wasabi storage swap, CSP + Cloudflare image loader.
3. Ensure v2 has Wasabi creds + read/write to the shared bucket.
4. **Rehearse:** run the ETL (dry-run then `--execute`) against a **copy** of v1 prod → **staging** v2 DB. Reconcile. Repeat until 100% clean.

### Window (downtime)
1. Put v1 in **maintenance/read-only**; announce. Stop all writes.
2. `pg_dump` v1 (authoritative snapshot + backup).
3. Backup v2 DB (pre-migration restore point).
4. Run ETL `--execute`: v1 snapshot → v2 prod.
5. Run reconciliation + verification suite → **must be green**.
6. Smoke test v2 (migrated login, publication + post + images, Google login, comments, subscribers).
7. Flip DNS in Cloudflare: primary domain, subdomains, custom domains → v2.
8. Open v2 to public; lift maintenance.

### Post-window
1. Monitor: error rate, auth success %, image 404s, view counts.
2. Keep v1 (read-only) + dump as rollback for N days.
3. **Rollback:** flip DNS back to v1, restore v2 from pre-migration backup. Clean because v1 was frozen.
4. After confidence window: decommission v1, `DROP TABLE migration_id_map`, retire Cloudinary, remove legacy `/uploads` route.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Global `slug` collisions when flattening tenants | Pre-flight collision map; loser prefixed by subdomain; `blog_slug_history` redirect |
| Duplicate `auth_user.email` (Django not unique) | Pre-flight dedup; merge or suffix; manual review list |
| Multiple v1 password hashers | Pre-flight prefix scan; `verifyDjangoHash` covers all present |
| `blog.description` NOT NULL vs v1 nullable | Backfill from content excerpt |
| Orphan authors / ownerless publications | Pre-flight FK check; assign fallback or archive with report |
| `PublicPost.created_on` is `auto_now` (last-modified, not created) | Accept as `createdAt`; document limitation |
| Comment `parentId` ordering | Two-pass insert |
| Window too long for data volume | Measure in rehearsal; batch inserts; parallelize per-schema if needed |
| Images blocked in v2 | Ship CSP + Cloudflare loader before cutover; verify in rehearsal |
| Silent partial migration | Reconciliation gate; hard-fail ETL; no `try/continue` |

---

## 9. Implementation phases

1. **Schema** — extend `schema.ts` + `relations.ts`, generate `0021`, migrate, extend smoke test. *(this PR)*
2. **Auth shim** — `verifyDjangoHash` + Better Auth `password` object + tests.
3. **Storage** — Wasabi S3 module, swap call sites, CSP + Cloudflare loader.
4. **ETL** — `migrate-v1-to-v2.mjs` with pre-flight, load, reconciliation, dry-run.
5. **Rehearsal** — run against prod copy → staging; fix until clean.
6. **Cutover** — execute runbook.

Phases 1–4 are independent PRs; 5–6 are operational.
</content>
</invoke>
