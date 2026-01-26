# Repository Guidelines

## Project Structure & Module Organization
- `app/` uses the Next.js app router (`app/page.tsx`, route groups, and `app/api/*`).
- `_components/` holds shared UI and feature components (with primitives under `_components/ui/`).
- `styles/` contains global styles and Tailwind setup (`globals.css`, `tailwind.css`, `theme.css`, `fonts.css`).
- Global CSS is imported from `app/layout.tsx`.

## Build, Test, and Development Commands
- `npm i`: install dependencies.
- `npm run dev`: start the Next.js dev server.
- `npm run build`: create a production build in `.next/`.
- `npm run start`: run the production server.
- There is no `test` script currently configured.

## Coding Style & Naming Conventions
- Language: React with TypeScript (`.tsx`); keep components in PascalCase (e.g., `LandingPage.tsx`) and hooks/handlers in camelCase.
- Indentation in existing files is two spaces; keep that consistent.
- Use the `@` path alias for imports from the repo root (e.g., `@/_components/LoginPage`).
- Styling is primarily Tailwind utility classes; keep global CSS additions in `styles/`.

## Testing Guidelines
- No test framework is set up yet. If you add tests, document the framework and add an `npm run test` script.
- Suggested naming: co-locate tests with components, e.g., `LandingPage.test.tsx`.

## Commit & Pull Request Guidelines
- Git history contains a single commit (`first commit`), so no convention is established.
- Recommended: short, imperative commit subjects (e.g., "Add battle select animations").
- PRs should include a clear description, screenshots for UI changes, and any setup steps or commands needed to verify.

## Configuration Notes
- Next.js config lives in `next.config.ts`.
- The `@` alias resolves to the repo root for cleaner imports.
