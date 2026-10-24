import "server-only";
import db from "../db";
import type { AppointmentStatus } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  groupLabTestsIntoOrders,
  labOrderTestInclude,
  LEGACY_ORDER_PREFIX,
  type LabOrderGroup,
  type LabOrderTest,
} from "@/lib/db/lab-order-groups";

const INACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "Cancelled",
  "NoShow",
];

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Appointments/medical records store `Doctor.id`, which is a generated UUID and
 * never the Clerk user id. The Clerk session id lives in `Doctor.clerkUserId`,
 * so the profile has to be resolved before it can be used in a `doctor_id` filter.
 */
export async function getDoctorProfile(clerkUserId: string) {
  return db.doctor.findFirst({
    where: {
      OR: [{ clerkUserId }, { id: clerkUserId }],
    },
    select: {
      id: true,
      name: true,
      specialization: true,
    },
  });
}

export type LabOrderPatient = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  appointmentId: number | null;
  lastVisitDate: string | null;
};

/**
 * Every active patient can be ordered tests for, not only the ones that
 * already sit in the doctor's own schedule. The most recent appointment with
 * this doctor is attached to each patient so the form can show the last visit
 * and reuse that appointment when the order is submitted.
 */
export async function getDoctorLabOrderFormData(clerkUserId: string) {
  const doctor = await getDoctorProfile(clerkUserId);

  if (!doctor) {
    return { patients: [] as LabOrderPatient[], services: [] };
  }

  const [patients, services] = await Promise.all([
    db.patient.findMany({
      where: { status: "Active" },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
      select: {
        id: true,
        patientNumber: true,
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        appointments: {
          where: {
            doctor_id: doctor.id,
            status: { notIn: [...INACTIVE_APPOINTMENT_STATUSES] },
          },
          orderBy: { appointment_date: "desc" },
          take: 1,
          select: { id: true, appointment_date: true },
        },
      },
    }),
    db.service.findMany({
      orderBy: {
        service_name: "asc",
      },
      select: {
        id: true,
        service_name: true,
        description: true,
        price: true,
      },
    }),
  ]);

  return {
    patients: patients.map((patient) => ({
      id: patient.id,
      patientNumber: patient.patientNumber,
      firstName: patient.first_name,
      lastName: patient.last_name,
      fullName: `${patient.first_name} ${patient.last_name}`,
      phone: patient.phone,
      email: patient.email,
      appointmentId: patient.appointments[0]?.id ?? null,
      lastVisitDate: patient.appointments[0]?.appointment_date.toISOString() ?? null,
    })),
    services,
  };
}

/**
 * A lab order hangs off a medical record and a medical record requires an
 * appointment. When the doctor orders tests for a patient they have not seen
 * yet, the appointment is created on the fly so the order still has a valid
 * clinical context. The slot lookup keeps the
 * `@@unique([doctor_id, appointment_date, time])` index satisfied.
 */
export async function resolveLabOrderAppointment(
  patientId: string,
  doctorId: string
): Promise<{ appointmentId: number; created: boolean }> {
  const existing = await db.appointment.findFirst({
    where: {
      patient_id: patientId,
      doctor_id: doctorId,
      status: { notIn: [...INACTIVE_APPOINTMENT_STATUSES] },
    },
    orderBy: { appointment_date: "desc" },
    select: { id: true },
  });

  if (existing) {
    return { appointmentId: existing.id, created: false };
  }

  const now = new Date();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const sameDay = await db.appointment.findMany({
    where: {
      doctor_id: doctorId,
      appointment_date: { gte: dayStart, lt: dayEnd },
    },
    select: { time: true },
  });

  const takenSlots = new Set(sameDay.map((appointment) => appointment.time));

  for (let offset = 0; offset < 90; offset += 1) {
    const slot = new Date(now.getTime() + offset * 60_000);
    const time = `${String(slot.getHours()).padStart(2, "0")}:${String(
      slot.getMinutes()
    ).padStart(2, "0")}`;

    if (takenSlots.has(time)) {
      continue;
    }

    try {
      const appointment = await db.appointment.create({
        data: {
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: dayStart,
          time,
          status: "InProgress",
          type: "Lab Order",
          reason: "Laboratory order requested without a scheduled visit",
          note: "Created automatically when the laboratory order was submitted.",
        },
        select: { id: true },
      });

      return { appointmentId: appointment.id, created: true };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      takenSlots.add(time);
    }
  }

  throw new Error("No free slot was found for the laboratory order.");
}

export type DoctorLabOrderTest = LabOrderTest;
export type DoctorLabOrder = LabOrderGroup;

type LabTestScope =
  | { kind: "all" }
  | { kind: "order"; orderId: string }
  | { kind: "legacy"; medicalRecordId: number };

async function loadDoctorLabTestRows(
  doctorId: string,
  scope: LabTestScope = { kind: "all" }
) {
  const where: Prisma.LabTestWhereInput =
    scope.kind === "order"
      ? {
          order_id: scope.orderId,
          medical_record: {
            appointment: {
              doctor_id: doctorId,
            },
          },
        }
      : scope.kind === "legacy"
        ? {
            OR: [
              {
                order_id: `${LEGACY_ORDER_PREFIX}${scope.medicalRecordId}`,
              },
              { order_id: null },
            ],
            medical_record: {
              id: scope.medicalRecordId,
              appointment: {
                doctor_id: doctorId,
              },
            },
          }
        : {
            medical_record: {
              appointment: {
                doctor_id: doctorId,
              },
            },
          };

  return db.labTest.findMany({
    where,
    orderBy: {
      created_at: "desc",
    },
    include: labOrderTestInclude,
  });
}

/**
 * All laboratory orders the doctor requested. Tests that were ordered
 * together are returned as a single order so the list and the printed
 * document show one row per order instead of one row per test.
 */
export async function getDoctorLabOrders(
  clerkUserId: string
): Promise<DoctorLabOrder[]> {
  const doctor = await getDoctorProfile(clerkUserId);

  if (!doctor) {
    return [];
  }

  const rows = await loadDoctorLabTestRows(doctor.id);

  return groupLabTestsIntoOrders(rows);
}

/**
 * A single order, used to print the laboratory request document.
 */
export async function getDoctorLabOrder(
  clerkUserId: string,
  orderId: string
): Promise<DoctorLabOrder | null> {
  const doctor = await getDoctorProfile(clerkUserId);

  if (!doctor) {
    return null;
  }

  /**
   * Orders created before the grouping column existed are keyed by the
   * medical record they belong to.
   */
  const legacyRecordId = orderId.startsWith(LEGACY_ORDER_PREFIX)
    ? Number(orderId.slice(LEGACY_ORDER_PREFIX.length))
    : null;

  const rows = await loadDoctorLabTestRows(
    doctor.id,
    legacyRecordId
      ? { kind: "legacy", medicalRecordId: legacyRecordId }
      : { kind: "order", orderId }
  );

  const order = groupLabTestsIntoOrders(rows).find(
    (entry) => entry.orderId === orderId
  );

  return order ?? null;
}
