
"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BillingList } from "./billing-list";

interface Bill {
  id: string;
  bill_number: string | number;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  status: string;
  created_at: string;
  patient: {
    patientNumber: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface BillingViewProps {
  initialBills: Bill[];
}

export function BillingView({ initialBills }: BillingViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredBills = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return initialBills.filter((bill) => {
      const patientName = bill.patient
        ? `${bill.patient.first_name ?? ""} ${bill.patient.last_name ?? ""}`
            .trim()
            .toLowerCase()
        : "";

      const billNumber = String(bill.bill_number ?? "").toLowerCase();

      const patientNumber = String(
        bill.patient?.patientNumber ?? ""
      ).toLowerCase();

      const matchesSearch =
        !searchText ||
        patientName.includes(searchText) ||
        billNumber.includes(searchText) ||
        patientNumber.includes(searchText);

      const matchesStatus =
        status === "all" || bill.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [initialBills, search, status]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "PARTIAL", label: "Partial" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pharmacy Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage pharmacy bills and payments
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, bill #, or patient #"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || status !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear filters"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear filters</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <BillingList bills={filteredBills} />
    </div>
  );
}
