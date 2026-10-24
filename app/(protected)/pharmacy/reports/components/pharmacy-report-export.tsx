"use client";

import { Download } from "lucide-react";

type ExportRow = {
  section: string;
  date: string;
  reference: string;
  patient: string;
  description: string;
  quantity: number | string;
  amount: number | string;
  collected: number | string;
  balance: number | string;
};

type Props = {
  rows: ExportRow[];
};

function escapeCsv(value: string | number) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function PharmacyReportExport({ rows }: Props) {
  function exportCsv() {
    const headers = [
      "Section",
      "Date",
      "Reference",
      "Patient",
      "Description",
      "Quantity",
      "Amount",
      "Collected",
      "Balance",
    ];

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        [
          row.section,
          row.date,
          row.reference,
          row.patient,
          row.description,
          row.quantity,
          row.amount,
          row.collected,
          row.balance,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pharmacy-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </button>
  );
}
