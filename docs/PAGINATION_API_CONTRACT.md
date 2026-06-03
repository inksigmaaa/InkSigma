# Pagination API Contract — Blogs & Members lists

**Status:** Proposed (backend implementation needed before frontend wiring)
**Owner:** Frontend (contract) → Backend (implement) → Frontend (integrate)
**Why:** The dashboard list pages (`my-blogs`, `draft`, `published`, `unpublished`,
`trash`, `schedule`, `review`, members) currently fetch the **entire** dataset
for a publication with no `limit`. `blogService.getBlogs()` requests
`/api/blogs?...` and the frontend holds and renders **all** rows, filtering
client-side. This is fine at tens of records and degrades badly at thousands
(multi-MB payloads, slow parse, janky scroll, high memory). Cursor pagination is
the fix and the single biggest scalability lever for the product.

---

## 1. Scope

| Endpoint | Priority | Notes |
|---|---|---|
| `GET /api/blogs` | **P0** | Drives all article list pages |
| `GET /api/members/:publicationId/members` | P1 | Members list (smaller, but same pattern) |

This doc specifies `/api/blogs`; `/members` follows the identical shape.

---

## 2. Backward compatibility (important)

`getBlogs()` today returns a **bare JSON array** and every caller treats it as
an array. Returning a `{ items, nextCursor }` object unconditionally would break
all current callers. **Pagination must be opt-in:**

- **Legacy (unchanged):** `GET /api/blogs?publicationId=…&status=…` with **no**
  `limit` → returns the existing bare array (current behavior).
- **Paged (new):** the **presence of `limit`** switches the response to the
  envelope below. This lets backend + frontend roll out independently and lets
  us migrate one list page at a time.

---

## 3. Request

```
GET /api/blogs
  ?publicationId=<id>          # existing — required for dashboard lists
  &status=<draft|published|unpublished|trash|scheduled|review>   # existing
  &category=<name>             # existing (optional) — should filter server-side
  &limit=<int 1..100>          # NEW — opts into paged response; default page size 20
  &cursor=<opaque string>      # NEW — omit for first page; echo nextCursor for next
```

- All existing filter params keep working and must be applied **server-side**
  (today some filtering, e.g. category, happens client-side — move it to the query).
- `limit` clamped server-side to a max (suggest 100) to prevent abuse.

## 4. Response (when `limit` is present)

```jsonc
{
  "items": [ /* Blog[] — same object shape as today */ ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIuLi4iLCJpZCI6IjEyMyJ9",  // null on last page
  "total": 1234   // OPTIONAL — include only if cheap; UI does not require it
}
```

- `items.length <= limit`.
- `nextCursor === null` ⇒ no more pages.
- Item object shape must be **identical** to the current array elements (no field
  changes) so rendering is unaffected.

## 5. Cursor design

- **Opaque** to the client (base64url of an internal key). The frontend only
  echoes it back; it never parses it.
- Encodes the **sort key of the last returned row**, e.g.
  `base64url(JSON.stringify({ createdAt, id }))`.
- **Keyset/seek pagination**, not `OFFSET` — `OFFSET` degrades on deep pages and
  is unstable when rows are inserted/deleted between requests.

## 6. Ordering & stability (required)

- Deterministic, total order. Recommended: `ORDER BY createdAt DESC, id DESC`
  (id as tiebreaker so the cursor is unambiguous).
- The same `(publicationId, status, category)` filter + cursor must return a
  stable, gap-free, duplicate-free sequence even as rows change between page
  fetches (keyset guarantees this; offset does not).
- Index to support it: composite on `(publicationId, status, createdAt, id)`.

## 7. Edge cases

- Empty result → `{ items: [], nextCursor: null }`.
- `cursor` pointing past the end → `{ items: [], nextCursor: null }`.
- Invalid/garbled `cursor` → `400` (don't silently return page 1).
- Auth/tenant scoping unchanged (same cookie/`X-Subdomain` rules as today).

---

## 8. Frontend integration plan (after backend ships)

Once `/api/blogs?...&limit=` honors the envelope, the frontend half is small and
will be done in one PR:

1. **`src/services/blog.service.js`** — `getBlogs(filters, { limit, cursor })`
   returns `{ items, nextCursor }` when `limit` is passed; keeps the array return
   otherwise.
2. **`src/stores/articleStore.js`** — per-status entries gain `nextCursor` +
   `isLoadingMore`; add `loadMoreArticles(status)` that fetches the next page and
   **appends** to the in-memory list.
3. **List pages** (`my-blogs`/`draft`/`published`/…) — render the current page and
   add an `IntersectionObserver` sentinel that calls `loadMoreArticles` when it
   scrolls into view ("infinite scroll"). Initial `limit` = 20.
4. Move the **category filter** to a server param (`&category=`) instead of
   client-side `.filter`.
5. (Optional, follow-up) virtualize the rendered list with `react-window` once
   pages can be long — orthogonal to this contract.

## 9. Acceptance criteria

- [ ] `GET /api/blogs?...&limit=20` returns `{ items, nextCursor }`; without
      `limit`, returns the legacy array (no regression for current callers).
- [ ] Fetching all pages via `nextCursor` yields every row exactly once, in
      stable order, with no gaps/dupes when rows are added/removed mid-paging.
- [ ] `category` is filtered server-side.
- [ ] Members endpoint mirrors the same contract (P1).

---

_Generated as the contract for the scalability pagination work. Frontend
integration is ready to implement as soon as the backend honors `limit`/`cursor`._
