# AGENTS.md

This file provides guidelines for agents working on this codebase.

## Build & Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Note**: This project does not currently have a test framework configured.

## Project Overview

This is a client-side file conversion tool built with SvelteKit 2.x, Svelte 5, and TypeScript. All conversions happen in the browser - no server uploads.

## Code Style Guidelines

### Svelte 5 Runes
- Use `$state()` for reactive state variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects (use sparingly)
- Use `$props()` for component props
- Example: `let count = $state(0);`

### TypeScript
- Strict mode enabled in tsconfig.json
- Use type-only imports with `import type { ... }`
- All functions must have explicit return types inferred or declared
- Type definitions centralized in `src/lib/types/index.ts`

### Imports
- Group imports: external libraries → internal modules → type imports
- Use `$lib` alias for src/lib directory: `import { foo } from '$lib/types'`
- Keep imports at the top of the file

### Naming Conventions
- **Components**: PascalCase (e.g., `ConversionPanel.svelte`)
- **Functions**: camelCase (e.g., `convertFile`, `onFileSelect`)
- **Constants**: UPPER_CASE for global constants (e.g., `FORMAT_MAP`)
- **Types/Interfaces**: PascalCase (e.g., `FileFormat`, `ConversionJob`)
- **Files**: kebab-case (e.g., `pdf-utils.ts`, `drop-zone.svelte`)

### File Organization
```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── converters/     # File conversion logic
│   └── types/          # TypeScript type definitions
└── routes/            # SvelteKit pages
```

### Error Handling
- Use try/catch for async operations
- Provide descriptive error messages
- Update job state with error information: `{ ...job, status: 'error', error: message }`

### Styling
- Uses Tailwind CSS v4 with `@import "tailwindcss"`
- Custom CSS variables defined in `@theme` block in `app.css`
- Prefers utility classes over inline styles
- Use CSS variables for theming: `var(--color-bg-primary)`

### Async Operations
- Use progress callbacks for long-running operations: `(progress: number) => void`
- Report progress incrementally throughout the conversion
- Example: `onProgress?.(currentStep / totalSteps * 100)`

### File Conversions
- All conversion functions return `Promise<Blob>`
- Functions follow pattern: `[source]To[Target](file: File, onProgress?: ProgressCallback): Promise<Blob>`
- Register converters in `src/lib/converters/engine.ts` with key format: `'source->target'`

### Type Safety
- File formats are strictly typed using `FileFormat` union type
- Always validate format before conversion
- Use type guards where appropriate

### No Comments
- Do not add comments to code
- Write self-documenting code with clear variable and function names