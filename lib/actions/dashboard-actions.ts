"use server";

import db from "@/lib/db";
import { Gender, JobType, OnboardingStatus, Role, Status } from "@/lib/generated/prisma/enums";
import { sendEmail } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import { AppRole } from "@/lib/auth/roles";
import { assignUserRole } from "@/lib/auth/assign-role";
import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { createAuditLog } from "@/lib/db/audit";
import { Permission, roleHasPermission } from "@/lib/auth/permissions";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

function formatActionError(error: unknown, defaultMessage: string): string {
  if (typeof error === "object" && error !== null && "errors" in error) {
    const clerkErr = error as { errors?: Array<{ message?: string }> };
    if (clerkErr.errors && clerkErr.errors[0]?.message) {
      return clerkErr.errors[0].message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return defaultMessage;
}

async function authorizeStaffAction(permission: Permission) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromSessionClaims(sessionClaims);

  if (!userId || !roleHasPermission(role, permission)) {
    return { userId: null, role: undefined };
  }

  return { userId, role };
}

export async function registerPatientAction(formData: FormData) {
  try {
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const dateOfBirth = String(
      formData.get("date_of_birth") || ""
    ).trim();
    const gender = String(formData.get("gender") || "").trim();
    const parsedGender = Object.values(Gender).find((value) => value === gender);
    const maritalStatus = String(
      formData.get("marital_status") || ""
    ).trim();
    const bloodGroup = String(
      formData.get("blood_group") || ""
    ).trim();
    const address = String(
      formData.get("address") || ""
    ).trim();

    const emergencyContactName = String(
      formData.get("emergency_contact_name") || ""
    ).trim();

    const emergencyContactNumber = String(
      formData.get("emergency_contact_number") || ""
    ).trim();

    const emergencyContactRelation = String(
      formData.get("emergency_contact_relation") || ""
    ).trim();

    const allergies = String(
      formData.get("allergies") || ""
    ).trim();

    const medicalConditions = String(
      formData.get("medical_conditions") || ""
    ).trim();

    const medicalHistory = String(
      formData.get("medical_history") || ""
    ).trim();

    const insuranceProvider = String(
      formData.get("insurance_provider") || ""
    ).trim();

    const privacyConsent = formData.get("privacy_consent") === "on";
    const serviceConsent = formData.get("service_consent") === "on";
    const medicalConsent = formData.get("medical_consent") === "on";

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !dateOfBirth ||
      !gender ||
      !parsedGender ||
      !maritalStatus ||
      !address ||
      !emergencyContactName ||
      !emergencyContactNumber ||
      !emergencyContactRelation ||
      !privacyConsent ||
      !serviceConsent ||
      !medicalConsent
    ) {
      return {
        success: false,
        error: "Please complete all required fields.",
      };
    }

    const lastPatient = await db.patient.findFirst({
      orderBy: {
        created_at: "desc",
      },
      select: {
        patientNumber: true,
      },
    });

    let nextNumber = 1001;

    if (lastPatient?.patientNumber) {
      const lastNumber = parseInt(
        lastPatient.patientNumber.replace("P-", ""),
        10
      );

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const patientNumber = `P-${nextNumber}`;

    const patient = await db.patient.create({
      data: {
        patientNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        date_of_birth: new Date(dateOfBirth),
        gender: parsedGender,
        marital_status: maritalStatus,
        blood_group: bloodGroup || null,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber,
        emergency_contact_relation: emergencyContactRelation,
        allergies: allergies || null,
        medical_conditions: medicalConditions || null,
        medical_history: medicalHistory || null,
        insurance_provider: insuranceProvider || null,
        privacy_consent: privacyConsent,
        service_consent: serviceConsent,
        medical_consent: medicalConsent,
      },
    });

    const { userId } = await auth();
    if (userId) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const currentEmail = clerkUser.emailAddresses[0]?.emailAddress;

      if (
        currentEmail &&
        currentEmail.toLowerCase() === email.toLowerCase()
      ) {
        await assignUserRole(userId, AppRole.patient);
      }
    }

    return {
      success: true,
      patient,
    };
  } catch (error) {
    console.error("Patient registration error:", error);

    return {
      success: false,
      error: "Failed to register patient.",
    };
  }
}

export async function updatePatientAction(formData: FormData) {
  try {
    const patientId = String(formData.get("patient_id") || "").trim();
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const dateOfBirth = String(formData.get("date_of_birth") || "").trim();
    const gender = String(formData.get("gender") || "").trim();
    const parsedGender = Object.values(Gender).find((value) => value === gender);
    const maritalStatus = String(formData.get("marital_status") || "").trim();
    const bloodGroup = String(formData.get("blood_group") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const emergencyContactName = String(formData.get("emergency_contact_name") || "").trim();
    const emergencyContactNumber = String(formData.get("emergency_contact_number") || "").trim();
    const emergencyContactRelation = String(formData.get("emergency_contact_relation") || "").trim();
    const allergies = String(formData.get("allergies") || "").trim();
    const medicalConditions = String(formData.get("medical_conditions") || "").trim();
    const medicalHistory = String(formData.get("medical_history") || "").trim();
    const insuranceProvider = String(formData.get("insurance_provider") || "").trim();
    const privacyConsent = formData.get("privacy_consent") === "on";
    const serviceConsent = formData.get("service_consent") === "on";
    const medicalConsent = formData.get("medical_consent") === "on";

    if (!patientId || !firstName || !lastName || !phone || !dateOfBirth || !gender || !parsedGender || !maritalStatus || !address || !emergencyContactName || !emergencyContactNumber || !emergencyContactRelation) {
      return { success: false, error: "Please complete all required fields." };
    }

    await db.patient.update({
      where: { id: patientId },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        date_of_birth: new Date(dateOfBirth),
        gender: parsedGender,
        marital_status: maritalStatus,
        blood_group: bloodGroup || null,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber,
        emergency_contact_relation: emergencyContactRelation,
        allergies: allergies || null,
        medical_conditions: medicalConditions || null,
        medical_history: medicalHistory || null,
        insurance_provider: insuranceProvider || null,
        privacy_consent: privacyConsent,
        service_consent: serviceConsent,
        medical_consent: medicalConsent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Patient update error:", error);
    return { success: false, error: "Failed to update patient." };
  }
}

export async function registerDoctorAction(formData: FormData) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_DOCTOR_ACCOUNTS);
    if (!actor.userId) return { success: false, error: "You do not have permission to create doctor accounts." };

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const specialization = String(formData.get("specialization") || "").trim();
    const licenseNumber = String(formData.get("license_number") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const department = String(formData.get("department") || "").trim() || null;
    const availabilityStatus = String(formData.get("availability_status") || "").trim() || null;
    const type = String(formData.get("type") || "FullTime").trim();

    if (!name || !email || !specialization || !licenseNumber || !phone || !address) {
      return { success: false, error: "Please complete all required fields." };
    }

    const [existingDoctor, existingLicense] = await Promise.all([
      db.doctor.findUnique({ where: { email } }),
      db.doctor.findFirst({ where: { license_number: licenseNumber } }),
    ]);

    if (existingDoctor) {
      return { success: false, error: "A doctor with this email already exists." };
    }

    if (existingLicense) {
      return { success: false, error: "A doctor with this license number already exists." };
    }

    const validTypes: JobType[] = [JobType.FullTime, JobType.PartTime, JobType.Consultant, JobType.Visiting];
    const normalizedType = validTypes.includes(type as JobType) ? (type as JobType) : JobType.FullTime;

    const clerkUserId = await onboardDoctor({
      name,
      email,
      specialization,
      licenseNumber,
      phone,
      address,
      department,
      availabilityStatus,
      type: normalizedType,
    });

    return { success: true, clerkUserId };
  } catch (error) {
    console.error("Doctor registration error:", error);
    return { success: false, error: formatActionError(error, "Failed to register doctor.") };
  }
}

async function onboardDoctor({
  name,
  email,
  specialization,
  licenseNumber,
  phone,
  address,
  department,
  availabilityStatus,
  type,
}: {
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  address: string;
  department: string | null;
  availabilityStatus: string | null;
  type: JobType;
}) {
  const client = await clerkClient();

  const nameParts = name.toLowerCase().split(" ").filter(Boolean);
  const baseName = nameParts.join(".");
  const hospitalDomain = process.env.HOSPITAL_EMAIL_DOMAIN || "hospital.com";

  const [allDoctors, allStaff] = await Promise.all([
    db.doctor.findMany({
      where: { hospitalEmail: { contains: `@${hospitalDomain}` } },
      select: { hospitalEmail: true },
    }),
    db.staff.findMany({
      where: { hospitalEmail: { contains: `@${hospitalDomain}` } },
      select: { hospitalEmail: true },
    }),
  ]);

  const existingEmails = new Set([
    ...allDoctors.map((d) => d.hospitalEmail).filter(Boolean),
    ...allStaff.map((s) => s.hospitalEmail).filter(Boolean),
  ]);

  let hospitalEmail = `${baseName}@${hospitalDomain}`;
  let counter = 1;
  while (existingEmails.has(hospitalEmail)) {
    hospitalEmail = `${baseName}${counter}@${hospitalDomain}`;
    counter++;
  }

  const tempPassword = generateTemporaryPassword();

  const clerkUser = await client.users.createUser({
    emailAddress: [hospitalEmail],
    password: tempPassword,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || "",
    publicMetadata: { role: AppRole.Doctor },
  });

  // Run email verification and role assignment in parallel — both are
  // independent Clerk API calls and don't need to be sequential.
  const verifyEmailPromise = clerkUser.emailAddresses?.[0]?.id
    ? client.emailAddresses.updateEmailAddress(clerkUser.emailAddresses[0].id, {
        verified: true,
      }).catch(() => {})
    : Promise.resolve();

  try {
    await Promise.all([
      verifyEmailPromise,
      assignUserRole(clerkUser.id, AppRole.Doctor),
    ]);

    await db.doctor.create({
      data: {
        id: crypto.randomUUID(),
        clerkUserId: clerkUser.id,
        email,
        name,
        specialization,
        license_number: licenseNumber,
        phone,
        address,
        department,
        availability_status: availabilityStatus,
        type,
        hospitalEmail,
        mustChangePassword: true,
        onboardingCompleted: false,
      },
    });
  } catch (error) {
    // Do not leave an unusable Clerk account behind when the database write fails.
    await client.users.deleteUser(clerkUser.id).catch((cleanupError) => {
      console.error("Failed to remove incomplete doctor account:", cleanupError);
    });
    throw error;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const welcomeEmail = {
    to: email,
    subject: `Your Doctor Account Credentials - ${process.env.HOSPITAL_NAME || "Hospital Management System"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <div style="background: #0f172a; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Welcome to ${process.env.HOSPITAL_NAME || "Hospital Management System"}</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin-top: 0;">Dear Dr. ${name},</p>
          <p>Your Doctor account has been created by HR / Hospital Administration. Please use the following credentials to access your portal:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Assigned Role</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Doctor</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Official Login Email</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${hospitalEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Temporary Password</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 14px; color: #0284c7;">${tempPassword}</td>
            </tr>
          </table>
          <p><strong>Note:</strong> You can log in using your official email address and temporary password.</p>
          <p style="margin-bottom: 4px;">Sign-in Portal:</p>
          <p><a href="${appUrl}/sign-in" style="color: #0369a1; text-decoration: none; font-weight: bold;">${appUrl}/sign-in</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">If you did not request this account, please contact hospital administration immediately.</p>
        </div>
      </div>
    `,
  };

  // Email delivery is not part of the database transaction. Schedule it after
  // the Server Action response so a slow SMTP server never delays registration.
  after(async () => {
    const emailResult = await sendEmail(welcomeEmail);
    if (!emailResult.success) {
      console.error("[DoctorOnboarding] Email delivery failed:", emailResult.error);
    }
  });

  return clerkUser.id;
}

function generateTemporaryPassword(): string {
  const characterGroups = [
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "0123456789",
    "!@#$%^&*",
  ];
  const charset = characterGroups.join("");
  const randomCharacter = (characters: string) =>
    characters.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % characters.length);

  // Clerk password policies commonly require each of these character types.
  const passwordCharacters = characterGroups.map(randomCharacter);
  while (passwordCharacters.length < 12) {
    passwordCharacters.push(randomCharacter(charset));
  }

  for (let index = passwordCharacters.length - 1; index > 0; index--) {
    const swapIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join("");
}

export async function updateDoctorAction(formData: FormData) {
  try {
    const actor = await authorizeStaffAction(Permission.UPDATE_STAFF_INFORMATION);
    if (!actor.userId) return { success: false, error: "You do not have permission to update doctor information." };

    const doctorId = String(formData.get("doctor_id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const specialization = String(formData.get("specialization") || "").trim();
    const licenseNumber = String(formData.get("license_number") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const department = String(formData.get("department") || "").trim() || null;
    const availabilityStatus = String(formData.get("availability_status") || "").trim() || null;
    const type = String(formData.get("type") || "FullTime").trim();

    if (!doctorId || !name || !email || !specialization || !licenseNumber || !phone || !address) {
      return { success: false, error: "Please complete all required fields." };
    }

    const validTypes: JobType[] = [JobType.FullTime, JobType.PartTime, JobType.Consultant, JobType.Visiting];
    const normalizedType = validTypes.includes(type as JobType) ? (type as JobType) : JobType.FullTime;

    await db.doctor.update({
      where: { id: doctorId },
      data: {
        name,
        email,
        specialization,
        license_number: licenseNumber,
        phone,
        address,
        department,
        availability_status: availabilityStatus,
        type: normalizedType,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Doctor update error:", error);
    return { success: false, error: "Failed to update doctor." };
  }
}

export async function changeDoctorPasswordAction(currentPassword: string, newPassword: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const role = sessionClaims?.metadata?.role as AppRole | undefined;
    if (role !== AppRole.Doctor) {
      return { success: false, error: "Forbidden" };
    }

    const doctor = await db.doctor.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, mustChangePassword: true },
    });

    if (!doctor) {
      return { success: false, error: "Doctor record not found." };
    }

    const client = await clerkClient();

    const verification = await client.users.verifyPassword({
      userId,
      password: currentPassword,
    });

    if (!verification.verified) {
      return { success: false, error: "Current password is incorrect." };
    }

    await client.users.updateUser(userId, {
      password: newPassword,
      signOutOfOtherSessions: true,
    });

    await db.doctor.update({
      where: { id: doctor.id },
      data: { mustChangePassword: false, onboardingCompleted: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password. Please ensure your current password is correct." };
  }
}

export async function changeStaffPasswordAction(currentPassword: string, newPassword: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const role = sessionClaims?.metadata?.role as AppRole | undefined;
    const staffRoles: AppRole[] = ["HR", "Receptionist", "Nurse", "LabTechnician", "Pharmacist", "Accountant"];
    if (!role || !staffRoles.includes(role)) {
      return { success: false, error: "Forbidden" };
    }

    const staff = await db.staff.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, mustChangePassword: true, onboardingCompleted: true, onboardingStatus: true },
    });

    if (!staff) {
      return { success: false, error: "Staff record not found." };
    }

    const client = await clerkClient();

    const verification = await client.users.verifyPassword({
      userId,
      password: currentPassword,
    });

    if (!verification.verified) {
      return { success: false, error: "Current password is incorrect." };
    }

    await client.users.updateUser(userId, {
      password: newPassword,
      signOutOfOtherSessions: true,
    });

    const isInitialPasswordChange = staff.mustChangePassword;
    await db.staff.update({
      where: { id: staff.id },
      data: {
        mustChangePassword: false,
        onboardingCompleted: isInitialPasswordChange ? false : staff.onboardingCompleted,
        onboardingStatus: isInitialPasswordChange ? OnboardingStatus.UNDER_REVIEW : staff.onboardingStatus,
        changeRequest: isInitialPasswordChange ? null : undefined,
        rejectionReason: isInitialPasswordChange ? null : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password. Please ensure your current password is correct." };
  }
}

export async function resubmitStaffOnboardingAction() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const staff = await db.staff.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, onboardingStatus: true },
    });

    if (!staff) return { success: false, error: "Staff record not found." };
    if (staff.onboardingStatus !== OnboardingStatus.CHANGES_REQUESTED) {
      return { success: false, error: "This onboarding record cannot be resubmitted." };
    }

    await db.staff.update({
      where: { id: staff.id },
      data: { onboardingStatus: OnboardingStatus.UNDER_REVIEW, changeRequest: null, rejectionReason: null },
    });

    return { success: true };
  } catch (error) {
    console.error("Onboarding resubmission error:", error);
    return { success: false, error: "Failed to resubmit onboarding." };
  }
}

export async function reviewStaffOnboardingAction(
  staffId: string,
  decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT",
  reason?: string
) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF_ONBOARDING_OFFBOARDING);
    const onboardingReviewerRoles: AppRole[] = [AppRole.HR, AppRole.admin, AppRole.SuperAdmin];
    if (!actor.userId || !actor.role || !onboardingReviewerRoles.includes(actor.role)) {
      return { success: false, error: "Only authorized HR users can review onboarding." };
    }

    const note = reason?.trim() || "";
    if ((decision === "REQUEST_CHANGES" || decision === "REJECT") && !note) {
      return { success: false, error: "A reason is required for this decision." };
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { name: true, role: true, onboardingStatus: true },
    });
    if (!staff) return { success: false, error: "Staff record not found." };
    if (actor.role === AppRole.HR && staff.role === AppRole.HR) {
      return { success: false, error: "HR managers cannot review HR accounts." };
    }
    if (
      staff.onboardingStatus !== OnboardingStatus.UNDER_REVIEW &&
      staff.onboardingStatus !== OnboardingStatus.CHANGES_REQUESTED &&
      staff.onboardingStatus !== OnboardingStatus.PENDING &&
      staff.onboardingStatus !== OnboardingStatus.IN_PROGRESS
    ) {
      return { success: false, error: "Only onboarding records that are pending, under review, or have requested changes can be decided." };
    }

    const data = decision === "APPROVE"
      ? {
          onboardingStatus: OnboardingStatus.COMPLETED,
          onboardingCompleted: true,
          status: Status.Active,
          approvedBy: actor.userId,
          approvedAt: new Date(),
          changeRequest: null,
          rejectionReason: null,
        }
      : decision === "REQUEST_CHANGES"
        ? {
            onboardingStatus: OnboardingStatus.CHANGES_REQUESTED,
            onboardingCompleted: false,
            changeRequest: note,
            rejectionReason: null,
          }
        : {
            onboardingStatus: OnboardingStatus.REJECTED,
            onboardingCompleted: false,
            status: Status.Inactive,
            changeRequest: null,
            rejectionReason: note,
          };

    await db.staff.update({ where: { id: staffId }, data });
    await createAuditLog({
      userId: actor.userId,
      recordId: staffId,
      action: `ONBOARDING_${decision}`,
      details: `${decision === "APPROVE" ? "Approved" : decision === "REJECT" ? "Rejected" : "Requested changes for"} onboarding for ${staff.name}${note ? `: ${note}` : ""}`,
      model: "Staff",
    });

    return { success: true };
  } catch (error) {
    console.error("Staff onboarding review error:", error);
    return { success: false, error: formatActionError(error, "Failed to review onboarding.") };
  }
}

export async function registerStaffAction(formData: FormData) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF);
    if (!actor.userId) return { success: false, error: "You do not have permission to create staff accounts." };

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const department = String(formData.get("department") || "").trim() || null;
    const licenseNumber = String(formData.get("license_number") || "").trim();
    const role = String(formData.get("role") || "Receptionist").trim() as AppRole;

    if (!name || !email || !phone || !address) {
      return { success: false, error: "Please complete all required fields." };
    }

    const validRoles: AppRole[] = [
      "Doctor",
      "Receptionist",
      "Nurse",
      "LabTechnician",
      "Pharmacist",
      "Accountant",
      "HR",
    ];
    const normalizedRole = validRoles.includes(role) ? role : "Receptionist";

    if (actor.role === AppRole.HR && normalizedRole === AppRole.HR) {
      return { success: false, error: "HR managers cannot create or manage HR accounts." };
    }

    const existingStaff = await db.staff.findFirst({
      where: { email },
    });

    if (existingStaff) {
      return { success: false, error: "A staff member with this email already exists." };
    }

    const clerkUserId = await onboardStaff({
      name,
      email,
      phone,
      address,
      department,
      licenseNumber,
      role: normalizedRole,
    });

    return { success: true, clerkUserId };
  } catch (error) {
    console.error("Staff registration error:", error);
    return { success: false, error: formatActionError(error, "Failed to register staff.") };
  }
}

async function onboardStaff({
  name,
  email,
  phone,
  address,
  department,
  licenseNumber,
  role,
}: {
  name: string;
  email: string;
  phone: string;
  address: string;
  department: string | null;
  licenseNumber: string;
  role: AppRole;
}) {
  const client = await clerkClient();

  const nameParts = name.toLowerCase().split(" ").filter(Boolean);
  const baseName = nameParts.join(".");
  const hospitalDomain = process.env.HOSPITAL_EMAIL_DOMAIN || "hospital.com";

  const [allStaff, allDoctors] = await Promise.all([
    db.staff.findMany({
      where: { hospitalEmail: { contains: `@${hospitalDomain}` } },
      select: { hospitalEmail: true },
    }),
    db.doctor.findMany({
      where: { hospitalEmail: { contains: `@${hospitalDomain}` } },
      select: { hospitalEmail: true },
    }),
  ]);

  const existingEmails = new Set([
    ...allStaff.map((s) => s.hospitalEmail).filter(Boolean),
    ...allDoctors.map((d) => d.hospitalEmail).filter(Boolean),
  ]);

  let hospitalEmail = `${baseName}@${hospitalDomain}`;
  let counter = 1;
  while (existingEmails.has(hospitalEmail)) {
    hospitalEmail = `${baseName}${counter}@${hospitalDomain}`;
    counter++;
  }

  const tempPassword = generateTemporaryPassword();

  const clerkUser = await client.users.createUser({
    emailAddress: [hospitalEmail],
    password: tempPassword,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || "",
    publicMetadata: { role },
  });

  // Run email verification and role assignment in parallel — both are
  // independent Clerk API calls and don't need to be sequential.
  const verifyEmailPromise = clerkUser.emailAddresses?.[0]?.id
    ? client.emailAddresses.updateEmailAddress(clerkUser.emailAddresses[0].id, {
        verified: true,
      }).catch(() => {})
    : Promise.resolve();

  try {
    await Promise.all([
      verifyEmailPromise,
      assignUserRole(clerkUser.id, role),
    ]);

    await db.staff.create({
      data: {
        id: crypto.randomUUID(),
        clerkUserId: clerkUser.id,
        email,
        name,
        phone,
        address,
        department,
        license_number: licenseNumber || null,
        role,
        hospitalEmail,
        mustChangePassword: true,
        onboardingCompleted: false,
        // New staff cannot access the system until HR approves onboarding.
        status: Status.Dormant,
      },
    });
  } catch (error) {
    await client.users.deleteUser(clerkUser.id).catch((cleanupError) => {
      console.error("Failed to remove incomplete staff account:", cleanupError);
    });
    throw error;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const welcomeEmail = {
    to: email,
    subject: `Your Staff Account Credentials (${role}) - ${process.env.HOSPITAL_NAME || "Hospital Management System"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <div style="background: #0f172a; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Welcome to ${process.env.HOSPITAL_NAME || "Hospital Management System"}</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin-top: 0;">Dear ${name},</p>
          <p>Your <strong>${role}</strong> account has been created by the hospital HR / Administration. Please use the following login credentials to access your staff portal:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Assigned Role</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #0369a1; font-weight: bold;">${role}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Official Login Email</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${hospitalEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Temporary Password</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 14px; color: #0284c7;">${tempPassword}</td>
            </tr>
          </table>
          <p><strong>Note:</strong> Log in using your official email address and temporary password above.</p>
          <p style="margin-bottom: 4px;">Sign-in Portal:</p>
          <p><a href="${appUrl}/sign-in" style="color: #0369a1; text-decoration: none; font-weight: bold;">${appUrl}/sign-in</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">If you did not request this account, please contact the hospital HR department immediately.</p>
        </div>
      </div>
    `,
  };

  after(async () => {
    const emailResult = await sendEmail(welcomeEmail);
    if (!emailResult.success) {
      console.error("[StaffOnboarding] Email delivery failed:", emailResult.error);
    }
  });

  return clerkUser.id;
}

export async function registerHRAction(formData: FormData) {
  try {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const department = String(formData.get("department") || "").trim() || null;

    if (!name || !email || !phone || !address) {
      return { success: false, error: "Please complete all required fields." };
    }

    const existingStaff = await db.staff.findFirst({
      where: { email },
    });

    if (existingStaff) {
      return { success: false, error: "A staff member with this email already exists." };
    }

    const clerkUserId = await onboardStaff({
      name,
      email,
      phone,
      address,
      department,
      licenseNumber: "",
      role: AppRole.HR,
    });

    return { success: true, clerkUserId };
  } catch (error) {
    console.error("HR registration error:", error);
    return { success: false, error: formatActionError(error, "Failed to register HR.") };
  }
}

export async function updateStaffAction(formData: FormData) {
  try {
    const actor = await authorizeStaffAction(Permission.UPDATE_STAFF_INFORMATION);
    if (!actor.userId) return { success: false, error: "You do not have permission to update staff information." };
    const actorUserId = actor.userId;
    const staffId = String(formData.get("staff_id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const department = String(formData.get("department") || "").trim() || null;
    const licenseNumber = String(formData.get("license_number") || "").trim();
    const role = String(formData.get("role") || "Receptionist").trim();
    const status = String(formData.get("status") || "Active").trim();

    if (!staffId || !name || !email || !phone || !address) {
      return { success: false, error: "Please complete all required fields." };
    }

    const existingStaff = await db.staff.findUnique({
      where: { id: staffId },
      select: { role: true, clerkUserId: true },
    });

    if (!existingStaff) {
      return { success: false, error: "Staff record not found." };
    }

    if (actor.role === AppRole.HR && (existingStaff.role === AppRole.HR || role === AppRole.HR)) {
      return { success: false, error: "HR managers cannot manage HR accounts." };
    }

    await db.staff.update({
      where: { id: staffId },
      data: {
        name,
        email,
        phone,
        address,
        department,
        license_number: licenseNumber || null,
        role: role as Role,
        status: status as Status,
      },
    });

    // Sync Clerk metadata if role changed
    if (existingStaff.role !== role && existingStaff.clerkUserId) {
      await assignUserRole(existingStaff.clerkUserId, role as AppRole).catch(
        (err) => console.error("[UpdateStaff] Failed to sync Clerk role:", err)
      );
    }

    if (actorUserId) {
      createAuditLog({
        userId: actorUserId,
        recordId: staffId,
        action: "UPDATE",
        details: `Updated staff ${name}${existingStaff.role !== role ? ` (role: ${existingStaff.role} → ${role})` : ""}`,
        model: "Staff",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Staff update error:", error);
    return { success: false, error: "Failed to update staff." };
  }
}

export async function toggleStaffStatusAction(
  staffId: string,
  newStatus: "Active" | "Inactive" | "Dormant"
) {
  try {
    const { userId: actorUserId, sessionClaims } = await auth();
    if (!actorUserId) return { success: false, error: "Unauthorized" };

    const actorRole = getRoleFromSessionClaims(sessionClaims);
    if (!roleHasPermission(actorRole, Permission.MANAGE_STAFF_ACCOUNT_STATUS)) {
      return { success: false, error: "You do not have permission to change staff account status." };
    }

    const validStatuses: string[] = [Status.Active, Status.Inactive, Status.Dormant];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid status value." };
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { clerkUserId: true, name: true, role: true, status: true },
    });

    if (!staff) return { success: false, error: "Staff record not found." };

    if (actorRole === AppRole.HR && staff.role === AppRole.HR) {
      return { success: false, error: "HR managers cannot manage HR accounts." };
    }

    await db.staff.update({
      where: { id: staffId },
      data: { status: newStatus as Status },
    });

    // Ban/unban in Clerk
    if (staff.clerkUserId) {
      const client = await clerkClient();
      try {
        if (newStatus === "Active") {
          await client.users.unbanUser(staff.clerkUserId);
        } else {
          await client.users.banUser(staff.clerkUserId);
        }
      } catch (err) {
        console.error("[ToggleStaffStatus] Clerk ban/unban failed:", err);
      }
    }

    createAuditLog({
      userId: actorUserId,
      recordId: staffId,
      action: "STATUS_CHANGE",
      details: `Changed status of ${staff.name} from ${staff.status} to ${newStatus}`,
      model: "Staff",
    });

    return { success: true };
  } catch (error) {
    console.error("Toggle staff status error:", error);
    return { success: false, error: formatActionError(error, "Failed to update staff status.") };
  }
}

export async function toggleDoctorStatusAction(
  doctorId: string,
  newStatus: "Active" | "Inactive" | "Dormant"
) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF_ACCOUNT_STATUS);
    if (!actor.userId) return { success: false, error: "You do not have permission to change doctor account status." };
    const actorUserId = actor.userId;

    const validStatuses: string[] = [Status.Active, Status.Inactive, Status.Dormant];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid status value." };
    }

    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      select: { clerkUserId: true, name: true, status: true },
    });

    if (!doctor) return { success: false, error: "Doctor record not found." };

    await db.doctor.update({
      where: { id: doctorId },
      data: { status: newStatus as Status },
    });

    if (doctor.clerkUserId) {
      const client = await clerkClient();
      try {
        if (newStatus === "Active") {
          await client.users.unbanUser(doctor.clerkUserId);
        } else {
          await client.users.banUser(doctor.clerkUserId);
        }
      } catch (err) {
        console.error("[ToggleDoctorStatus] Clerk ban/unban failed:", err);
      }
    }

    createAuditLog({
      userId: actorUserId,
      recordId: doctorId,
      action: "STATUS_CHANGE",
      details: `Changed status of Dr. ${doctor.name} from ${doctor.status} to ${newStatus}`,
      model: "Doctor",
    });

    return { success: true };
  } catch (error) {
    console.error("Toggle doctor status error:", error);
    return { success: false, error: formatActionError(error, "Failed to update doctor status.") };
  }
}

export async function offboardStaffAction(staffId: string) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF_ONBOARDING_OFFBOARDING);
    if (!actor.userId) return { success: false, error: "You do not have permission to offboard staff." };
    const actorUserId = actor.userId;

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { clerkUserId: true, name: true, role: true, status: true },
    });

    if (!staff) return { success: false, error: "Staff record not found." };

    if (actor.role === AppRole.HR && staff.role === AppRole.HR) {
      return { success: false, error: "HR managers cannot manage HR accounts." };
    }

    await db.staff.update({
      where: { id: staffId },
      data: { status: "Inactive" },
    });

    if (staff.clerkUserId) {
      const client = await clerkClient();
      await client.users.banUser(staff.clerkUserId).catch((err) => {
        console.error("[OffboardStaff] Clerk ban failed:", err);
      });
    }

    createAuditLog({
      userId: actorUserId,
      recordId: staffId,
      action: "OFFBOARD",
      details: `Offboarded staff ${staff.name} (status: ${staff.status} → Inactive, account disabled)`,
      model: "Staff",
    });

    return { success: true };
  } catch (error) {
    console.error("Staff offboard error:", error);
    return { success: false, error: formatActionError(error, "Failed to offboard staff.") };
  }
}

export async function offboardDoctorAction(doctorId: string) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF_ONBOARDING_OFFBOARDING);
    if (!actor.userId) return { success: false, error: "You do not have permission to offboard doctors." };
    const actorUserId = actor.userId;

    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      select: { clerkUserId: true, name: true, status: true },
    });

    if (!doctor) return { success: false, error: "Doctor record not found." };

    await db.doctor.update({
      where: { id: doctorId },
      data: { status: "Inactive" },
    });

    if (doctor.clerkUserId) {
      const client = await clerkClient();
      await client.users.banUser(doctor.clerkUserId).catch((err) => {
        console.error("[OffboardDoctor] Clerk ban failed:", err);
      });
    }

    createAuditLog({
      userId: actorUserId,
      recordId: doctorId,
      action: "OFFBOARD",
      details: `Offboarded Dr. ${doctor.name} (status: ${doctor.status} → Inactive, account disabled)`,
      model: "Doctor",
    });

    return { success: true };
  } catch (error) {
    console.error("Doctor offboard error:", error);
    return { success: false, error: formatActionError(error, "Failed to offboard doctor.") };
  }
}

export async function resendStaffCredentialsAction(
  accountType: "staff" | "doctor",
  accountId: string
) {
  try {
    const permission = accountType === "doctor"
      ? Permission.MANAGE_DOCTOR_ACCOUNTS
      : Permission.MANAGE_STAFF;
    const actor = await authorizeStaffAction(permission);
    if (!actor.userId) return { success: false, error: "You do not have permission to send login credentials." };

    const account = accountType === "doctor"
      ? await db.doctor.findUnique({ where: { id: accountId }, select: { clerkUserId: true, name: true, email: true } })
      : await db.staff.findUnique({ where: { id: accountId }, select: { clerkUserId: true, name: true, email: true, role: true } });

    if (!account?.clerkUserId) return { success: false, error: "This account does not have a login profile." };
    if (actor.role === AppRole.HR && "role" in account && account.role === AppRole.HR) {
      return { success: false, error: "HR managers cannot manage HR accounts." };
    }

    const temporaryPassword = generateTemporaryPassword();
    const client = await clerkClient();
    await client.users.updateUser(account.clerkUserId, {
      password: temporaryPassword,
      signOutOfOtherSessions: true,
    });

    const model = accountType === "doctor" ? "Doctor" : "Staff";
    if (accountType === "doctor") {
      await db.doctor.update({ where: { id: accountId }, data: { mustChangePassword: true, onboardingCompleted: false } });
    } else {
      await db.staff.update({ where: { id: accountId }, data: { mustChangePassword: true, onboardingCompleted: false } });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await sendEmail({
      to: account.email,
      subject: `Your updated hospital login credentials`,
      html: `<p>Dear ${account.name},</p><p>Your hospital login credentials have been reset by HR.</p><p><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Please sign in at <a href="${appUrl}/sign-in">${appUrl}/sign-in</a> and change your password immediately.</p>`,
    });
    if (!result.success) return { success: false, error: "Password reset, but the credential email could not be sent." };

    createAuditLog({
      userId: actor.userId,
      recordId: accountId,
      action: "CREDENTIALS_RESENT",
      details: `Reset and resent login credentials for ${account.name}`,
      model,
    });
    return { success: true };
  } catch (error) {
    console.error("Resend credentials error:", error);
    return { success: false, error: formatActionError(error, "Failed to resend login credentials.") };
  }
}

export async function deleteStaffAction(staffId: string) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF);
    if (!actor.userId) return { success: false, error: "You do not have permission to remove staff." };
    const actorUserId = actor.userId;

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { clerkUserId: true, name: true, role: true },
    });

    if (!staff) return { success: false, error: "Staff record not found." };

    if (actor.role === AppRole.HR && staff.role === AppRole.HR) {
      return { success: false, error: "HR managers cannot remove HR accounts." };
    }

    // Delete from database first
    await db.staff.delete({ where: { id: staffId } });

    // Then clean up Clerk account
    if (staff.clerkUserId) {
      const client = await clerkClient();
      await client.users.deleteUser(staff.clerkUserId).catch((err) => {
        console.error("[DeleteStaff] Clerk user deletion failed:", err);
      });
    }

    createAuditLog({
      userId: actorUserId,
      recordId: staffId,
      action: "DELETE",
      details: `Deleted staff ${staff.name} (role: ${staff.role})`,
      model: "Staff",
    });

    return { success: true };
  } catch (error) {
    console.error("Staff delete error:", error);
    return { success: false, error: formatActionError(error, "Failed to delete staff record.") };
  }
}

export async function deleteDoctorAction(doctorId: string) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_DOCTOR_ACCOUNTS);
    if (!actor.userId) return { success: false, error: "You do not have permission to remove doctor accounts." };
    const actorUserId = actor.userId;

    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      select: { clerkUserId: true, name: true },
    });

    if (!doctor) return { success: false, error: "Doctor record not found." };

    // Check for dependent records that would prevent deletion
    const [appointmentCount, diagnosisCount] = await Promise.all([
      db.appointment.count({ where: { doctor_id: doctorId } }),
      db.diagnosis.count({ where: { doctor_id: doctorId } }),
    ]);

    if (appointmentCount > 0 || diagnosisCount > 0) {
      return {
        success: false,
        error: `Cannot delete Dr. ${doctor.name} — they have ${appointmentCount} appointment(s) and ${diagnosisCount} diagnosis record(s). Use offboarding instead.`,
      };
    }

    await db.doctor.delete({ where: { id: doctorId } });

    if (doctor.clerkUserId) {
      const client = await clerkClient();
      await client.users.deleteUser(doctor.clerkUserId).catch((err) => {
        console.error("[DeleteDoctor] Clerk user deletion failed:", err);
      });
    }

    createAuditLog({
      userId: actorUserId,
      recordId: doctorId,
      action: "DELETE",
      details: `Deleted doctor Dr. ${doctor.name}`,
      model: "Doctor",
    });

    return { success: true };
  } catch (error) {
    console.error("Doctor delete error:", error);
    return { success: false, error: formatActionError(error, "Failed to delete doctor record.") };
  }
}

export async function changeStaffRoleAction(staffId: string, newRole: AppRole) {
  try {
    const actor = await authorizeStaffAction(Permission.MANAGE_STAFF_ROLES);
    if (!actor.userId) return { success: false, error: "You do not have permission to change staff roles." };
    const actorUserId = actor.userId;

    const validRoles: AppRole[] = [
      "Receptionist",
      "Nurse",
      "LabTechnician",
      "Pharmacist",
      "Accountant",
      "HR",
    ];

    if (!validRoles.includes(newRole)) {
      return { success: false, error: "Invalid role. Staff cannot be assigned Doctor, admin, or SuperAdmin roles." };
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { clerkUserId: true, name: true, role: true },
    });

    if (!staff) return { success: false, error: "Staff record not found." };

    if (actor.role === AppRole.HR && (staff.role === AppRole.HR || newRole === AppRole.HR)) {
      return { success: false, error: "HR managers cannot manage HR accounts." };
    }

    if (staff.role === newRole) {
      return { success: false, error: `Staff is already assigned the ${newRole} role.` };
    }

    await db.staff.update({
      where: { id: staffId },
      data: { role: newRole as Role },
    });

    if (staff.clerkUserId) {
      await assignUserRole(staff.clerkUserId, newRole).catch((err) => {
        console.error("[ChangeStaffRole] Clerk metadata sync failed:", err);
      });
    }

    createAuditLog({
      userId: actorUserId,
      recordId: staffId,
      action: "ROLE_CHANGE",
      details: `Changed role of ${staff.name} from ${staff.role} to ${newRole}`,
      model: "Staff",
    });

    return { success: true };
  } catch (error) {
    console.error("Change staff role error:", error);
    return { success: false, error: formatActionError(error, "Failed to change staff role.") };
  }
}
