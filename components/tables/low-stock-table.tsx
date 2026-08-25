import React from "react";
import { Pill, AlertTriangle, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface StockItem {
  id: string;
  medicineName: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unitPrice: string;
  status: "Critical" | "Low Stock" | "In Stock";
}

export function LowStockTable({ items, onReorder }: { items?: StockItem[]; onReorder?: () => void }) {
  const defaultItems: StockItem[] = [
    { id: "MED-101", medicineName: "Amoxicillin 500mg Capsule", category: "Antibiotics", currentStock: 12, minThreshold: 50, unitPrice: "$8.50", status: "Critical" },
    { id: "MED-102", medicineName: "Paracetamol 650mg Tablet", category: "Analgesic", currentStock: 28, minThreshold: 100, unitPrice: "$2.20", status: "Low Stock" },
    { id: "MED-103", medicineName: "Insulin Glargine 100IU/ml", category: "Diabetes", currentStock: 5, minThreshold: 20, unitPrice: "$45.00", status: "Critical" },
    { id: "MED-104", medicineName: "Atorvastatin 20mg Tablet", category: "Cardiovascular", currentStock: 45, minThreshold: 60, unitPrice: "$12.00", status: "Low Stock" },
    { id: "MED-105", medicineName: "Azithromycin 250mg", category: "Antibiotics", currentStock: 18, minThreshold: 40, unitPrice: "$14.50", status: "Low Stock" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Low Stock & Inventory Replenishment Alerts
          </h3>
        </div>
        {onReorder && (
          <Button onClick={onReorder} size="sm" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs">
            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Reorder Supplies
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Code</th>
              <th className="pb-3 font-bold">Medicine Name</th>
              <th className="pb-3 font-bold">Category</th>
              <th className="pb-3 font-bold">Current Stock</th>
              <th className="pb-3 font-bold">Min Threshold</th>
              <th className="pb-3 font-bold text-right">Stock Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 font-mono font-bold text-slate-400 whitespace-nowrap">
                  {row.id}
                </td>
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.medicineName}
                </td>
                <td className="py-3 text-slate-500 whitespace-nowrap">{row.category}</td>
                <td className="py-3 font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {row.currentStock} Units
                </td>
                <td className="py-3 text-slate-400 whitespace-nowrap">{row.minThreshold} Units</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Badge variant={row.status === "Critical" ? "destructive" : "warning"}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
