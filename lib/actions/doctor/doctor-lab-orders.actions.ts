
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import {
  getDoctorProfile,
  isUniqueConstraintError,
  resolveLabOrderAppointment,
} from "@/lib/db/doctor-lab-orders";

export type LabOrderActionState = {
  success: boolean;
  message: string;
};

async function ensureMedicalRecord(
  appointment: { id: number; patient_id: string },
  doctorId: string
) {
  const existing = await db.medicalRecords.findFirst({
    where: {
      appointment_id: appointment.id,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return existing;
  }

  try {
    return await db.medicalRecords.create({
      data: {
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        doctor_id: doctorId,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const raced = await db.medicalRecords.findFirst({
        where: {
          appointment_id: appointment.id,
        },
        select: {
          id: true,
        },
      });

      if (raced) {
        return raced;
      }
    }

    throw error;
  }
}

export async function createDoctorLabOrders(
  _previousState: LabOrderActionState,
  formData: FormData
): Promise<LabOrderActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "Please sign in to request laboratory tests.",
    };
  }

  const patientId = String(formData.get("patientId") ?? "").trim();

  const serviceIds = [
    ...new Set(
      formData
        .getAll("serviceIds")
        .map((value) => Number(value))
        .filter(
          (id) => Number.isSafeInteger(id) && id > 0
        )
    ),
  ];

  const notes = String(formData.get("notes") ?? "").trim();

  /**
   * Every test requested in this submission shares one order id, so the
   * order is listed and printed as a single document.
   */
  const orderId = crypto.randomUUID();

  if (!patientId) {
    return {
      success: false,
      message: "Please select a patient.",
    };
  }

  if (serviceIds.length === 0) {
    return {
      success: false,
      message: "Select at least one laboratory test.",
    };
  }

  if (serviceIds.length > 20 || notes.length > 2000) {
    return {
      success: false,
      message: "Please reduce the number of tests or shorten your notes.",
    };
  }

  const doctor = await getDoctorProfile(userId);

  if (!doctor) {
    return {
      success: false,
      message:
        "Your doctor profile was not found. Please contact the administrator.",
    };
  }

  const patient = await db.patient.findFirst({
    where: {
      id: patientId,
      status: "Active",
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!patient) {
    return {
      success: false,
      message: "The selected patient was not found or is inactive.",
    };
  }

  const services = await db.service.findMany({
    where: {
      id: {
        in: serviceIds,
      },
    },
    select: {
      id: true,
      service_name: true,
    },
  });

  if (services.length !== serviceIds.length) {
    return {
      success: false,
      message: "One or more selected services are invalid.",
    };
  }

  try {
    const { appointmentId } = await resolveLabOrderAppointment(
      patient.id,
      doctor.id
    );

    const record = await ensureMedicalRecord(
      {
        id: appointmentId,
        patient_id: patient.id,
      },
      doctor.id
    );

    await db.$transaction(async (tx) => {
      await tx.labTest.createMany({
        data: serviceIds.map((serviceId) => ({
          record_id: record.id,
          order_id: orderId,
          service_id: serviceId,
          test_date: new Date(),
          status: "Pending",
          result: "",
          notes: notes || null,
        })),
      });
    });

    const patientName = `${patient.first_name} ${patient.last_name}`;
    const testNames = services
      .map((service) => service.service_name)
      .join(", ");

    try {
      const labTechnicians = await db.staff.findMany({
        where: {
          role: "LabTechnician",
          status: "Active",
        },
        select: {
          id: true,
        },
      });

      await Promise.all(
        labTechnicians.map((technician) =>
          db.notification.create({
            data: {
              user_id: technician.id,
              title: "New Laboratory Order",
              message: `Dr. ${doctor.name} requested ${testNames} for ${patientName}.`,
              type: "laboratory",
              link: "/lab/orders",
            },
          })
        )
      );
    } catch (notificationError) {
      console.error(
        "Failed to notify laboratory staff:",
        notificationError
      );
    }

    revalidatePath("/doctors/lab-orders");
    revalidatePath("/doctors/lab-orders/new");
    revalidatePath("/lab/orders");
    revalidatePath("/lab");

    return {
      success: true,
      message: `Laboratory order submitted successfully with ${serviceIds.length} test(s).`,
    };
  } catch (error) {
    console.error("Failed to create doctor lab order:", error);

    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        message:
          "A database uniqueness conflict occurred while creating the order. Please try again.",
      };
    }

    return {
      success: false,
      message: "Unable to submit the laboratory order. Please try again.",
    };
  }
}
