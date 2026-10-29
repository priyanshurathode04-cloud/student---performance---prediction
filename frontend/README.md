# StudyInsight frontend

Next.js frontend for the Student Performance Prediction System. The dashboard prediction form calls the FastAPI API; Supabase authentication and saved student profiles are not connected yet.

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
