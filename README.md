# ArahIn

A clean architecture starter with a working task list and create flow. Next.js 16 App Router, strict TypeScript, React Compiler, Tailwind CSS 4, Biome, Axios, TanStack Query, React Hook Form, and Zod.

## Run locally

Use Node 24 LTS (`.nvmrc` and `.node-version`) and pnpm 10.34.5, pinned in `packageManager`.

```sh
nvm use
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm dev
```

If Corepack is unavailable, install pnpm 10.34.5 with your preferred package manager. Open [localhost:3000](http://localhost:3000). No environment variables, database, or external services are needed. `pnpm build && pnpm start` runs the production version.

Stable dependency versions were resolved during setup; `pnpm-lock.yaml` reproduces the complete installation. TypeScript is pinned to **6.0.3** because dependency-cruiser 18.2 does not support the TypeScript 7 compiler API and silently skips TypeScript modules with that version. Upgrade them together and check the reported module count.

## Architecture

```text
src/
  app/                         Next.js pages, layout, and thin route entry points
  features/tasks/
    domain/                    Task, input rules, and repository port
    application/               Framework-free list/create use cases
    infrastructure/            HTTP + memory adapters, DTOs, schemas, handlers
    presentation/              Injected UI, query hook, form schema, cache helpers
    composition.client.tsx     HTTP repository → use cases → task UI
    composition.server.ts      Memory repository → use cases → HTTP handlers
  shared/
    infrastructure/http/       Axios instance and normalized API errors
    providers/                 QueryClient provider and development devtools
tests/                         Unit tests outside the production layer graph
```

Dependencies point inward. `.dependency-cruiser.cjs` enforces these rules, including type-only imports:

- Domain imports only its own domain. No frameworks or external packages.
- Application imports only its feature's domain.
- Infrastructure imports its own infrastructure, application/domain, shared infrastructure, and declared libraries.
- Presentation imports its own presentation, application/domain, shared presentation, and UI libraries. It cannot import adapters, composition roots, Axios, or Next.js.
- Shared code cannot import features or app code. App entry points access features through composition roots.
- Circular imports, unresolved imports, undeclared packages, and production imports of development dependencies fail validation.

`Task` has an ID, title, optional description, and a `Date` timestamp. Domain normalization trims text, requires a 1–60 character title, limits descriptions to 240 characters, and removes empty descriptions. Length uses JavaScript string length (UTF-16 code units). Use cases enforce these rules before calling `TaskRepository.list()` or `TaskRepository.create(input)`.

Zod lives at the boundaries: form values, incoming JSON requests, and all successful Axios response bodies. Explicit mappers turn DTO date strings into domain `Date` objects and serialize them back for HTTP. Both browser and server use cases normalize input. The UI receives use cases as props; it never constructs a repository.

## Task API

| Request | Response |
| --- | --- |
| `GET /api/tasks` | `200 { data: TaskDto[] }`, newest first |
| `POST /api/tasks` with `{ title, description? }` | `201 { data: TaskDto }` |
| Invalid JSON or input | `400 { error: { code, message, fields } }` |
| Unexpected failure | `500 { error: { code, message } }`, generic message |

`TaskDto` uses a UUID ID and an ISO 8601 UTC `createdAt` string. The server generates both. Unknown request fields are rejected. API responses use `Cache-Control: no-store`.

Axios uses the same-origin `/api` prefix, a 10-second timeout, and clarified timeout errors. Its interceptor converts HTTP, validation, network, and timeout failures into `ApiError`. Invalid successful payloads become `INVALID_RESPONSE` before they reach the UI.

## Client behavior

Initial fetching happens in the browser using React Query and Axios; there is no SSR hydration. One browser QueryClient uses a 30-second stale time, one query retry, and no window-focus refetch. Mutations are never retried automatically. Devtools load only in development. Static page content remains a Server Component.

Submitting cancels the list query, snapshots its cache, and inserts a temporary task at the top. Success replaces that row in place with the server result, then resets and refocuses the form. Failure restores the exact prior data snapshot and retains input. An absent cache is explicitly removed on rollback because `setQueryData(undefined)` does nothing. If creation succeeds before the initial list loads, the list is marked stale to fetch the remaining tasks afterward. Refetching is disabled during the mutation so it cannot overwrite the temporary row.

The form prevents repeat submissions, has associated labels and inline errors, and announces pending/success/error states. The screen includes loading, empty, retry, and responsive layouts with visible keyboard focus and reduced-motion support.

## Extend the starter

1. Create a feature with its domain types, invariants, and repository port.
2. Add use cases against that port, with no framework imports.
3. Implement adapters and transport schemas/mappers in infrastructure.
4. Build presentation against injected use cases and domain types.
5. Wire adapters in separate client/server composition roots and expose thin app entry points.
6. Add unit tests and run `pnpm verify`.

To persist tasks, implement `TaskRepository` using a database and replace the adapter in `composition.server.ts`. The use cases and UI stay the same. Add authentication and ownership checks before using this as a shared service.

## Scripts and verification

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Development with Turbopack |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm check` / `pnpm lint` | Biome formatting, lint, and imports |
| `pnpm fix` / `pnpm format` | Safe Biome fixes / formatting |
| `pnpm typecheck` | Generate Next.js route types and strict type check |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests / watch |
| `pnpm architecture` | Enforce layer and dependency rules |
| `pnpm verify` | All checks plus production build |

GitHub Actions uses Node 24, pnpm caching, and a frozen install before running Biome, type checking, tests, architecture validation, and the production build. Tests cover domain limits, use cases, schemas, DTO mapping, API handlers, the memory adapter, Axios behavior, and optimistic cache transitions. There are no component tests, browser E2E suites, or numeric coverage gates.

Manual smoke checklist:

- Load the page: loading state resolves to two seeded tasks.
- Throttle the network and submit a valid task: a pending row appears immediately, then becomes the saved row; the form clears and title regains focus.
- Submit whitespace or over-limit input: inline errors appear and no request is sent. Direct invalid API requests return 400.
- After loading the list, use browser DevTools request blocking for `/api/tasks`, or switch offline, then submit: the row rolls back and both inputs remain available. Unblock and retry.
- Reload while blocking the API to verify the list error and retry state. A temporary local response override of `{ "data": [] }` exercises the empty state.
- Check keyboard navigation and desktop/mobile widths with no horizontal overflow.
- Restart the server and reload: the data returns to two newly seeded tasks.

## Demo limitations

The store exists only in the current server process. Hot reloads retain it, but restarts erase it. Multiple instances, workers, and serverless invocations have separate stores. There is no authentication, ownership, durable storage, synchronization between tabs, pagination, or retention bound. A request timeout can occur after the server saved a task, so reload before retrying when the outcome is uncertain. This adapter is for learning and local demonstration, not production storage.

## References

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [TanStack Query advanced SSR and QueryClient lifetime](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Biome setup](https://biomejs.dev/guides/getting-started/)
- [Axios instances](https://axios-http.com/docs/instance)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
