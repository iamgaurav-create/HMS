"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Users,
  Eye,
  Pencil,
  Phone,
  Mail,
  CalendarDays,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { StatCard } from "../cards/stat-card";

export type Patient = {
  id: string;
  patientNumber: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date | string;
  gender: string;
  phone: string;
  email: string;
  blood_group: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  insurance_provider: string | null;
  status: "Active" | "Inactive" | "Dormant";
  created_at: Date | string;
};

function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(
  firstName: string,
  lastName: string,
) {
  return `${firstName.charAt(0)}${lastName.charAt(
    0,
  )}`.toUpperCase();
}

const bloodGroupStyle: Record<string, string> = {
  "A+": "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  "A-": "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  "B+": "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800",
  "B-": "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800",
  "AB+": "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-800",
  "AB-": "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-800",
  "O+": "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
  "O-": "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
};

export function PatientsTable({
  patients,
  currentPage,
  totalPages,
  totalPatients,
}: {
  patients: Patient[];
  currentPage: number;
  totalPages: number;
  totalPatients: number;
}) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const metrics = useMemo(() => {
    const now = new Date();

    const totalPatients = patients.length;

    const activePatients = patients.filter(
      (patient) =>
        patient.status === "Active",
    ).length;

    const inactivePatients = patients.filter(
      (patient) =>
        patient.status === "Inactive",
    ).length;

    const dormantPatients = patients.filter(
      (patient) =>
        patient.status === "Dormant",
    ).length;

    const newThisMonth = patients.filter(
      (patient) => {
        const createdAt = new Date(
          patient.created_at,
        );

        return (
          createdAt.getMonth() ===
            now.getMonth() &&
          createdAt.getFullYear() ===
            now.getFullYear()
        );
      },
    ).length;

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      dormantPatients,
      newThisMonth,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.patientNumber
          .toLowerCase()
          .includes(query) ||
        patient.first_name
          .toLowerCase()
          .includes(query) ||
        patient.last_name
          .toLowerCase()
          .includes(query) ||
        patient.email
          .toLowerCase()
          .includes(query) ||
        patient.phone.includes(query)
      );
    });
  }, [patients, searchQuery]);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={metrics.totalPatients.toLocaleString()}
          change={`${metrics.totalPatients} registered`}
          trend="up"
          subtitle="All patient records"
          icon={
            <Users className="h-5 w-5" />
          }
          gradient="from-sky-500/20 to-indigo-500/10"
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />

        <StatCard
          title="Active Patients"
          value={metrics.activePatients.toLocaleString()}
          change={`${metrics.activePatients} active`}
          trend="up"
          subtitle="Currently active records"
          icon={
            <UserCheck className="h-5 w-5" />
          }
          gradient="from-emerald-500/20 to-teal-500/10"
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />

        <StatCard
          title="Inactive Patients"
          value={metrics.inactivePatients.toLocaleString()}
          change={`${metrics.inactivePatients} inactive`}
          trend="down"
          subtitle="Inactive records"
          icon={
            <UserX className="h-5 w-5" />
          }
          gradient="from-slate-500/20 to-gray-500/10"
          iconColor="text-slate-600 bg-slate-500/10 dark:bg-slate-500/20"
        />

        <StatCard
          title="New This Month"
          value={metrics.newThisMonth.toLocaleString()}
          change={`${metrics.newThisMonth} new`}
          trend="up"
          subtitle="Patients registered this month"
          icon={
            <UserPlus className="h-5 w-5" />
          }
          gradient="from-violet-500/20 to-purple-500/10"
          iconColor="text-violet-600 bg-violet-500/10 dark:bg-violet-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Patients
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {filteredPatients.length}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Manage and monitor registered
                  patients
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                type="search"
                placeholder="Search patient..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs shadow-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Patient
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Patient ID
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Age / Gender
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Contact
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Blood
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Emergency
                </th>

                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Registered
                </th>

                <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Status
                </th>

                <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                        <Users className="h-5 w-5 text-slate-400" />
                      </div>

                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No patients found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your search
                        query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(
                  (patient) => {
                    const age =
                      calculateAge(
                        patient.date_of_birth,
                      );

                    return (
                      <tr
                        key={patient.id}
                        className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:ring-slate-700">
                              {getInitials(
                                patient.first_name,
                                patient.last_name,
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {
                                  patient.first_name
                                }{" "}
                                {
                                  patient.last_name
                                }
                              </p>

                              <div className="mt-0.5 flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />

                                <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                                  {
                                    patient.email
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            {
                              patient.patientNumber
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {age} years
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {patient.gender}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
                              <Phone className="h-3 w-3 text-slate-400" />
                            </div>

                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {patient.phone}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {patient.blood_group ? (
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${
                                bloodGroupStyle[
                                  patient
                                    .blood_group
                                ] ??
                                "bg-slate-50 text-slate-600 ring-slate-200"
                              }`}
                            >
                              {
                                patient.blood_group
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div>
                            <p className="max-w-[150px] truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {
                                patient.emergency_contact_name
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {
                                patient.emergency_contact_number
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                            <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(
                                patient.created_at,
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          {patient.status ===
                            "Active" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}

                          {patient.status ===
                            "Inactive" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}

                          {patient.status ===
                            "Dormant" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Dormant
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/patients/${patient.id}`}
                              title="View patient"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/patient/registration?edit=${encodeURIComponent(
                                patient.id,
                              )}`}
                              title="Edit patient"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>



<div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-xs text-slate-400">
      Showing{" "}
      <span className="font-semibold text-slate-200">
        {patients.length}
      </span>{" "}
      of{" "}
      <span className="font-semibold text-slate-200">
        {totalPatients}
      </span>{" "}
      patients
    </p>
  </div>

  <div className="flex items-center gap-1">
    {currentPage > 1 ? (
      <Link
        href={`/patients?page=${currentPage - 1}`}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        Previous
      </Link>
    ) : (
      <span className="cursor-not-allowed rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-600">
        Previous
      </span>
    )}

    {Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    ).map((page) => (
      <Link
        key={page}
        href={`/patients?page=${page}`}
        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
          page === currentPage
            ? "bg-teal-500 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {page}
      </Link>
    ))}

    {currentPage < totalPages ? (
      <Link
        href={`/patients?page=${currentPage + 1}`}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        Next
      </Link>
    ) : (
      <span className="cursor-not-allowed rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-600">
        Next
      </span>
    )}
  </div>
</div>

      </div>

    </section>
  );
}