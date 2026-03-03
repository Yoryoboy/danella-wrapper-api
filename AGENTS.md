# Repository Guidelines

## Project Structure & Module Organization
This repository hosts the Danella-X wrapper API in TypeScript.

Recommended maintainable/scalable layout:

```text
src/
  modules/
    auth/
      domain/          # Entities + contracts (no framework deps)
      application/     # Use cases (login, logout, validate)
      infrastructure/  # Danella HTTP client, cookie adapters
      interfaces/      # Controllers, DTOs, route wiring
    tasks/
      domain/
      application/
      infrastructure/
      interfaces/
  shared/
    domain/            # Common errors, value objects
    infrastructure/    # Logger, cache, HTTP utilities
    interfaces/        # Global middleware, API response mappers
  config/              # env, constants, bootstrap config
  app.ts               # Express composition root
  server.ts            # process entrypoint
tests/
  unit/
  integration/
```

Rules:
- `domain` must be framework-agnostic and reusable.
- `application` orchestrates business rules; no direct Express usage.
- `infrastructure` contains external integrations (Danella, cache, persistence).
- `interfaces` is the HTTP boundary (validation, DTO mapping, status codes).

## API Objective (From ARCHITECTURE.md)
This API is intended to wrap the legacy Danella-X web app behind clean REST endpoints.

- Expose task operations as predictable JSON endpoints (instead of consuming SSR HTML/embedded JS directly).
- Handle Danella-X authentication through cookie forwarding, including anti-CSRF token flow and session cookies.
- Centralize scraping/parsing complexity inside the API so client apps can integrate with a simpler contract.
- Improve reliability and integration speed with normalized responses and cache-ready service boundaries.

Keep deep technical details in `ARCHITECTURE.md`; this file only captures contributor-facing intent and rules.

## API Design Principles (Skill-Based)
- Use resource-oriented REST naming (`/api/v1/tasks`, `/api/v1/tasks/{id}`), not action verbs.
- Preserve HTTP semantics: `GET` read, `POST` create, `PUT/PATCH` update, `DELETE` remove.
- Standardize pagination/filtering on collections (`page`, `limit`, `status`, `search`).
- Keep error responses consistent with stable machine-readable codes.
- Version from day one (`/api/v1`) to avoid breaking clients on future changes.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm test`: placeholder only (currently prints "No tests configured yet").
- `npx tsc --noEmit`: type-check TypeScript sources.

Example workflow:
```bash
npm install
npx tsc --noEmit
```

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`, `module: NodeNext`, `target: ES2022`).
- Indentation: 2 spaces; semicolons required; prefer double quotes to match existing files.
- Naming:
  - files: kebab-case
  - types/interfaces: PascalCase, e.g. `ProbeConfig`
  - functions/variables: camelCase
  - env vars: UPPER_SNAKE_CASE (`DANELLA_BASE_URL`)
- Favor small, pure helpers and keep side effects at controller/service boundaries.

## Testing Guidelines
No formal test framework is configured yet. Until one is added:

- Treat `npx tsc --noEmit` as the minimum gate.
- Validate endpoint behavior locally with controlled test data.

When tests are introduced, place them under `tests/` or alongside modules as `*.test.ts`.

## Commit & Pull Request Guidelines
Git history is minimal, so enforce a clear standard now:

- Commit messages: imperative and scoped (e.g., `feat: add token fallback for login probe`, `fix: handle missing set-cookie header`).
- Keep commits focused; separate refactors from behavior changes.
- PRs should include:
  - purpose and summary of endpoint behavior changes
  - linked issue/task (if available)
  - sample verification steps/commands
  - any `.env.example` updates when introducing new config

## Postman Documentation Requirement
Each new endpoint must be documented in Postman before a PR is considered complete.

- Use the Postman MCP tools to create/update request docs.
- Target collection name: `danella-wrapper-api`.
- Minimum per endpoint: method, URL/path, params/body schema, auth requirements, example request, and example response.
- Keep Postman docs synchronized with code changes in the same PR.

## Security & Configuration Tips
- Never commit real credentials in `.env`.
- Do not commit personal test/probe files; keep them local and ignored.
- Redact tokens/passwords in logs and examples.
