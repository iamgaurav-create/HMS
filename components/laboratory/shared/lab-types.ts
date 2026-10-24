import type { LabResultFlag } from "@/lib/lab/lab-test-templates";

export type LabParameterResult = {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
};

export type LabTestTemplate = {
  title: string;
  specimen: string;
  parameters: {
    name: string;
    unit: string;
    referenceRange: string;
  }[];
};

export type LabReportParameter = LabParameterResult;

/**
 * A single laboratory test of a report. The names of the professionals are
 * kept as they were when the result was recorded, so an old report stays
 * correct when somebody changes role later on.
 */
export type LabReportTest = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  result: string | null;
  result_data: unknown;
  result_unit: string | null;
  reference_range: string | null;
  result_flag: string | null;
  sample_type: string | null;
  sample_id: string | null;
  sample_collected_at: string | null;
  sample_status: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  performed_at: string | null;
  submitted_at: string | null;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
  released_by: string | null;
  released_by_name: string | null;
  released_at: string | null;
  amended_by_name: string | null;
  amended_at: string | null;
  amendment_reason: string | null;
  notes: string | null;
  parameters: LabReportParameter[];
};

export type LabReportData = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderDate: string;
  patientName: string;
  patientNumber: string;
  patientEmail: string;
  patientPhone: string;
  patientGender: string;
  patientDateOfBirth: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorLicenseNumber: string;
  notes: string;
  total: number;
  tests: LabReportTest[];
};

/**
 * The professional that worked on a result.
 */
export type LabProfessional = {
  id: string | null;
  name: string | null;
  at: string | null;
};

/**
 * A single test of a laboratory order.
 */
export type LaboratoryOrderTest = {
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
  sampleCollectedAt: string | null;
  sampleStatus: string | null;
  performedBy: string | null;
  performedByName: string | null;
  performedAt: string | null;
  submittedAt: string | null;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  releasedBy: string | null;
  releasedByName: string | null;
  releasedAt: string | null;
  amendedBy: string | null;
  amendedByName: string | null;
  amendedAt: string | null;
  amendmentReason: string | null;
  testDate: string;
  templateKey: string | null;
  templateSpecimen: string | null;
  templateParameters: unknown;
};

/**
 * A laboratory order. Every test that was requested together stays in the
 * same order.
 */
export type LaboratoryOrder = {
  orderId: string;
  orderNumber: string;
  medicalRecordId: number;
  patientNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string | null;
  testDate: string;
  createdAt: string;
  status: string;
  notes: string | null;
  total: number;
  testCount: number;
  tests: LaboratoryOrderTest[];
};

export type { LabResultFlag };
