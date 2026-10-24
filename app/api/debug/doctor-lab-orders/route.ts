import { NextResponse } from "next/server";
import {
  getDoctorLabOrderFormData,
  getDoctorLabOrders,
  resolveLabOrderAppointment,
} from "@/lib/db/doctor-lab-orders";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clerkUserId = url.searchParams.get("clerkUserId") ?? "";
  const requestedPatientId = url.searchParams.get("patientId");
  const create = url.searchParams.get("create") === "1";

  try {
    const formData = await getDoctorLabOrderFormData(clerkUserId);
    const orders = await getDoctorLabOrders(clerkUserId);

    let created: unknown = null;
    if (create && formData.patients.length && formData.services.length) {
      const doctor = await db.doctor.findFirst({
        where: { OR: [{ clerkUserId }, { id: clerkUserId }] },
        select: { id: true, name: true },
      });
      const patient =
        formData.patients.find((entry) => entry.id === requestedPatientId) ??
        formData.patients[0];
      const service = formData.services[0];

      const { appointmentId } = await resolveLabOrderAppointment(
        patient.id,
        doctor!.id
      );

      await db.$transaction(async (tx) => {
        const mr = await tx.medicalRecords.upsert({
          where: { appointment_id: appointmentId },
          create: {
            patient_id: patient.id,
            appointment_id: appointmentId,
            doctor_id: doctor!.id,
          },
          update: {},
          select: { id: true },
        });

        await tx.labTest.createMany({
          data: [
            {
              record_id: mr.id,
              order_id: crypto.randomUUID(),
              service_id: service.id,
              test_date: new Date(),
              status: "Pending",
              result: "",
              notes: null,
            },
          ],
        });
      });

      created = { doctor, patient, service, appointmentId };
    }

    const after = create ? await getDoctorLabOrders(clerkUserId) : orders;

    return NextResponse.json({
      ok: true,
      patients: formData.patients,
      services: formData.services,
      orders: after,
      created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
