"use client";

import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { registerPatientAction, updatePatientAction } from "@/lib/actions/dashboard-actions";

interface PatientRegistrationFormProps {
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdminMode?: boolean;
  isEditMode?: boolean;
  patientId?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  medical_conditions?: string;
  medical_history?: string;
  insurance_provider?: string;
}

export function PatientRegistrationForm({
  email = "",
  firstName = "",
  lastName = "",
  isAdminMode = false,
  isEditMode = false,
  patientId,
  phone = "",
  date_of_birth = "",
  gender = "",
  marital_status = "",
  blood_group = "",
  address: initialAddress = "",
  emergency_contact_name = "",
  emergency_contact_number = "",
  emergency_contact_relation = "",
  allergies = "",
  medical_conditions = "",
  medical_history = "",
  insurance_provider = "",
}: PatientRegistrationFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState(initialAddress);

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by your browser.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&namedetails=1`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to get address");
          }

          const data = await response.json();
          const locationAddress = data.address || {};

          const addressParts = [
            locationAddress.house_number,
            locationAddress.house_name,
            locationAddress.road,
            locationAddress.neighbourhood,
            locationAddress.suburb,
            locationAddress.city_district,
            locationAddress.district,
            locationAddress.municipality,
            locationAddress.village,
            locationAddress.town,
            locationAddress.city,
            locationAddress.county,
            locationAddress.state_district,
            locationAddress.state,
            locationAddress.postcode,
            locationAddress.country,
          ];

          const uniqueAddressParts = [
            ...new Set(
              addressParts.filter(
                (value): value is string =>
                  typeof value === "string" && value.trim().length > 0
              )
            ),
          ];

          const formattedAddress = uniqueAddressParts.join(", ");

          if (formattedAddress) {
            setAddress(formattedAddress);
            toast.success("Full address detected!", {
              description: formattedAddress,
            });
          } else if (data.display_name) {
            setAddress(data.display_name);
            toast.success("Location detected!", {
              description: data.display_name,
            });
          } else {
            toast.error("Address information is not available.");
          }
        } catch {
          toast.error("Unable to get your full address.", {
            description: "Please enter your address manually or try again.",
          });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied.", {
              description: "Please allow location access from your browser.",
            });
            break;

          case error.POSITION_UNAVAILABLE:
            toast.error("Location unavailable.", {
              description: "Please check your GPS, Wi-Fi, or mobile network.",
            });
            break;

          case error.TIMEOUT:
            toast.error("Location request timed out.", {
              description: "Please try again.",
            });
            break;

          default:
            toast.error("Unable to detect your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (isEditMode && patientId) {
      formData.set("patient_id", patientId);
    }

    const requiredFields = [
      ["first_name", "First Name"],
      ["last_name", "Last Name"],
      ["phone", "Phone Number"],
      ["date_of_birth", "Date of Birth"],
      ["gender", "Gender"],
      ["marital_status", "Marital Status"],
      ["address", "Address"],
      ["emergency_contact_name", "Emergency Contact Name"],
      ["emergency_contact_number", "Emergency Contact Phone"],
      ["emergency_contact_relation", "Emergency Contact Relation"],
    ];

    const missingFields = requiredFields
      .filter(([name]) => {
        const value = formData.get(name);
        return !value || String(value).trim() === "";
      })
      .map(([, label]) => label);

    const requiredConsents = [
      ["privacy_consent", "Privacy Policy Consent"],
      ["service_consent", "Medical Service Consent"],
      ["medical_consent", "Medical Records Consent"],
    ];

    const missingConsents = requiredConsents
      .filter(([name]) => !formData.get(name))
      .map(([, label]) => label);

    const missingItems = [
      ...missingFields,
      ...missingConsents,
    ];

    if (missingItems.length > 0) {
      if (missingItems.length === 1) {
        toast.error("Required field missing", {
          description: `${missingItems[0]} is required.`,
        });
      } else {
        toast.error("Please complete all required fields", {
          description: `${missingItems.length} required fields are missing.`,
        });
      }

      return;
    }

    setLoading(true);

    try {
      const action = isEditMode ? updatePatientAction : registerPatientAction;
      const result = await action(formData);

      if (result.success) {
        toast.success(isEditMode ? "Patient updated successfully!" : isAdminMode ? "Patient registered successfully!" : "Profile completed successfully!", {
          description: isEditMode ? "Redirecting to patients list..." : isAdminMode ? "Redirecting to patients list..." : "Redirecting to your patient portal...",
        });

        if (isEditMode || isAdminMode) {
          router.push("/patients");
        } else {
          router.push("/dashboard/role/patient");
        }
      } else {
        toast.error(result.error || (isEditMode ? "Failed to update patient" : "Failed to register patient"));
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <input type="hidden" name="patient_id" value={patientId || ""} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input id="first_name" name="first_name" defaultValue={firstName} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input id="last_name" name="last_name" defaultValue={lastName} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" defaultValue={email} readOnly={!isAdminMode} className={`rounded-xl ${isAdminMode ? "" : "bg-slate-100 dark:bg-slate-800"}`} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input id="phone" name="phone" type="number" defaultValue={phone} placeholder="+1 (555) 000-0000" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_of_birth">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={date_of_birth} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">
            Gender <span className="text-red-500">*</span>
          </Label>
          <select id="gender" name="gender" defaultValue={gender} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marital_status">
            Marital Status <span className="text-red-500">*</span>
          </Label>
          <select id="marital_status" name="marital_status" defaultValue={marital_status} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30">
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blood_group">Blood Group</Label>
          <select id="blood_group" name="blood_group" defaultValue={blood_group} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm dark:bg-input/30">
            <option value="">Select</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={locationLoading || loading} className="w-full rounded-lg border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700 sm:w-auto">
            <MapPin className="mr-2 h-4 w-4" />
            {locationLoading ? "Detecting Location..." : "Use My Current Location"}
          </Button>
        </div>
        <Textarea id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State, ZIP" className="min-h-[100px] rounded-xl" />
        <p className="text-xs text-slate-500 dark:text-slate-400">You can enter your address manually or use your current location.</p>
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Emergency Contact</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_name">
              Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={emergency_contact_name} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_number">
              Contact Phone <span className="text-red-500">*</span>
            </Label>
            <Input id="emergency_contact_number" name="emergency_contact_number" type="number" defaultValue={emergency_contact_number} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_relation">
              Relation <span className="text-red-500">*</span>
            </Label>
            <Input id="emergency_contact_relation" name="emergency_contact_relation" defaultValue={emergency_contact_relation} placeholder="e.g. Spouse, Parent" className="rounded-xl" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Medical Information</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="allergies">Allergies</Label>
            <Input id="allergies" name="allergies" defaultValue={allergies} placeholder="e.g. Penicillin, Peanuts" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medical_conditions">Medical Conditions</Label>
            <Input id="medical_conditions" name="medical_conditions" defaultValue={medical_conditions} placeholder="e.g. Diabetes, Hypertension" className="rounded-xl" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea id="medical_history" name="medical_history" defaultValue={medical_history} placeholder="Past surgeries, chronic illnesses, family history..." className="rounded-xl" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="insurance_provider">Insurance Provider</Label>
        <Input id="insurance_provider" name="insurance_provider" defaultValue={insurance_provider} placeholder="e.g. BlueCross, Aetna" className="rounded-xl" />
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Consents</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="privacy_consent" defaultChecked={isEditMode} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              I agree to the hospital&apos;s privacy policy and consent to the collection and processing of my personal health information.
              <span className="ml-1 text-red-500">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="service_consent" defaultChecked={isEditMode} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              I consent to receive medical services and treatments as recommended by the attending physicians.
              <span className="ml-1 text-red-500">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="medical_consent" defaultChecked={isEditMode} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              I authorize the sharing of my medical records with relevant healthcare providers for continuity of care.
              <span className="ml-1 text-red-500">*</span>
            </span>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl" disabled={loading || locationLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || locationLoading} className="rounded-xl bg-sky-600 font-bold text-white hover:bg-sky-700">
          {loading ? "Saving..." : isEditMode ? "Update Patient" : isAdminMode ? "Register Patient" : "Complete Registration"}
        </Button>
      </div>
    </form>
  );
}