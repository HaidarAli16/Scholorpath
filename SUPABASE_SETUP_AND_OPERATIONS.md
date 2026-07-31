# ScholarPath Supabase Setup and Operations

## Environment

Create `.env.local` from `.env.example` with the Supabase project URL, publishable key, and server-only service-role key. Never expose or commit the service-role key.

## Migrations

Apply in order through a reviewed Supabase migration or SQL editor session:

1. `database/001_foundation.sql`
2. `database/002_complete_product.sql`

The complete migration creates product entities, indexes, row-level security, role helpers, audit events, and two private buckets:

- `student-documents`: user-scoped paths beginning with `auth.uid()`.
- `confidential-references`: no student read policy; only token-validated server routes create uploads.

## First administrator

Create the first user through Supabase Auth, then grant the admin role from a protected SQL session:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'admin');
```

Recommended separation:

- `research_operator`: capture sources and prepare facts.
- `research_reviewer`: independently review and publish facts.
- `support`: view only minimum support context.
- `admin`: manage roles and high-risk operations.

## Data ingestion workflow

ScholarPath does not require an external AI API for recommendations.

1. Capture an official URL in `source_records`.
2. Store an immutable page/document snapshot in `source_snapshots`.
3. Extract one factual field at a time into `fact_records`.
4. Normalize it without overwriting the source value.
5. Create versioned `atomic_rules` for programme or scholarship evaluation.
6. Require an independent reviewer for high-impact facts.
7. Publish the catalogue record and its rules.
8. The deterministic engine evaluates the latest assessment and stores explainable `match_evaluations`.

Each result contains state, score, reason codes, open checks, failed gates, rule versions, source freshness, and engine version. The score prioritizes research routes; it is not an admission probability.

## API map

- `POST /api/assessment`: validate, generate, and persist assessment, report, and tasks.
- `GET|POST /api/workspace`: load and mutate the authenticated student workspace.
- `POST /api/recommendations`: evaluate published catalogue rules.
- `POST /api/documents/upload-url`: issue a signed private upload.
- `POST /api/documents/complete`: create the document record.
- `GET /api/documents/:id/download`: issue a 60-second signed download.
- `POST /api/references/invite`: create a 30-day confidential invitation.
- `/api/references/:token/*`: validate and submit a confidential PDF.
- `GET|POST /api/operations`: staff queue, capture, review, conflict, publication, and audit.
- `GET /api/auth/status`: report configured, live, or demo state.

## Required Supabase configuration

- Add the production domain and `http://localhost:3000` to Auth URLs.
- Add `/auth/callback` to allowed redirect URLs.
- Keep email confirmation enabled for beta.
- Enable point-in-time recovery before material student data is stored.
- Keep both storage buckets private.
- Verify restoration, not only backup creation.
- Store the service key only in server environment variables.

## Pre-beta security checks

- Test RLS using two separate student accounts.
- Confirm one student cannot access another student's files or records.
- Confirm students cannot retrieve confidential recommender content.
- Confirm research operators cannot self-approve a fact.
- Confirm unpublished or stale facts do not appear as verified matches.
- Confirm deadline source timezone is retained.
- Add malware scanning before broader file formats are accepted.
- Configure transactional email for auth, deadlines, and recommender invitations.
- Configure error monitoring with token and student-evidence redaction.

## Current local behavior

Without Supabase environment values, the UI runs in `Demo` mode. Persistence routes reject unsafe writes and all modules remain inspectable. After valid keys and migrations are supplied, authenticated sessions report `Live` and use the private workspace.