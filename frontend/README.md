# StudyInsight frontend

Next.js frontend for the Student Performance Prediction System. Supabase Auth provides student sign-in and registration, and row-level-secured database tables store student profiles and prediction history. The dashboard calls the FastAPI prediction API.

## Requirements
- Node.js 22 (matches the CI workflow)
- npm

## Run locally
1. Start the backend by following `../backend/README.md`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`.
4. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Checks
```bash
npm run typecheck
npm run lint
npm run build
```

## Important
- The score trend chart is illustrative, not actual student history.
- The model uses a small synthetic dataset and is for demonstration only.
- No secrets belong in the frontend. Use only a Supabase publishable/anon key in browser code; never expose a service-role key.
- For a deployed frontend, set `NEXT_PUBLIC_API_URL` to the deployed API URL and set backend `FRONTEND_ORIGIN` to the exact frontend origin.


## Supabase authentication and saved history

The frontend uses Supabase Auth with a generated Student ID (format STU- plus 12 hexadecimal characters) and a password. IDs are mapped to a reserved, non-inbox address for this classroom prototype. Because those addresses cannot receive email, configure Authentication → Sign In / Providers → Email → Confirm email according to your prototype's needs before testing ID/password registration. For a real deployment, use verified student email addresses and a password recovery flow.

1. Copy .env.example to .env.local.
2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the Supabase project's Connect/API settings. A legacy anon key is also accepted by the client. Never use a service-role/secret key in the frontend.
3. Apply the migration at ../supabase/migrations/20261029000000_student_profiles_and_predictions.sql to your development Supabase project using the Supabase CLI or SQL Editor. The GitHub integration does not automatically apply migrations to your current database merely because the files are committed.
4. Run npm install, npm run typecheck, npm run lint, and npm run build.

The migration creates a profile row when an Auth user is created and uses row-level security to limit profile and prediction-history access to the signed-in user. Test it against a development project before applying it to production. The prediction API remains a separate service; use a deployed HTTPS API URL for a hosted frontend.
