# Local Subdomain Development

This backend now supports subdomain- and custom-domain-aware routing.
Use one of the options below to simulate:

## Option A: hosts file (simple)

Add entries to `/etc/hosts`:
```
127.0.0.1 dashboard.localhost
127.0.0.1 tyson.localhost
127.0.0.1 demo.localhost
```

Then run the backend on port `3000` or proxy to it.

## Option B: NGINX wildcard (recommended)

Use the provided NGINX config and compose file:
```
docker compose -f infra/compose/docker-compose.yml up -d
```

This routes `*.localhost` to `127.0.0.1:3000` and preserves the `Host` header.

## Environment

Add to `backend/.env`:
```
BASE_DOMAINS=localhost,inksigma.com
DASHBOARD_SUBDOMAIN=dashboard
PUBLICATION_CACHE_TTL_SECONDS=3600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

## Quick Test

1. Open `http://dashboard.localhost:3000/login`
2. Create a publication with subdomain `tyson`
3. Visit `http://tyson.localhost:3000/`
