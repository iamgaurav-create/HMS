import { createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import type { AppRole } from "@/lib/auth/roles";
import { AppRole as R } from "@/lib/auth/roles";

export const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
  "/api/webhooks(.*)",
]);

export const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export const routeMatchers = {
  adminPortal: createRouteMatcher(["/admin(.*)"]),
  hrPortal: createRouteMatcher(["/hr(.*)"]),
  hrRegistration: createRouteMatcher(["/hr/registration(.*)"]),
  doctorPortal: createRouteMatcher(["/doctor", "/doctor/(.*)"]),
  doctorExact: createRouteMatcher(["/doctor"]),
  patientPortal: createRouteMatcher(["/patient", "/patient/(.*)"]),
  patientExact: createRouteMatcher(["/patient"]),
  receptionistPortal: createRouteMatcher(["/receptionist(.*)"]),
  nursePortal: createRouteMatcher(["/nurse(.*)"]),
  labPortal: createRouteMatcher(["/lab(.*)"]),
  pharmacyPortal: createRouteMatcher(["/pharmacy(.*)"]),
  accountantPortal: createRouteMatcher(["/accountant(.*)"]),
  staffChangePassword: createRouteMatcher(["/staff/change-password(.*)"]),

  dashboard: createRouteMatcher(["/dashboard(.*)"]),

  patients: createRouteMatcher(["/patients(.*)"]),
  doctors: createRouteMatcher(["/doctors(.*)"]),
  appointments: createRouteMatcher(["/appointments(.*)"]),
  prescriptions: createRouteMatcher(["/prescriptions(.*)"]),
  medicalRecords: createRouteMatcher(["/medical-records(.*)"]),
  laboratory: createRouteMatcher(["/laboratory(.*)"]),
  pharmacy: createRouteMatcher(["/pharmacy(.*)"]),
  billing: createRouteMatcher(["/billing(.*)"]),
  inventory: createRouteMatcher(["/inventory(.*)"]),
  reports: createRouteMatcher(["/reports(.*)"]),
  staffs: createRouteMatcher(["/staffs(.*)"]),
  settings: createRouteMatcher(["/settings(.*)"]),
};

export type RouteAccessRule = {
  matcher: (req: NextRequest) => boolean;
  allowedRoles: readonly AppRole[];
};

/**
 * Middleware and server guards use the same matrix so route policy lives in one place.
 */
export const routeAccessRules: RouteAccessRule[] = [
  {
    matcher: routeMatchers.adminPortal,
    allowedRoles: [R.SuperAdmin, R.admin],
  },
  {
    matcher: routeMatchers.hrPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.HR],
  },
  {
    matcher: routeMatchers.hrRegistration,
    allowedRoles: [R.SuperAdmin, R.admin, R.HR],
  },
  {
    matcher: routeMatchers.doctorExact,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.HR],
  },
  {
    matcher: routeMatchers.doctorPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.HR],
  },
  {
    matcher: routeMatchers.patientExact,
    allowedRoles: [R.SuperAdmin, R.admin, R.patient],
  },
  {
    matcher: routeMatchers.patientPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.patient, R.Receptionist, R.Doctor, R.Nurse],
  },
  {
    matcher: routeMatchers.receptionistPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.Receptionist],
  },
  {
    matcher: routeMatchers.nursePortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.Nurse],
  },
  {
    matcher: routeMatchers.labPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.LabTechnician, R.Doctor],
  },
  {
    matcher: routeMatchers.pharmacyPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.Pharmacist, R.Nurse],
  },
  {
    matcher: routeMatchers.accountantPortal,
    allowedRoles: [R.SuperAdmin, R.admin, R.Accountant],
  },
  {
    matcher: routeMatchers.staffs,
    allowedRoles: [R.SuperAdmin, R.admin, R.HR],
  },
  {
    matcher: routeMatchers.settings,
    allowedRoles: [R.SuperAdmin, R.admin],
  },
  {
    matcher: routeMatchers.inventory,
    allowedRoles: [R.SuperAdmin, R.admin, R.Pharmacist],
  },
  {
    matcher: routeMatchers.reports,
    allowedRoles: [R.SuperAdmin, R.admin, R.Accountant],
  },
  {
    matcher: routeMatchers.patients,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.Nurse, R.LabTechnician, R.Receptionist, R.Pharmacist, R.Accountant],
  },
  {
    matcher: routeMatchers.doctors,
    allowedRoles: [R.SuperAdmin, R.admin, R.HR],
  },
  {
    matcher: routeMatchers.appointments,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.Nurse, R.Receptionist, R.patient],
  },
  {
    matcher: routeMatchers.prescriptions,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.Pharmacist, R.Nurse],
  },
  {
    matcher: routeMatchers.medicalRecords,
    allowedRoles: [R.SuperAdmin, R.admin, R.Doctor, R.Nurse, R.patient],
  },
  {
    matcher: routeMatchers.laboratory,
    allowedRoles: [R.SuperAdmin, R.admin, R.LabTechnician, R.Doctor],
  },
  {
    matcher: routeMatchers.pharmacy,
    allowedRoles: [R.SuperAdmin, R.admin, R.Pharmacist, R.Nurse],
  },
  {
    matcher: routeMatchers.billing,
    allowedRoles: [R.SuperAdmin, R.admin, R.Accountant, R.Receptionist, R.patient],
  },
  {
    matcher: routeMatchers.staffChangePassword,
    allowedRoles: [R.SuperAdmin, R.admin, R.HR, R.Receptionist, R.Nurse, R.LabTechnician, R.Pharmacist, R.Accountant],
  },
];

export function findRouteAccessViolation(
  req: NextRequest,
  role: AppRole | undefined
): RouteAccessRule | undefined {
  for (const rule of routeAccessRules) {
    if (!rule.matcher(req)) continue;
    if (!role || !rule.allowedRoles.includes(role)) {
      return rule;
    }
  }
  return undefined;
}

/**
 * Returns only the roles that have access to the matched route,
 * filtered to exclude roles with no access.
 */
export function getAllowedRolesForRoute(
  matcher: (req: NextRequest) => boolean,
  request: NextRequest
): readonly AppRole[] {
  for (const rule of routeAccessRules) {
    if (!matcher(request)) continue;
    return rule.allowedRoles;
  }
  return [];
}

/**
 * Returns a filtered list of roles that can access at least one route.
 * Useful for previewing which roles are active in the system.
 */
export function getActiveRoles(): readonly AppRole[] {
  const active = new Set<AppRole>();
  for (const rule of routeAccessRules) {
    for (const role of rule.allowedRoles) {
      active.add(role);
    }
  }
  return Array.from(active);
}
