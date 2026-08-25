"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export interface AppointmentState {
  error?: string;
}

export async function createAppointment(
  _prevState: AppointmentState,
  formData: FormData
): Promise<AppointmentState> {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } =
    await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/patient/appointments/new",
    });
  }

  let email = sessionClaims?.email as string | undefined;
  if (!email) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId!);
      email = user.emailAddresses[0]?.emailAddress;
    } catch (e) {
      console.error("Error retrieving user email:", e);
    }
  }

  if (!email) {
    return { error: "Unable to identify patient email." };
  }

  const patient = await db.patient.findUnique({
    where: { email },
    select: { id: true, first_name: true, last_name: true },
  });

  if (!patient) {
    redirect("/patient/registration");
  }

  const doctorId = String(formData.get("doctorId") || "");
  const appointmentDate = String(formData.get("appointmentDate") || "");
  const time = String(formData.get("time") || "");
  const type = String(formData.get("type") || "");
  const reason = String(formData.get("reason") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!doctorId || !appointmentDate || !time || !type) {
    return {
      error: "Please select a doctor, date, time and appointment type.",
    };
  }

  const selectedDate = new Date(`${appointmentDate}T00:00:00Z`);

  if (Number.isNaN(selectedDate.getTime())) {
    return { error: "Invalid appointment date." };
  }

  const today = new Date().toLocaleDateString("en-CA");

  if (appointmentDate < today) {
    return { error: "You cannot book an appointment for a past date." };
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
        status: "Pending",
      },
    });

    // Notify the doctor about the new appointment
    await db.notification.create({
      data: {
        user_id: doctorId,
        title: "New Appointment Booked",
        message: `Patient ${patient.first_name} ${patient.last_name} booked a ${type} for ${appointmentDate} at ${time}.`,
        type: "appointment",
        link: "/dashboard?role=Doctor",
      },
    });

    // Notify all receptionists
    await db.notification.create({
      data: {
        user_id: "role:Receptionist",
        title: "New Appointment Request",
        message: `Patient ${patient.first_name} ${patient.last_name} requested a ${type} with Dr. ${doctor.name} for ${appointmentDate} at ${time}.`,
        type: "appointment",
        link: "/appointments",
      },
    });

    const activeReceptionists = await db.staff.findMany({
      where: { role: "Receptionist", status: "Active" },
      select: { id: true, clerkUserId: true },
    });

    for (const rec of activeReceptionists) {
      const target = rec.clerkUserId || rec.id;
      await db.notification.create({
        data: {
          user_id: target,
          title: "New Appointment Request",
          message: `Patient ${patient.first_name} ${patient.last_name} requested a ${type} with Dr. ${doctor.name} for ${appointmentDate} at ${time}.`,
          type: "appointment",
          link: "/appointments",
        },
      });
    }
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

  redirect("/patient/appointments?success=created");
}
