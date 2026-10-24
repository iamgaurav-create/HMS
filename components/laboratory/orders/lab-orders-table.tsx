"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  ChevronRight,
  Filter,
  FilterX,
  FlaskConical,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabSearch } from "@/components/laboratory/shared/lab-search";
import { LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import { updateLabOrderStatus } from "@/lib/actions/laboratory/orders.action";
import {
  labStatusActionLabel,
  nextLabOrderStatuses,
  resolveOrderStage,
} from "@/lib/lab/order-status";
import type {
  LaboratoryOrder,
  LaboratoryOrderTest,
} from "@/components/laboratory/shared/lab-types";

export type { LaboratoryOrder, LaboratoryOrderTest };

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function LabOrdersTable({ orders }: { orders: LaboratoryOrder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = search.trim().toLowerCase();

      if (query) {
        const matches =
          order.orderNumber.toLowerCase().includes(query) ||
          order.patientName.toLowerCase().includes(query) ||
          order.patientNumber.toLowerCase().includes(query) ||
          order.doctorName.toLowerCase().includes(query) ||
          order.tests.some((test) =>
            test.name.toLowerCase().includes(query)
          );

        if (!matches) {
          return false;
        }
      }

      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (dateFrom) {
        const from = new Date(dateFrom).getTime();

        if (new Date(order.testDate).getTime() < from) {
          return false;
        }
      }

      if (dateTo) {
        const to = new Date(dateTo).getTime();

        if (new Date(order.testDate).getTime() > to) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleStatusChange(orderId: string, status: string) {
    startTransition(async () => {
      const result = await updateLabOrderStatus(orderId, status);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-card glass-card-hover p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabSearch
            value={search}
            onChange={setSearch}
            placeholder="Search order, patient or test"
            label="Search orders"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="Released">Released</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9"
              aria-label="Orders from"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9"
              aria-label="Orders until"
            />
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Filter size={15} />
            <span>
              {filteredOrders.length} of {orders.length} orders
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 gap-1 px-2 text-xs"
            >
              <FilterX size={13} />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl glass-card">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
            <tr>
              <th className="px-5 py-4 font-semibold">Order</th>
              <th className="px-5 py-4 font-semibold">Patient</th>
              <th className="px-5 py-4 font-semibold">Tests</th>
              <th className="px-5 py-4 font-semibold">Requested By</th>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Amount</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-500/10">
                    <FlaskConical size={26} />
                  </div>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">
                    No laboratory orders found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasFilters
                      ? "Try clearing the filters to see every order."
                      : "Orders requested by a doctor will show up here."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const stage = resolveOrderStage(
                  order.tests.map((test) => test.status)
                );
                const nextStatuses = nextLabOrderStatuses(stage);
                const primaryStatus = nextStatuses.find(
                  (status) => status !== "Cancelled"
                );
                const cancelStatus = nextStatuses.find(
                  (status) => status === "Cancelled"
                );

                return (
                  <tr
                    key={order.orderId}
                    className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.testCount}{" "}
                        {order.testCount === 1 ? "test" : "tests"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {order.patientName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.patientNumber}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <ul className="flex flex-col gap-1">
                        {order.tests.map((test) => (
                          <li
                            key={test.id}
                            className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                          >
                            <span>{test.name}</span>
                            <LabStatusBadge
                              status={test.status}
                              className="text-[10px]"
                            />
                          </li>
                        ))}
                      </ul>
                    </td>

                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Stethoscope size={14} className="text-slate-400" />
                        {order.doctorName
                          ? `Dr. ${order.doctorName}`
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.doctorSpecialization || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatDate(order.testDate)}
                    </td>

                    <td className="px-5 py-4">
                      <LabStatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col items-end gap-2">
                        {primaryStatus ? (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              handleStatusChange(
                                order.orderId,
                                primaryStatus
                              )
                            }
                            className="h-8 gap-1.5 text-xs"
                          >
                            {labStatusActionLabel(primaryStatus)}
                          </Button>
                        ) : null}

                        <div className="flex items-center gap-2">
                          {cancelStatus ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                handleStatusChange(
                                  order.orderId,
                                  cancelStatus
                                )
                              }
                              className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              Cancel
                            </Button>
                          ) : null}

                          <Link
                            href={`/lab/orders/${order.orderId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                          >
                            Details
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
