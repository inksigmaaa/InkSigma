# Local Subdomain Development

This backend now supports subdomain- and custom-domain-aware routing.
Use one of the options below to simulate:

## Option A: hosts file (simple)

Add entries to `/etc/hosts`. **On macOS you MUST add an `::1` (IPv6) line for
every `.local` name** — see the warning below, or every request will hang ~5s.
```
# IPv4
127.0.0.1 dashboard.localhost
127.0.0.1 tyson.localhost
127.0.0.1 demo.localhost
127.0.0.1 inksigma.local api.inksigma.local dashboard.inksigma.local
127.0.0.1 tyson.inksigma.local tennyson.inksigma.local
127.0.0.1 tennyson.local
# IPv6 — required on macOS for any *.local name (avoids the mDNS delay)
::1       inksigma.local api.inksigma.local dashboard.inksigma.local
::1       tyson.inksigma.local tennyson.inksigma.local
::1       tennyson.local
```

Then run the backend on port `3000` or proxy to it.

> ### ⚠️ macOS: `.local` names hang ~5 seconds without an `::1` entry
>
> The `.local` TLD is reserved for **mDNS / Bonjour**. When a `.local` name has
> an IPv4 (`A`) entry in `/etc/hosts` but **no IPv6 (`AAAA`) entry**, macOS still
> sends the `AAAA` lookup to multicast DNS, which **times out after ~5 seconds**
> before falling back. The result: the first request (and the first request after
> a few idle minutes, once keep-alive connections drop) blocks for ~5s — or ~10s
> through the Next.js proxy, which resolves both the page host and the backend
> host. Verify with:
> ```
> dscacheutil -q host -a name api.inksigma.local   # ~5.0s real → broken; ~0.0s → fixed
> ```
> **Fix:** add the matching `::1` lines above, then flush DNS:
> ```
> sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
> ```
> `*.localhost` names are immune (macOS resolves them to loopback instantly with
> no mDNS), so they need no `::1` entry.

## Option B: NGINX wildcard (recommended)

Use the provided NGINX config and compose file:
```
docker compose -f infra/compose/docker-compose.yml up -d
```

This routes `*.localhost`, `*.inksigma.local`, and single-label `*.local`
hosts to `127.0.0.1:3000` and preserves the `Host` header.

## Environment

Add to `backend/.env`:
```
BASE_DOMAINS=localhost,inksigma.local
DASHBOARD_SUBDOMAIN=dashboard
PUBLICATION_CACHE_TTL_SECONDS=3600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

## Quick Test

1. Open `http://dashboard.localhost:3000/login`
2. Create a publication with subdomain `tyson`
3. Visit `http://tyson.localhost:3000/`
4. Save a custom domain like `tennyson.local`
5. Visit `http://tennyson.local:3000/`
