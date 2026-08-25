"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import type { AppointmentStatus } from "@/lib/generated/prisma/enums";

export async function updateAppointmentStatus({
  appointmentId,
  status,
  reason,
}: {
  appointmentId: number;
  status: "Scheduled" | "Confirmed" | "CheckedIn" | "InProgress" | "Completed" | "Cancelled" | "NoShow";
  reason?: string;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  let userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    const staff = await db.staff.findFirst({
      where: { clerkUserId: userId },
      select: { role: true },
    });
    if (staff) userRole = staff.role;
  }

  const allowedRoles = ["Receptionist", "admin", "SuperAdmin", "Doctor", "Nurse"];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return { success: false, error: "You don't have permission to update appointments." };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, first_name: true, last_name: true, email: true } },
      doctor: { select: { id: true, name: true, clerkUserId: true } },
    },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  try {
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as AppointmentStatus,
        note: reason ? (appointment.note ? `${appointment.note}\n${reason}` : reason) : appointment.note,
      },
    });

    const appointmentDateStr = new Date(appointment.appointment_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Notify the Patient
    if (appointment.patient) {
      let patientActionMsg = "";
      if (status === "Scheduled" || status === "Confirmed") {
        patientActionMsg = `Your appointment with Dr. ${appointment.doctor.name} on ${appointmentDateStr} at ${appointment.time} has been accepted and confirmed.`;
      } else if (status === "Cancelled") {
        patientActionMsg = `Your appointment request with Dr. ${appointment.doctor.name} on ${appointmentDateStr} at ${appointment.time} was cancelled/rejected.`;
      } else if (status === "Completed") {
        patientActionMsg = `Your consultation with Dr. ${appointment.doctor.name} on ${appointmentDateStr} has been marked as completed.`;
      }

      if (patientActionMsg) {
        await db.notification.create({
          data: {
            user_id: appointment.patient.id,
            title: status === "Cancelled" ? "Appointment Rejected / Cancelled" : "Appointment Confirmed",
            message: patientActionMsg,
            type: "appointment",
            link: "/patient/appointments",
          },
        });
      }
    }

    // Notify the Doctor
    if (appointment.doctor) {
      const doctorTargetId = appointment.doctor.id;
      let doctorMsg = "";
      if (status === "Scheduled" || status === "Confirmed") {
        doctorMsg = `Appointment for ${appointment.patient.first_name} ${appointment.patient.last_name} on ${appointmentDateStr} at ${appointment.time} has been confirmed.`;
      } else if (status === "Cancelled") {
        doctorMsg = `Appointment for ${appointment.patient.first_name} ${appointment.patient.last_name} on ${appointmentDateStr} at ${appointment.time} was cancelled.`;
      }

      if (doctorMsg) {
        await db.notification.create({
          data: {
            user_id: doctorTargetId,
            title: status === "Cancelled" ? "Appointment Cancelled" : "Appointment Confirmed",
            message: doctorMsg,
            type: "appointment",
            link: "/dashboard?role=Doctor",
          },
        });
      }
    }

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/patient/appointments");

    return { success: true, appointment: updated };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: "Failed to update appointment status." };
  }
}
