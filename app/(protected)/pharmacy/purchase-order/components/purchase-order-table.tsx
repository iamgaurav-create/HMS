"use client";

import {
  canclePurchaseOrderAction,
  placePurchaseOrderAction,
} from "@/lib/actions/pharmacy/purchase-order.actions";
import ReceiveStockDialog from "./receive-stock-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, XCircle, CheckCircle2, PackageCheck } from "lucide-react";
import DownlodePDFButton from "./download-pdf-button";

type PurchaseOrder = {
  id: string;
  order_number: string;

  status: "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  order_date: Date;
  expected_date: Date | null;
  pdf_url: string | null;
  supplier: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    id: string;
    quantity: number;
    recived_quantity: number;
    received_quantity: number;

    medicine: {
      name: string;
      unit: string;
    };
  }[];
};

type props = {
  orders: PurchaseOrder[];
  onUpdated: () => void;
};

export default function PurchaseOrderTable({ orders, onUpdated }: props) {
  const [loading, setLoading] = useState<string | null>(null);
  async function handlePlaceOrder(id: string) {
    console.log("[Client] Place order clicked for id:", id);
    try {
      setLoading(id);
      console.log("[Client] Calling placePurchaseOrderAction...");
      const result = await placePurchaseOrderAction(id);
      console.log("[Client] Action result:", result);
      if (result.emailSend) {
        toast.success("Order placed. Email sent.");
      }
      onUpdated();
    } catch (error) {
      console.error("[Client] Place order error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to place order",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleCancle(id: string) {
    try {
      setLoading(id);
      await canclePurchaseOrderAction(id);
      toast.success("Purchase order cancelled");
      onUpdated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancle order",
      );
    } finally {
      setLoading(null);
    }
  }

  function getStatusClass(status: PurchaseOrder["status"]) {
    switch (status) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700";

      case "ORDERED":
        return "bg-blue-100 text-blue-700";

      case "PARTIALLY_RECEIVED":
        return "bg-amber-100 text-amber-700";

      case "RECEIVED":
        return "bg-emerald-100 text-emerald-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";
    }
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center dark:bg-slate-950">
        <p className="font-semibold">No Purchase orders</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first pharmacy purchase order above.
        </p>
      </div>
    );
  }
  return (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b bg-slate-50 dark:bg-slate-900">
              <th className="px-5 py-4 text-left text-xl font-semibold">PO</th>
              <th className="px-5 py-4 text-left text-xl font-semibold">
                Supplier
              </th>
              <th className="px-5 py-4 text-left text-xl font-semibold">
                Medicines
              </th>
              <th className="px-5 py-4 text-left text-xl font-semibold">
                Date
              </th>
              <th className="px-5 py-4 text-left text-xl font-semibold">
                Status
              </th>
              <th className="px-5 py-4 text-left text-xl font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
              >
                <td className="px-5 py-4">
                  <div className="font-semibold">{order.order_number}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold">{order.supplier.name}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.medicine.name}
                        {" × "}
                        {item.quantity}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {new Date(order.order_date).toLocaleDateString("en-IN")}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(order.status)}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    {order.status === "DRAFT" && (
                      <>
                        <Button
                          size="sm"
                          disabled={loading === order.id}
                          onClick={() => handlePlaceOrder(order.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {loading === order.id ? "Sending..." : "Place Order"}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={loading === order.id}
                          onClick={() => handleCancle(order.id)}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    {(order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED") && (
                      <>
                        <ReceiveStockDialog purchaseOrderId={order.id} />
                        <DownlodePDFButton
                          pdfUrl={order.pdf_url}
                          orderNumber={order.order_number}
                        />
                      </>
                    )}
                    {order.status === "RECEIVED" && (
                      <DownlodePDFButton
                        pdfUrl={order.pdf_url}
                        orderNumber={order.order_number}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
