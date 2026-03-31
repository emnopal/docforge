# AGENTS.md

This file provides guidelines for agents working on this codebase.

## Build & Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run check            # Run TypeScript and Svelte checks
npm run check:watch      # Watch mode for type checking
```

**Note**: This project does not currently have a test framework configured.

## Project Overview

This is a client-side file conversion tool built with SvelteKit 2.x, Svelte 5, and TypeScript. All conversions happen in the browser - no server uploads.

## Module Architecture

This application follows a module-based structure where each feature is a self-contained module:

- **Landing Page**: Located at `./src/routes/+page.svelte` lists all available modules
- **Module Route**: Each module has its own route at `./src/routes/<route_name>/+page.svelte`
- **Business Logic**: Module-specific logic goes in `./src/lib`
- **Type Definitions**: All shared types defined in `./src/lib/types`
- **Reusable Components**: General/useful components in `./src/lib/components/<name_components>.svelte`

To create a new module:

1. Create route directory: `./src/routes/<route_name>/+page.svelte`
2. Add business logic to appropriate `./src/lib` subdirectory
3. Add types to `./src/lib/types/index.ts` if needed
4. Create reusable components in `./src/lib/components/` if applicable
5. Update landing page at `./src/routes/+page.svelte` to include the new module

## Code Style Guidelines

### Svelte 5 Runes

- Use `$state()` for reactive state variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects (use sparingly)
- Use `$props()` for component props with destructuring
- Example: `let { job, onDownload, onReset }: { job: ConversionJob; onDownload: () => void; onReset: () => void; } = $props();`

### TypeScript

- Strict mode enabled in tsconfig.json
- Use type-only imports with `import type { ... }`
- All functions must have explicit return types inferred or declared
- Type definitions centralized in `src/lib/types/index.ts`
- Use `any` sparingly; prefer unknown or specific types

### Imports

- Group imports: external libraries → internal modules → type imports
- Use `$lib` alias for src/lib directory: `import { foo } from '$lib/types'`
- Keep imports at the top of the file
- Use dynamic imports for heavy libraries in converter functions: `const library = await import('library-name');`
- Example:
  ```typescript
  import { FORMAT_MAP, type FileFormat, type ConversionJob } from "$lib/types";
  import type { ProgressCallback } from "$lib/types";
  ```

### Naming Conventions

- **Components**: PascalCase (e.g., `ConversionPanel.svelte`)
- **Functions**: camelCase (e.g., `convertFile`, `onFileSelect`)
- **Constants**: UPPER_CASE for global constants (e.g., `FORMAT_MAP`, `ACCEPT`)
- **Types/Interfaces**: PascalCase (e.g., `FileFormat`, `ConversionJob`)
- **Files**: kebab-case (e.g., `pdf-utils.ts`, `drop-zone.svelte`)

### File Organization

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components (general-use across modules)
│   ├── converters/     # File conversion logic (module-specific)
│   └── types/          # TypeScript type definitions (shared across all modules)
└── routes/            # SvelteKit pages (one directory per module)
    ├── +page.svelte                    # Landing page (module directory)
    └── <route_name>/                   # Module routes
        └── +page.svelte                # Module's main page
```

### Component Patterns

- Use `$props()` for component props at the top of the script section
- Use `$state()` for local reactive state
- Use `$derived()` for computed values based on state or props
- Bind DOM elements with `bind:this` when needed
- Use svelte-ignore comments sparingly for intentional a11y exceptions

### Error Handling

- Use try/catch for async operations
- Provide descriptive error messages
- Update job state with error information: `{ ...job, status: 'error', error: message }`
- Use optional chaining for callbacks: `onProgress?.(value)`

### Styling

- Uses Tailwind CSS v4 with `@import "tailwindcss"`
- Custom CSS variables defined in `@theme` block in `app.css`
- Prefers utility classes over inline styles
- Use CSS variables for theming: `var(--color-bg-primary)`
- Use color-mix function for dynamic colors: `color-mix(in srgb, ${color} 20%, var(--color-bg-elevated))`

### Async Operations

- Use progress callbacks for long-running operations: `(progress: number) => void`
- Report progress incrementally throughout the conversion
- Use optional chaining for callbacks: `onProgress?.(currentStep / totalSteps * 100)`
- Dynamic import heavy libraries inside functions to improve initial load time

### File Conversions

- All conversion functions return `Promise<Blob>`
- Functions follow pattern: `[source]To[Target](file: File, onProgress?: ProgressCallback): Promise<Blob>`
- Register converters in `src/lib/converters/engine.ts` with key format: `'source->target'`
- Format detection handled by `detectFormat()` function in types

### Type Safety

- File formats are strictly typed using `FileFormat` union type
- Always validate format before conversion
- Use type guards where appropriate
- Use FORMAT_MAP constant for format metadata (icon, color, mime type, extension)

### Best Practices

- Write self-documenting code with clear variable and function names
- Avoid inline event handlers; use functions defined in the script section
- Use the `FORMAT_MAP` constant to get format-specific UI elements (colors, icons)
- For multi-page PDFs, wrap single pages in ZIP files when converting to images
- Handle both single and multi-page documents appropriately in converters

### Vite Configuration

- PDF.js worker is excluded from optimization to prevent build issues
- Tailwind CSS plugin is configured for utility-first styling
- SvelteKit adapter is configured for static site generation

### Dynamic Import Pattern

Heavy libraries should be imported dynamically inside functions to avoid bundling issues and improve load times:

```typescript
export async function convertPdfToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const docx = await import('docx');
  const { Document, Paragraph, Packer } = docx;
  const doc = new Document({ sections: [...] });
  return Packer.toBlob(doc);
}
```

### Working with FORMAT_MAP

Access format-specific metadata for UI elements:

```typescript
const formatInfo = FORMAT_MAP[sourceFormat];
const badgeStyle = `background: color-mix(in srgb, ${formatInfo.color} 15%, #1e1e3a); border: 1px solid color-mix(in srgb, ${formatInfo.color} 30%, transparent); color: ${formatInfo.color};`;
```

### Conversion Function Template

Follow this pattern for new converter functions:

```typescript
export async function sourceToTarget(
  file: File,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const content = await file.text();
  onProgress?.(30);

  const Library = await import("library-name");
  const result = await Library.process(content);
  onProgress?.(70);

  const blob = new Blob([result], { type: "mime/type" });
  onProgress?.(100);
  return blob;
}
```

### No Comments

- Do not add comments to code
- Write self-documenting code with clear variable and function names
- Use descriptive function names that explain their purpose
