"use client";

import Link from "next/link";
import { Calendar, FileText, Pill, User } from "lucide-react";

import PrescriptionStatus from "./prescription-status";

interface MedicineItem {
  id: string;
  quantity: number;
  dispensed_qty: number;
  medicine: {
    id: string;
    name: string;
    generic_name: string | null;
    unit: string;
  };
}

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
  medicines: MedicineItem[];
}

interface PrescriptionCardProps {
  prescription: Prescription;
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const totalItems = prescription.medicines.length;
  const totalQty = prescription.medicines.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const dispensedQty = prescription.medicines.reduce(
    (sum, item) => sum + item.dispensed_qty,
    0
  );
  const isFullyDispensed =
    prescription.status === "DISPENSED" || dispensedQty >= totalQty;

  return (
    <Link
      href={`/pharmacy/prescriptions/${prescription.id}`}
      className="block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              Prescription #{prescription.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              Created{" "}
              {new Date(prescription.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <PrescriptionStatus status={prescription.status as any} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Patient</p>
            <p className="font-medium">
              {prescription.patient.first_name} {prescription.patient.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Doctor</p>
            <p className="font-medium">
              {prescription.doctor.name} ({prescription.doctor.specialization})
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-sm">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <span>
            {totalItems} medicine{totalItems !== 1 ? "s" : ""} · {totalQty} units
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={isFullyDispensed ? "text-green-600" : "text-amber-600 font-medium"}>
            {dispensedQty} / {totalQty} dispensed
          </span>
        </div>
      </div>

      {prescription.notes && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {prescription.notes}
        </p>
      )}
    </Link>
  );
}