import "server-only";

import db from "@/lib/db";
import { resolveOrderKey } from "@/lib/db/lab-order-groups";

/**
 * One row of the result list. Every test of an order is one row, so the
 * laboratory can work through the tests that still need attention.
 */
export type LaboratoryResultRow = {
  id: number;
  orderId: string;
  orderNumber: string;
  testName: string;
  status: string;
  result: string;
  resultFlag: string | null;
  sampleId: string | null;
  sampleType: string | null;
  sampleCollectedAt: string | null;
  sampleStatus: string | null;
  performedByName: string | null;
  performedAt: string | null;
  submittedAt: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  releasedByName: string | null;
  releasedAt: string | null;
  patientName: string;
  patientNumber: string;
  doctorName: string;
  testDate: string;
};

/**
 * One row of the sample list.
 */
export type LaboratorySampleRow = {
  id: number;
  orderId: string;
  orderNumber: string;
  testName: string;
  testStatus: string;
  sampleId: string | null;
  sampleType: string | null;
  sampleCollectedAt: string | null;
  sampleStatus: string | null;
  patientName: string;
  patientNumber: string;
  doctorName: string;
};

const resultRowInclude = {
  service: { select: { service_name: true } },
  medical_record: {
    select: {
      id: true,
      patient: {
        select: {
          patientNumber: true,
          first_name: true,
          last_name: true,
        },
      },
      appointment: {
        select: {
          doctor: { select: { name: true } },
        },
      },
    },
  },
} as const;

/**
 * Every laboratory test with the patient, the referring doctor and the
 * professionals that worked on the result.
 */
export async function getLaboratoryResultRows(): Promise<LaboratoryResultRow[]> {
  const rows = await db.labTest.findMany({
    orderBy: {
      created_at: "desc",
    },
    include: resultRowInclude,
  });

  return rows.map((row) => {
    const patient = row.medical_record.patient;
    const doctor = row.medical_record.appointment?.doctor;

    return {
      id: row.id,
      orderId: resolveOrderKey(row.order_id, row.medical_record.id),
      orderNumber: `LAB-${row.id}`,
      testName: row.service.service_name,
      status: row.status,
      result: row.result,
      resultFlag: row.result_flag,
      sampleId: row.sample_id,
      sampleType: row.sample_type,
      sampleCollectedAt: row.sample_collected_at
        ? row.sample_collected_at.toISOString()
        : null,
      sampleStatus: row.sample_status,
      performedByName: row.performed_by_name,
      performedAt: row.performed_at ? row.performed_at.toISOString() : null,
      submittedAt: row.submitted_at ? row.submitted_at.toISOString() : null,
      verifiedByName: row.verified_by_name,
      verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
      releasedByName: row.released_by_name,
      releasedAt: row.released_at ? row.released_at.toISOString() : null,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientNumber: patient.patientNumber,
      doctorName: doctor?.name ?? "",
      testDate: row.test_date.toISOString(),
    };
  });
}

/**
 * Every laboratory test that belongs to a sample, so the laboratory can
 * follow the specimen from the collection to the result.
 */
export async function getLaboratorySampleRows(): Promise<LaboratorySampleRow[]> {
  const rows = await db.labTest.findMany({
    where: {
      OR: [
        { sample_id: { not: null } },
        { sample_type: { not: null } },
        { sample_collected_at: { not: null } },
      ],
    },
    orderBy: {
      created_at: "desc",
    },
    include: resultRowInclude,
  });

  return rows.map((row) => {
    const patient = row.medical_record.patient;
    const doctor = row.medical_record.appointment?.doctor;

    return {
      id: row.id,
      orderId: resolveOrderKey(row.order_id, row.medical_record.id),
      orderNumber: `LAB-${row.id}`,
      testName: row.service.service_name,
      testStatus: row.status,
      sampleId: row.sample_id,
      sampleType: row.sample_type,
      sampleCollectedAt: row.sample_collected_at
        ? row.sample_collected_at.toISOString()
        : null,
      sampleStatus: row.sample_status,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientNumber: patient.patientNumber,
      doctorName: doctor?.name ?? "",
    };
  });
}

/**
 * One single test with the patient, the referring doctor and the result
 * sheet of the service.
 */
export async function getLaboratoryResultById(testId: number) {
  const row = await db.labTest.findUnique({
    where: { id: testId },
    include: {
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
        select: {
          id: true,
          patient: {
            select: {
              patientNumber: true,
              first_name: true,
              last_name: true,
              gender: true,
              date_of_birth: true,
              phone: true,
            },
          },
          appointment: {
            select: {
              appointment_date: true,
              doctor: {
                select: { name: true, specialization: true },
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

  const patient = row.medical_record.patient;
  const doctor = row.medical_record.appointment?.doctor;

  return {
    id: row.id,
    orderId: resolveOrderKey(row.order_id, row.medical_record.id),
    orderNumber: `LAB-${row.id}`,
    testName: row.service.service_name,
    description: row.service.description,
    price: row.service.price,
    status: row.status,
    result: row.result,
    resultData: row.result_data,
    resultFlag: row.result_flag,
    notes: row.notes,
    sampleType: row.sample_type,
    sampleId: row.sample_id,
    sampleCollectedAt: row.sample_collected_at
      ? row.sample_collected_at.toISOString()
      : null,
    sampleStatus: row.sample_status,
    performedBy: row.performed_by,
    performedByName: row.performed_by_name,
    performedAt: row.performed_at ? row.performed_at.toISOString() : null,
    submittedAt: row.submitted_at ? row.submitted_at.toISOString() : null,
    verifiedByName: row.verified_by_name,
    verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
    releasedByName: row.released_by_name,
    releasedAt: row.released_at ? row.released_at.toISOString() : null,
    amendedByName: row.amended_by_name,
    amendedAt: row.amended_at ? row.amended_at.toISOString() : null,
    amendmentReason: row.amendment_reason,
    patientName: `${patient.first_name} ${patient.last_name}`,
    patientNumber: patient.patientNumber,
    patientGender: String(patient.gender ?? ""),
    patientDateOfBirth: patient.date_of_birth.toISOString(),
    patientPhone: patient.phone,
    doctorName: doctor?.name ?? "",
    doctorSpecialization: doctor?.specialization ?? "",
    templateKey: row.service.labTemplate?.template_key ?? null,
    templateSpecimen: row.service.labTemplate?.specimen ?? null,
    templateParameters: row.service.labTemplate?.parameters ?? null,
  };
}
