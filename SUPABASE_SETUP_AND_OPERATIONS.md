# ScholarPath Supabase setup and operations

## Production boundary

Supabase is the system of record for identity, student data, the verified catalogue, recommendation history, execution state, private documents and audit events. Vercel runs the Next.js web/API layer. The future iOS app must call the same versioned HTTP/RPC contracts; it must not reproduce eligibility or workflow rules on-device.

## Required environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser-safe publishable key.
- `SUPABASE_SECRET_KEY`: preferred server-only secret key. `SUPABASE_SERVICE_ROLE_KEY` remains a legacy fallback.
- `NEXT_PUBLIC_APP_URL`: canonical web origin.
- `ALLOWED_APP_ORIGINS`: comma-separated approved web origins.

Never put the secret/service-role key in a `NEXT_PUBLIC_*` variable, mobile binary, repository or client response.

## Migrations

The reviewed source migrations live in `database/`:

1. `001_foundation.sql` — profiles, assessments, reports and source registry.
2. `002_complete_product.sql` — catalogue, facts/rules, applications and operational modules.
3. `003_execution_engine.sql` — task dependencies, impact, events, reminders and readiness.
4. `004_production_backend.sql` — transactional commands, recommendation runs, tenant-safe foreign keys, rate limits, outbox, consent, imports and security hardening.

`npm run db:prepare` generates timestamped Supabase CLI migrations in `supabase/migrations/`. Never edit generated copies; edit `database/` and regenerate.

Local validation:

```powershell
npm run db:prepare
supabase db start
supabase db reset --local
supabase db lint --local --level warning
```

Remote deployment:

```powershell
supabase login
supabase link --project-ref gbhzekncpqeytknxanzy
supabase migration list
supabase db push --linked --dry-run
supabase db push --linked
```

Do not edit the production schema through Table Editor after migration tracking begins. The manual GitHub workflow `.github/workflows/deploy-database.yml` is the controlled deployment path and requires the `beta` environment plus `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` secrets.

## First administrator

Create and verify the account through Supabase Auth, then run once from a protected SQL session:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'admin');
```

Role separation:

- `research_operator`: capture sources and draft facts.
- `research_reviewer`: independently review and publish.
- `support`: read minimum support context; cannot change research truth.
- `admin`: manage roles and controlled exceptions.

## Data ingestion

Production recommendations never scrape arbitrary search results at request time and require no external AI API.

1. Capture the official owner URL in `source_records`.
2. Store an immutable source snapshot.
3. Extract atomic, source-linked facts.
4. Normalize values without replacing the original claim.
5. Encode versioned programme/scholarship rules.
6. Require a different reviewer for approval.
7. Publish only current catalogue rows and rules.
8. Evaluate the latest profile snapshot and store the full score breakdown and rule versions.

The engine output is a research priority, never an admission, scholarship or visa probability.

## Production checks

- Add localhost, preview and production URLs to Auth redirect allowlists.
- Keep email verification enabled and configure a real SMTP provider before beta invites.
- Keep `student-documents` and `confidential-references` private.
- Enable PITR on Pro before storing material student evidence; perform a restore drill.
- Run Supabase Security and Performance Advisors after every migration.
- Test with two unrelated student accounts and every staff role.
- Confirm student B cannot reference student A's application, task, document or assessment UUID.
- Confirm students cannot select recommender token hashes or confidential storage paths.
- Confirm source creators cannot approve their own facts.
- Configure error monitoring with token, email and evidence redaction.
- Process `outbox_events` through one retryable worker before enabling email notifications.

## Current deployment status

Repository implementation and application checks are ready. A production database push still requires a working Supabase MCP/CLI authentication session and the project environment keys. Do not mark the backend live until migrations, advisors and the two-account isolation test pass against project `gbhzekncpqeytknxanzy`.
