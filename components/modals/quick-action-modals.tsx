"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus, Calendar, CreditCard, HeartPulse, Pill, FlaskConical } from "lucide-react";

export type ModalType =
  | "register_patient"
  | "book_appointment"
  | "add_doctor"
  | "generate_bill"
  | "record_vitals"
  | "dispense_medicine"
  | "upload_lab"
  | null;

interface QuickActionModalsProps {
  activeModal: ModalType;
  onClose: () => void;
}

export function QuickActionModals({ activeModal, onClose }: QuickActionModalsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (actionName: string, formData: FormData, action: (formData: FormData) => Promise<{ success: boolean; error?: string }>) => {
    setLoading(true);
    try {
      const result = await action(formData);
      if (result.success) {
        toast.success(`${actionName} successful!`, {
          description: "Credentials sent to staff email.",
        });
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${actionName.toLowerCase()}`);
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!activeModal) return null;

  return (
    <Dialog open={!!activeModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl glass-card">
        {activeModal === "register_patient" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
                <UserPlus className="h-5 w-5" /> Register New Patient
              </DialogTitle>
              <DialogDescription>
                Create a new electronic health record for the patient.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" placeholder="John" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" placeholder="Doe" className="mt-1 rounded-xl" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="patient@example.com" className="mt-1 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" className="mt-1 rounded-xl" />
                </div>
              </div>
              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input id="emergency" placeholder="Contact Name & Number" className="mt-1 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={() => handleFormSubmit("Patient Registration", new FormData(), async () => ({ success: true }))} disabled={loading} className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold">
                {loading ? "Registering..." : "Register Patient"}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeModal === "generate_bill" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" /> Generate Billing Invoice
              </DialogTitle>
              <DialogDescription>
                Create financial charge for consultation or treatment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="bpatient">Patient Name</Label>
                <Input id="bpatient" placeholder="Arthur Pendelton" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="service">Medical Service / Item</Label>
                <Input id="service" placeholder="Cardiology OPD & ECG Scan" className="mt-1 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amount">Total Amount ($)</Label>
                  <Input id="amount" type="number" placeholder="850.00" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="discount">Discount ($)</Label>
                  <Input id="discount" type="number" placeholder="0.00" className="mt-1 rounded-xl" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={() => handleFormSubmit("Billing Invoice", new FormData(), async () => ({ success: true }))} disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {loading ? "Generating..." : "Generate Invoice"}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeModal === "record_vitals" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <HeartPulse className="h-5 w-5" /> Record Patient Vitals
              </DialogTitle>
              <DialogDescription>
                Log temperature, blood pressure, heart rate for ward patient.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="vbed">Ward / Bed Number</Label>
                <Input id="vbed" placeholder="ICU Bed #02" className="mt-1 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                  <Input id="bp" placeholder="120/80" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="hr">Heart Rate (bpm)</Label>
                  <Input id="hr" placeholder="75" className="mt-1 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="temp">Temperature (°F)</Label>
                  <Input id="temp" placeholder="98.6" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
                  <Input id="spo2" placeholder="99" className="mt-1 rounded-xl" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={() => handleFormSubmit("Vitals Entry", new FormData(), async () => ({ success: true }))} disabled={loading} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">
                {loading ? "Saving..." : "Save Vitals"}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeModal === "dispense_medicine" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Pill className="h-5 w-5" /> Dispense Prescription
              </DialogTitle>
              <DialogDescription>
                Fulfill pharmaceutical order for patient.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="rxno">Prescription #</Label>
                <Input id="rxno" placeholder="RX-2026-904" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="medname">Medicine Name & Quantity</Label>
                <Input id="medname" placeholder="Amoxicillin 500mg (20 Units)" className="mt-1 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={() => handleFormSubmit("Medicine Dispense", new FormData(), async () => ({ success: true }))} disabled={loading} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {loading ? "Dispensing..." : "Confirm Dispense"}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeModal === "upload_lab" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <FlaskConical className="h-5 w-5" /> Upload Lab Test Report
              </DialogTitle>
              <DialogDescription>
                Attach diagnostic result for doctor review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="labid">Test Order ID</Label>
                <Input id="labid" placeholder="LAB-401" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="result">Diagnostic Result / Summary</Label>
                <Textarea id="result" placeholder="Hemoglobin level 14.2 g/dL - Within normal limits..." className="mt-1 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button onClick={() => handleFormSubmit("Lab Report Upload", new FormData(), async () => ({ success: true }))} disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {loading ? "Uploading..." : "Publish Report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
