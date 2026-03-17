# Domain Architecture Plan

## Current State Analysis

The codebase currently resolves tenants from:

- Next.js edge middleware in `src/middleware.ts`
- frontend host parsing in `src/utils/hostParser.js`
- backend tenant resolution in `backend/middleware/subdomainMiddleware.ts`
- backend publication lookup in `backend/services/publicationResolver.ts`
- publication edits in `backend/routes/publicationRoutes.ts`

Current storage is centered on two mutable fields on `publication`:

- `publication.subdomain`
- `publication.customDomain`

That model is enough for routing the current host, but it is not enough for durable domain history. When either value changes, the previous hostname disappears from the source of truth. That creates four production problems:

1. Old shared links can stop resolving after a subdomain or custom-domain change.
2. Old subdomains are not permanently reserved.
3. There is no authoritative redirect state for edge routing.
4. The system cannot distinguish canonical hosts from historical aliases.

## Target Architecture

Use a layered hostname model:

1. `publication` keeps the current editable state:
   - current `subdomain`
   - current `customDomain`
2. `publication_hostname` becomes the immutable history and routing layer:
   - `kind`: `subdomain | custom_domain`
   - `value`: stored hostname value
   - `status`: `active | redirect`
3. Resolver logic checks current values first, then historical aliases.
4. Edge or middleware redirects historical aliases to the current canonical host.
5. Platform subdomains remain permanently reserved and never reused.

## Canonical Rules

- If `customDomain` exists, it is canonical.
- Otherwise the current `subdomain` is canonical.
- Old subdomains always stay mapped as redirect aliases.
- Old custom domains stay mapped as redirect aliases while they still point to the platform.

## Implementation Phases

### Phase 1

Foundation and non-breaking resolution:

- add `publication_hostname`
- backfill existing publications
- reserve old subdomains and old custom domains
- resolve historical aliases through the current publication

### Phase 2

Canonical redirect flow:

- expose redirect metadata from tenant resolution
- redirect old host -> canonical host with one hop
- preserve path and query string

### Phase 3

Operational hardening:

- custom-domain verification status
- SSL lifecycle state
- DNS drift detection
- release policy for detached custom domains
- edge cache invalidation and warmup

## Task List

1. Add hostname-history persistence and backfill migration.
2. Reserve historical hostnames during create and update flows.
3. Resolve legacy hostnames in the backend resolver so old links keep loading.
4. Expose canonical redirect metadata in middleware and resolve APIs.
5. Redirect old hosts to canonical hosts in Next edge middleware.
6. Add verification lifecycle for custom domains.
7. Add end-to-end tests for:
   - subdomain -> new subdomain
   - subdomain -> custom domain
   - custom domain -> new custom domain
   - revert custom domain -> platform subdomain

## Slice Started In This Change

This change implements Phase 1:

- persistent hostname history
- historical hostname reservation
- publication lookup through hostname history

The next slice should wire `redirect` status into the edge layer so old hosts return permanent redirects instead of only resolving as aliases.
