"use client";

import { useState } from "react";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BatchOption {
  id: string;
  batch_number: string;
  medicine_name: string;
  quantity: number;
  expiry_date: string;
  unit: string;
}

interface BatchSelectorProps {
  batches: BatchOption[];
  selectedBatchId?: string;
  onSelect: (batch: BatchOption | null) => void;
}

export function BatchSelector({
  batches,
  selectedBatchId,
  onSelect,
}: BatchSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredBatches = batches.filter((batch) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      batch.batch_number.toLowerCase().includes(q) ||
      batch.medicine_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batch..."
          className="pl-9"
        />
      </div>

      <div className="max-h-48 overflow-y-auto rounded-xl border">
        {filteredBatches.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No batches found
            </p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <button
              key={batch.id}
              type="button"
              onClick={() =>
                onSelect(
                  selectedBatchId === batch.id ? null : batch
                )
              }
              className={`flex w-full items-center justify-between border-b p-3 text-left text-sm last:border-0 hover:bg-muted/50 ${
                selectedBatchId === batch.id ? "bg-primary/5" : ""
              }`}
            >
              <div>
                <p className="font-medium">
                  {batch.batch_number} — {batch.medicine_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {new Date(batch.expiry_date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className="font-semibold">
                {batch.quantity} {batch.unit}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}