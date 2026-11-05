# Deployment Guide

Production deployment is intentionally gated on operator-owned provider accounts and credentials. Do not commit `.env.local`, provider secrets, or real user data.

## Prerequisites

- Node.js 22 LTS and npm.
- GitHub repository and Vercel project.
- PostgreSQL on Neon or Supabase, with a pooled application URL and a direct migration URL.
- Google OAuth credentials, a Resend account/domain, Cloudinary, and Upstash Redis.
- Optional OpenAI API key for editor suggestions.

## Prepare the repository

1. Install Node.js 22 and run `npm install`. Commit the generated `package-lock.json`. The checked-in CI currently uses `npm install` because this workspace cannot generate a lockfile; switch CI to `npm ci` after committing the lockfile.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the pooled PostgreSQL URL and `DIRECT_URL` to the direct connection URL. Keep both server-side.
3. Generate the Prisma client and create the initial checked-in migration:

   ```sh
   npx prisma generate
   npx prisma migrate dev --name init
   ```

   Review and commit `prisma/migrations/`. This source workspace has no generated migration yet; production deploys must not proceed until it exists and has been tested against an empty database.
4. Add a follow-up migration containing the PostgreSQL expression index used by full-text search. Create a new migration directory after the generated initial migration and put this in its `migration.sql`:

   ```sql
   CREATE INDEX "Blog_search_fts_idx" ON "Blog" USING GIN (
     to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || "content"::text)
   );
   ```

   Apply and test it with `npx prisma migrate dev`, then commit it. The SQL expression must stay aligned with the search expression in `src/lib/articles.ts`.
5. Provision the first administrator from a trusted local machine with `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` of at least 20 characters, then run `npx prisma db seed`. Do not expose seed credentials in build logs or client variables.
6. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Configure providers

Set these in local server environment and Vercel Project Settings. Never prefix secrets with `NEXT_PUBLIC_`.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled TLS PostgreSQL URL for application requests. |
| `DIRECT_URL` | Yes | Direct TLS PostgreSQL URL for Prisma migrations. |
| `AUTH_SECRET` | Yes | Generate with `openssl rand -base64 32`; rotate with awareness that sessions will be invalidated. |
| `AUTH_URL` | Yes | Canonical application origin. |
| `APP_URL` | Yes | Canonical HTTPS URL used in metadata and email links. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | For Google sign-in | Configure callback `${APP_URL}/api/auth/callback/google` in Google Cloud. |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email workflows | Verify the sending domain and set the sender to that domain. |
| `CONTACT_EMAIL` | For contact form | Inbox receiving contact-form messages. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For images | Upload API requires server-side credentials. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Yes in production | Distributed rate limits fail closed in production if Redis is not configured. |
| `CRON_SECRET` | Yes for scheduling | Long random value; Vercel Cron sends it as a bearer token. |
| `OPENAI_API_KEY` | Optional | Server-only; AI suggestions are disabled when absent. Check provider data handling before sending unpublished text. |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-4.1-mini`. |

## Vercel and database rollout

1. Import the GitHub repository into Vercel and select the Next.js framework preset.
2. Add all production environment variables for Preview and Production as appropriate. Use a separate database for previews where possible.
3. Before directing production traffic, run `npm run db:deploy` from a trusted deployment job with `DIRECT_URL` set. Do not run `prisma migrate dev` in production.
4. Deploy the application. Confirm the Vercel Cron job from `vercel.json` is enabled and receives `CRON_SECRET`.
5. Add the custom domain in Vercel, configure the exact DNS records Vercel supplies, wait for domain verification, and confirm the canonical URL redirects to HTTPS.
6. Smoke-test registration, email verification, login, OAuth callback, password reset, author creation/edit/publish/scheduling, uploads, comments, likes/bookmarks/follows, reports, admin authorization, search, `sitemap.xml`, and `robots.txt`.
7. Configure database backups/retention, Vercel and provider alerts, and a documented restore test before launch.

## Troubleshooting

- `P1001`/connection timeouts: verify TLS, outbound access, `DATABASE_URL`, and Neon/Supabase pooler settings. Use `DIRECT_URL` for migration commands.
- Prisma schema/env errors: confirm both database URLs are present, run `npx prisma generate`, then `npx prisma validate`.
- Google callback errors: the callback URL must exactly match `${APP_URL}/api/auth/callback/google`; check the deployed origin and both OAuth secrets.
- No verification/reset email: confirm `RESEND_API_KEY`, `EMAIL_FROM`, domain verification, and provider logs. The app deliberately avoids revealing whether an email belongs to an account.
- `503` upload/email/AI response: the matching provider credentials are absent or invalid; configure the server variables and redeploy.
- Production rate-limited actions unavailable: configure both Upstash REST variables; production intentionally does not fall back to per-instance memory.
- Scheduled story remains a draft: check `CRON_SECRET`, Vercel Cron execution logs, and the story's future `scheduledFor` value/status.
- Build fails on fonts: Next.js downloads Google Fonts at build time; allow build-time network access or replace those fonts with self-hosted assets.
- A migration has already been applied: never edit an applied migration. Create a follow-up migration and test the rollback/restore strategy against a copy first.

## Domain, legal, and release gates

Legal text in the app is a starting point and needs jurisdiction-specific review. Validate privacy disclosures for hosting, email, AI, analytics, cookies, and retention. Verify domain ownership, HTTPS, secure cookies, rate limits, email deliverability, backup restoration, and monitoring before inviting real users.
