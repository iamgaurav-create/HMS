"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Search, UserRound, X } from "lucide-react";

export type PatientSearchOption = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  lastVisitDate: string | null;
};

type Props = {
  patients: PatientSearchOption[];
  value: string;
  onChange: (patientId: string) => void;
  disabled?: boolean;
};

const MAX_VISIBLE_RESULTS = 25;

function formatVisitDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function PatientSearchSelect({
  patients,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => patients.find((patient) => patient.id === value) ?? null,
    [patients, value]
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return patients;
    }

    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(term) ||
        patient.patientNumber.toLowerCase().includes(term) ||
        patient.phone.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term)
    );
  }, [patients, query]);

  const visibleResults = useMemo(
    () => results.slice(0, MAX_VISIBLE_RESULTS),
    [results]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectPatient(patient: PatientSearchOption) {
    onChange(patient.id);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        visibleResults.length === 0 ? 0 : (index + 1) % visibleResults.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        visibleResults.length === 0
          ? 0
          : (index - 1 + visibleResults.length) % visibleResults.length
      );
      return;
    }

    if (event.key === "Enter") {
      if (open && visibleResults[activeIndex]) {
        event.preventDefault();
        selectPatient(visibleResults[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/40 dark:bg-indigo-500/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
            {initials(selected.firstName, selected.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selected.fullName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {selected.patientNumber} · {selected.phone}
              {selected.lastVisitDate
                ? ` · Last visit ${formatVisitDate(selected.lastVisitDate)}`
                : " · No previous visit"}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
          >
            <X size={14} />
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              id="patientSearch"
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls="patient-search-results"
              aria-autocomplete="list"
              autoComplete="off"
              disabled={disabled}
              value={query}
              placeholder="Search patients by name, ID, phone or email..."
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {open && (
            <div
              id="patient-search-results"
              role="listbox"
              className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {visibleResults.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500">
                  No patients match &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                visibleResults.map((patient, index) => (
                  <button
                    key={patient.id}
                    type="button"
                    role="option"
                    aria-selected={patient.id === value}
                    onClick={() => selectPatient(patient)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      index === activeIndex
                        ? "bg-indigo-50 dark:bg-indigo-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      {initials(patient.firstName, patient.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {patient.fullName}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {patient.patientNumber} · {patient.phone}
                      </p>
                    </div>
                    {patient.lastVisitDate ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <CalendarDays size={11} />
                        {formatVisitDate(patient.lastVisitDate)}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                        New
                      </span>
                    )}
                    {patient.id === value && (
                      <Check size={15} className="shrink-0 text-indigo-600" />
                    )}
                  </button>
                ))
              )}

              {results.length > visibleResults.length && (
                <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800">
                  Showing {visibleResults.length} of {results.length} matches. Keep
                  typing to narrow the search.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {patients.length === 0 && (
        <p className="mt-2 flex items-center gap-2 text-sm text-amber-600">
          <UserRound size={15} />
          No patients are registered yet.
        </p>
      )}
    </div>
  );
}
