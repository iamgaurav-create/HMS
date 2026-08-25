"use client";

import React, { useState } from "react";
import { Search, User, Stethoscope, FileText, CreditCard, X } from "lucide-react";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const mockResults = [
    { title: "Dr. Sarah Jenkins", category: "Doctor", desc: "Cardiology - OPD 204", icon: <Stethoscope className="h-4 w-4 text-emerald-500" /> },
    { title: "John Miller (P-1094)", category: "Patient", desc: "Admitted - Ward 3B Bed 12", icon: <User className="h-4 w-4 text-sky-500" /> },
    { title: "CBC & Blood Profile #884", category: "Lab Report", desc: "Completed - Patient: Emma Watson", icon: <FileText className="h-4 w-4 text-purple-500" /> },
    { title: "Invoice #INV-2026-904", category: "Billing", desc: "Unpaid - $1,450.00", icon: <CreditCard className="h-4 w-4 text-rose-500" /> },
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs text-slate-400 shadow-xs backdrop-blur-md transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/60 w-48 md:w-64"
      >
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="truncate">Search patients, doctors...</span>
        <kbd className="hidden md:inline-flex ml-auto items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-50 duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by patient name, doctor ID, lab test, invoice..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {query ? "Search Results" : "Recent Medical Lookup"}
              </div>
              {mockResults.length > 0 ? (
                mockResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {res.icon}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {res.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {res.desc}
                      </span>
                    </div>
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {res.category}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No medical records found matching &quot;{query}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
