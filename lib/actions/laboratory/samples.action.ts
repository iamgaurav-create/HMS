"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { createAuditLog } from "@/lib/db/audit";
import { Permission } from "@/lib/auth/permissions";
import { getLabActor } from "@/lib/lab/lab-actor";
import { labSampleUpdateSchema } from "@/lib/lab/lab-validation";

export type LabSampleActionState = {
  success: boolean;
  message: string;
};

/**
 * Updates the sample information of a test.
 *
 * The collection time of a sample is a fact about the sample itself. It is
 * only written when the laboratory sends a new one, so a result can be
 * edited without moving the collection time of the sample.
 */
export async function updateLabSample(
  _previousState: LabSampleActionState,
  formData: FormData
): Promise<LabSampleActionState> {
  const actor = await getLabActor(Permission.MANAGE_LAB);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  const parsed = labSampleUpdateSchema.safeParse({
    testId: formData.get("testId"),
    sampleType: formData.get("sampleType") ?? "",
    sampleId: formData.get("sampleId") ?? "",
    sampleCollectedAt: formData.get("sampleCollectedAt") ?? "",
    sampleStatus: formData.get("sampleStatus") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "The sample details are incomplete.",
    };
  }

  const { testId, sampleType, sampleId, sampleStatus } = parsed.data;

  const collectedAtText = parsed.data.sampleCollectedAt.trim();
  let collectedAt: Date | null = null;

  if (collectedAtText) {
    const date = new Date(collectedAtText);

    if (Number.isNaN(date.getTime())) {
      return {
        success: false,
        message: "Enter a valid collection date and time.",
      };
    }

    collectedAt = date;
  }

  const test = await db.labTest.findUnique({
    where: { id: testId },
    select: {
      id: true,
      order_id: true,
      status: true,
      sample_collected_at: true,
      sample_status: true,
      service: { select: { service_name: true } },
    },
  });

  if (!test) {
    return { success: false, message: "The laboratory test was not found." };
  }

  if (test.status === "Cancelled") {
    return {
      success: false,
      message: "A cancelled test does not have a sample.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.update({
        where: { id: test.id },
        data: {
          sample_type: sampleType,
          sample_id: sampleId || null,
          sample_collected_at: collectedAt ?? test.sample_collected_at,
          sample_status: sampleStatus || test.sample_status || null,
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(test.id),
      action: "update_lab_sample",
      details: `Sample of ${test.service.service_name} updated by ${actor.actor.name}.`,
      model: "LabTest",
    });

    revalidatePath("/lab/samples");
    revalidatePath("/lab/orders");

    if (test.order_id) {
      revalidatePath(`/lab/orders/${test.order_id}`);
    }

    revalidatePath(`/lab/results/${test.id}`);

    return {
      success: true,
      message: `Sample details updated for ${test.service.service_name}.`,
    };
  } catch (error) {
    console.error("Failed to update laboratory sample:", error);

    return {
      success: false,
      message: "Unable to update the sample. Please try again.",
    };
  }
}
