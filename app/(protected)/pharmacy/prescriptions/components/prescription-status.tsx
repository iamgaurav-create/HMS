"use client";

import { AlertCircle, CheckCircle2, Clock3, XCircle } from "lucide-react";

type PrescriptionStatus =
  | "PENDING"
  | "PARTIALLY_DISPENSED"
  | "DISPENSED"
  | "CANCELLED";

interface PrescriptionStatusProps {
  status: PrescriptionStatus;
}

export default function PrescriptionStatus({
  status,
}: PrescriptionStatusProps) {
  const config = {
    PENDING: {
      label: "Pending",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: Clock3,
    },
    PARTIALLY_DISPENSED: {
      label: "Partially Dispensed",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: AlertCircle,
    },
    DISPENSED: {
      label: "Dispensed",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
