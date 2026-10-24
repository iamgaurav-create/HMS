import "server-only";

import db from "@/lib/db";
import { buildLabOrderWhere } from "@/lib/db/laboratory-orders";
import {
  groupLabTestsIntoOrders,
  labOrderTestInclude,
} from "@/lib/db/lab-order-groups";
import { resolveLabTemplate } from "@/lib/lab/lab-template";
import { parseResultData } from "@/lib/lab/lab-validation";
import type { LabParameterDefinition } from "@/lib/lab/lab-test-templates";
import type {
  LabReportData,
  LabReportParameter,
  LabReportTest,
} from "@/components/laboratory/shared/lab-types";

/**
 * One row of the report list.
 */
export type LaboratoryReportSummary = {
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientNumber: string;
  doctorName: string;
  testCount: number;
  status: string;
  testDate: string;
  releasedAt: string | null;
  releasedByName: string | null;
  verifiedByName: string | null;
  hasResults: boolean;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

/**
 * Every laboratory order that can be printed as a report. The report always
 * covers the complete order, so the list shows one row per order.
 */
export async function getLaboratoryReportSummaries(): Promise<
  LaboratoryReportSummary[]
> {
  const rows = await db.labTest.findMany({
    orderBy: {
      created_at: "desc",
    },
    include: labOrderTestInclude,
  });

  return groupLabTestsIntoOrders(rows).map((order) => {
    const released = order.tests.find((test) => test.releasedAt);
    const verified = order.tests.find((test) => test.verifiedAt);

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      patientName: order.patientName,
      patientNumber: order.patientNumber,
      doctorName: order.doctorName,
      testCount: order.testCount,
      status: order.status,
      testDate: order.testDate.toISOString(),
      releasedAt: released ? toIso(released.releasedAt) : null,
      releasedByName: released?.releasedByName ?? null,
      verifiedByName: verified?.verifiedByName ?? null,
      hasResults: order.tests.some(
        (test) => test.resultData !== null && test.resultData !== undefined
      ),
    };
  });
}

/**
 * The parameters of one test. The values that were recorded win, the
 * configured result sheet fills in the parameters that are still missing.
 */
function buildReportParameters(
  template: LabParameterDefinition[],
  stored: unknown
): LabReportParameter[] {
  const recorded = parseResultData(stored);

  if (recorded.length > 0) {
    return recorded.map((parameter) => ({
      name: parameter.name,
      value: parameter.value,
      unit: parameter.unit,
      referenceRange: parameter.referenceRange,
      flag: parameter.flag,
    }));
  }

  return template.map((parameter) => ({
    name: parameter.name,
    value: "",
    unit: parameter.unit,
    referenceRange: parameter.referenceRange,
    flag: "Normal",
  }));
}

/**
 * The complete report of one order. Every test of the order is part of the
 * report, together with the professional that performed it and the
 * professional that verified it.
 */
export async function getLaboratoryOrderReport(
  orderKey: string
): Promise<LabReportData | null> {
  const rows = await db.labTest.findMany({
    where: buildLabOrderWhere(orderKey),
    orderBy: {
      created_at: "asc",
    },
    include: labOrderTestInclude,
  });

  const order = groupLabTestsIntoOrders(rows).find(
    (entry) => entry.orderId === orderKey
  );

  if (!order) {
    return null;
  }

  const tests: LabReportTest[] = order.tests.map((test) => {
    const template = resolveLabTemplate(test.name, {
      template_key: test.templateKey ?? "",
      specimen: test.templateSpecimen,
      parameters: test.templateParameters,
    });

    return {
      id: test.id,
      name: test.name,
      description: test.description,
      status: test.status,
      result: test.result,
      result_data: test.resultData,
      result_unit: test.resultUnit,
      reference_range: test.referenceRange,
      result_flag: test.resultFlag,
      sample_type: test.sampleType,
      sample_id: test.sampleId,
      sample_collected_at: toIso(test.sampleCollectedAt),
      sample_status: test.sampleStatus,
      performed_by: test.performedBy,
      performed_by_name: test.performedByName,
      performed_at: toIso(test.performedAt),
      submitted_at: toIso(test.submittedAt),
      verified_by: test.verifiedBy,
      verified_by_name: test.verifiedByName,
      verified_at: toIso(test.verifiedAt),
      released_by: test.releasedBy,
      released_by_name: test.releasedByName,
      released_at: toIso(test.releasedAt),
      amended_by_name: test.amendedByName,
      amended_at: toIso(test.amendedAt),
      amendment_reason: test.amendmentReason,
      notes: test.notes,
      parameters: buildReportParameters(template.parameters, test.resultData),
    };
  });

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    orderDate: order.testDate.toISOString(),
    patientName: order.patientName,
    patientNumber: order.patientNumber,
    patientEmail: order.patientEmail,
    patientPhone: order.patientPhone,
    patientGender: order.patientGender,
    patientDateOfBirth: order.patientDateOfBirth.toISOString(),
    doctorName: order.doctorName,
    doctorSpecialization: order.doctorSpecialization,
    doctorLicenseNumber: order.doctorLicenseNumber,
    notes: order.notes ?? "",
    total: order.total,
    tests,
  };
}
