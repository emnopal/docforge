import type { ProgressCallback, FileFormat } from '../types';
import { htmlToImage } from './html-utils';

export async function spreadsheetToMarkdown(headers: string[], rows: string[][]): Promise<string> {
	const maxColWidth = headers.map((h, i) => {
		const colVals = rows.map((r) => r[i] || '');
		return Math.max(h.length, ...colVals.map((v) => v.length));
	});

	const createRow = (cells: string[]) => {
		return '| ' + cells.map((cell, i) => cell.padEnd(maxColWidth[i])).join(' | ') + ' |';
	};

	const separator = '| ' + maxColWidth.map((w) => '-'.repeat(w)).join(' | ') + ' |';

	let md = createRow(headers) + '\n';
	md += separator + '\n';

	for (const row of rows) {
		md += createRow(row.map((c) => c || '')) + '\n';
	}

	return md;
}

export async function readSpreadsheet(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headers = (data[0] || []).map(String);
  const rows = data.slice(1).map((r) => r.map(String));
  return { headers, rows };
}

export async function xlsxToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const { headers, rows } = await readSpreadsheet(file);
  onProgress?.(40);
  const jsPDF = (await import('jspdf')).jsPDF;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;
  const colW = Math.min(
    (pdf.internal.pageSize.getWidth() - margin * 2) / Math.max(headers.length, 1),
    150
  );
  const lineH = 18;
  const pageH = pdf.internal.pageSize.getHeight() - margin;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  headers.forEach((h, ci) => pdf.text(h.substring(0, 20), margin + ci * colW, y));
  y += lineH;
  pdf.setFont('helvetica', 'normal');

  for (const row of rows) {
    if (y + lineH > pageH) {
      pdf.addPage();
      y = margin;
    }
    row.forEach((cell, ci) => {
      if (ci < headers.length) pdf.text(String(cell).substring(0, 20), margin + ci * colW, y);
    });
    y += lineH;
  }
  onProgress?.(85);
  return pdf.output('blob');
}

export async function xlsxToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const { headers, rows } = await readSpreadsheet(file);
  onProgress?.(40);
  const docx = await import('docx');
  const { Document, Table, TableRow, TableCell, Paragraph, TextRun, Packer, WidthType } = docx;

  const tableRows = [
    new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
            width: { size: 2000, type: WidthType.DXA }
          })
      )
    }),
    ...rows.map(
      (row) =>
        new TableRow({
          children: headers.map(
            (_, ci) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: row[ci] || '', size: 20 })] })],
                width: { size: 2000, type: WidthType.DXA }
              })
          )
        })
    )
  ];

  const doc = new Document({
    sections: [{ children: [new Table({ rows: tableRows })] }]
  });
  return Packer.toBlob(doc);
}

export async function xlsxToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const { headers, rows } = await readSpreadsheet(file);
  onProgress?.(40);
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pres = new PptxGenJS();
  const slide = pres.addSlide();
  const tableData = [headers, ...rows.slice(0, 30)];
  slide.addTable(
    tableData.map((row) => row.map((cell) => ({ text: String(cell), options: { fontSize: 10 } }))),
    { x: 0.3, y: 0.5, w: 9.4, colW: headers.map(() => 9.4 / headers.length) }
  );
  onProgress?.(80);
  const arrBuf = await (pres.write as any)({ outputType: 'arraybuffer' });
  return new Blob([arrBuf], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}

export async function xlsxToCsv(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  onProgress?.(50);
  const csv = XLSX.utils.sheet_to_csv(ws);
  return new Blob([csv], { type: 'text/csv' });
}

export async function xlsxToImage(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const { headers, rows } = await readSpreadsheet(file);
  onProgress?.(30);
  const html = `<table style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
    <tr>${headers.map((h) => `<th style="border:1px solid #444;padding:6px 10px;background:#1a1a2e;color:#eee">${h}</th>`).join('')}</tr>
    ${rows.slice(0, 50).map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #444;padding:4px 10px;color:#ddd">${c}</td>`).join('')}</tr>`).join('')}
  </table>`;
  return htmlToImage(html, format, onProgress);
}

export async function csvToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  return xlsxToPdf(file, onProgress);
}

export async function csvToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  return xlsxToDocx(file, onProgress);
}

export async function csvToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  return xlsxToPptx(file, onProgress);
}

export async function csvToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const XLSX = await import('xlsx');
  const text = await file.text();
  onProgress?.(30);
  const wb = XLSX.read(text, { type: 'string' });
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  onProgress?.(80);
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export async function xlsxToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const { headers, rows } = await readSpreadsheet(file);
  onProgress?.(40);
  const md = await spreadsheetToMarkdown(headers, rows);
  onProgress?.(90);
  return new Blob([md], { type: 'text/markdown' });
}

export async function csvToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  return xlsxToMarkdown(file, onProgress);
}

export async function xlsxToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
	const { headers, rows } = await readSpreadsheet(file);
	onProgress?.(40);

	let text = '';
	if (rows.length > 0) {
		text = headers.map((h) => `${h}:`).join('\t') + '\n';
		text += rows.map((r) => r.map((cell, i) => `${headers[i]}: ${cell || ''}`).join('\t')).join('\n');
	} else {
		text = 'Empty spreadsheet';
	}

	onProgress?.(90);
	return new Blob([text], { type: 'text/plain' });
}

export async function csvToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
	const text = await file.text();
	onProgress?.(90);
	return new Blob([text], { type: 'text/plain' });
}