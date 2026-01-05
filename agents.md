# Agent Development Rules

This guide is for AI coding agents working in the planner-app codebase. Follow these conventions strictly.

## Commands

### Development

```bash
pnpm dev              # Start dev server on port 3001
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Testing

```bash
pnpm test             # Run all tests once (vitest)
vitest                # Run tests in watch mode
vitest run            # Run tests once (same as pnpm test)
vitest <file-path>    # Run a single test file
vitest validation     # Run tests matching "validation"
```

**Single test examples:**

```bash
vitest src/lib/utils/__tests__/validation.test.ts
vitest validation.test
```

### Linting & Formatting

```bash
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm check            # Format + lint with fixes
```

The project uses **lint-staged** with **husky** - all commits are auto-formatted and linted.

## File Naming Conventions

### TypeScript/JavaScript Files

- Use **camelCase** for all TypeScript and JavaScript module filenames
  - ✅ `useBlocks.ts`, `queryClient.ts`, `validation.ts`
  - ❌ `use-blocks.ts`, `query-client.ts`, `validation-utils.ts`

### React Components

- Use **PascalCase** for React component files
  - ✅ `Header.tsx`, `Timeline.tsx`, `BlockCard.tsx`
  - ❌ `header.tsx`, `timeline-view.tsx`, `block-card.tsx`

### Test Files

- Follow source file naming with `.test.ts` or `.test.tsx` suffix
- Place in `__tests__` directory next to source files
  - ✅ `src/lib/utils/__tests__/validation.test.ts`
  - ❌ `validation.spec.ts`, `tests/validation.test.ts`

### Special Files

- Configuration files use kebab-case as required by tooling
  - `tsconfig.json`, `vite.config.ts`, `eslint.config.js`

## Code Style

### Prettier Configuration

```js
{
  semi: false,              // No semicolons
  singleQuote: true,        // Single quotes for strings
  trailingComma: "all",     // Trailing commas everywhere
}
```

**Always run `pnpm format` before committing** (or let husky do it).

### Imports

- **Prefer named imports** over default imports
- **Group imports** in this order:
  1. External libraries (React, TanStack, date-fns, etc.)
  2. Internal modules (relative imports from `../`)
  3. Types (import type)
  4. Styles (if any)
- **Sort alphabetically** within each group

**Example:**

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { parseISO, format } from 'date-fns'
import { createBlock, updateBlock } from '../storage'
import type { Block, BlockInput } from '../../types'
```

### TypeScript

#### Type Definitions

- **Prefer `type` over `interface`** unless you need to extend
- **Use explicit return types** for all exported functions
- **Avoid `any`** - use `unknown` if the type is truly unknown
- Enable strict mode (already configured in `tsconfig.json`)

**Example:**

```typescript
// ✅ Good - explicit return type
export function calculateDuration(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start))
}

// ✅ Good - type alias
type BlockStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'

// ❌ Avoid interface unless extending
interface BlockStatus { ... }
```

#### Path Aliases

- Use `@/*` for absolute imports from `src/`
- Configured in `tsconfig.json` and `vite.config.ts`

```typescript
// ✅ Good
import { Block } from '@/types'
import { useBlocks } from '@/lib/hooks'

// ❌ Avoid deep relative paths
import { Block } from '../../../types'
```

### Naming Conventions

- **Functions & Variables**: `camelCase`
  - `calculateDuration`, `blockLayout`, `isValid`
- **Types & Interfaces**: `PascalCase`
  - `Block`, `BlockInput`, `BlockLayout`
- **Constants**: `UPPER_SNAKE_CASE`
  - `SLOT_MINUTES`, `TYPE_COLORS`, `STATUS_COLORS`
- **React Components**: `PascalCase` (function names and files)
  - `BlockCard`, `Timeline`, `Header`
- **Custom Hooks**: `camelCase` starting with `use`
  - `useBlocks`, `usePreferences`, `useTimerState`

### Error Handling

- **Throw descriptive errors** with helpful messages
- **Validate inputs** before processing (especially dates/times)
- **Use Result types** for validation functions

**Example:**

```typescript
// ✅ Good - descriptive error
if (!existing) {
  throw new Error(`Block with id ${id} not found`)
}

// ✅ Good - validation with result type
export function validateBlockTimes(
  start: string,
  end: string,
): {
  valid: boolean
  error?: string
} {
  if (startDate >= endDate) {
    return { valid: false, error: 'Start time must be before end time' }
  }
  return { valid: true }
}
```

## Project Structure

```
src/
├── components/        # React components (PascalCase)
│   ├── BlockCard.tsx
│   ├── Header.tsx
│   └── Timeline.tsx
├── routes/           # File-based routes (TanStack Router)
│   ├── __root.tsx
│   ├── index.tsx
│   └── day/$date.tsx
├── lib/              # Business logic and utilities
│   ├── hooks/        # Custom React hooks (camelCase)
│   │   ├── useBlocks.ts
│   │   └── usePreferences.ts
│   ├── storage/      # IndexedDB services (camelCase)
│   │   ├── db.ts
│   │   ├── blocks.ts
│   │   └── days.ts
│   ├── utils/        # Utility functions (camelCase)
│   │   ├── validation.ts
│   │   └── __tests__/
│   │       └── validation.test.ts
│   └── context/      # React Context providers
│       └── TimerContext.tsx
└── types/            # TypeScript type definitions
    └── index.ts
```

## Technology Stack

- **Framework**: React 19 + TanStack Router (file-based routing)
- **State Management**: TanStack Query + Zustand
- **Database**: IndexedDB (via `idb` library)
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 7
- **Testing**: Vitest + Testing Library
- **Date/Time**: date-fns
- **Icons**: lucide-react

## Testing Guidelines

- **Write tests for all business logic** (validation, storage, utilities)
- **Use descriptive test names** that explain the scenario
- **Place tests in `__tests__` directory** next to source files
- **Aim for high coverage** on critical paths (validation, storage)
- **Use Testing Library** for component tests
- **Use Vitest** for unit tests

**Test structure:**

```typescript
import { describe, expect, it } from 'vitest'

describe('functionName', () => {
  it('should do something when condition', () => {
    const result = functionName(input)
    expect(result).toBe(expected)
  })
})
```

## Git Commit Conventions

Use **conventional commits** format:

```
type: description

Examples:
feat: add pomodoro timer component
fix: correct overlap detection logic
docs: update README with setup instructions
style: format code with prettier
refactor: extract validation logic to utils
test: add tests for block overlap detection
chore: update dependencies
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Guidelines**:

- Keep commits focused and atomic
- Write descriptive commit messages (explain the "why")
- Reference issue numbers when applicable (#123)
