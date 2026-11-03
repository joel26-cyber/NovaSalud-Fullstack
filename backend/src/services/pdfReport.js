import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

export function buildReportPdf({
  title,
  subtitle,
  headers,
  widths,
  alignments = [],
  rows,
  summary,
  logoPath,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      bufferPages: true,
      info: { Title: title, Author: 'Nova Salud' },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const tableWidth = widths.reduce((sum, width) => sum + width, 0);
    let y = 0;

    const drawTableHeader = (top) => {
      doc.rect(MARGIN, top, tableWidth, 27).fill('#0f172a');
      let x = MARGIN;
      headers.forEach((header, index) => {
        doc.fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text(String(header), x + 6, top + 8, {
            width: widths[index] - 12,
            align: alignments[index] || 'left',
            lineBreak: false,
            ellipsis: true,
          });
        x += widths[index];
      });
    };

    const drawPageHeader = () => {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.rect(0, 0, PAGE_WIDTH, 8).fill('#e63946');
      doc.rect(MARGIN, 20, PAGE_WIDTH - MARGIN * 2, 48).fill('#0f172a');

      let logoDrawn = false;
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, (PAGE_WIDTH - 145) / 2, 25, { fit: [145, 38] });
          logoDrawn = true;
        } catch {
          logoDrawn = false;
        }
      }
      if (!logoDrawn) {
        doc.fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(17)
          .text('NOVA SALUD', MARGIN + 12, 35, { lineBreak: false });
      }

      doc.fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text(title, MARGIN, 82, { lineBreak: false });
      doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(10)
        .text(subtitle, MARGIN, 109, { lineBreak: false });
      doc.rect(MARGIN, 127, PAGE_WIDTH - MARGIN * 2, 22).fill('#fbecef');
      doc.fillColor('#b91c1c')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(summary, MARGIN + 9, 133, {
          width: PAGE_WIDTH - MARGIN * 2 - 18,
          lineBreak: false,
          ellipsis: true,
        });

      drawTableHeader(158);
      y = 185;
    };

    const drawRow = (top, row, alternate) => {
      if (alternate) {
        doc.rect(MARGIN, top, tableWidth, 25).fill('#f8fafc');
      }
      doc.moveTo(MARGIN, top + 25)
        .lineTo(MARGIN + tableWidth, top + 25)
        .lineWidth(0.5)
        .strokeColor('#e2e8f0')
        .stroke();

      let x = MARGIN;
      widths.forEach((width, index) => {
        doc.fillColor('#1e293b')
          .font('Helvetica')
          .fontSize(8.5)
          .text(String(row[index] ?? ''), x + 6, top + 8, {
            width: width - 12,
            align: alignments[index] || 'left',
            lineBreak: false,
            ellipsis: true,
          });
        x += width;
      });
    };

    drawPageHeader();

    if (!rows.length) {
      doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(10)
        .text('No hay datos para mostrar.', MARGIN + 10, y + 10, { lineBreak: false });
    }

    rows.forEach((row, index) => {
      if (y + 25 > 790) drawPageHeader();
      drawRow(y, row, index % 2 === 1);
      y += 25;
    });

    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      doc.moveTo(MARGIN, 806)
        .lineTo(PAGE_WIDTH - MARGIN, 806)
        .lineWidth(0.5)
        .strokeColor('#e2e8f0')
        .stroke();
      doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(8)
        .text('Generado por Sistema Nova Salud', MARGIN, 816, { lineBreak: false });
      doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(8)
        .text(`Página ${page + 1} de ${range.count}`, MARGIN, 816, {
          width: PAGE_WIDTH - MARGIN * 2,
          align: 'right',
          lineBreak: false,
        });
    }

    doc.end();
  });
}

export { PAGE_HEIGHT };
