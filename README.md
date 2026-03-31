# DocForge

Fast, secure document tools that run entirely in your browser. No files are uploaded to any server — all processing happens client-side.

## Tools

| Tool | Description |
|------|-------------|
| **Converter** | Convert between PDF, DOCX, PPTX, XLSX, CSV, Images, TXT, and Markdown (100+ format combinations) |
| **PDF Rearranger** | Drag and drop to reorder PDF pages with full resolution |
| **PDF Extractor** | Extract selected pages from a PDF into a new PDF or image files |
| **PDF Joiner** | Combine multiple PDF files into one with drag-and-drop ordering |
| **OCR** | Extract text from PDFs and images using AI-powered OCR (Tesseract.js) — save as TXT, Markdown, PDF, or DOCX |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
```

Output is a fully static site in `build/` — deploy to any static host.

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) (static adapter) + [Svelte 5](https://svelte.dev/docs/svelte)
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn-svelte](https://www.shadcn-svelte.com/) UI components
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) / [pdf-lib](https://pdf-lib.js.org/) for PDF processing
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR
- [docx](https://docx.js.org/) / [mammoth](https://github.com/mwilliamson/mammoth.js) / [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) / [xlsx](https://sheetjs.com/) for office formats

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript + Svelte type checking
npm run lint         # ESLint
npm run format       # Prettier
```
