"use client";

import React, { useMemo, useState } from "react";
import { Search, Stethoscope, Eye, Pencil, Phone, Mail, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type Doctor = {
  id: string;
  email: string;
  name: string;
  specialization: string;
  license_number: string;
  phone: string;
  address: string;
  department: string | null;
  img: string | null;
  availability_status: string | null;
  type: string;
  status: string;
  created_at: Date | string;
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return `${parts[0]?.charAt(0) || ""}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

const statusColors: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
  "On Break": "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
  "In Surgery": "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900",
  OffDuty: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
};

const accountStatusColors: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
  Inactive: "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
  Dormant: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
};

export function DoctorsTable({ doctors }: { doctors: Doctor[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return doctors;
    return doctors.filter((doctor) => {
      return (
        doctor.name.toLowerCase().includes(query) ||
        doctor.email.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query) ||
        doctor.department?.toLowerCase().includes(query) ||
        doctor.phone.includes(query) ||
        doctor.license_number.toLowerCase().includes(query)
      );
    });
  }, [doctors, searchQuery]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Doctors & Staff
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {filteredDoctors.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Manage and monitor registered doctors
              </p>
            </div>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs shadow-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Doctor</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Specialization</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">License #</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
              <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                      <Stethoscope className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No doctors found</p>
                    <p className="mt-1 text-xs text-slate-400">Try changing your search query.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:ring-slate-700">
                        {getInitials(doctor.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {doctor.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                            {doctor.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {doctor.specialization}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {doctor.department || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
                        <Phone className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {doctor.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {doctor.license_number}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {doctor.availability_status ? (
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${statusColors[doctor.availability_status] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {doctor.availability_status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${accountStatusColors[doctor.status] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${doctor.type === "FullTime" ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                      {doctor.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/doctors/${doctor.id}`} title="View doctor" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/doctors/registration?edit=${doctor.id}`} title="Edit doctor" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredDoctors.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredDoctors.length}</span> doctors
          </p>
          <p className="text-[11px] text-slate-400">Hospital Management System</p>
        </div>
      )}
    </section>
  );
}
