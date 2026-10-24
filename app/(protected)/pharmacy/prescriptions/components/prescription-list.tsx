"use client";

import { FileText, Pill } from "lucide-react";

import { PrescriptionCard } from "./prescription-card";

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

interface PrescriptionListProps {
  prescriptions: Prescription[];
}

export function PrescriptionList({ prescriptions }: PrescriptionListProps) {
  if (prescriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold">No prescriptions found</p>
        <p className="text-sm text-muted-foreground">
          Try changing your search or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard key={prescription.id} prescription={prescription} />
      ))}
    </div>
  );
}