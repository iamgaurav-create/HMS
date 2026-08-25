import type { AppRole } from "./roles";
import { AppRole as R } from "./roles";

export const Permission = {
  MANAGE_STAFF: "manage_staff",
  MANAGE_SETTINGS: "manage_settings",
  VIEW_REPORTS: "view_reports",
  MANAGE_INVENTORY: "manage_inventory",
  MANAGE_BILLING: "manage_billing",
  VIEW_BILLING: "view_billing",
  MANAGE_PHARMACY: "manage_pharmacy",
  MANAGE_LAB: "manage_lab",
  VIEW_LAB: "view_lab",
  MANAGE_APPOINTMENTS: "manage_appointments",
  VIEW_APPOINTMENTS: "view_appointments",
  MANAGE_MEDICAL_RECORDS: "manage_medical_records",
  VIEW_MEDICAL_RECORDS: "view_medical_records",
  MANAGE_PATIENTS: "manage_patients",
  VIEW_PATIENTS: "view_patients",
  MANAGE_PRESCRIPTIONS: "manage_prescriptions",
  MANAGE_DOCTOR_ACCOUNTS: "manage_doctor_accounts",
  MANAGE_NURSE_ACCOUNTS: "manage_nurse_accounts",
  MANAGE_RECEPTIONIST_ACCOUNTS: "manage_receptionist_accounts",
  MANAGE_LAB_TECHNICIAN_ACCOUNTS: "manage_lab_technician_accounts",
  MANAGE_PHARMACIST_ACCOUNTS: "manage_pharmacist_accounts",
  MANAGE_ACCOUNTANT_ACCOUNTS: "manage_accountant_accounts",
  UPDATE_STAFF_INFORMATION: "update_staff_information",
  MANAGE_STAFF_ROLES: "manage_staff_roles",
  MANAGE_STAFF_ONBOARDING_OFFBOARDING: "manage_staff_onboarding_offboarding",
  MANAGE_STAFF_ACCOUNT_STATUS: "manage_staff_account_status",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const staffClinical: Permission[] = [
  Permission.VIEW_PATIENTS,
  Permission.VIEW_APPOINTMENTS,
  Permission.VIEW_MEDICAL_RECORDS,
  Permission.MANAGE_MEDICAL_RECORDS,
];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  [R.SuperAdmin]: Object.values(Permission),
  [R.admin]: Object.values(Permission),
  [R.HR]: [
    Permission.MANAGE_STAFF,
    Permission.MANAGE_DOCTOR_ACCOUNTS,
    Permission.MANAGE_NURSE_ACCOUNTS,
    Permission.MANAGE_RECEPTIONIST_ACCOUNTS,
    Permission.MANAGE_LAB_TECHNICIAN_ACCOUNTS,
    Permission.MANAGE_PHARMACIST_ACCOUNTS,
    Permission.MANAGE_ACCOUNTANT_ACCOUNTS,
    Permission.UPDATE_STAFF_INFORMATION,
    Permission.MANAGE_STAFF_ROLES,
    Permission.MANAGE_STAFF_ONBOARDING_OFFBOARDING,
    Permission.MANAGE_STAFF_ACCOUNT_STATUS,
  ],
  [R.Doctor]: [
    ...staffClinical,
    Permission.MANAGE_APPOINTMENTS,
    Permission.MANAGE_PRESCRIPTIONS,
    Permission.VIEW_LAB,
    Permission.VIEW_BILLING,
  ],
  [R.Receptionist]: [
    Permission.VIEW_PATIENTS,
    Permission.MANAGE_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.MANAGE_APPOINTMENTS,
    Permission.VIEW_BILLING,
  ],
  [R.Nurse]: [
    Permission.VIEW_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.MANAGE_APPOINTMENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.MANAGE_MEDICAL_RECORDS,
    Permission.MANAGE_PHARMACY,
  ],
  [R.LabTechnician]: [
    Permission.VIEW_PATIENTS,
    Permission.VIEW_LAB,
    Permission.MANAGE_LAB,
  ],
  [R.Pharmacist]: [
    Permission.VIEW_PATIENTS,
    Permission.MANAGE_PHARMACY,
    Permission.MANAGE_INVENTORY,
  ],
  [R.Accountant]: [
    Permission.VIEW_PATIENTS,
    Permission.VIEW_BILLING,
    Permission.MANAGE_BILLING,
    Permission.VIEW_REPORTS,
  ],
  [R.patient]: [
    Permission.VIEW_APPOINTMENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.VIEW_BILLING,
  ],
};

export function roleHasPermission(
  role: AppRole | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleHasAnyPermission(
  role: AppRole | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}
