"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  registerStaffAction,
  registerDoctorAction,
  updateStaffAction,
} from "@/lib/actions/dashboard-actions";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";

interface StaffRegistrationFormProps {
  staffId?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  department?: string;
  licenseNumber?: string;
  role?: string;
  hospitalEmail?: string;
  status?: string;
  isEditMode?: boolean;
  actorRole?: string;
}

export function StaffRegistrationForm({
  staffId,
  email = "",
  name = "",
  phone = "",
  address = "",
  department = "",
  licenseNumber = "",
  role = "Receptionist",
  hospitalEmail = "",
  status = "Active",
  isEditMode = false,
  actorRole,
}: StaffRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(role);

  const isDoctorRole = selectedRole === "Doctor";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (isEditMode && staffId) {
      formData.set("staff_id", staffId);
    }

    const requiredFields: [string, string][] = [
      ["name", "Full Name"],
      ["email", "Email Address"],
      ["phone", "Phone Number"],
      ["address", "Address"],
    ];

    // Doctor role requires specialization and license number
    if (isDoctorRole && !isEditMode) {
      requiredFields.push(
        ["specialization", "Specialization"],
        ["license_number", "License Number"]
      );
    }

    const missingFields = requiredFields
      .filter(([fieldName]) => {
        const value = formData.get(fieldName);
        return !value || String(value).trim() === "";
      })
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      toast.error("Required fields missing", {
        description: `${missingFields.join(", ")} ${missingFields.length === 1 ? "is" : "are"} required.`,
      });
      return;
    }

    setLoading(true);

    try {
      let result: { success: boolean; error?: string };

      if (isEditMode) {
        result = await updateStaffAction(formData);
      } else if (isDoctorRole) {
        // Route Doctor registrations to the doctor-specific action
        // which creates a record in the doctor table with proper onboarding
        result = await registerDoctorAction(formData);
      } else {
        result = await registerStaffAction(formData);
      }

      if (result.success) {
        toast.success(
          isEditMode
            ? "Staff updated successfully!"
            : isDoctorRole
              ? "Doctor registered successfully! Credentials sent to their email."
              : "Staff registered successfully! Credentials sent to their email.",
          {
            description: isEditMode
              ? "Redirecting to staff list..."
              : isDoctorRole
                ? "Redirecting to doctors list..."
                : "Redirecting to staff list...",
          }
        );
        router.push(isDoctorRole && !isEditMode ? "/doctors" : "/staffs");
      } else {
        toast.error(
          result.error ||
            (isEditMode ? "Failed to update staff" : "Failed to register")
        );
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const staffRoles: AppRole[] = [
    "Doctor",
    "Receptionist",
    "Nurse",
    "LabTechnician",
    "Pharmacist",
    "Accountant",
    "HR",
  ];
  const assignableRoles = actorRole === "HR" ? staffRoles.filter((staffRole) => staffRole !== "HR") : staffRoles;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {isEditMode && <input type="hidden" name="staff_id" value={staffId || ""} />}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={name}
            placeholder="John Doe"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            placeholder="staff@hospital.com"
            className="rounded-xl"
          />
          <p className="text-[11px] text-slate-500">
            Login credentials will be sent to this email.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            placeholder="+1 (555) 000-0000"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Staff Role</Label>
          <select
            id="role"
            name="role"
            defaultValue={role}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none md:text-sm dark:bg-input/30"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] || r}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor-specific fields — only shown when Doctor role is selected */}
        {isDoctorRole && !isEditMode && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="specialization">
                Specialization <span className="text-red-500">*</span>
              </Label>
              <Input
                id="specialization"
                name="specialization"
                placeholder="e.g. Cardiology, Neurology"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license_number">
                License Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="license_number"
                name="license_number"
                defaultValue={licenseNumber}
                placeholder="MD-884920"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Employment Type</Label>
              <select
                id="type"
                name="type"
                defaultValue="FullTime"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none md:text-sm dark:bg-input/30"
              >
                <option value="FullTime">Full Time</option>
                <option value="PartTime">Part Time</option>
                <option value="Consultant">Consultant</option>
                <option value="Visiting">Visiting</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="availability_status">Availability Status</Label>
              <select
                id="availability_status"
                name="availability_status"
                defaultValue=""
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none md:text-sm dark:bg-input/30"
              >
                <option value="">Select</option>
                <option value="Available">Available</option>
                <option value="On Break">On Break</option>
                <option value="In Surgery">In Surgery</option>
                <option value="OffDuty">Off Duty</option>
              </select>
            </div>
          </>
        )}

        {/* Non-doctor fields */}
        {!isDoctorRole && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                defaultValue={department}
                placeholder="e.g. Cardiology, OPD 204"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                name="license_number"
                defaultValue={licenseNumber}
                placeholder="LIC-884920"
                className="rounded-xl"
              />
            </div>
          </>
        )}

        {isDoctorRole && !isEditMode && (
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              defaultValue={department}
              placeholder="e.g. Cardiology, OPD 204"
              className="rounded-xl"
            />
          </div>
        )}

        {!isDoctorRole && (
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none md:text-sm dark:bg-input/30"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Dormant">Dormant</option>
            </select>
          </div>
        )}

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            name="address"
            defaultValue={address}
            placeholder="Office / Clinic address"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky-600 font-bold text-white hover:bg-sky-700"
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Staff"
              : isDoctorRole
                ? "Register Doctor"
                : "Register Staff"}
        </Button>
      </div>
    </form>
  );
}
