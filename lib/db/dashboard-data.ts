import db from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";
import type { ActivityItem } from "@/components/tables/recent-activities-table";
import type { AppointmentRow } from "@/components/tables/upcoming-appointments-table";
import type { QueueItem } from "@/components/tables/patient-queue-table";
import type { WardPatient } from "@/components/tables/ward-patients-table";
import type { LabTestRow } from "@/components/tables/pending-tests-table";
import type { InvoiceRow } from "@/components/tables/invoices-table";

export interface DashboardMetrics {
  totalPatients: number;
  totalDoctors: number;
  todaysAppointments: number;
  activeAdmissions: number;
  revenueToday: number;
  pendingBills: number;
  availableBeds: number;
  emergencyPatients: number;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(date: Date, time?: string) {
  if (time) return time;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function mapAppointmentStatus(
  status: string
): AppointmentRow["status"] {
  switch (status.toLowerCase()) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "scheduled":
      return "Scheduled";
    default:
      return "Pending";
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const start = todayStart();

  try {
    const [
      totalPatients,
      totalDoctors,
      todaysAppointments,
      unpaidBills,
      revenueToday,
      scheduledToday,
      emergencyPatients,
    ] = await Promise.all([
      db.patient.count(),
      db.doctor.count(),
      db.appointment.count({ where: { appointment_date: { gte: start } } }),
      db.payment.count({ where: { status: "UnPaid" } }),
      db.payment.aggregate({
        _sum: { amount_paid: true },
        where: { payment_date: { gte: start } },
      }),
      db.appointment.count({
        where: {
          appointment_date: { gte: start },
          status: { in: ["Scheduled", "Pending"] },
        },
      }),
      db.appointment.count({
        where: {
          type: { contains: "Emergency", mode: "insensitive" },
          appointment_date: { gte: start },
        },
      }),
    ]);

    const revenue = revenueToday._sum.amount_paid ?? 0;

    return {
      totalPatients,
      totalDoctors,
      todaysAppointments,
      activeAdmissions: Math.max(scheduledToday, 0),
      revenueToday: revenue,
      pendingBills: unpaidBills,
      availableBeds: Math.max(50 - scheduledToday, 0),
      emergencyPatients: Math.min(emergencyPatients, 12),
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalPatients: 0,
      totalDoctors: 0,
      todaysAppointments: 0,
      activeAdmissions: 0,
      revenueToday: 0,
      pendingBills: 0,
      availableBeds: 50,
      emergencyPatients: 0,
    };
  }
}

export async function getRecentActivities(): Promise<ActivityItem[]> {
  try {
    const logs = await db.auditlog.findMany({
      orderBy: { created_at: "desc" },
      take: 8,
    });

    if (logs.length === 0) return [];

    return logs.map((log) => ({
      id: `ACT-${log.id}`,
      user: log.user_id,
      action: log.details,
      time: relativeTime(log.created_at),
      status: log.action.toLowerCase().includes("urgent")
        ? "Urgent"
        : log.action.toLowerCase().includes("pending")
          ? "Pending"
          : "Completed",
      type:
        log.model === "Payment"
          ? "billing"
          : log.model === "LabTest"
            ? "lab"
            : log.model === "Patient"
              ? "registration"
              : "appointment",
    }));
  } catch {
    return [];
  }
}

export async function getUpcomingAppointments(): Promise<AppointmentRow[]> {
  try {
    const start = todayStart();
    const appointments = await db.appointment.findMany({
      where: { appointment_date: { gte: start } },
      include: {
        patient: { select: { first_name: true, last_name: true } },
        doctor: { select: { name: true, department: true } },
      },
      orderBy: { appointment_date: "asc" },
      take: 10,
    });

    return appointments.map((apt) => ({
      id: `APT-${apt.id}`,
      patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
      doctorName: apt.doctor.name,
      department: apt.doctor.department ?? "General",
      time: formatTime(apt.appointment_date, apt.time),
      type: apt.type,
      status: mapAppointmentStatus(apt.status),
    }));
  } catch {
    return [];
  }
}

export async function getPatientQueue(): Promise<QueueItem[]> {
  try {
    const start = todayStart();
    const appointments = await db.appointment.findMany({
      where: {
        appointment_date: { gte: start },
        status: { in: ["Pending", "Scheduled"] },
      },
      include: {
        patient: { select: { first_name: true, last_name: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { appointment_date: "asc" },
      take: 12,
    });

    return appointments.map((apt, i) => ({
      id: apt.id,
      token: `#Q-${apt.id}`,
      patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
      type: apt.type.toLowerCase().includes("walk") ? "Walk-in" : "Appointment",
      assignedDoctor: apt.doctor.name,
      waitTime: `${(i + 1) * 8} mins`,
      rawStatus: apt.status,
      status:
        apt.status === "Completed"
          ? "Completed"
          : apt.status === "Pending"
            ? "Waiting"
            : "Checked-In",
    }));
  } catch {
    return [];
  }
}

export async function getDoctorAvailability() {
  try {
    const doctors = await db.doctor.findMany({
      take: 8,
      include: {
        appointments: {
          where: { appointment_date: { gte: todayStart() } },
          select: { id: true },
        },
      },
    });

    return doctors.map((doc) => ({
      name: doc.name,
      dept: doc.department ?? doc.specialization,
      status: doc.availability_status ?? "Available",
      room: doc.address.split(",")[0] || "OPD",
      queue: doc.appointments.length,
    }));
  } catch {
    return [];
  }
}

export async function getWardPatients(): Promise<WardPatient[]> {
  try {
    const vitals = await db.vitalSigns.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        medical: {
          include: {
            patient: {
              select: { first_name: true, last_name: true, gender: true, date_of_birth: true },
            },
          },
        },
      },
    });

    return vitals.map((v, i) => {
      const patient = v.medical?.patient;
      const age = patient
        ? Math.floor(
            (Date.now() - patient.date_of_birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          )
        : 0;

      return {
        bedNo: `W${Math.floor(i / 4) + 1}-Bed ${String(i + 1).padStart(2, "0")}`,
        patientName: patient
          ? `${patient.first_name} ${patient.last_name}`
          : "Unknown Patient",
        ageGender: patient ? `${age} / ${patient.gender}` : "—",
        doctor: "Attending Physician",
        vitals: `BP ${v.systolic}/${v.diastolic} | Temp ${v.temperature}°F | HR ${v.heartRate}`,
        medicationStatus: i % 3 === 0 ? "Due Now" : i % 3 === 1 ? "Given" : "Pending",
        condition: v.systolic > 140 ? "Critical" : v.systolic > 120 ? "Improving" : "Stable",
      };
    });
  } catch {
    return [];
  }
}

export async function getPendingLabTests(): Promise<LabTestRow[]> {
  try {
    const tests = await db.labTest.findMany({
      where: { status: { not: "Completed" } },
      include: {
        service: { select: { service_name: true } },
        medical_record: {
          include: {
            patient: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { test_date: "desc" },
      take: 10,
    });

    return tests.map((test) => ({
      testId: `LAB-${test.id}`,
      patientName: test.medical_record?.patient
        ? `${test.medical_record.patient.first_name} ${test.medical_record.patient.last_name}`
        : "Unknown",
      testName: test.service.service_name,
      doctorName: "Attending Physician",
      priority:
        test.status === "Urgent"
          ? "Urgent"
          : test.status === "High"
            ? "High"
            : "Normal",
      requestedAt: relativeTime(test.test_date),
      status:
        test.status === "Sample Collected"
          ? "Sample Collected"
          : test.status === "Completed"
            ? "Completed"
            : "Pending",
    }));
  } catch {
    return [];
  }
}

export async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const payments = await db.payment.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        patient: { select: { first_name: true, last_name: true } },
        appointment: { select: { type: true } },
      },
    });

    return payments.map((p) => ({
      invoiceId: `INV-${p.receipt_number}`,
      patientName: `${p.patient.first_name} ${p.patient.last_name}`,
      service: p.appointment?.type ?? "Hospital Services",
      totalAmount: `$${p.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      amountPaid: `$${p.amount_paid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      date: p.bill_date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status:
        p.status === "paid"
          ? "Paid"
          : p.status === "PartPayment"
            ? "Part Payment"
            : "Unpaid",
    }));
  } catch {
    return [];
  }
}

export async function getDoctorSchedule(): Promise<AppointmentRow[]> {
  try {
    const start = todayStart();
    const appointments = await db.appointment.findMany({
      where: { appointment_date: { gte: start } },
      include: {
        patient: { select: { first_name: true, last_name: true, id: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { appointment_date: "asc" },
      take: 12,
    });

    return appointments.map((apt) => {
      const status =
        apt.status === "Completed"
          ? "Completed"
          : apt.status === "Scheduled"
            ? "Scheduled"
            : apt.status === "Pending"
              ? "Pending"
              : "Cancelled";

      return {
        id: `APT-${apt.id}`,
        patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
        doctorName: apt.doctor.name,
        department: apt.type,
        time: formatTime(apt.appointment_date, apt.time),
        type: apt.type,
        status,
      };
    });
  } catch {
    return [];
  }
}

export async function getPatientByEmail(email: string) {
  try {
    return await db.patient.findUnique({
      where: { email },
      include: {
        appointments: {
          where: { appointment_date: { gte: new Date() } },
          include: { doctor: { select: { name: true } } },
          orderBy: { appointment_date: "asc" },
          take: 5,
        },
        medical: {
          orderBy: { created_at: "desc" },
          take: 5,
          include: { lab_test: { include: { service: true } } },
        },
        payments: {
          orderBy: { created_at: "desc" },
          take: 5,
          include: { appointment: { select: { type: true } } },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getAccountMetrics() {
  const start = todayStart();
  try {
    const [todayIncome, pendingPayments, totalInvoices] = await Promise.all([
      db.payment.aggregate({
        _sum: { amount_paid: true },
        where: { payment_date: { gte: start } },
      }),
      db.payment.aggregate({
        _sum: { total_amount: true },
        where: { status: "UnPaid" },
      }),
      db.payment.count(),
    ]);

    return {
      todayIncome: todayIncome._sum.amount_paid ?? 0,
      pendingPayments: pendingPayments._sum.total_amount ?? 0,
      totalInvoices,
    };
  } catch {
    return { todayIncome: 0, pendingPayments: 0, totalInvoices: 0 };
  }
}

export async function getReceptionistMetrics() {
  const start = todayStart();
  try {
    const [queueCount, registrationsToday, appointmentsToday] = await Promise.all([
      db.appointment.count({
        where: {
          appointment_date: { gte: start },
          status: { in: ["Pending", "Scheduled"] },
        },
      }),
      db.patient.count({ where: { created_at: { gte: start } } }),
      db.appointment.count({ where: { appointment_date: { gte: start } } }),
    ]);

    return { queueCount, registrationsToday, appointmentsToday };
  } catch {
    return { queueCount: 0, registrationsToday: 0, appointmentsToday: 0 };
  }
}

export async function getLabMetrics() {
  const start = todayStart();
  try {
    const [pending, completed] = await Promise.all([
      db.labTest.count({ where: { status: { not: "Completed" } } }),
      db.labTest.count({
        where: { status: "Completed", created_at: { gte: start } },
      }),
    ]);
    return { pending, completed };
  } catch {
    return { pending: 0, completed: 0 };
  }
}

export async function getPharmacyMetrics() {
  try {
    const pendingRx = await db.medicalRecords.count({
      where: { prescriptions: { not: null } },
    });
    return { pendingRx, lowStock: 0, salesToday: 0 };
  } catch {
    return { pendingRx: 0, lowStock: 0, salesToday: 0 };
  }
}

export async function getNurseMetrics() {
  const start = todayStart();
  try {
    const [vitalsToday, activePatients] = await Promise.all([
      db.vitalSigns.count({ where: { created_at: { gte: start } } }),
      db.appointment.count({
        where: {
          appointment_date: { gte: start },
          status: { in: ["Scheduled", "Pending"] },
        },
      }),
    ]);
    return { vitalsToday, activePatients };
  } catch {
    return { vitalsToday: 0, activePatients: 0 };
  }
}

export async function getAllStaff() {
  try {
    return await db.staff.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        department: true,
        license_number: true,
        role: true,
        hospitalEmail: true,
        status: true,
        created_at: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getHRMetrics() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalStaff, totalDoctors, activeStaff, newThisMonth, inactiveStaff, inactiveDoctors, pendingOnboarding] = await Promise.all([
      db.staff.count(),
      db.doctor.count(),
      db.staff.count({ where: { status: "Active" } }),
      db.staff.count({
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
      }),
      db.staff.count({ where: { status: { in: ["Inactive", "Dormant"] } } }),
      db.doctor.count({ where: { status: { in: ["Inactive", "Dormant"] } } }),
      db.staff.count({ where: { onboardingCompleted: false } }),
    ]);

    return {
      totalStaff,
      totalDoctors,
      activeStaff,
      newThisMonth,
      inactiveStaff,
      inactiveDoctors,
      pendingOnboarding,
    };
  } catch (error) {
    console.error("Error fetching HR metrics:", error);
    return {
      totalStaff: 0,
      totalDoctors: 0,
      activeStaff: 0,
      newThisMonth: 0,
      inactiveStaff: 0,
      inactiveDoctors: 0,
      pendingOnboarding: 0,
    };
  }
}

export async function getAllDoctors() {
  try {
    return await db.doctor.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        specialization: true,
        license_number: true,
        phone: true,
        address: true,
        department: true,
        img: true,
        availability_status: true,
        type: true,
        status: true,
        created_at: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getRecentStaffActivities(): Promise<ActivityItem[]> {
  try {
    const logs = await db.auditlog.findMany({
      where: {
        OR: [
          { model: "Staff" },
          { model: "Doctor" },
        ],
      },
      orderBy: { created_at: "desc" },
      take: 8,
    });

    if (logs.length === 0) return [];

    return logs.map((log) => ({
      id: `ACT-${log.id}`,
      user: log.user_id,
      action: log.details,
      time: relativeTime(log.created_at),
      status: log.action.toLowerCase().includes("urgent")
        ? "Urgent"
        : log.action.toLowerCase().includes("pending")
          ? "Pending"
          : "Completed",
      type: "registration",
    }));
  } catch {
    return [];
  }
}

export interface RoleCount {
  role: string;
  total: number;
  active: number;
  inactive: number;
}

export async function getStaffCountsByRole(): Promise<RoleCount[]> {
  try {
    const staff = await db.staff.findMany({
      select: {
        role: true,
        status: true,
      },
    });

    const counts: Record<string, { total: number; active: number; inactive: number }> = {};

    for (const s of staff) {
      if (!counts[s.role]) {
        counts[s.role] = { total: 0, active: 0, inactive: 0 };
      }
      counts[s.role].total += 1;
      if (s.status === "Active") {
        counts[s.role].active += 1;
      } else if (s.status === "Inactive" || s.status === "Dormant") {
        counts[s.role].inactive += 1;
      }
    }

    return Object.entries(counts).map(([role, counts]) => ({
      role,
      total: counts.total,
      active: counts.active,
      inactive: counts.inactive,
    }));
  } catch {
    return [];
  }
}

export async function getStaffByRole(role: string) {
  try {
    return await db.staff.findMany({
        where: { role: role as Role },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        department: true,
        license_number: true,
        role: true,
        hospitalEmail: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getAllStaffAndDoctors() {
  try {
    const [staff, doctors] = await Promise.all([
      db.staff.findMany({
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          department: true,
          license_number: true,
          role: true,
          hospitalEmail: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      db.doctor.findMany({
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          department: true,
          specialization: true,
          license_number: true,
          availability_status: true,
          type: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    return { staff, doctors };
  } catch {
    return { staff: [], doctors: [] };
  }
}

export async function getPendingOnboarding() {
  try {
    const [staff, doctors] = await Promise.all([
      db.staff.findMany({
        where: { onboardingStatus: { in: ["PENDING", "IN_PROGRESS"] } },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          hospitalEmail: true,
          department: true,
          status: true,
          created_at: true,
        },
      }),
      db.doctor.findMany({
        where: { onboardingCompleted: false },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          specialization: true,
          department: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    return { staff, doctors };
  } catch {
    return { staff: [], doctors: [] };
  }
}

export async function getStaffOnboardingByStatus(status: "UNDER_REVIEW" | "CHANGES_REQUESTED") {
  try {
    return await db.staff.findMany({
      where: { onboardingStatus: status },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        onboardingStatus: true,
        changeRequest: true,
        rejectionReason: true,
        created_at: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getRecentlyOnboarded(days: number) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const [staff, doctors] = await Promise.all([
      db.staff.findMany({
        where: { created_at: { gte: cutoff }, onboardingStatus: "COMPLETED" },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          hospitalEmail: true,
          department: true,
          status: true,
          created_at: true,
        },
      }),
      db.doctor.findMany({
        where: { created_at: { gte: cutoff }, onboardingCompleted: true },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          specialization: true,
          department: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    return { staff, doctors };
  } catch {
    return { staff: [], doctors: [] };
  }
}

export async function getOffboardedStaff() {
  try {
    const [staff, doctors] = await Promise.all([
      db.staff.findMany({
        where: { status: "Inactive" },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          hospitalEmail: true,
          department: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      db.doctor.findMany({
        where: { status: "Inactive" },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          specialization: true,
          department: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    return { staff, doctors };
  } catch {
    return { staff: [], doctors: [] };
  }
}
