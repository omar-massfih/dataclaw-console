# dataclaw-console (Frontend)

React + TypeScript frontend for the DataClaw console (Vite-based scaffold).

## Getting Started

1. Install dependencies:
   - `npm install`
2. Copy environment file:
   - `cp .env.example .env`
3. Start development server:
   - `npm run dev`

## Available Scripts

- `npm run dev` - Start local development server
- `npm run build` - Type-check and build production assets
- `npm run preview` - Preview built app locally
- `npm run test` - Run unit/component tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run format` - Format files with Prettier
- `npm run prepare` - Install Husky git hooks

## Project Structure

```text
src/
  assets/         Static imported assets
  components/     Reusable UI components
  features/       Feature-scoped modules
  hooks/          Shared hooks
  lib/            API client, env access, utilities
  pages/          Route-level pages/screens
  styles/         Global styles and design tokens
  test/           Test setup utilities
  types/          Shared TypeScript types
```

## Conventions

- Put feature-specific code in `src/features/<feature>`.
- Route API calls through `src/lib/api-client.ts`.
- Access environment variables through `src/lib/env.ts` only.
- Keep `AGENTS.md` and `README.md` updated when conventions or setup change.
