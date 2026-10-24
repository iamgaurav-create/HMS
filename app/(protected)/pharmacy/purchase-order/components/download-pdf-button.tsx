"use client";

import { Download } from "lucide-react";

type Props = {
  pdfUrl: string | null;
  orderNumber: string;
};

export default function DownlodePDFButton({
  pdfUrl,
  orderNumber,
}: Props) {
  if (!pdfUrl) {
    return null;
  }
  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={`${orderNumber}.pdf`}
      className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Download className="mr-2 h-4 w-4" />
      PDF
    </a>
  );
}
