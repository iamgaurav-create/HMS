"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  LoaderCircle,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createLabTest } from "@/lib/actions/laboratory/catalog.action";

type TestCatalogFormProps = {
  onCancel: () => void;
};

const initialForm = {
  service_name: "",
  description: "",
  price: "",
};

export function TestCatalogForm({ onCancel }: TestCatalogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState(initialForm);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      try {
        const result = await createLabTest({
          service_name: form.service_name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
        });

        if (result.success) {
          setForm({ ...initialForm });
          setMessage(
            result.message ?? "Laboratory test created successfully."
          );
          setIsError(false);
          router.refresh();
        } else {
          setMessage(
            result.message ?? "Failed to create laboratory test."
          );
          setIsError(true);
        }
      } catch {
        setMessage("Something went wrong. Please try again.");
        setIsError(true);
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-slate-700";

  return (
    <main className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <FlaskConical size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Add Laboratory Test
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a test service to your hospital catalog.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <section
          className={cn(
            "w-full rounded-2xl border p-5 shadow-sm sm:p-7",
            "border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          )}
        >
          <div className="border-b border-gray-100 pb-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Test Information
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter the basic details for this laboratory service.
            </p>
          </div>

          <div className="grid gap-5 p-0 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="service_name"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Test Name <span className="text-red-500">*</span>
              </label>

              <input
                id="service_name"
                name="service_name"
                required
                maxLength={150}
                value={form.service_name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    service_name: event.target.value,
                  }))
                }
                placeholder="e.g. Complete Blood Count (CBC)"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Description <span className="text-red-500">*</span>
              </label>

              <textarea
                id="description"
                name="description"
                required
                maxLength={1000}
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the laboratory test..."
                className={`${inputClass} resize-y`}
                disabled={isPending}
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Price <span className="text-red-500">*</span>
              </label>

              <input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    price: event.target.value,
                  }))
                }
                placeholder="Enter price"
                className={inputClass}
                disabled={isPending}
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Uses the same currency as your existing billing system.
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div
            role="alert"
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              isError
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
            )}
          >
            {message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/lab/catalog"
            onClick={(event) => {
              event.preventDefault();
              onCancel();
            }}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            {isPending ? "Saving..." : "Save Test"}
          </button>
        </div>
      </form>
    </main>
  );
}