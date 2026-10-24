"use client";

import { useState } from "react";
import { Loader2, PackageCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getPurchaseOrderForReceivingAction,
  receiveStockAction,
} from "@/lib/actions/pharmacy/receive-stock.actions";

type Props = {
  purchaseOrderId: string;
};

type ReceiveItem = {
  purchaseOrderItemId: string;

  medicineName: string;

  orderedQuantity: number;
  alreadyReceived: number;
  remainingQuantity: number;

  batchNumber: string;
  expiryDate: string;

  quantity: number;

  purchasePrice: number;
  sellingPrice: number;
};

export default function ReceiveStockDialog({ purchaseOrderId }: Props) {
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [items, setItems] = useState<ReceiveItem[]>([]);

  async function handleOpen() {
    setError("");
    setLoading(true);

    try {
      const order = await getPurchaseOrderForReceivingAction(purchaseOrderId);

      const pending = order.items
        .filter((item) => item.received_quantity < item.quantity)
        .map((item) => ({
          purchaseOrderItemId: item.id,

          medicineName: item.medicine.name,

          orderedQuantity: item.quantity,

          alreadyReceived: item.received_quantity,

          remainingQuantity: item.quantity - item.received_quantity,

          batchNumber: "",

          expiryDate: "",

          quantity: item.quantity - item.received_quantity,

          purchasePrice: item.purchase_price,

          sellingPrice: 0,
        }));

      setItems(pending);
      setOpen(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load purchase order.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    index: number,
    field: keyof ReceiveItem,
    value: string | number,
  ) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSaving(true);

    try {
      for (const item of items) {
        if (!item.batchNumber.trim()) {
          throw new Error(`Batch number is required for ${item.medicineName}.`);
        }

        if (!item.expiryDate) {
          throw new Error(`Expiry date is required for ${item.medicineName}.`);
        }

        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for ${item.medicineName}.`);
        }

        if (item.quantity > item.remainingQuantity) {
          throw new Error(
            `Quantity exceeds remaining quantity for ${item.medicineName}.`,
          );
        }
      }

      const result = await receiveStockAction(
        purchaseOrderId,

        items.map((item) => ({
          purchaseOrderItemId: item.purchaseOrderItemId,

          batchNumber: item.batchNumber.trim(),

          expiryDate: item.expiryDate,

          quantity: Number(item.quantity),

          purchasePrice: Number(item.purchasePrice),

          sellingPrice: Number(item.sellingPrice),
        })),
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      setOpen(false);

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to receive stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={handleOpen} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PackageCheck className="mr-2 h-4 w-4" />
        )}
        Receive Stock
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="absolute right-5 top-5 rounded-md p-2 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 pr-10">
              <h2 className="text-2xl font-bold">Receive Stock</h2>

              <p className="text-sm text-muted-foreground">
                Enter the actual stock received from the supplier.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-xl border p-8 text-center">
                <PackageCheck className="mx-auto mb-3 h-10 w-10" />

                <h3 className="font-semibold">All stock received</h3>

                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {items.map((item, index) => (
                  <div
                    key={item.purchaseOrderItemId}
                    className="rounded-xl border p-5"
                  >
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold">
                        {item.medicineName}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Ordered: {item.orderedQuantity} | Received:{" "}
                        {item.alreadyReceived} | Remaining:{" "}
                        {item.remainingQuantity}
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                      <div className="space-y-2">
                        <Label>Batch Number</Label>

                        <Input
                          value={item.batchNumber}
                          placeholder="PCM-001"
                          onChange={(e) =>
                            updateItem(index, "batchNumber", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expiry Date</Label>

                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) =>
                            updateItem(index, "expiryDate", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Received Quantity</Label>

                        <Input
                          type="number"
                          min={1}
                          
                          max={item.remainingQuantity}
                          value={item.quantity}
                          onFocus={(e) => {
                            e.target.select();
                            updateItem(index, "quantity", "");
                          }}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Purchase Price</Label>

                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Enter purchase price"
                          value={item.purchasePrice}
                          onFocus={(e) => {
                            e.target.select();
                            updateItem(index, "purchasePrice", "");
                          }}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "purchasePrice",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Selling Price</Label>

                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Enter selling price"
                          value={item.sellingPrice}
                          onFocus={(e) => {
                            e.target.select();
                            updateItem(index, "sellingPrice", "");
                          }}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "sellingPrice",
                              Number(e.target.value),
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {saving ? "Receiving..." : "Confirm Receive Stock"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
