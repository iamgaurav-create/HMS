import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  groupLabTestsIntoOrders,
  labOrderTestInclude,
  LEGACY_ORDER_PREFIX,
  parseLegacyOrderKey,
  type LabOrderGroup,
} from "@/lib/db/lab-order-groups";
import type {
  LaboratoryOrder,
  LaboratoryOrderTest,
} from "@/components/laboratory/shared/lab-types";

export type { LaboratoryOrder, LaboratoryOrderTest };

/**
 * Where clause that selects every test of one order. Orders created before the
 * grouping column existed are keyed by their medical record.
 */
export function buildLabOrderWhere(orderKey: string): Prisma.LabTestWhereInput {
  const legacyRecordId = parseLegacyOrderKey(orderKey);

  if (legacyRecordId) {
    return {
      OR: [{ order_id: `${LEGACY_ORDER_PREFIX}${legacyRecordId}` }, { order_id: null }],
      medical_record: { id: legacyRecordId },
    };
  }

  return { order_id: orderKey };
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function toLaboratoryOrder(order: LabOrderGroup): LaboratoryOrder {
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    medicalRecordId: order.medicalRecordId,
    patientNumber: order.patientNumber,
    patientName: order.patientName,
    patientPhone: order.patientPhone,
    patientEmail: order.patientEmail,
    doctorName: order.doctorName,
    doctorSpecialization: order.doctorSpecialization,
    appointmentDate: order.appointmentDate
      ? order.appointmentDate.toISOString()
      : null,
    testDate: order.testDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    notes: order.notes,
    total: order.total,
    testCount: order.testCount,
    tests: order.tests.map((test) => ({
      id: test.id,
      name: test.name,
      description: test.description,
      price: test.price,
      status: test.status,
      result: test.result,
      notes: test.notes,
      resultData: test.resultData,
      resultUnit: test.resultUnit,
      referenceRange: test.referenceRange,
      resultFlag: test.resultFlag,
      sampleType: test.sampleType,
      sampleId: test.sampleId,
      sampleCollectedAt: toIso(test.sampleCollectedAt),
      sampleStatus: test.sampleStatus,
      performedBy: test.performedBy,
      performedByName: test.performedByName,
      performedAt: toIso(test.performedAt),
      submittedAt: toIso(test.submittedAt),
      verifiedBy: test.verifiedBy,
      verifiedByName: test.verifiedByName,
      verifiedAt: toIso(test.verifiedAt),
      releasedBy: test.releasedBy,
      releasedByName: test.releasedByName,
      releasedAt: toIso(test.releasedAt),
      amendedBy: test.amendedBy,
      amendedByName: test.amendedByName,
      amendedAt: toIso(test.amendedAt),
      amendmentReason: test.amendmentReason,
      testDate: test.testDate.toISOString(),
      templateKey: test.templateKey,
      templateSpecimen: test.templateSpecimen,
      templateParameters: test.templateParameters,
    })),
  };
}

/**
 * Every laboratory order in the system. Tests that were requested together
 * are returned as one order, so the technician works on a single order sheet
 * instead of a list of unrelated tests.
 */
export async function getLaboratoryOrders(): Promise<LaboratoryOrder[]> {
  const rows = await db.labTest.findMany({
    orderBy: {
      created_at: "desc",
    },
    include: labOrderTestInclude,
  });

  return groupLabTestsIntoOrders(rows).map(toLaboratoryOrder);
}

/**
 * A single order with the tests that still need attention.
 */
export async function getLaboratoryOrderById(
  orderKey: string
): Promise<LaboratoryOrder | null> {
  const rows = await db.labTest.findMany({
    where: buildLabOrderWhere(orderKey),
    orderBy: {
      created_at: "desc",
    },
    include: labOrderTestInclude,
  });

  const order = groupLabTestsIntoOrders(rows).find(
    (entry) => entry.orderId === orderKey
  );

  return order ? toLaboratoryOrder(order) : null;
}

/**
 * The doctor who requested the order, so the laboratory can report back once
 * the results are ready.
 */
export async function getLabOrderRequestingDoctor(orderKey: string) {
  const row = await db.labTest.findFirst({
    where: buildLabOrderWhere(orderKey),
    select: {
      order_id: true,
      medical_record: {
        select: {
          id: true,
          appointment: {
            select: {
              doctor: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const doctor = row.medical_record.appointment?.doctor ?? null;

  return {
    doctor,
    doctorId: doctor?.id ?? null,
    doctorName: doctor?.name ?? "",
  };
}
