"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Pill } from "lucide-react";

import PrescriptionStatus from "./prescription-status";
import { DispenseSummary } from "./dispense-summary";
import { DispenseForm } from "./dispense-form";

interface Batch {
  id: string;
  batch_number: string;
  quantity: number;
  medicine_id: string;
  expiry_date: Date;
}

interface PrescriptionItem {
  id: string;
  medicine_id: string;
  quantity: number;
  dispensed_qty: number;
}

interface MedicineItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensed_qty: number;
  created_at: Date;
  updated_at: Date;
  medicine: {
    id: string;
    name: string;
    generic_name: string | null;
    category: string | null;
    unit: string;
    manufacturer: string | null;
    batches: Batch[];
  };
}

interface Prescription {
  id: string;
  status: "PENDING" | "PARTIALLY_DISPENSED" | "DISPENSED" | "CANCELLED";
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    date_of_birth: Date;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
    phone: string;
  };
  medicines: MedicineItem[];
}

interface PrescriptionDetailsProps {
  prescription: Prescription;
  dispensedBy: string;
  canDispense?: boolean;
}

export function PrescriptionDetails({
  prescription,
  dispensedBy,
  canDispense = false,
}: PrescriptionDetailsProps) {
  const router = useRouter();
  const totalQty = prescription.medicines.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const dispensedQty = prescription.medicines.reduce(
    (sum, item) => sum + item.dispensed_qty,
    0,
  );

  const dispenseMedicines = prescription.medicines.map((item) => ({
    id: item.medicine.id,
    name: item.medicine.name,
    generic_name: item.medicine.generic_name,
    unit: item.medicine.unit,
  }));

  const dispenseItems: PrescriptionItem[] = prescription.medicines.map(
    (item) => ({
      id: item.id,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      dispensed_qty: item.dispensed_qty,
    }),
  );

  const dispenseBatches = prescription.medicines.flatMap((item) =>
    item.medicine.batches.map((batch) => ({
      id: batch.id,
      batch_number: batch.batch_number,
      quantity: batch.quantity,
      medicine_id: batch.medicine_id,
      expiry_date: batch.expiry_date,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/pharmacy/prescriptions"
          className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Prescription #{prescription.id.slice(-8).toUpperCase()}
            </h1>
            <PrescriptionStatus status={prescription.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created{" "}
            {new Date(prescription.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Prescription Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Patient</p>
                <p className="font-semibold">
                  {prescription.patient.first_name}{" "}
                  {prescription.patient.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {prescription.patient.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doctor</p>
                <p className="font-semibold">{prescription.doctor.name}</p>
                <p className="text-sm text-muted-foreground">
                  {prescription.doctor.specialization}
                </p>
              </div>
            </div>
            {prescription.notes && (
              <div className="mt-4 rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{prescription.notes}</p>
              </div>
            )}
          </div>

          <div className=" space-y-6  gap-5">
            {prescription.status !== "DISPENSED" &&
              prescription.status !== "CANCELLED" &&
              canDispense && (
                <DispenseForm
                  prescriptionId={prescription.id}
                  medicines={dispenseMedicines}
                  batches={dispenseBatches}
                  items={dispenseItems}
                  dispensedBy={dispensedBy}
                  onSuccess={() => router.refresh()}
                />
              )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <DispenseSummary
            totalQty={totalQty}
            dispensedQty={dispensedQty}
            status={prescription.status}
          />

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Pill className="h-5 w-5 text-primary" />
              Prescribed Medicines
            </h2>
            <div className="space-y-3">
              {prescription.medicines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="font-semibold">{item.medicine.name}</p>
                    {item.medicine.generic_name && (
                      <p className="text-xs text-muted-foreground">
                        {item.medicine.generic_name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.dosage} · {item.frequency} · {item.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {item.dispensed_qty} / {item.quantity}{" "}
                      <span className="text-xs text-muted-foreground">
                        {item.medicine.unit}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">dispensed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
