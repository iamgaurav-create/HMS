/** Mirrors `Role` in prisma/schema.prisma — keep in sync (edge-safe, no Prisma import). */
export const AppRole = {
  SuperAdmin: "SuperAdmin",
  admin: "admin",
  HR: "HR",
  Doctor: "Doctor",
  Receptionist: "Receptionist",
  Nurse: "Nurse",
  LabTechnician: "LabTechnician",
  Pharmacist: "Pharmacist",
  Accountant: "Accountant",
  patient: "patient",
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const ALL_ROLES: AppRole[] = Object.values(AppRole);

export const ROLE_LABELS: Record<AppRole, string> = {
  SuperAdmin: "Super Admin",
  admin: "Administrator",
  HR: "HR Manager",
  Doctor: "Doctor",
  Receptionist: "Receptionist",
  Nurse: "Nurse",
  LabTechnician: "Lab Technician",
  Pharmacist: "Pharmacist",
  Accountant: "Accountant",
  patient: "Patient",
};

/** Default landing path after sign-in for each role. */
export const ROLE_HOME_PATH: Record<AppRole, string> = {
  SuperAdmin: "/dashboard?role=SuperAdmin",
  admin: "/admin",
  HR: "/dashboard?role=HR",
  Doctor: "/doctor",
  Receptionist: "/dashboard?role=Receptionist",
  Nurse: "/dashboard?role=Nurse",
  LabTechnician: "/dashboard?role=LabTechnician",
  Pharmacist: "/dashboard?role=Pharmacist",
  Accountant: "/dashboard?role=Accountant",
  patient: "/dashboard/role/patient",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && ALL_ROLES.includes(value as AppRole);
}
