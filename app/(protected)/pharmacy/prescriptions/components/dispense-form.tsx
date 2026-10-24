"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  dispensePrescriptionAction,
} from "@/lib/actions/pharmacy/dispensing.actions";
import {
  createPharmacyBillAction,
} from "@/lib/actions/pharmacy/billing.actions";

interface Medicine {
  id: string;
  name: string;
  generic_name?: string | null;
  unit?: string | null;
}

interface Batch {
  id: string;
  batch_number: string;
  quantity: number;
  medicine_id: string;
  expiry_date?: Date | string | null;
}

interface PrescriptionItem {
  id: string;
  medicine_id: string;
  quantity: number;
  dispensed_qty: number;
}

interface DispenseFormProps {
  prescriptionId: string;
  medicines: Medicine[];
  batches: Batch[];
  items: PrescriptionItem[];
  dispensedBy: string;
  onSuccess?: () => void;
}

export function DispenseForm({
  prescriptionId,
  medicines,
  batches,
  items,
  dispensedBy,
  onSuccess,
}: DispenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dispensingAll, setDispensingAll] = useState(false);
  const [medicineId, setMedicineId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");

  const selectedItem = items.find((item) => item.medicine_id === medicineId);

  const remaining = selectedItem
    ? Math.max(0, selectedItem.quantity - selectedItem.dispensed_qty)
    : 0;

  const prescribedQty = selectedItem ? selectedItem.quantity : 0;

  const alreadyDispensed = selectedItem ? selectedItem.dispensed_qty : 0;

  const availableForMedicine = batches
    .filter((batch) => batch.medicine_id === medicineId)
    .reduce((sum, batch) => sum + batch.quantity, 0);

  const selectedBatch = batches.find((batch) => batch.id === batchId);

  const availableBatches = batches.filter(
    (batch) => batch.medicine_id === medicineId && batch.quantity > 0,
  );

  const hasPendingItems = items.some(
    (item) => item.dispensed_qty < item.quantity,
  );

  function handleMedicineChange(value: string) {
    setMedicineId(value);
    setBatchId("");

    const item = items.find((entry) => entry.medicine_id === value);

    if (!item) {
      setQuantity("");
      return;
    }

    const itemRemaining = Math.max(0, item.quantity - item.dispensed_qty);

    const inStock = batches
      .filter((batch) => batch.medicine_id === value)
      .reduce((sum, batch) => sum + batch.quantity, 0);

    const defaultQty = Math.min(itemRemaining, inStock);

    setQuantity(defaultQty > 0 ? String(defaultQty) : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!medicineId) {
      toast.error("Please select a medicine");
      return;
    }

    if (!selectedItem) {
      toast.error("Medicine is not part of this prescription");
      return;
    }

    if (remaining <= 0) {
      toast.error("This medicine is already fully dispensed");
      return;
    }

    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }

    const dispenseQuantity = Number(quantity);

    if (!dispenseQuantity || dispenseQuantity < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    if (dispenseQuantity > remaining) {
      toast.error(`Only ${remaining} units remaining for this medicine`);
      return;
    }

    if (selectedBatch && dispenseQuantity > selectedBatch.quantity) {
      toast.error(
        `Only ${selectedBatch.quantity} units are available in this batch`,
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pharmacy/dispense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prescriptionId,
          medicineId,
          batchId,
          quantity: dispenseQuantity,
          dispensedBy,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Failed to dispense medicine");
      }

      const result = await response.json();

      toast.success("Medicine dispensed successfully");

      setMedicineId("");
      setBatchId("");
      setQuantity("");
      setNotes("");
      setDiscount("");

      onSuccess?.();

      try {
        const bill = await createPharmacyBillAction(
          prescriptionId,
          Number(discount) || 0
        );
        router.push(`/pharmacy/billing/${bill.id}`);
      } catch (billError) {
        console.error(billError);
        toast.error(
          billError instanceof Error
            ? billError.message
            : "Failed to create bill. Please create it manually from billing."
        );
        router.refresh();
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to dispense medicine",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDispenseAll() {
    setDispensingAll(true);

    try {
      const result = await dispensePrescriptionAction(prescriptionId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setMedicineId("");
      setBatchId("");
      setQuantity("");
      setNotes("");
      setDiscount("");

      onSuccess?.();

      try {
        const bill = await createPharmacyBillAction(
          prescriptionId,
          Number(discount) || 0
        );
        router.push(`/pharmacy/billing/${bill.id}`);
      } catch (billError) {
        console.error(billError);
        toast.error(
          billError instanceof Error
            ? billError.message
            : "Failed to create bill. Please create it manually from billing."
        );
        router.refresh();
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to dispense prescription",
      );
    } finally {
      setDispensingAll(false);
    }
  }

  const maxQuantity =
    selectedBatch && remaining > 0
      ? Math.min(remaining, selectedBatch.quantity)
      : remaining;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Label>Dispense Medicine</Label>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="medicineId">Medicine</Label>

          <select
            id="medicineId"
            value={medicineId}
            onChange={(e) => handleMedicineChange(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select medicine</option>

            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.name}
                {medicine.generic_name ? ` (${medicine.generic_name})` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="font-medium">Prescribed:</span> {prescribedQty}{" "}
                {(selectedItem &&
                  medicines.find((m) => m.id === selectedItem.medicine_id)
                    ?.unit) ||
                  ""}
              </span>

              <span>
                <span className="font-medium">Dispensed:</span>{" "}
                {alreadyDispensed}
              </span>

              <span>
                <span className="font-medium">Remaining:</span> {remaining}
              </span>

              <span>
                <span className="font-medium">In stock:</span>{" "}
                {availableForMedicine}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch</Label>

            <select
              id="batchId"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
              disabled={!medicineId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {medicineId ? "Select batch" : "Select medicine first"}
              </option>

              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_number} - Available: {batch.quantity}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>

            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity > 0 ? maxQuantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>
        </div>

        {selectedBatch && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="font-medium">Batch:</span>{" "}
                {selectedBatch.batch_number}
              </span>

              <span>
                <span className="font-medium">Available:</span>{" "}
                {selectedBatch.quantity}
              </span>

              {selectedBatch.expiry_date && (
                <span>
                  <span className="font-medium">Expiry:</span>{" "}
                  {new Date(selectedBatch.expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dispensedBy">Dispensed By</Label>

          <Input
            id="dispensedBy"
            value={dispensedBy}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>

          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount">Discount Amount</Label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Apply a discount to the total bill
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={loading} className="rounded-xl">
            {loading ? "Dispensing..." : "Dispense Medicine"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleDispenseAll}
            disabled={dispensingAll || !hasPendingItems}
            className="rounded-xl"
          >
            {dispensingAll ? "Dispensing..." : "Dispense All"}
          </Button>
        </div>
      </form>
    </div>
  );
}
