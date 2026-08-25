import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import db from "@/lib/db";
import Link from "next/link";
import { DoctorDetailActions } from "@/components/staff/doctor-detail-actions";
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Calendar,
  ArrowLeft,
  BadgeCheck,
  Hash,
  Stethoscope,
  Clock,
  Briefcase,
} from "lucide-react";

export default async function DoctorDetailPage({
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

  const doctor = await db.doctor.findUnique({
    where: { id },
    include: { working_days: true },
  });

  if (!doctor) {
    redirect("/doctors");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Inactive":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "Dormant":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "FullTime":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "PartTime":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Consultant":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "Visiting":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <AppShell userRole={userRole}>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/doctors"
          className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Doctors
        </Link>

        {/* Header Section */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0">
                {getInitials(doctor.name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Dr. {doctor.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center text-slate-300 text-sm">
                    <Stethoscope className="w-4 h-4 mr-1.5 text-indigo-400" />
                    {doctor.specialization}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      doctor.status
                    )}`}
                  >
                    {doctor.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getTypeColor(
                      doctor.type
                    )}`}
                  >
                    <Briefcase className="w-3 h-3" />
                    {doctor.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link
                href={`/doctors/registration?edit=${doctor.id}`}
                className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all font-medium text-sm"
              >
                Edit Profile
              </Link>
              <DoctorDetailActions
                doctorId={doctor.id}
                currentStatus={doctor.status}
                doctorName={doctor.name}
                userRole={userRole}
                clerkUserId={doctor.clerkUserId}
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <BadgeCheck className="w-5 h-5 text-indigo-400" />
              Professional Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Department</p>
                  <p className="text-slate-200">{doctor.department || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">License Number</p>
                  <p className="text-slate-200">{doctor.license_number}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Availability Status</p>
                  <p className="text-slate-200">{doctor.availability_status || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Onboarding Status</p>
                  <p className="text-slate-200">{doctor.onboardingCompleted ? "Completed" : "Pending"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Join Date</p>
                  <p className="text-slate-200">
                    {new Date(doctor.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Mail className="w-5 h-5 text-purple-400" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Personal Email</p>
                  <a
                    href={`mailto:${doctor.email}`}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {doctor.email}
                  </a>
                </div>
              </div>
              {doctor.hospitalEmail && (
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-400">Hospital Email</p>
                    <a
                      href={`mailto:${doctor.hospitalEmail}`}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {doctor.hospitalEmail}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Phone Number</p>
                  <p className="text-slate-200">{doctor.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="text-slate-200">{doctor.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Working Days */}
        {doctor.working_days && doctor.working_days.length > 0 && (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Clock className="w-5 h-5 text-emerald-400" />
              Schedule & Working Days
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-3 px-4 text-sm font-medium text-slate-400">
                      Day
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-400">
                      Start Time
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-400">
                      Close Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {doctor.working_days.map((day: any) => (
                    <tr
                      key={day.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {day.day}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {day.start_time}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {day.close_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
