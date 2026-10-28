# Next.js Redesign Plan

## Goal
Build a modern dark student analytics experience without changing the existing Streamlit app or its live deployment until the replacement has been tested.

## Visual direction
- Dark navy surfaces with restrained blue and emerald accents
- Clear typography and a consistent spacing scale
- Thin borders and subtle elevation instead of excessive gradients/glass effects
- Responsive sidebar navigation and mobile layout
- Accessible contrast, visible focus states, and useful empty/loading/error states
- Avoid invented historical scores, confidence intervals, or metrics that are not calculated by the model

## Target architecture
- `frontend/`: Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/ui
- `backend/`: Python FastAPI service wrapping the existing scikit-learn preprocessing/training/prediction logic
- Supabase Auth for student sessions; Supabase database only for persistent history after schema and row-level security are reviewed
- Existing Streamlit `app.py` remains intact during development

## Delivery stages
1. Design shell: app layout, navigation, header, theme tokens, reusable UI components, and responsive behavior. Use realistic placeholder data clearly marked as demo data.
2. Prediction experience: build the prediction form and validation states; connect only after the API contract is defined.
3. Backend extraction: move reusable ML code into testable Python modules and expose health, metadata, and prediction endpoints. Keep CSV uploads constrained and validated.
4. Authentication and data: connect Supabase using public client configuration; enforce server-side validation and Row Level Security for any stored student records.
5. Verification: unit tests for preprocessing/prediction, API tests, frontend lint/typecheck/build, auth checks, and desktop/mobile smoke tests.
6. Preview deployment: deploy the frontend and API to separate preview services, configure environment variables, and test end-to-end before considering any production cutover.

## Initial folder proposal
```text
frontend/
  src/app/
  src/components/
  src/lib/
backend/
  app/main.py
  app/schemas.py
  app/services/
  tests/
```

## Safety rules
- Do not commit secrets, service-role keys, passwords, or real student personal data.
- Do not change `main` or the existing Streamlit deployment during the rebuild.
- Do not present mock chart values as actual student history.
- Do not persist prediction history until access rules and retention behavior are defined.
- Any future cutover requires explicit review after preview testing.
