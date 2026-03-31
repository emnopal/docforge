# AGENTS.md

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (static output to build/)
npm run preview      # Preview production build locally
npm run check        # TypeScript + Svelte type checking
npm run check:watch  # Watch mode type checking
npm run lint         # ESLint (flat config, TS + Svelte + Prettier)
npm run format       # Prettier (double quotes, 2-space indent, 100 char width)
npm run format:check # Check formatting without writing
```

No test framework is configured. Husky pre-push hook runs `npm run lint -- --max-warnings 50 && npm run check`.

## Architecture

DocForge is a **100% client-side** document tool suite built with SvelteKit (static adapter), Svelte 5, and TypeScript. No server uploads. SSR is disabled (`ssr = false`) and all routes are prerendered in `+layout.ts`.

Five modules, each a standalone route:

- `/converter` — Format converter (100+ combinations across 11 formats)
- `/pdf-rearranger` — Drag-and-drop PDF page reordering
- `/pdf-extractor` — Extract specific pages from a PDF
- `/pdf-joiner` — Merge multiple PDFs
- `/ocr` — OCR via Tesseract.js (PDF/images → TXT/Markdown/PDF/DOCX)

### Conversion Flow

1. `src/routes/converter/+page.svelte` manages UI state (`ConversionJob`)
2. Calls `convert(file, from, to, onProgress)` from `src/lib/converters/engine.ts`
3. `engine.ts` dispatches via `'source->target'` string key to a converter function
4. Converter functions live in `src/lib/converters/*-utils.ts`, grouped by source format
5. All converters return `Promise<Blob>`

**Adding a new conversion:** implement in the appropriate `*-utils.ts`, export it, import in `engine.ts`, add `'src->tgt': () => fn(file, onProgress)` to the converters map.

**Adding a new module:** create `src/routes/<name>/+page.svelte`, add logic under `src/lib/`, register in the `modules` array in `src/routes/+page.svelte`.

### UI Components

shadcn-svelte (style: "vega") in `src/lib/components/ui/`. Add new ones via `npx shadcn-svelte@latest add <component>`. Use `cn()` from `$lib/utils` for Tailwind class merging.

## Conventions

### Svelte 5 Runes Only

Never use legacy Options API. Use `$state()`, `$derived()`, `$props()`. Use `$effect()` sparingly.

```typescript
let { job, onDownload }: { job: ConversionJob; onDownload: () => void } = $props();
let status = $state<"idle" | "converting">("idle");
const label = $derived(FORMAT_MAP[job.targetFormat].label);
```

Layouts use Svelte 5 snippets: `let { children } = $props()` and `{@render children()}` — not `<slot />`.

### Dynamic Imports

Heavy dependencies (pdfjs-dist, docx, mammoth, pptxgenjs, tesseract.js, xlsx, etc.) must be dynamically imported inside the function body, never at the top of a file.

```typescript
export async function pdfToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  // ...
}
```

`pdfjs-dist` is excluded from Vite's `optimizeDeps` and uses a lazy singleton in `pdf-utils.ts` (`getPdfJs()`) — don't change that.

### TypeScript & Imports

- Strict mode enabled
- Use `import type { ... }` for type-only imports
- Use `$lib` alias: `import { FORMAT_MAP } from '$lib/types'`
- Group: external libraries → internal modules → type imports
- Prefix unused variables with `_`

### Naming

- **Components**: PascalCase (`ConversionPanel.svelte`)
- **Functions**: camelCase (`convertFile`)
- **Constants**: UPPER_CASE (`FORMAT_MAP`)
- **Types/Interfaces**: PascalCase (`FileFormat`)
- **Files**: kebab-case (`pdf-utils.ts`)

### ConversionJob State Machine

```
pending → converting → done
                     ↘ error
```

Update by spreading: `job = { ...newJob, progress: p }`.

### Converters

- All return `Promise<Blob>`
- Signature: `sourceToTarget(file: File, onProgress?: ProgressCallback): Promise<Blob>`
- ProgressCallback: `(progress: number) => void`, 0–100, call with `onProgress?.(value)`
- Multi-page PDF → image produces a ZIP blob (`blob.type === 'application/zip'`)

### FORMAT_MAP

`FORMAT_MAP[format]` from `src/lib/types/index.ts` provides `color`, `icon`, `mime`, `extension`, `label`. Format detection via `detectFormat()`.

### Styling

- Tailwind CSS v4 — `@import "tailwindcss"` (not `@tailwind` directives)
- Theme tokens in `src/app.css` using OKLch color space with light/dark modes (`.dark` class on `<html>`)
- Semantic variables: `var(--background)`, `var(--foreground)`, `var(--primary)`
- Accent variables: `var(--color-accent-blue)`, `var(--color-accent-red)`, etc.
- Dynamic colors: `color-mix(in srgb, ${color} 15%, #1e1e3a)`
- Custom data-attribute variants (`data-open`, `data-closed`, etc.) for bits-ui states

### Error Handling

- try/catch for async operations
- Update job state: `{ ...job, status: 'error', error: message }`
- Optional chaining for callbacks: `onProgress?.(value)`

### No Comments

Do not add comments. Write self-documenting code with descriptive names.
