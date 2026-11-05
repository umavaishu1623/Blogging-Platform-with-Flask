# Ink & Signal

A production-oriented publishing platform built with Next.js, PostgreSQL, and Prisma. The original repository contains no Flask application; the requested Next.js App Router stack is the source of truth for this project.

## Architecture

```text
Browser
	-> Next.js App Router (server-rendered pages, metadata, route handlers)
	-> Server Actions (validated mutations, session and ownership checks)
	-> Domain/data-access modules (Prisma)
	-> PostgreSQL (Neon or Supabase)

Auth.js -> Google OAuth and encrypted, HTTP-only JWT session cookies
Cloudinary -> signed server-authorized image uploads
Email provider -> verification, password reset, and newsletter workflows
Vercel -> Next.js application and scheduled jobs
```

The app is a modular monolith: UI routes, API handlers, and Server Actions share domain services and authorization rules. PostgreSQL is the source of truth. Public article pages are server-rendered and cacheable; personalized pages and mutations are authenticated and uncached. Zod schemas validate every untrusted input. Privileged operations enforce roles and resource ownership on the server, not in the UI.

### Application boundaries

- `app/`: public pages, authenticated workspace, admin pages, API routes, sitemap, and robots rules.
- `components/`: accessible, reusable presentation components.
- `lib/auth/`: Auth.js configuration and session/role helpers.
- `lib/validation/`: shared Zod input schemas.
- `lib/services/`: blog, interaction, moderation, and newsletter rules.
- `lib/db/`: Prisma client and repository access.
- `prisma/`: relational schema and migrations.
- `tests/`: unit, integration, and end-to-end coverage.

### Database schema

PostgreSQL with Prisma. IDs are opaque strings; timestamps use UTC. Slugs are unique. Foreign-key deletion behavior is chosen to preserve authored content while removing dependent interactions when appropriate.

| Model | Purpose and key relationships |
| --- | --- |
| `User` | Auth identity, unique email, display/profile fields, role (`ADMIN`, `AUTHOR`, `READER`), verification state; owns articles, comments, likes, bookmarks, follows, and notifications. |
| `Account`, `Session`, `VerificationToken` | Auth.js OAuth accounts, optional adapter session storage, and one-time verification tokens. This app uses Auth.js JWT sessions because its Credentials provider does not support database sessions. Credentials use a salted password hash, never plaintext. |
| `Blog` | Author-owned article with unique slug, title, description, rich-text JSON content, optional sanitized HTML, image URL/alt text, status (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`), publication time, SEO fields, and view count. Indexed by status/publication date, author, and slug. |
| `Category` | Unique name and slug; many-to-many with blogs. |
| `Tag` | Unique normalized name and slug; many-to-many with blogs. |
| `Comment` | Article- and user-owned threaded comment; nullable parent for replies, moderation state, and timestamps. Parent/article indexes support thread retrieval. |
| `Like` | Unique `(userId, blogId)` pair. |
| `Bookmark` | Unique `(userId, blogId)` pair, ordered by creation time. |
| `Follow` | Unique `(followerId, followingId)` pair; self-follow prohibited. |
| `NewsletterSubscription` | Unique normalized email, verification/unsubscribe token hashes, consent and lifecycle timestamps. No password or reusable token stored. |
| `Notification` | Recipient, type, optional actor/article/comment references, read timestamp. |
| `PasswordResetToken` | Hashed, expiring, single-use token keyed to a user. |
| `ArticleView` | Deduplicated anonymous or signed-in view event with article/time indexes; avoids trusting client-provided totals. Retention/aggregation is a deployment policy. |
| `Report` | Reporter, article/comment target, reason, moderation status, and admin audit timestamps. |

Important constraints: email is normalized to lowercase before its unique constraint; tag/category slugs are unique; OAuth provider/account pairs, user/article likes and bookmarks, follower/following pairs, and implicit category/tag membership pairs are unique; publication indexes support feeds; cascading deletion is limited to dependent interaction/session records. Self-follow and report-target exclusivity are enforced by domain services. Article ownership remains explicit and author account deletion needs a deliberate transfer or anonymization policy.

### API conventions

Use Server Actions for same-origin UI mutations and REST route handlers under `/api/v1` for external or client-consumed resources. JSON responses use standard HTTP status codes and a consistent `{ data }` / `{ error: { code, message } }` envelope. List endpoints use bounded cursor pagination. Mutating routes validate input, verify CSRF/origin where cookie-authenticated, apply rate limits, then authorize before writing. Never return secrets, password hashes, or internal moderation fields.

## Implementation plan

Phases are delivered in order. A phase is complete only when its acceptance checks pass; production deployment additionally requires the operator-owned accounts and secrets listed below.

1. **Requirements and architecture**: confirm product scope, boundaries, data model, trust assumptions, and external dependencies. Acceptance: this architecture and schema are reviewed and documented.
2. **UI/UX**: define responsive public/editor/admin navigation, accessible states, light/dark tokens, and article reading experience. Acceptance: keyboard and narrow-viewport review.
3. **Project initialization**: Next.js App Router, TypeScript, Tailwind, shadcn/ui, lint/typecheck/test scripts, environment validation. Acceptance: clean install and production build.
4. **Frontend foundation**: shared shell, theme, home, explore, category, article, search, about, contact, legal, and not-found pages. Acceptance: responsive route and accessibility checks.
5. **Database architecture**: Prisma models, constraints, indexes, migrations, seed only for local development. Acceptance: migration applies to an empty PostgreSQL database.
6. **Backend/API**: domain services, REST handlers, validation, pagination, rate limiting, upload signing, error handling. Acceptance: integration tests against PostgreSQL.
7. **Authentication/authorization**: Auth.js credentials and Google providers, email verification/reset, sessions, role and ownership policies. Acceptance: auth and permission tests.
8. **Publishing workflow**: editor, drafts, preview, scheduling, publish/unpublish, image upload, categories/tags, edit/delete. Acceptance: author CRUD and upload tests.
9. **Admin dashboard**: moderation, users, content, categories, reports, analytics. Acceptance: admin-only route/action tests.
10. **Search/SEO**: PostgreSQL full-text search, filters, pagination, metadata, JSON-LD, sitemap, robots. Acceptance: search and metadata tests.
11. **Testing/debugging**: unit, integration, browser, API, accessibility, responsive, and migration checks. Acceptance: CI gates pass.
12. **Security/performance**: threat review, rate limits, sanitization, headers, image constraints, cache strategy, dependency audit. Acceptance: no known critical/high findings and measured performance review.
13. **Production build**: reproducible install, Prisma generate/migrate, lint, typecheck, tests, production build. Acceptance: all CI commands pass.
14. **Deployment**: connect GitHub, provision Neon/Supabase and Cloudinary, configure Vercel environment, deploy migrations, preview and production smoke tests.
15. **Domain/SSL**: configure DNS and Vercel domain verification; confirm HTTPS and canonical host.
16. **Production verification**: exercise registration/login, author CRUD, interactions, admin permissions, email, uploads, search, SEO endpoints, backups, and monitoring with production services.

## Local setup

Prerequisites: Node.js LTS, npm, and PostgreSQL (or a Neon/Supabase database). Copy `.env.example` to `.env.local`, configure the required values, then run:

```sh
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

No production credentials or real third-party integrations are committed. Google OAuth, email delivery, Cloudinary, PostgreSQL, Vercel, DNS, and SSL require operator-owned accounts and secrets. See `.env.example` and the deployment guide once those integrations are implemented.

## Current status

Architecture and implementation plan are documented. Project scaffolding and feature implementation are in progress. This workspace currently has no Node.js/npm executable, so builds and tests must be run after installing Node.js LTS.