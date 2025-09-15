# Portfolio Builder — Frontend

This is the React + TypeScript frontend for the Portfolio Builder. It uses Vite, TailwindCSS, Vitest, and a feature-based structure.

## Tech Stack
- React 19 + TypeScript (Vite)
- TailwindCSS (with PostCSS + Autoprefixer)
- React Router DOM
- Zustand (state management)
- Axios (HTTP client)
- React Hook Form
- React Toastify (toasts)
- Vitest + Testing Library (unit tests) and Playwright (configured for e2e)
- ESLint (TypeScript + React Hooks + Vite refresh)

## Prerequisites
- Node.js 18+ (recommended LTS)
- npm 9+

## Getting Started (Local Development)
1. Install dependencies
   npm install

2. Start the dev server
   npm run dev

   - Default Vite URL: http://localhost:5173

3. Open the app
   - The root element is defined in `index.html` and bootstrapped in `src/main.tsx`.

## Build & Preview (Production-like)
1. Build
   npm run build

   - Runs TypeScript build (project references) and Vite production build.

2. Preview the production build locally
   npm run preview

   - Serves the contents of `dist/` at a local URL.

## Testing
- Run unit tests (Vitest)
  npm test

- Run tests with the Vitest UI
  npm run test:ui

- Test environment
  - Configured in `vite.config.ts` with `environment: 'jsdom'`
  - Global setup in `src/tests/setup.ts` (includes `@testing-library/jest-dom`)

## Linting
- Run ESLint
  npm run lint

- ESLint config: `eslint.config.js`
  - Based on `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`

## Styling (TailwindCSS)
- Tailwind config: `tailwind.config.js`
  - Content paths: `index.html`, `src/**/*.{js,ts,jsx,tsx}`
  - Extended theme includes:
    - fontFamily: `poppins`
    - title typography scales: `text-title-xl`, `text-title-lg`, `text-title-md`, `text-title-sm`
    - title weights: `font-title-normal`, `font-title-bold`
    - letter spacing variants: `tracking-title-*`
    - colors: `text-title` (#354052)
    - margin utilities: `mt-title-top`, `ml-title-left`
- PostCSS config: `postcss.config.js`
- Global styles entry: `src/index.css`

## Project Structure (high level)
- `src/`
  - `features/UploadCV/`
    - `UploadCV.tsx` — Upload page container
    - `UploadArea.tsx` — Drag & drop/file input component
    - `UploadCV.types.ts` — Component types
  - `components/` — Shared components (future)
  - `state/` — Zustand stores (future)
  - `services/` — API clients (Axios)
  - `utils/` — Utilities/helpers
  - `tests/` — Unit tests setup and suites
  - `assets/` — Static assets (images, icons)
  - `main.tsx` — App bootstrap
  - `App.tsx` — Root app component

## Common Scripts
- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check + production build
- `npm run preview` — Preview production build locally
- `npm run test` — Run unit tests (Vitest)
- `npm run test:ui` — Run Vitest with UI
- `npm run lint` — Lint codebase

## Environment Variables
Currently, there are no required frontend environment variables. If/when API endpoints are added, create a `.env` file at the project root (next to `package.json`) with Vite-prefixed vars (e.g., `VITE_API_BASE_URL=https://api.example.com`) and access them via `import.meta.env.VITE_API_BASE_URL`.

## Running Against a Backend
- If you also run a backend locally (e.g., FastAPI), configure the frontend to hit the correct base URL using `VITE_*` env variables and Axios config in `src/services/`.
- Consider enabling CORS on the backend for localhost development.

## Troubleshooting
- Port already in use: set a different port `npm run dev -- --port 5174`
- Tailwind classes not applied: ensure content globs in `tailwind.config.js` include your paths and restart dev server after config changes.
- Typescript build errors: run `npm run build` to see full diagnostics.
- Tests fail due to DOM APIs: ensure `environment: 'jsdom'` remains configured in `vite.config.ts`.

## Notes for Contributors
- Follow the feature-based structure under `src/features/`
- Prefer Tailwind utilities; extract repeated styles into Tailwind theme extensions as needed
- Keep components typed with TypeScript
- Write unit tests for new UI behavior and hooks

---
If anything is unclear or you need onboarding help, ping the team on the project channel.
