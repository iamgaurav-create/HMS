
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ToWords } from "to-words";

const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});

import {
  createPurchaseOrderAction,
  getActiveMedicinesAction,
  getActiveSuppliersAction,
} from "@/lib/actions/pharmacy/purchase-order.actions";


type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type Medicine = {
  id: string;
  name: string;
  generic_name: string | null;
  unit: string;
};

type OrderItem = {
  medicine_id: string;
  quantity: number | "";
  purchase_price: number | "";
};

type PurchaseOrderFormProps = {
  onSuccess?: () => void;
};


const EMPTY_ORDER_ITEM: OrderItem = {
  medicine_id: "",
  quantity: 1,
  purchase_price: 0,
};

const CURRENCY = "₹";


export default function PurchaseOrderForm({
  onSuccess,
}: PurchaseOrderFormProps) {
  
  
  

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<OrderItem[]>([
    { ...EMPTY_ORDER_ITEM },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  
  

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      try {
        setIsLoading(true);

        const [supplierData, medicineData] = await Promise.all([
          getActiveSuppliersAction(),
          getActiveMedicinesAction(),
        ]);

        if (!isMounted) return;

        setSuppliers(supplierData);
        setMedicines(medicineData);
      } catch (error) {
        if (!isMounted) return;

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load pharmacy data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      isMounted = false;
    };
  }, []);

  
  
  

  const totalAmount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + (item.quantity === "" ? 0 : item.quantity) * (item.purchase_price === "" ? 0 : item.purchase_price),
      0,
    );
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + (item.quantity === "" ? 0 : item.quantity),
      0,
    );
  }, [items]);

  
  
  

  function createEmptyItem(): OrderItem {
    return { ...EMPTY_ORDER_ITEM };
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      createEmptyItem(),
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      toast.error("At least one medicine is required.");
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function updateItem(
    index: number,
    field: keyof OrderItem,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "medicine_id") {
          return {
            ...item,
            medicine_id: value,
          };
        }

        if (value === "") {
          return {
            ...item,
            [field]: "",
          };
        }

        const numericValue = Number(value);

        return {
          ...item,
          [field]: Number.isFinite(numericValue)
            ? numericValue
            : 0,
        };
      }),
    );
  }

  function handleQuantityFocus(index: number) {
    if (items[index].quantity === 1) {
      updateItem(index, "quantity", "");
    }
  }

  function handlePriceFocus(index: number) {
    if (items[index].purchase_price === 0) {
      updateItem(index, "purchase_price", "");
    }
  }

  function resetForm() {
    setSupplierId("");
    setExpectedDate("");
    setNotes("");
    setItems([createEmptyItem()]);
  }

  
  
  

  function validateForm(): boolean {
    if (!supplierId) {
      toast.error("Please select a supplier.");
      return false;
    }

    if (items.length === 0) {
      toast.error("Please add at least one medicine.");
      return false;
    }

    const medicineIds = new Set<string>();

    for (const item of items) {
      if (!item.medicine_id) {
        toast.error("Please select a medicine for every item.");
        return false;
      }

      if (medicineIds.has(item.medicine_id)) {
        toast.error(
          "A medicine cannot be added more than once.",
        );
        return false;
      }

      medicineIds.add(item.medicine_id);

      if (
        item.quantity === "" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        toast.error(
          "Quantity must be a positive whole number.",
        );
        return false;
      }

      if (
        item.purchase_price === "" ||
        !Number.isFinite(item.purchase_price) ||
        item.purchase_price < 0
      ) {
        toast.error("Purchase price cannot be negative.");
        return false;
      }
    }

    return true;
  }

  
  
  

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await createPurchaseOrderAction({
        supplier_id: supplierId,
        expected_date: expectedDate ? new Date(expectedDate) : undefined,
        notes: notes.trim(),
        items: items.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity === "" ? 0 : item.quantity,
          purchase_price: item.purchase_price === "" ? 0 : item.purchase_price,
        })),
      });

      toast.success("Purchase order created successfully.");

      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create purchase order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  
  
  

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border bg-white p-8 shadow-sm dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

          <div>
            <p className="font-medium">
              Loading purchase order form
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Fetching suppliers and medicines...
            </p>
          </div>
        </div>
      </div>
    );
  }

  
  
  

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">
          Create Purchase Order
        </h2>

        <p className="text-sm text-muted-foreground">
          Create an order for medicines from an approved supplier.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">
            Supplier Details
          </h3>

          <p className="text-sm text-muted-foreground">
            Select the supplier and expected delivery date.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supplier">
              Supplier <span className="text-red-500">*</span>
            </Label>

            <select
              id="supplier"
              value={supplierId}
              onChange={(event) =>
                setSupplierId(event.target.value)
              }
              disabled={isSubmitting}
              required
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                Select supplier
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>

            {suppliers.length === 0 && (
              <p className="text-xs text-amber-600">
                No active suppliers are available.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expected-date">
              Expected Delivery Date
            </Label>

            <Input
              id="expected-date"
              type="date"
              value={expectedDate}
              onChange={(event) =>
                setExpectedDate(event.target.value)
              }
              disabled={isSubmitting}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
      </section>
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">
              Order Items
            </h3>

            <p className="text-sm text-muted-foreground">
              Add medicines, quantities, and expected purchase prices.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const itemTotal =
              (item.quantity === "" ? 0 : item.quantity) * (item.purchase_price === "" ? 0 : item.purchase_price);

            return (
              <div
                key={`${index}-${item.medicine_id}`}
                className="rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-900/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Medicine #{index + 1}
                  </p>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={isSubmitting}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label={`Remove medicine ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-12">
                  <div className="space-y-2 md:col-span-6">
                    <Label htmlFor={`medicine-${index}`}>
                      Medicine{" "}
                      <span className="text-red-500">*</span>
                    </Label>

                    <select
                      id={`medicine-${index}`}
                      value={item.medicine_id}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "medicine_id",
                          event.target.value,
                        )
                      }
                      disabled={isSubmitting}
                      required
                      className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        Select medicine
                      </option>

                      {medicines.map((medicine) => (
                        <option
                          key={medicine.id}
                          value={medicine.id}
                        >
                          {medicine.name} — {medicine.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`quantity-${index}`}>
                      Quantity
                    </Label>

                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "quantity",
                          event.target.value,
                        )
                      }
                      onFocus={() => handleQuantityFocus(index)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor={`price-${index}`}>
                      Expected Purchase Price
                    </Label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {CURRENCY}
                      </span>

                      <Input
                        id={`price-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.purchase_price}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "purchase_price",
                            event.target.value,
                          )
                        }
                        onFocus={() => handlePriceFocus(index)}
                        disabled={isSubmitting}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end border-t pt-3">
                  <p className="text-sm text-muted-foreground">
                    Item Total:{" "}
                    <span className="font-semibold text-foreground">
                      {CURRENCY}
                      {itemTotal.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="space-y-2">
        <Label htmlFor="notes">
          Notes
        </Label>

        <textarea
          id="notes"
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Add any special instructions or information for the supplier..."
          rows={4}
          className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />

        <p className="text-xs text-muted-foreground">
          Optional. Include delivery instructions or other
          information relevant to this order.
        </p>
      </section>
      <section className="rounded-xl border bg-slate-50 p-5 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Medicines
            </p>

            <p className="text-lg font-semibold">
              {totalItems}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground">
              Expected Order Total
            </p>

            <p className="text-2xl font-bold tracking-tight">
              {CURRENCY}
              {totalAmount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Amount in Words:{" "}
              {toWords.convert(totalAmount, { currency: true })}
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          disabled={isSubmitting}
        >
          Reset
        </Button>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            suppliers.length === 0 ||
            medicines.length === 0
          }
          className="min-w-[170px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Purchase Order"
          )}
        </Button>
      </div>
    </form>
  );
}

