"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle } from "lucide-react";

import { updateLabOrderStatus } from "@/lib/actions/laboratory/orders.action";

export function LabOrderCancelButton({
  orderId,
  orderNumber,
  disabled,
}: {
  orderId: string;
  orderNumber: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return null;
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await updateLabOrderStatus(orderId, "Cancelled");

      if (result.success) {
        toast.success(`Order ${orderNumber} cancelled.`);
      } else {
        toast.error(result.message);
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-500/10"
    >
      <XCircle size={14} />
      Cancel
    </button>
  );
}
