# StudyInsight frontend preview

This folder contains the first visual shell for the planned Next.js frontend. It is intentionally not connected to Supabase or the model API yet.

## Requirements
- Node.js 20.9+ (use a currently supported LTS release)
- npm

## Run locally
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
The score chart is marked as illustrative. Do not use it as actual student history or model output. No secrets belong in this folder. Use a frontend-safe Supabase publishable/anon key only; never expose a service-role key.
