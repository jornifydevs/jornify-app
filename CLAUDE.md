# CLAUDE.md - Jornify Project Guidelines

## Project Overview

Jornify is a time tracking and workforce management application built with Next.js App Router and Supabase. It allows workers to clock in/out and view their work history, while admins can view statistics and manage the workforce.

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, Lucide icons
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe, Lemon Squeezy
- **Email**: Mailgun
- **Testing**: Vitest
- **Package Manager**: pnpm

## Architecture: Hexagonal (Ports & Adapters)

This project follows hexagonal architecture. **Respect the layer boundaries strictly.**

```
src/
├── core/                          # Pure business logic - NO external dependencies
│   ├── domain/
│   │   ├── entities/              # TypeScript interfaces (camelCase)
│   │   ├── ports/
│   │   │   ├── repositories/      # Repository interfaces (contracts)
│   │   │   └── services/          # External service interfaces
│   │   └── errors/                # Domain error hierarchy
│   └── application/
│       ├── use-cases/             # Business operations (one class per use case)
│       └── dtos/                  # Data transfer objects
│
├── infrastructure/                # Implementations of ports
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   ├── middleware.ts          # Auth middleware
│   │   └── repositories/         # Supabase implementations of repository ports
│   ├── email/                     # Mailgun adapter
│   └── payment/                   # Stripe & Lemon Squeezy adapters
│
├── app/                           # Next.js App Router (presentation layer)
│   ├── dashboard/
│   │   ├── page.tsx               # Server component: auth + routing
│   │   ├── _components/           # UI components (pure rendering)
│   │   └── _hooks/                # Custom hooks (bridge: UI ↔ use cases)
│   ├── auth/                      # Authentication pages and routes
│   └── api/                       # API routes
│
├── components/                    # Shared UI components (shadcn/ui, forms)
├── lib/                           # Shared utilities (cn() for shadcn)
└── __tests__/                     # Test files (mirrors src/core structure)
```

### Layer Rules

1. **`core/domain/`** - NEVER imports from `infrastructure/`, `app/`, or external libraries (Supabase, Stripe, etc.). Only pure TypeScript types and classes.
2. **`core/application/`** - Only imports from `core/domain/`. Use cases receive repository/service interfaces via constructor injection.
3. **`infrastructure/`** - Implements the port interfaces defined in `core/domain/ports/`. This is the only layer that depends on Supabase, Stripe, Mailgun, etc.
4. **`app/`** - Presentation layer. Server components instantiate repositories and use cases. Client components use custom hooks that bridge UI state with use cases.
5. **Dependencies always flow inward**: `app → infrastructure → core/application → core/domain`

### Import Path Alias

Always use `@/` for imports (maps to `src/`). Example: `import { ClockInUseCase } from "@/core/application/use-cases/time-tracking/clock-in.use-case"`.

## Naming Conventions

| Element           | Convention                            | Example                                 |
| ----------------- | ------------------------------------- | --------------------------------------- |
| React components  | PascalCase                            | `TimeTracker.tsx`, `AdminDashboard.tsx` |
| Hooks             | camelCase with `use` prefix           | `useTimeTracker.ts`                     |
| Use cases         | kebab-case with `.use-case.ts` suffix | `clock-in.use-case.ts`                  |
| Repository ports  | kebab-case with `.repository.ts`      | `workday.repository.ts`                 |
| Repository impls  | kebab-case with `supabase-` prefix    | `supabase-workday.repository.ts`        |
| Domain entities   | kebab-case                            | `time-record.ts`                        |
| DTOs              | kebab-case with `.dto.ts`             | `dashboard.dto.ts`                      |
| Test files        | `.test.ts` suffix mirroring source    | `clock-in.use-case.test.ts`             |
| Domain errors     | PascalCase classes                    | `NotFoundError`, `ClockError`           |
| Entity properties | camelCase                             | `workerId`, `startHour`, `typeDay`      |
| DB columns        | snake_case (mapped in repositories)   | `worker_id`, `start_hour`               |

## Creating New Features

### 1. Define the entity (if new)

Create in `src/core/domain/entities/` and re-export from `index.ts`.

### 2. Define the port (repository interface)

Create in `src/core/domain/ports/repositories/`. Define only the methods the domain needs.

### 3. Create the use case

Create in `src/core/application/use-cases/<feature>/`. Inject dependencies via constructor:

```typescript
export class MyUseCase {
  constructor(private myRepo: MyRepository) {}

  async execute(input: string): Promise<Result> {
    // Business logic here - use domain errors for failures
    throw new NotFoundError("Entity");
  }
}
```

### 4. Implement the repository

Create in `src/infrastructure/supabase/repositories/`. Always include a `toDomain()` mapper to convert snake_case DB rows to camelCase domain entities.

### 5. Connect from presentation

- **Server components**: Instantiate repositories and use cases directly in the component.
- **Client components**: Create a custom hook in `_hooks/` that instantiates repos/use cases and manages React state. The UI component in `_components/` only renders.

### 6. Write tests

Create in `src/__tests__/` mirroring the source path. Mock repository ports (never Supabase directly).

## Error Handling

Use the domain error hierarchy from `src/core/domain/errors/domain-errors.ts`:

- `DomainError` - Base class (abstract, do not throw directly)
- `NotFoundError` - Entity not found
- `UnauthorizedError` - Auth/permission failure
- `ValidationError` - Invalid input data
- `ClockError` - Time tracking specific errors

In hooks, catch errors with:

```typescript
catch (e) {
  const message = e instanceof DomainError ? e.message : "Fallback message";
  setError(message);
}
```

Never use `alert()` for errors. Display them in the UI via error state.

## Database Mapping

The database uses snake_case. Domain entities use camelCase. Each Supabase repository must include:

- A `Row` interface matching the DB schema (snake_case)
- A `toDomain(row)` private method that maps Row → Entity (camelCase)
- Reverse mapping in `create()`/`update()` methods (camelCase → snake_case)

## Testing

- **Framework**: Vitest (config in `vitest.config.ts`)
- **Run**: `npm run test` (single run), `npm run test:watch` (watch mode)
- **Location**: `src/__tests__/core/application/use-cases/`
- **Pattern**: Unit tests for use cases using mocked repository ports
- **Rule**: Every new use case MUST have tests. Test the happy path, edge cases, and error cases.

Example test structure:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("MyUseCase", () => {
  let myRepo: MyRepository;
  let useCase: MyUseCase;

  beforeEach(() => {
    myRepo = {
      findById: vi.fn(),
      // ... mock all interface methods
    };
    useCase = new MyUseCase(myRepo);
  });

  it("does what it should", async () => {
    vi.mocked(myRepo.findById).mockResolvedValue(mockData);
    const result = await useCase.execute("id");
    expect(result).toEqual(expected);
  });
});
```

## Commands

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run lint          # ESLint
npm run format        # Prettier
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Responsive Design

All UI must be **mobile-first and fully responsive**. The app is designed to be used on mobile devices (phones and tablets) as well as desktop.

- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) starting from mobile layout.
- Every new component or page must work correctly on screens from 320px wide.
- Test layouts at mobile (375px), tablet (768px), and desktop (1280px) breakpoints.
- Avoid fixed widths. Use `max-w-*`, `w-full`, and flex/grid layouts.
- Touch targets (buttons, links) must be at least 44x44px on mobile.

## Internationalization (i18n)

Every new component and page **must be prepared for i18n**:

- **No hardcoded user-facing strings**. Use `useTranslations` (client) or `getTranslations` (server) from `next-intl`.
- Add all new translation keys to **both** `messages/es.json` and `messages/en.json` simultaneously.
- Choose a namespace that matches the feature path (e.g. `dashboard.admin.company`, `dashboard.profile`).
- For client components: `const t = useTranslations("my.namespace");`
- For server components: `const t = await getTranslations("my.namespace");`
- Errors in hooks must also use `useTranslations` — never hardcode error messages.

## Key Rules

- **No business logic in React components**. Extract to use cases.
- **No direct Supabase calls from components or hooks**. Always go through repositories.
- **No `alert()` or `console.error` for user-facing errors**. Use the error state pattern.
- **No unused code**. Delete dead files, don't comment them out.
- **No `any` types**. Use proper interfaces and generics.
- **All use cases must have unit tests** with mocked ports.
- **All UI must be responsive**. Design mobile-first, test at all breakpoints.
- **Verify after changes**: Run `npm run build` and `npm run test` after every significant change.
