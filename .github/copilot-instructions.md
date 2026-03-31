# Copilot Instructions

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (static output to build/)
npm run check        # TypeScript + Svelte type checking
npm run check:watch  # Watch mode type checking
```

No test framework is configured.

## Architecture

DocForge is a **100% client-side** document tool suite built with SvelteKit (static adapter), Svelte 5, and TypeScript. No files are uploaded to any server.

Four modules, each a standalone route:

- `/converter` — General-purpose format converter
- `/pdf-rearranger` — Drag-and-drop PDF page reordering
- `/pdf-extractor` — Extract specific pages from a PDF
- `/pdf-joiner` — Merge multiple PDFs

**Conversion flow:**

1. `src/routes/converter/+page.svelte` handles UI state (`ConversionJob`)
2. Calls `convert(file, from, to, onProgress)` from `src/lib/converters/engine.ts`
3. `engine.ts` dispatches via a `'source->target'` string key to a specific converter function
4. Converter functions live in `src/lib/converters/*-utils.ts`, grouped by source format
5. All converters return `Promise<Blob>`

**Adding a new conversion:** implement the function in the appropriate `*-utils.ts`, export it, import it in `engine.ts`, and add a `'src->tgt': () => fn(file, onProgress)` entry to the `converters` map.

**Adding a new module:** create `src/routes/<name>/+page.svelte`, add business logic under `src/lib/`, and register the module in the `modules` array in `src/routes/+page.svelte`.

## Key Conventions

### Svelte 5 Runes

All components use Svelte 5 rune syntax — never the legacy Options API:

```ts
let { job, onDownload }: { job: ConversionJob; onDownload: () => void } =
  $props();
let status = $state<"idle" | "converting">("idle");
const label = $derived(FORMAT_MAP[job.targetFormat].label);
```

### Dynamic Imports for Heavy Libraries

Heavy dependencies (pdfjs-dist, docx, mammoth, pptxgenjs, etc.) must be dynamically imported inside the converter function body, not at the top of the file. This keeps the initial bundle small.

```ts
export async function pdfToDocx(
  file: File,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  // ...
}
```

`pdfjs-dist` is also excluded from Vite's `optimizeDeps` — don't change that.

### ConversionJob State Machine

```
pending → converting → done
                     ↘ error
```

Progress updates are done by spreading the job: `job = { ...newJob, progress: p }`.

### Multi-page PDF → Image = ZIP

When converting a multi-page PDF to an image format, the result is a ZIP blob (not a single image). Check `blob.type === 'application/zip'` and adjust the output filename/extension accordingly — see the converter route for the pattern.

### FORMAT_MAP

Use `FORMAT_MAP[format]` (from `src/lib/types/index.ts`) to get `color`, `icon`, `mime`, `extension`, and `label` for any `FileFormat`. Use `color-mix()` for badge/border styles:

```ts
`background: color-mix(in srgb, ${info.color} 15%, #1e1e3a);`;
```

### ProgressCallback

Signature: `(progress: number) => void` where progress is 0–100. Call `onProgress?.(value)` with optional chaining throughout long operations so the UI stays responsive.

### Styling

Tailwind CSS v4 — use `@import "tailwindcss"` (not `@tailwind` directives). Theme tokens are CSS variables defined in `src/app.css` (e.g. `var(--color-bg-primary)`, `var(--color-accent-blue)`). Prefer these variables over hardcoded colors.

### Types

All shared types and `FORMAT_MAP` live in `src/lib/types/index.ts`. Import with `$lib` alias:

```ts
import { FORMAT_MAP, type FileFormat, type ConversionJob } from "$lib/types";
```
