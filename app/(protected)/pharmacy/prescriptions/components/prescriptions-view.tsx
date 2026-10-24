"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PrescriptionFilters } from "./prescription-filters";
import { PrescriptionList } from "./prescription-list";
// import { PrescriptionForm } from "./prescription-form";

interface Prescription {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
  medicines: Array<{
    id: string;
    quantity: number;
    dispensed_qty: number;
    medicine: {
      id: string;
      name: string;
      generic_name: string | null;
      unit: string;
    };
  }>;
}

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
}

export function PrescriptionsView({
  prescriptions,
}: PrescriptionsViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const patientName = `${prescription.patient.first_name} ${prescription.patient.last_name}`.toLowerCase();
    const doctorName = prescription.doctor.name.toLowerCase();
    const searchText = search.toLowerCase();
    const matchesSearch =
      !searchText ||
      patientName.includes(searchText) ||
      doctorName.includes(searchText) ||
      prescription.patient.phone.toLowerCase().includes(searchText);

    const matchesStatus =
      status === "all" || prescription.status === status;

    return matchesSearch && matchesStatus;
  });

  function handleFormSuccess() {
    setShowForm(false);
    toast.success("Prescription saved");
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Prescriptions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage patient prescriptions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <PrescriptionFilters
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />
      </div>

      <PrescriptionList prescriptions={filteredPrescriptions} />
    </div>
  );
}