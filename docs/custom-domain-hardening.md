# Custom Domain Hardening

## Scope
- Public publication traffic can run on a custom domain.
- Dashboard and admin flows stay on the platform dashboard host.
- Browser traffic from publication hosts uses same-origin `/api` through Next.js.
- Custom-domain comment/profile flows use a short-lived public-site auth token minted from the dashboard session.

## Required Environment
- `BACKEND_URL`
- `FRONTEND_URL`
- `BASE_DOMAINS`
- `MAIN_DOMAIN`
- `NEXT_PUBLIC_ROOT_DOMAIN`
- `DASHBOARD_SUBDOMAIN`
- `CUSTOM_DOMAIN_CNAME_TARGET` or `CUSTOM_DOMAIN_CNAME_TARGETS`
- `CUSTOM_DOMAIN_IP_TARGET` or `CUSTOM_DOMAIN_IP_TARGETS`
- `DOMAIN_RECONCILE_TOKEN`
- `PUBLIC_SITE_AUTH_SECRET` or `BETTER_AUTH_SECRET`
- `PUBLICATION_CACHE_TTL_SECONDS`
- `DNS_LOOKUP_TIMEOUT_MS`
- `DNS_LOOKUP_MAX_CONCURRENCY`
- `PUBLIC_SITE_AUTH_TOKEN_TTL_SECONDS`

## Operator Flow
1. Save the custom domain from the dashboard domain page.
2. Add the generated TXT record: `_inksigma.<domain>` -> `inksigma-verification=<token>`.
3. Add routing records:
   - Use CNAME targets for subdomain custom hosts such as `blog.example.com`.
   - Use A or AAAA targets for apex hosts such as `example.com`.
4. Run `Verify domain` from the dashboard page.
5. Confirm the status becomes `active` before treating the custom domain as canonical.

## Reconciliation
- Protected endpoint: `POST /api/publications/internal/custom-domains/reconcile`
- Auth:
  - `Authorization: Bearer <DOMAIN_RECONCILE_TOKEN>`
  - or `X-Domain-Reconcile-Token: <DOMAIN_RECONCILE_TOKEN>`
- Optional scope:
  - `publicationId` in the request body or query string

### Example
```bash
curl -X POST \
  -H "Authorization: Bearer $DOMAIN_RECONCILE_TOKEN" \
  "$BACKEND_URL/api/publications/internal/custom-domains/reconcile"
```

## Production Checks
- Confirm `/api/publications/resolve-host` latency and error rate are monitored.
- Track custom-domain verification success and failure counts.
- Track `/api` proxy failures on publication hosts.
- Watch comment/profile auth failures on custom domains.
- Alert on domains stuck in `pending_verification` or `verified`.

## Runbook
- `pending_verification`:
  - TXT record missing or not propagated.
- `verified`:
  - Ownership is correct, but the domain is not pointing at the InkSigma routing target yet.
- `failed`:
  - TXT record is wrong or missing, or verification token was regenerated.
- Redirect problems:
  - Check `publication_hostname` history and `canonicalHost` from `resolve-host`.
- Custom-domain comment/profile auth problems:
  - Confirm the login flow returns with `publicAuthToken` and that `/api/profile` succeeds on the publication host.
