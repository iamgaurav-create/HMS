"use client";

import { CheckCircle2, Clock3, Package } from "lucide-react";

interface DispenseSummaryProps {
  totalQty: number;
  dispensedQty: number;
  status: string;
}

export function DispenseSummary({
  totalQty,
  dispensedQty,
  status,
}: DispenseSummaryProps) {
  const remaining = Math.max(0, totalQty - dispensedQty);
  const percent =
    totalQty > 0 ? Math.round((dispensedQty / totalQty) * 100) : 0;

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    PENDING: { label: "Pending", icon: Clock3, color: "text-yellow-600" },
    PARTIALLY_DISPENSED: {
      label: "Partially Dispensed",
      icon: Package,
      color: "text-blue-600",
    },
    DISPENSED: { label: "Dispensed", icon: CheckCircle2, color: "text-green-600" },
    CANCELLED: { label: "Cancelled", icon: CheckCircle2, color: "text-red-600" },
  };

  const config = statusConfig[status] ?? statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-2 flex items-center gap-1 text-lg font-bold">
        <Package className="h-5 w-5 text-primary" />
        Dispense Summary
      </h2>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Quantity</span>
          <span className="font-semibold">{totalQty}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Dispensed</span>
          <span className="font-semibold text-green-600">{dispensedQty}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-semibold text-amber-600">{remaining}</span>
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-center text-xs font-medium text-muted-foreground">
          {percent}% dispensed
        </p>

        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>
    </div>
  );
}