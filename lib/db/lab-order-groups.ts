import type { Prisma } from "@/lib/generated/prisma/client";
import { resolveOrderStatus } from "@/lib/lab/order-status";

/**
 * Key used for orders that were created before the grouping column existed.
 * Those orders are grouped by the medical record they belong to.
 */
export const LEGACY_ORDER_PREFIX = "legacy-";

export type LabOrderTest = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  status: string;
  result: string;
  notes: string | null;
  resultData: unknown;
  resultUnit: string | null;
  referenceRange: string | null;
  resultFlag: string | null;
  sampleType: string | null;
  sampleId: string | null;
  sampleCollectedAt: Date | null;
  sampleStatus: string | null;
  performedBy: string | null;
  performedByName: string | null;
  performedAt: Date | null;
  submittedAt: Date | null;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: Date | null;
  releasedBy: string | null;
  releasedByName: string | null;
  releasedAt: Date | null;
  amendedBy: string | null;
  amendedByName: string | null;
  amendedAt: Date | null;
  amendmentReason: string | null;
  testDate: Date;
  templateKey: string | null;
  templateSpecimen: string | null;
  templateParameters: unknown;
};

export type LabOrderGroup = {
  orderId: string;
  orderNumber: string;
  medicalRecordId: number;
  appointmentId: number | null;
  patientId: string;
  patientNumber: string;
  patientName: string;
  patientGender: string;
  patientDateOfBirth: Date;
  patientPhone: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorLicenseNumber: string;
  doctorPhone: string;
  appointmentDate: Date | null;
  testDate: Date;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  notes: string | null;
  total: number;
  testCount: number;
  tests: LabOrderTest[];
};

export const labOrderTestInclude = {
  service: {
    select: {
      service_name: true,
      description: true,
      price: true,
      labTemplate: {
        select: {
          template_key: true,
          specimen: true,
          parameters: true,
        },
      },
    },
  },
  medical_record: {
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          first_name: true,
          last_name: true,
          gender: true,
          date_of_birth: true,
          phone: true,
          email: true,
        },
      },
      appointment: {
        select: {
          id: true,
          appointment_date: true,
          time: true,
          type: true,
          doctor: {
            select: {
              name: true,
              specialization: true,
              license_number: true,
              phone: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.LabTestInclude;

export type LabOrderTestRow = Prisma.LabTestGetPayload<{
  include: typeof labOrderTestInclude;
}>;

/**
 * Every test that was requested together shares one `order_id`, so a single
 * submission is a single order. Rows created before the column existed are
 * grouped by the medical record they belong to.
 */
export function resolveOrderKey(
  orderId: string | null,
  medicalRecordId: number
): string {
  return orderId ?? `${LEGACY_ORDER_PREFIX}${medicalRecordId}`;
}

/**
 * Reads the medical record id out of a legacy order key, so a single order
 * can be queried without loading every order first.
 */
export function parseLegacyOrderKey(orderKey: string): number | null {
  if (!orderKey.startsWith(LEGACY_ORDER_PREFIX)) {
    return null;
  }

  const recordId = Number(orderKey.slice(LEGACY_ORDER_PREFIX.length));

  return Number.isSafeInteger(recordId) && recordId > 0 ? recordId : null;
}

/**
 * Turns laboratory test rows into the orders the doctor requested. Tests that
 * were requested together stay together, so both the laboratory queue and
 * the printed document show one entry per order.
 */
export function groupLabTestsIntoOrders(
  rows: LabOrderTestRow[]
): LabOrderGroup[] {
  const groups = new Map<string, LabOrderTestRow[]>();

  for (const row of rows) {
    const key = resolveOrderKey(row.order_id, row.medical_record.id);
    const existing = groups.get(key);

    if (existing) {
      existing.push(row);
      continue;
    }

    groups.set(key, [row]);
  }

  return Array.from(groups.entries()).map(([orderId, group]) => {
    const ordered = [...group].sort((a, b) => a.id - b.id);
    const head = ordered[0];
    const patient = head.medical_record.patient;
    const doctor = head.medical_record.appointment?.doctor;
    const tests: LabOrderTest[] = ordered.map((row) => ({
      id: row.id,
      name: row.service.service_name,
      description: row.service.description,
      price: row.service.price,
      status: row.status,
      result: row.result,
      notes: row.notes,
      resultData: row.result_data,
      resultUnit: row.result_unit,
      referenceRange: row.reference_range,
      resultFlag: row.result_flag,
      sampleType: row.sample_type,
      sampleId: row.sample_id,
      sampleCollectedAt: row.sample_collected_at,
      sampleStatus: row.sample_status,
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      performedAt: row.performed_at,
      submittedAt: row.submitted_at,
      verifiedBy: row.verified_by,
      verifiedByName: row.verified_by_name,
      verifiedAt: row.verified_at,
      releasedBy: row.released_by,
      releasedByName: row.released_by_name,
      releasedAt: row.released_at,
      amendedBy: row.amended_by,
      amendedByName: row.amended_by_name,
      amendedAt: row.amended_at,
      amendmentReason: row.amendment_reason,
      testDate: row.test_date,
      templateKey: row.service.labTemplate?.template_key ?? null,
      templateSpecimen: row.service.labTemplate?.specimen ?? null,
      templateParameters: row.service.labTemplate?.parameters ?? null,
    }));

    return {
      orderId,
      orderNumber: `LAB-${head.id}`,
      medicalRecordId: head.medical_record.id,
      appointmentId: head.medical_record.appointment?.id ?? null,
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientGender: String(patient.gender ?? ""),
      patientDateOfBirth: patient.date_of_birth,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      doctorName: doctor?.name ?? "",
      doctorSpecialization: doctor?.specialization ?? "",
      doctorLicenseNumber: doctor?.license_number ?? "",
      doctorPhone: doctor?.phone ?? "",
      appointmentDate:
        head.medical_record.appointment?.appointment_date ?? null,
      testDate: head.test_date,
      createdAt: head.created_at,
      updatedAt: ordered.reduce(
        (latest, row) => (row.updated_at > latest ? row.updated_at : latest),
        head.updated_at
      ),
      status: resolveOrderStatus(tests.map((test) => test.status)),
      notes: head.notes,
      total: tests.reduce((sum, test) => sum + test.price, 0),
      testCount: tests.length,
      tests,
    };
  });
}
