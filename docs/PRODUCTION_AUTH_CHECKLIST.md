# Production Auth Checklist

Use this checklist before promoting auth changes to production.

## Required Environment

- `NODE_ENV=production`
- `BETTER_AUTH_SECRET` or `SESSION_SECRET`
- `TOKEN_HASH_SECRET` for independent reset/verification/invitation token hashing, or allow fallback to the auth secret
- `BETTER_AUTH_URL` set to the production backend auth origin
- `FRONTEND_URL` or `TRUSTED_ORIGINS`/`CORS_ORIGIN`/`ALLOWED_ORIGINS`
- `BASE_DOMAIN` or `BASE_DOMAINS` set to production platform domains
- No production auth/domain variable may contain `localhost`, `127.0.0.1`, `0.0.0.0`, `.localhost`, or `.local`

## Cookie Verification

After login on staging or production, inspect the Better Auth `Set-Cookie` headers.

Expected attributes:

- `Secure`
- `HttpOnly`
- `SameSite=Lax` or stricter
- `Path=/`
- `Domain` only when cross-subdomain login is required

Also verify:

- Session cookies are not visible through `document.cookie`.
- Dashboard and publication subdomains keep the expected signed-in state.
- Logout invalidates `/api/auth/get-session`.

## Logging

Production logs must not contain:

- session tokens or session storage keys
- reset, verification, invite, OAuth, or API tokens
- full reset or verification URLs
- raw user emails where a redacted version is enough
