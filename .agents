# Agent Development Rules

## File Naming Conventions

### TypeScript/JavaScript Files
- Use **camelCase** for all TypeScript and JavaScript module filenames
  - ✅ `useBlocks.ts`, `queryClient.ts`, `userService.ts`
  - ❌ `use-blocks.ts`, `query-client.ts`, `user-service.ts`

### React Components
- Use **PascalCase** for React component files
  - ✅ `Header.tsx`, `TimelineView.tsx`, `BlockCard.tsx`
  - ❌ `header.tsx`, `timeline-view.tsx`, `block-card.tsx`

### Test Files
- Follow the source file naming with `.test.ts` or `.test.tsx` suffix
  - ✅ `validation.test.ts`, `BlockCard.test.tsx`
  - ❌ `validation.spec.ts`, `block-card.test.tsx`

### Special Files
- Configuration files may use kebab-case as required by tooling
  - `tsconfig.json`, `vite.config.ts`, `eslint.config.js`

## Code Style

### Imports
- Use named imports over default imports where possible
- Group imports: external libraries, internal modules, types, styles
- Sort imports alphabetically within groups

### Functions and Variables
- Use **camelCase** for functions and variables
- Use **PascalCase** for types, interfaces, and classes
- Use **UPPER_SNAKE_CASE** for constants

### TypeScript
- Prefer `type` over `interface` unless extending is needed
- Use explicit return types for exported functions
- Avoid `any` - use `unknown` if type is truly unknown

## Project Structure

```
src/
├── components/        # React components (PascalCase)
├── routes/           # File-based routes (TanStack Router)
├── lib/              # Business logic and utilities
│   ├── hooks/        # Custom React hooks (camelCase)
│   ├── storage/      # Database/storage services (camelCase)
│   └── utils/        # Utility functions (camelCase)
└── types/            # TypeScript type definitions
```

## Git Commits

- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep commits focused and atomic
- Write descriptive commit messages

## Testing

- Write unit tests for business logic and utilities
- Place tests in `__tests__` directory next to source files
- Aim for high coverage on critical paths (validation, storage)
- Use descriptive test names that explain the scenario
