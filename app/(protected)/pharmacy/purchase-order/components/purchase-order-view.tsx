"use client";

import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getpurchaseOrderAction } from "@/lib/actions/pharmacy/purchase-order.actions";

import PurchaseOrderForm from "../components/purchase-order-form";
import PurchaseOrderTable from "../components/purchase-order-table";

interface PurchaseOrderViewProps {
  initialOrders: any[];
}

export function PurchaseOrderView({ initialOrders }: PurchaseOrderViewProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getpurchaseOrderAction();
      setOrders(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load purchase orders",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function handleAdd() {
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    void loadOrders();
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage pharmacy medicine purchase orders.
          </p>
        </div>

        <Button onClick={handleAdd} className="rounded-xl">
          <Plus data-icon="inline-start" className="h-4 w-4" />
          Add Purchase Order
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Add Purchase Order
              </h2>
              <p className="text-sm text-muted-foreground">
                Create a new purchase order for medicines.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Close purchase order form"
              onClick={handleCloseForm}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <PurchaseOrderForm onSuccess={handleFormSuccess} />
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading purchase orders...</p>
        </div>
      ) : (
        <PurchaseOrderTable
          orders={orders}
          onUpdated={loadOrders}
        />
      )}
    </div>
  );
}
