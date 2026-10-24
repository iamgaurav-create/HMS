"use client";

import { useMemo, useState } from "react";

import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { InventoryRow } from "@/lib/actions/pharmacy/inventory.action";


type Props = {
  rows: InventoryRow[];
};

type Filter =
  | "ALL"
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "EXPIRING_SOON"
  | "EXPIRED";

export default function InventoryTable({
  rows,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const filteredRows =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return rows.filter((row) => {
        const matchesSearch =
          !query ||
          row.medicineName
            .toLowerCase()
            .includes(query) ||
          row.genericName
            ?.toLowerCase()
            .includes(query) ||
          row.batchNumber
            .toLowerCase()
            .includes(query) ||
          row.supplierName
            .toLowerCase()
            .includes(query) ||
          row.category
            ?.toLowerCase()
            .includes(query);

        const matchesFilter =
          filter === "ALL" ||
          row.status === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      });
    }, [rows, search, filter]);

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  }

  function formatCurrency(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  function statusBadge(
    status: InventoryRow["status"]
  ) {
    switch (status) {
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </span>
        );

      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            <XCircle className="h-3 w-3" />
            Out of Stock
          </span>
        );

      case "EXPIRING_SOON":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
            <Clock className="h-3 w-3" />
            Expiring Soon
          </span>
        );

      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            <XCircle className="h-3 w-3" />
            Expired
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            <Package className="h-3 w-3" />
            In Stock
          </span>
        );
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Inventory
          </h2>

          <p className="text-sm text-muted-foreground">
            {filteredRows.length} batch
            {filteredRows.length !== 1
              ? "es"
              : ""}{" "}
            found
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search medicine, batch..."
              className="pl-9 sm:w-[280px]"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as Filter
              )
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">
              All Stock
            </option>

            <option value="IN_STOCK">
              In Stock
            </option>

            <option value="LOW_STOCK">
              Low Stock
            </option>

            <option value="OUT_OF_STOCK">
              Out of Stock
            </option>

            <option value="EXPIRING_SOON">
              Expiring Soon
            </option>

            <option value="EXPIRED">
              Expired
            </option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-5 py-4 text-left font-semibold">
                Medicine
              </th>

              <th className="px-5 py-4 text-left font-semibold">
                Batch
              </th>

              <th className="px-5 py-4 text-left font-semibold">
                Supplier
              </th>

              <th className="px-5 py-4 text-right font-semibold">
                Quantity
              </th>

              <th className="px-5 py-4 text-left font-semibold">
                Expiry
              </th>

              <th className="px-5 py-4 text-right font-semibold">
                Purchase
              </th>

              <th className="px-5 py-4 text-right font-semibold">
                Selling
              </th>

              <th className="px-5 py-4 text-left font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map(
              (row) => (
                <tr
                  key={row.batchId}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium">
                        {
                          row.medicineName
                        }
                      </p>

                      {row.genericName && (
                        <p className="text-xs text-muted-foreground">
                          {
                            row.genericName
                          }
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs">
                    {
                      row.batchNumber
                    }
                  </td>

                  <td className="px-5 py-4">
                    {
                      row.supplierName
                    }
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div>
                      <span className="font-semibold">
                        {row.quantity}
                      </span>

                      <span className="ml-1 text-xs text-muted-foreground">
                        {row.unit}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Total:{" "}
                      {
                        row.totalMedicineStock
                      }
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(
                      row.expiryDate
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {formatCurrency(
                      row.purchasePrice
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {formatCurrency(
                      row.sellingPrice
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {statusBadge(
                      row.status
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 p-4 lg:hidden">
        {filteredRows.map(
          (row) => (
            <div
              key={row.batchId}
              className="rounded-xl border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {
                      row.medicineName
                    }
                  </h3>

                  {row.genericName && (
                    <p className="text-xs text-muted-foreground">
                      {
                        row.genericName
                      }
                    </p>
                  )}
                </div>

                {statusBadge(
                  row.status
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Batch
                  </p>

                  <p className="font-mono">
                    {
                      row.batchNumber
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Quantity
                  </p>

                  <p className="font-semibold">
                    {row.quantity}{" "}
                    {row.unit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Supplier
                  </p>

                  <p>
                    {
                      row.supplierName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Expiry
                  </p>

                  <p>
                    {formatDate(
                      row.expiryDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Purchase Price
                  </p>

                  <p>
                    {formatCurrency(
                      row.purchasePrice
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Selling Price
                  </p>

                  <p>
                    {formatCurrency(
                      row.sellingPrice
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                Total medicine stock:{" "}
                <strong>
                  {
                    row.totalMedicineStock
                  }
                </strong>{" "}
                {row.unit}
              </div>
            </div>
          )
        )}
      </div>

      {filteredRows.length === 0 && (
        <div className="p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <h3 className="font-semibold">
            No inventory found
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing your search or
            filter.
          </p>
        </div>
      )}
    </div>
  );
}