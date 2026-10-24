"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { createAuditLog } from "@/lib/db/audit";
import { Permission } from "@/lib/auth/permissions";
import { getLabActor } from "@/lib/lab/lab-actor";
import { resolveLabTemplate } from "@/lib/lab/lab-template";
import {
  evaluateResultFlag,
  labResultEntrySchema,
  normalizeResultFlag,
} from "@/lib/lab/lab-validation";
import {
  LAB_RELEASED_STATUS,
  LAB_REVIEW_STATUS,
  LAB_RESULT_ENTRY_STATUS,
  LAB_VERIFIED_STATUS,
  isEditableTestStatus,
} from "@/lib/lab/order-status";

export type LabResultActionState = {
  success: boolean;
  message: string;
  errors?: string[];
};

type SubmittedParameter = {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
};

type TemplateParameter = {
  name: string;
  unit: string;
  referenceRange: string;
};

const FLAG_SEVERITY: Record<string, number> = {
  Normal: 0,
  Abnormal: 1,
  Critical: 2,
};

/**
 * The pages that show laboratory results.
 */
function revalidateLabPaths(orderId?: string | null, testId?: number | null) {
  revalidatePath("/lab");
  revalidatePath("/lab/orders");
  revalidatePath("/lab/results");
  revalidatePath("/lab/samples");
  revalidatePath("/lab/reports");
  revalidatePath("/lab/verification");

  if (orderId) {
    revalidatePath(`/lab/orders/${orderId}`);
  }

  if (testId) {
    revalidatePath(`/lab/results/${testId}`);
  }
}

/**
 * Reads the parameters the browser sent and checks them against the result
 * sheet of the test. The unit and the reference range always come from the
 * sheet the laboratory configured, the flag is recalculated on the server.
 */
function prepareParameters({
  templateParameters,
  submitted,
}: {
  templateParameters: TemplateParameter[];
  submitted: SubmittedParameter[];
}): { ok: true; parameters: SubmittedParameter[] } | { ok: false; message: string } {
  const allowed = new Map(
    templateParameters.map((parameter) => [parameter.name, parameter])
  );

  const unknown = submitted.filter((parameter) => !allowed.has(parameter.name));

  if (unknown.length > 0) {
    return {
      ok: false,
      message:
        "The submitted parameters do not match the result sheet of this test.",
    };
  }

  const missing = templateParameters.filter(
    (parameter) =>
      !submitted.some((entry) => entry.name === parameter.name)
  );

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Add a value for ${missing
        .map((parameter) => parameter.name)
        .join(", ")}.`,
    };
  }

  const empty = submitted.filter((parameter) => parameter.value.trim().length === 0);

  if (empty.length > 0) {
    return {
      ok: false,
      message: `Enter a value for ${empty
        .map((parameter) => parameter.name)
        .join(", ")}.`,
    };
  }

  const parameters: SubmittedParameter[] = submitted.map((parameter) => {
    const template = allowed.get(parameter.name)!;

    return {
      name: parameter.name,
      value: parameter.value.trim(),
      unit: template.unit,
      referenceRange: template.referenceRange,
      flag: evaluateResultFlag({
        value: parameter.value.trim(),
        referenceRange: template.referenceRange,
        submittedFlag: parameter.flag,
      }),
    };
  });

  return { ok: true, parameters };
}

/**
 * The worst flag of a result, used for the badge of the whole test.
 */
function summarizeFlag(parameters: SubmittedParameter[]) {
  return parameters.reduce((worst, parameter) => {
    const flag = normalizeResultFlag(parameter.flag);

    return FLAG_SEVERITY[flag] > FLAG_SEVERITY[worst] ? flag : worst;
  }, "Normal");
}

/**
 * The result of a test as one readable line.
 */
function summarizeResult(parameters: SubmittedParameter[]) {
  return parameters
    .map((parameter) =>
      parameter.unit
        ? `${parameter.name}: ${parameter.value} ${parameter.unit}`
        : `${parameter.name}: ${parameter.value}`
    )
    .join("; ");
}

/**
 * Parses a date the browser sent. An empty value means "not changed".
 */
function parseCollectedAt(value: string) {
  const text = value.trim();

  if (!text) {
    return { ok: true as const, date: null };
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, message: "Enter a valid collection date and time." };
  }

  return { ok: true as const, date };
}

async function loadTest(testId: number) {
  return db.labTest.findUnique({
    where: { id: testId },
    select: {
      id: true,
      order_id: true,
      record_id: true,
      status: true,
      result: true,
      result_data: true,
      notes: true,
      sample_type: true,
      sample_id: true,
      sample_collected_at: true,
      sample_status: true,
      performed_by: true,
      performed_by_name: true,
      verified_by: true,
      verified_by_name: true,
      verified_at: true,
      released_at: true,
      released_by_name: true,
      amended_at: true,
      service: {
        select: {
          service_name: true,
          labTemplate: {
            select: {
              template_key: true,
              specimen: true,
              parameters: true,
            },
          },
        },
      },
    },
  });
}

/**
 * The result sheet of a test. The sheet the laboratory configured wins over
 * the built in template.
 */
function templateOf(test: NonNullable<Awaited<ReturnType<typeof loadTest>>>) {
  return resolveLabTemplate(test.service.service_name, {
    template_key: test.service.labTemplate?.template_key ?? "",
    specimen: test.service.labTemplate?.specimen ?? null,
    parameters: test.service.labTemplate?.parameters ?? null,
  });
}

/**
 * Stores the result of a single test.
 *
 * The result is stored as a draft, so the technician can still correct it
 * before it is handed over for review. The professional that entered the
 * result is stored with the result, the browser never sends a name or an id.
 */
export async function saveLabTestResult(
  _previousState: LabResultActionState,
  formData: FormData
): Promise<LabResultActionState> {
  const actor = await getLabActor(Permission.MANAGE_LAB);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  const rawParameters = formData.get("parameters");
  let submitted: unknown;

  try {
    submitted = JSON.parse(typeof rawParameters === "string" ? rawParameters : "[]");
  } catch {
    return { success: false, message: "The result data could not be read." };
  }

  const parsed = labResultEntrySchema.safeParse({
    testId: formData.get("testId"),
    sampleType: formData.get("sampleType") ?? "",
    sampleId: formData.get("sampleId") ?? "",
    sampleCollectedAt: formData.get("sampleCollectedAt") ?? "",
    sampleStatus: formData.get("sampleStatus") ?? "",
    notes: formData.get("notes") ?? "",
    parameters: submitted,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "The result is incomplete.";

    return { success: false, message };
  }

  const { testId, sampleType, sampleId, sampleStatus, notes } = parsed.data;

  const collectedAt = parseCollectedAt(parsed.data.sampleCollectedAt);

  if (!collectedAt.ok) {
    return { success: false, message: collectedAt.message };
  }

  const test = await loadTest(testId);

  if (!test) {
    return { success: false, message: "The laboratory test was not found." };
  }

  if (test.status === "Cancelled") {
    return {
      success: false,
      message: "A cancelled test cannot receive a result.",
    };
  }

  if (!isEditableTestStatus(test.status)) {
    return {
      success: false,
      message:
        "This result is already verified. Use the amendment workflow to correct it.",
    };
  }

  const template = templateOf(test);

  const prepared = prepareParameters({
    templateParameters: template.parameters,
    submitted: parsed.data.parameters,
  });

  if (!prepared.ok) {
    return { success: false, message: prepared.message };
  }

  const parameters = prepared.parameters;
  const flag = summarizeFlag(parameters);
  const summary = summarizeResult(parameters);

  /**
   * The collection time of a sample is a fact about the sample. It is only
   * written when the laboratory sends a new one, so editing a result never
   * moves the collection time of an already collected sample.
   */
  const sampleCollectedAt =
    collectedAt.date ?? test.sample_collected_at ?? null;

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.update({
        where: { id: test.id },
        data: {
          result_data: parameters,
          result: summary,
          result_unit: null,
          reference_range: null,
          result_flag: flag,
          sample_type: sampleType,
          sample_id: sampleId || null,
          sample_collected_at: sampleCollectedAt,
          sample_status: sampleStatus || test.sample_status || "Collected",
          performed_by: actor.actor.staffId,
          performed_by_name: actor.actor.name,
          performed_at: new Date(),
          notes: notes || null,
          status:
            test.status === "Pending" || test.status === "Sample Collected"
              ? LAB_RESULT_ENTRY_STATUS
              : test.status,
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(test.id),
      action: "record_lab_result",
      details: `Result recorded for ${test.service.service_name} by ${actor.actor.name}. Flag: ${flag}.`,
      model: "LabTest",
    });

    revalidateLabPaths(test.order_id, test.id);

    return {
      success: true,
      message: `Result saved for ${test.service.service_name}.`,
    };
  } catch (error) {
    console.error("Failed to save laboratory result:", error);

    return {
      success: false,
      message: "Unable to save the result. Please try again.",
    };
  }
}

/**
 * Hands a stored result over for review.
 */
export async function submitLabTestForReview(
  testId: number
): Promise<LabResultActionState> {
  const actor = await getLabActor(Permission.MANAGE_LAB);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  if (!Number.isSafeInteger(testId) || testId <= 0) {
    return { success: false, message: "Invalid test selected." };
  }

  const test = await loadTest(testId);

  if (!test) {
    return { success: false, message: "The laboratory test was not found." };
  }

  if (test.status === "Cancelled") {
    return {
      success: false,
      message: "A cancelled test cannot be submitted for review.",
    };
  }

  if (test.status === LAB_VERIFIED_STATUS || test.status === LAB_RELEASED_STATUS) {
    return {
      success: false,
      message: "This result is already verified and cannot be submitted again.",
    };
  }

  if (!test.result_data) {
    return {
      success: false,
      message: "Record the result before submitting it for review.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.update({
        where: { id: test.id },
        data: {
          status: LAB_REVIEW_STATUS,
          submitted_at: new Date(),
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(test.id),
      action: "submit_lab_result_for_review",
      details: `${test.service.service_name} submitted for review by ${actor.actor.name}.`,
      model: "LabTest",
    });

    revalidateLabPaths(test.order_id, test.id);

    return {
      success: true,
      message: `${test.service.service_name} was submitted for review.`,
    };
  } catch (error) {
    console.error("Failed to submit laboratory result for review:", error);

    return {
      success: false,
      message: "Unable to submit the result. Please try again.",
    };
  }
}

/**
 * Approves a result.
 *
 * Only a professional with the verification permission may approve a result
 * and the professional that performed the test may never approve their own
 * result.
 */
export async function verifyLabTestResult(
  testId: number
): Promise<LabResultActionState> {
  const actor = await getLabActor(Permission.VERIFY_LAB_RESULTS);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  if (!Number.isSafeInteger(testId) || testId <= 0) {
    return { success: false, message: "Invalid test selected." };
  }

  const test = await loadTest(testId);

  if (!test) {
    return { success: false, message: "The laboratory test was not found." };
  }

  if (test.status !== LAB_REVIEW_STATUS) {
    return {
      success: false,
      message: "Only a result that waits for review can be verified.",
    };
  }

  if (test.performed_by && test.performed_by === actor.actor.staffId) {
    return {
      success: false,
      message:
        "A result cannot be verified by the professional who performed it. Ask a colleague to review it.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.update({
        where: { id: test.id },
        data: {
          status: LAB_VERIFIED_STATUS,
          verified_by: actor.actor.staffId,
          verified_by_name: actor.actor.name,
          verified_at: new Date(),
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(test.id),
      action: "verify_lab_result",
      details: `${test.service.service_name} verified by ${actor.actor.name}.`,
      model: "LabTest",
    });

    revalidateLabPaths(test.order_id, test.id);

    return {
      success: true,
      message: `${test.service.service_name} was verified.`,
    };
  } catch (error) {
    console.error("Failed to verify laboratory result:", error);

    return {
      success: false,
      message: "Unable to verify the result. Please try again.",
    };
  }
}

/**
 * Corrects a result that was already verified.
 *
 * The correction is auditable: the reason is stored on the test, the audit
 * log keeps the previous values and the result waits for a new verification.
 */
export async function amendLabTestResult(
  _previousState: LabResultActionState,
  formData: FormData
): Promise<LabResultActionState> {
  const actor = await getLabActor(Permission.MANAGE_LAB);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  const reason = String(formData.get("amendmentReason") ?? "").trim();

  if (reason.length < 10) {
    return {
      success: false,
      message: "Enter a reason of at least 10 characters for the amendment.",
    };
  }

  if (reason.length > 1000) {
    return {
      success: false,
      message: "The reason of the amendment is too long.",
    };
  }

  const rawParameters = formData.get("parameters");
  let submitted: unknown;

  try {
    submitted = JSON.parse(typeof rawParameters === "string" ? rawParameters : "[]");
  } catch {
    return { success: false, message: "The result data could not be read." };
  }

  const parsed = labResultEntrySchema.safeParse({
    testId: formData.get("testId"),
    sampleType: formData.get("sampleType") ?? "",
    sampleId: formData.get("sampleId") ?? "",
    sampleCollectedAt: formData.get("sampleCollectedAt") ?? "",
    sampleStatus: formData.get("sampleStatus") ?? "",
    notes: formData.get("notes") ?? "",
    parameters: submitted,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "The result is incomplete.";

    return { success: false, message };
  }

  const test = await loadTest(parsed.data.testId);

  if (!test) {
    return { success: false, message: "The laboratory test was not found." };
  }

  if (
    test.status !== LAB_VERIFIED_STATUS &&
    test.status !== LAB_RELEASED_STATUS
  ) {
    return {
      success: false,
      message:
        "Only a verified result can be amended. Edit the result and submit it for review instead.",
    };
  }

  const template = templateOf(test);

  const prepared = prepareParameters({
    templateParameters: template.parameters,
    submitted: parsed.data.parameters,
  });

  if (!prepared.ok) {
    return { success: false, message: prepared.message };
  }

  const parameters = prepared.parameters;
  const flag = summarizeFlag(parameters);
  const summary = summarizeResult(parameters);
  const previousResult = test.result ?? "";

  const collectedAt = parseCollectedAt(parsed.data.sampleCollectedAt);

  if (!collectedAt.ok) {
    return { success: false, message: collectedAt.message };
  }

  const sampleCollectedAt = collectedAt.date ?? test.sample_collected_at ?? null;

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.update({
        where: { id: test.id },
        data: {
          result_data: parameters,
          result: summary,
          result_flag: flag,
          sample_type: parsed.data.sampleType,
          sample_id: parsed.data.sampleId || null,
          sample_collected_at: sampleCollectedAt,
          sample_status: parsed.data.sampleStatus || test.sample_status || null,
          notes: parsed.data.notes || null,
          amended_by: actor.actor.staffId,
          amended_by_name: actor.actor.name,
          amended_at: new Date(),
          amendment_reason: reason,
          status: LAB_REVIEW_STATUS,
          submitted_at: new Date(),
          verified_by: null,
          verified_by_name: null,
          verified_at: null,
          released_at: null,
          released_by: null,
          released_by_name: null,
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(test.id),
      action: "amend_lab_result",
      details: `${test.service.service_name} amended by ${actor.actor.name}. Reason: ${reason}. Previous result: ${previousResult}.`,
      model: "LabTest",
    });

    revalidateLabPaths(test.order_id, test.id);

    return {
      success: true,
      message: `${test.service.service_name} was amended and waits for a new verification.`,
    };
  } catch (error) {
    console.error("Failed to amend laboratory result:", error);

    return {
      success: false,
      message: "Unable to amend the result. Please try again.",
    };
  }
}
