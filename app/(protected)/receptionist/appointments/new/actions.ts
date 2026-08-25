"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export interface ReceptionistAppointmentState {
  error?: string;
}

export async function createAppointmentByReceptionist(
  _prevState: ReceptionistAppointmentState,
  formData: FormData
): Promise<ReceptionistAppointmentState> {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } =
    await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/receptionist/appointments/new",
    });
  }

  const role = sessionClaims?.metadata?.role as string | undefined;

  if (role !== "Receptionist" && role !== "admin" && role !== "SuperAdmin") {
    redirect("/unauthorized");
  }

  const patientId = String(formData.get("patientId") || "");
  const doctorId = String(formData.get("doctorId") || "");
  const appointmentDate = String(formData.get("appointmentDate") || "");
  const time = String(formData.get("time") || "");
  const type = String(formData.get("type") || "");
  const reason = String(formData.get("reason") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!patientId || !doctorId || !appointmentDate || !time || !type) {
    return {
      error: "Please fill in all required fields: patient, doctor, date, time and type.",
    };
  }

  const selectedDate = new Date(`${appointmentDate}T00:00:00Z`);

  if (Number.isNaN(selectedDate.getTime())) {
    return { error: "Invalid appointment date." };
  }

  const today = new Date().toLocaleDateString("en-CA");

  if (appointmentDate < today) {
    return { error: "Cannot book an appointment for a past date." };
  }

  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { id: true, first_name: true, last_name: true },
  });

  if (!patient) {
    return { error: "Selected patient not found." };
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, status: true, name: true },
  });

  if (!doctor || doctor.status !== "Active") {
    return { error: "Selected doctor is not available." };
  }

  const existingAppointment = await db.appointment.findFirst({
    where: {
      doctor_id: doctorId,
      appointment_date: selectedDate,
      time,
      status: {
        in: ["Pending", "Scheduled", "Confirmed", "CheckedIn", "InProgress"],
      },
    },
  });

  if (existingAppointment) {
    return {
      error: "This time slot is already booked. Please choose another time.",
    };
  }

  try {
    await db.appointment.create({
      data: {
        patient_id: patient.id,
        doctor_id: doctorId,
        appointment_date: selectedDate,
        time,
        type,
        reason: reason || null,
        note: note || null,
        status: "Scheduled",
      },
    });

    // Create notification for the doctor
    await db.notification.create({
      data: {
        user_id: doctorId,
        title: "New Appointment Scheduled",
        message: `Receptionist booked a ${type} appointment for ${patient.first_name} ${patient.last_name} on ${appointmentDate} at ${time}.`,
        type: "appointment",
        link: "/dashboard?role=Doctor",
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return {
        error: "This time slot is already booked. Please choose another time.",
      };
    }

    return {
      error: "Something went wrong while booking. Please try again.",
    };
  }

  redirect("/dashboard?role=Receptionist");
}
