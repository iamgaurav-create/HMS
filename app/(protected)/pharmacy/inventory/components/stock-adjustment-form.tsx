
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStockAdjustment } from "@/lib/actions/pharmacy/inventory.actions";
import { Loader2, PackageCheck } from "lucide-react";

type BatchOption = {
  id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  medicine: {
    name: string;
    unit: string;
  };
};

type Props = {
  batches: BatchOption[];
  canAddStock: boolean;
};

type Operation = "ADD" | "REMOVE" | "DAMAGED" | "EXPIRED";

export default function StockAdjustmentForm({
  batches,
  canAddStock,
}: Props) {
  const router = useRouter();
  const [batchId, setBatchId] = useState("");
  const [operation, setOperation] = useState<Operation>("REMOVE");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const numericQuantity = Number(quantity);

  const validQuantity =
    quantity.trim() !== "" &&
    Number.isSafeInteger(numericQuantity) &&
    numericQuantity > 0;

  const canSubmit =
    Boolean(selectedBatch) &&
    validQuantity &&
    reason.trim().length >= 3 &&
    reason.trim().length <= 500 &&
    !loading &&
    (operation === "ADD"
      ? canAddStock
      : Boolean(selectedBatch && numericQuantity <= selectedBatch.quantity));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      toast.error("Check the selected batch, quantity, and reason.");
      return;
    }

    try {
      setLoading(true);

      await createStockAdjustment({
        batchId,
        operation,
        quantity: numericQuantity,
        reason: reason.trim(),
      });

      toast.success("Stock adjustment recorded successfully.");
      setQuantity("1");
      setReason("");
      setBatchId("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Adjustment failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const operations: { value: Operation; label: string }[] = [
    ...(canAddStock ? [{ value: "ADD" as const, label: "Add stock correction" }] : []),
    { value: "REMOVE", label: "Remove stock correction" },
    { value: "DAMAGED", label: "Remove damaged stock" },
    { value: "EXPIRED", label: "Remove expired stock" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">New Stock Adjustment</h2>
          <p className="text-sm text-muted-foreground">
            Select a batch and provide a reason for the change.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="batch" className="text-sm font-medium">
          Medicine Batch
        </label>
        <select
          id="batch"
          required
          value={batchId}
          onChange={(event) => setBatchId(event.target.value)}
          disabled={loading}
          className="w-full rounded-lg border bg-background px-3 py-2.5"
        >
          <option value="">Select a batch</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.medicine.name} · {batch.batch_number} · Stock:{" "}
              {batch.quantity} · Expires:{" "}
              {new Date(batch.expiry_date).toLocaleDateString("en-IN")}
            </option>
          ))}
        </select>
        {selectedBatch && (
          <p className="text-xs text-muted-foreground">
            Current stock: {selectedBatch.quantity} {selectedBatch.medicine.unit}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="operation" className="text-sm font-medium">
          Adjustment Type
        </label>
        <select
          id="operation"
          value={operation}
          onChange={(event) => setOperation(event.target.value as Operation)}
          disabled={loading}
          className="w-full rounded-lg border bg-background px-3 py-2.5"
        >
          {operations.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={
            operation === "ADD"
              ? undefined
              : selectedBatch?.quantity ?? undefined
          }
          step={1}
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={loading}
          className="w-full rounded-lg border bg-background px-3 py-2.5"
        />
        {operation === "EXPIRED" && selectedBatch && (
          <p className="text-xs text-muted-foreground">
            Only batches whose expiry date has passed can be marked expired.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <textarea
          id="reason"
          required
          minLength={3}
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={loading}
          placeholder="Describe why this adjustment is required"
          className="w-full resize-y rounded-lg border bg-background px-3 py-2.5"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving Adjustment...
          </>
        ) : (
          "Save Stock Adjustment"
        )}
      </button>
    </form>
  );
}
