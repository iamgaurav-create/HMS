import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import db from "@/lib/db";
import Link from "next/link";
import { StaffDetailActions } from "@/components/staff/staff-detail-actions";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Calendar,
  BadgeCheck,
  Hash,
} from "lucide-react";

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { sessionClaims } = await auth();
  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole || !["SuperAdmin", "admin", "HR"].includes(userRole)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const staff = await db.staff.findUnique({
    where: { id },
  });

  if (!staff) {
    redirect("/staffs");
  }

  const initials = staff.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Inactive":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
      case "Dormant":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <AppShell userRole={userRole}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/staffs"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff List
        </Link>

        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="relative p-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {staff.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">
                    <Shield className="w-4 h-4 mr-1.5" />
                    {staff.role}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(
                      staff.status
                    )}`}
                  >
                    {staff.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Personal Email
                      </p>
                      <p>{staff.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Building className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Hospital Email
                      </p>
                      <p>{staff.hospitalEmail || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Phone
                      </p>
                      <p>{staff.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Address
                      </p>
                      <p>{staff.address || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Professional Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Building className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Department
                      </p>
                      <p>{staff.department || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Hash className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        License Number
                      </p>
                      <p>{staff.license_number || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <BadgeCheck className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Onboarding Status
                      </p>
                      <p>{staff.onboardingStatus.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Join Date
                      </p>
                      <p>{formatDate(staff.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-8 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/staffs/registration?edit=${staff.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:bg-sky-700 hover:shadow-lg"
              >
                Edit Profile
              </Link>

              <StaffDetailActions
                staffId={staff.id}
                currentStatus={staff.status}
                currentRole={staff.role}
                staffName={staff.name}
                userRole={userRole}
                clerkUserId={staff.clerkUserId}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
