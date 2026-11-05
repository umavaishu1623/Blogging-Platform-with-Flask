# API Reference

Base URL: `/api/v1`. The platform uses JSON, standard HTTP status codes, and same-origin Next.js Server Actions for signed-in UI mutations. The routes below are the public REST surface currently implemented.

## Articles

### `GET /api/v1/articles`

Returns published stories only. Query parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | PostgreSQL English full-text query; maximum 120 characters. |
| `category` | Exact category slug; maximum 80 characters. |
| `tag` | Exact tag slug; maximum 80 characters. |
| `page` | One-based page number, capped at 1,000; 12 records per page. |

Response:

```json
{
  "data": [{ "id": "...", "title": "...", "slug": "...", "author": { "id": "...", "name": "...", "image": null } }],
  "pagination": { "page": 1, "totalPages": 1 }
}
```

### `GET /api/v1/articles/{slug}`

Returns a single published article, validated rich-text JSON, and public author/category/tag fields. Drafts, scheduled stories, and unknown slugs return `404` with `{ "error": { "code": "NOT_FOUND", "message": "Story not found." } }`.

### `GET /api/v1/articles/recent?slugs=slug-one,slug-two`

Returns up to five requested, still-published stories in input order. Only public story metadata and author IDs/names are returned; this endpoint powers the browser-local recently viewed shelf.

### `POST /api/v1/articles/{slug}/view`

Records at most one view per browser per UTC day. Sets an HTTP-only `ink-viewer` cookie and stores only a SHA-256 hash of its random identifier. Returns `204`; returns `404` for non-public stories and `429` when rate-limited.

## Uploads

### `POST /api/v1/uploads`

Requires an authenticated `AUTHOR` or `ADMIN` session. Send `multipart/form-data` with a `file` field. Accepts JPEG, PNG, or WebP up to 5 MB after checking the file signature, then stores it in the configured Cloudinary folder. Returns `201 { "url": "https://res.cloudinary.com/..." }`; returns `400`, `403`, `413`, `415`, `429`, or `503` for validation, origin, size, media, rate-limit, or configuration errors.

## Authentication and mutations

Auth.js handles `/api/auth/*`, including Google OAuth. UI mutations use Next.js Server Actions and require the signed-in session plus current database role/ownership checks:

- Account: register, verify email, sign in/out, request/reset password.
- Publishing: create/edit/delete, save draft, schedule, publish, and become an author.
- Engagement: like, bookmark, follow, comment/reply, and report content.
- Account data: edit profile, mark notifications read, and manage saved stories.
- Administration: change roles, moderate comments/reports, and manage categories.

Server Action payloads are not a versioned external API. Use the REST reads above for public consumers; do not call Server Action internals directly. Mutations validate input with Zod, apply rate limits where appropriate, and authorize on the server. No endpoint returns password hashes, OAuth secrets, email-provider credentials, or internal user fields.

## Operational routes

- `GET /api/cron/publish-scheduled`: Vercel Cron endpoint; requires `Authorization: Bearer $CRON_SECRET`.
- `GET /api/auth/session`: Auth.js session endpoint; exposes only the current signed-in user's ID, email, name, and role.
