import { requireRole } from "@/lib/auth/guards";
import { getAllDoctors } from "@/lib/db/dashboard-data";
import { DoctorsTable } from "@/components/tables/doctors-table";
import { WelcomeCard } from "@/components/cards/welcome-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HRDoctorsPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const doctors = await getAllDoctors();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Doctor Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Register, update, and manage doctor accounts
          </p>
        </div>
        <Link
          href="/staffs/registration?defaultRole=Doctor"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600"
        >
          Register New Doctor
        </Link>
      </div>
      <DoctorsTable doctors={doctors} />
    </div>
  );
}
