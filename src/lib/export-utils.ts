export interface RegistroJornadaMeta {
  workerName: string;
  workerLastName: string;
  workerDni?: string;
  workerNss?: string;
  companyName: string;
  companyNif: string;
  companyCCC?: string;
}

export interface RegistroJornadaRow {
  date: string;
  entry: string;
  exit: string;
  breakStart: string;
  breakEnd: string;
  breakTotal: string;
  total: string;
  signed: boolean;
}

export interface RegistroJornadaLabels {
  title: string;
  period: string;
  company: string;
  nif: string;
  ccc: string;
  worker: string;
  dni: string;
  nss: string;
  date: string;
  entry: string;
  exit: string;
  breakStart: string;
  breakEnd: string;
  breakTotal: string;
  totalHours: string;
  signature: string;
  signedYes: string;
  signedNo: string;
  signatureBlock: string;
  workerSignature: string;
  companySignature: string;
  grandTotal: string;
}

function sumHHMMSS(times: string[]): string {
  let totalSeconds = 0;
  for (const t of times) {
    if (!t || t === "—") continue;
    const parts = t.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const s = parts[2] ?? 0;
    totalSeconds += h * 3600 + m * 60 + s;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export async function downloadRegistroJornada(
  meta: RegistroJornadaMeta,
  rows: RegistroJornadaRow[],
  startDate: string,
  endDate: string,
  filename: string,
  labels: RegistroJornadaLabels
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  // ── Título ────────────────────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(labels.title, pageW / 2, y, { align: "center" });
  y += 7;

  // Período
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${labels.period}: ${startDate}  –  ${endDate}`, pageW / 2, y, {
    align: "center",
  });
  y += 9;

  // ── Datos de empresa ──────────────────────────────────────────────────────
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(labels.company, margin + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(meta.companyName, margin + 3, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text(labels.nif + ":", pageW / 2 - 20, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(
    meta.companyNif,
    pageW / 2 - 20 + doc.getTextWidth(labels.nif + ": "),
    y + 6
  );

  if (meta.companyCCC) {
    doc.setFont("helvetica", "bold");
    doc.text(labels.ccc + ":", pageW / 2 - 20, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text(
      meta.companyCCC,
      pageW / 2 - 20 + doc.getTextWidth(labels.ccc + ": "),
      y + 12
    );
  }
  y += 28;

  // ── Datos del trabajador ──────────────────────────────────────────────────
  doc.setFillColor(240, 255, 244);
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(labels.worker, margin + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`${meta.workerName} ${meta.workerLastName}`, margin + 3, y + 12);

  if (meta.workerDni) {
    doc.setFont("helvetica", "bold");
    doc.text(labels.dni + ":", pageW / 2 - 20, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(
      meta.workerDni,
      pageW / 2 - 20 + doc.getTextWidth(labels.dni + ": "),
      y + 6
    );
  }

  if (meta.workerNss) {
    doc.setFont("helvetica", "bold");
    doc.text(labels.nss + ":", pageW / 2 - 20, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text(
      meta.workerNss,
      pageW / 2 - 20 + doc.getTextWidth(labels.nss + ": "),
      y + 12
    );
  }
  y += 28;

  // ── Tabla de jornada ──────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [
      [
        labels.date,
        labels.entry,
        labels.exit,
        labels.breakStart,
        labels.breakEnd,
        labels.breakTotal,
        labels.totalHours,
        labels.signature,
      ],
    ],
    body: rows.map((r) => [
      r.date,
      r.entry,
      r.exit,
      r.breakStart,
      r.breakEnd,
      r.breakTotal,
      r.total,
      r.signed ? labels.signedYes : labels.signedNo,
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      7: { halign: "center", cellWidth: 18 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 200;

  // ── Cómputo total de horas ────────────────────────────────────────────────
  const grandTotalValue = sumHHMMSS(rows.map((r) => r.total));
  const totalBlockY = finalY + 4;
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(margin, totalBlockY, pageW - margin * 2, 10, 1.5, 1.5, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${labels.grandTotal}: ${grandTotalValue}`,
    pageW - margin - 3,
    totalBlockY + 6.5,
    { align: "right" }
  );
  doc.setTextColor(0, 0, 0);

  // ── Bloque de firmas ──────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  const sigY = totalBlockY + 10 + 8;
  const needsNewPage = sigY + 30 > pageH;
  if (needsNewPage) doc.addPage();
  const sigBlockY = needsNewPage ? 20 : sigY;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(labels.signatureBlock, margin, sigBlockY);

  const colW = (pageW - margin * 2) / 2 - 5;

  // Firma trabajador
  doc.setFont("helvetica", "normal");
  doc.rect(margin, sigBlockY + 4, colW, 22);
  doc.setFontSize(7.5);
  doc.text(labels.workerSignature, margin + colW / 2, sigBlockY + 10, {
    align: "center",
  });

  // Firma empresa
  doc.rect(margin + colW + 10, sigBlockY + 4, colW, 22);
  doc.text(
    labels.companySignature,
    margin + colW + 10 + colW / 2,
    sigBlockY + 10,
    { align: "center" }
  );

  doc.save(`${filename}.pdf`);
}

export function downloadCSV(
  columns: string[],
  rows: string[][],
  filename: string
): void {
  const header = columns.join(",");
  const body = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const content = "\uFEFF" + header + "\n" + body;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(
  columns: string[],
  rows: string[][],
  filename: string,
  title?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });

  if (title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 16);
  }

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: title ? 22 : 14,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${filename}.pdf`);
}
