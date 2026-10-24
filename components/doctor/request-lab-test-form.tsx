"use client";

import { createDoctorLabOrders, LabOrderActionState } from "@/lib/actions/doctor/doctor-lab-orders.actions";
import { ArrowLeft, ClipboardList, FlaskConical, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import PatientSearchSelect, {
  type PatientSearchOption,
} from "@/components/doctor/patient-search-select";

type LabService = {
  id: number;
  service_name: string;
  description: string | null;
  price: number;
};

const initialState: LabOrderActionState = {
  success: false,
  message: "",
};

export default function RequestLabTestForm({
  patients,
  services,
}: {
  patients: PatientSearchOption[];
  services: LabService[];
}) {
  const [state, formAction, pending] = useActionState(
    createDoctorLabOrders,
    initialState
  );
  const [patientId, setPatientId] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/doctors/lab-orders"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to laboratory Order
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Request Laboratory Tests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a patient and the tests required for their medical care.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
          <FlaskConical size={25} />
        </div>
      </div>

      {state.message && (
        <div
          role="status"
          className={`rounded-xl border p-4 text-sm ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {state.message}
          {state.success && (
            <Link
              href="/doctors/lab-orders"
              className="ml-2 font-semibold underline"
            >
              View orders
            </Link>
          )}
        </div>
      )}

      <section className="glass-card space-y-5 rounded-2xl border border-slate-200/70 p-5 shadow-sm dark:border-slate-800 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Patient information
            </h2>
            <p className="text-sm text-slate-500">
              Search every registered patient and pick the one the tests are
              for.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="patientSearch"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Patient
          </label>
          <PatientSearchSelect
            patients={patients}
            value={patientId}
            onChange={setPatientId}
            disabled={pending}
          />
        </div>
      </section>

      <section className="glass-card space-y-5 rounded-2xl border border-slate-200/70 p-5 shadow-sm dark:border-slate-800 sm:p-6">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Select laboratory tests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select all tests required for this patient.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            No services are available. Add laboratory services before
            requesting a test.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/70 dark:border-slate-800 dark:hover:bg-indigo-950/20 dark:has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-950/30"
              >
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {service.service_name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      }).format(service.price)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {service.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card space-y-3 rounded-2xl border border-slate-200/70 p-5 shadow-sm dark:border-slate-800 sm:p-6">
        <label
          htmlFor="notes"
          className="block font-semibold text-slate-900 dark:text-white"
        >
          Clinical notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Enter relevant clinical information or test instructions..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Link
          href="/doctors/lab-orders"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending || !patientId || services.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
          {pending ? "Submitting..." : "Submit Lab Order"}
        </button>
      </div>
    </form>
  );
}
