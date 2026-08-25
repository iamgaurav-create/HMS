"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { registerDoctorAction, updateDoctorAction } from "@/lib/actions/dashboard-actions";

interface DoctorRegistrationFormProps {
  doctorId?: string;
  email?: string;
  name?: string;
  specialization?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  department?: string;
  availabilityStatus?: string;
  type?: string;
  isEditMode?: boolean;
}

export function DoctorRegistrationForm({
  doctorId,
  email = "",
  name = "",
  specialization = "",
  licenseNumber = "",
  phone = "",
  address = "",
  department = "",
  availabilityStatus = "",
  type = "FullTime",
  isEditMode = false,
}: DoctorRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (isEditMode && doctorId) {
      formData.set("doctor_id", doctorId);
    }

    const requiredFields = [
      ["name", "Full Name"],
      ["email", "Email Address"],
      ["specialization", "Specialization"],
      ["license_number", "License Number"],
      ["phone", "Phone Number"],
      ["address", "Address"],
    ];

    const missingFields = requiredFields
      .filter(([name]) => {
        const value = formData.get(name);
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
      const action = isEditMode ? updateDoctorAction : registerDoctorAction;
      const result = await action(formData);

      if (result.success) {
        toast.success(isEditMode ? "Doctor updated successfully!" : "Doctor registered successfully!", {
          description: isEditMode ? "Redirecting to doctors list..." : "Redirecting to doctors list...",
        });
        router.push("/doctors");
      } else {
        toast.error(result.error || (isEditMode ? "Failed to update doctor" : "Failed to register doctor"));
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {isEditMode && <input type="hidden" name="doctor_id" value={doctorId || ""} />}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input id="name" name="name" defaultValue={name} placeholder="Dr. John Smith" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input id="email" name="email" type="email" defaultValue={email} placeholder="doctor@hospital.com" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input id="phone" name="phone" type="tel" defaultValue={phone} placeholder="+1 (555) 000-0000" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialization">
            Specialization <span className="text-red-500">*</span>
          </Label>
          <Input id="specialization" name="specialization" defaultValue={specialization} placeholder="e.g. Cardiology, Neurology" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="license_number">
            License Number <span className="text-red-500">*</span>
          </Label>
          <Input id="license_number" name="license_number" defaultValue={licenseNumber} placeholder="MD-884920" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" defaultValue={department} placeholder="e.g. Cardiology, OPD 204" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Employment Type</Label>
          <select id="type" name="type" defaultValue={type} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30">
            <option value="FullTime">Full Time</option>
            <option value="PartTime">Part Time</option>
            <option value="Consultant">Consultant</option>
            <option value="Visiting">Visiting</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability_status">Availability Status</Label>
          <select id="availability_status" name="availability_status" defaultValue={availabilityStatus} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30">
            <option value="">Select</option>
            <option value="Available">Available</option>
            <option value="On Break">On Break</option>
            <option value="In Surgery">In Surgery</option>
            <option value="OffDuty">Off Duty</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea id="address" name="address" defaultValue={address} placeholder="Clinic / Hospital address" className="rounded-xl" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700">
          {loading ? "Saving..." : isEditMode ? "Update Doctor" : "Register Doctor"}
        </Button>
      </div>
    </form>
  );
}
