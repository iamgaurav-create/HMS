"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { registerHRAction } from "@/lib/actions/dashboard-actions";

export function HRRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const requiredFields: [string, string][] = [
      ["name", "Full Name"],
      ["email", "Personal Email"],
      ["phone", "Phone Number"],
      ["address", "Address"],
    ];

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
      const result = await registerHRAction(formData);

      if (result.success) {
        toast.success("HR registered successfully!", {
          description: "Login credentials have been sent to the HR's personal email.",
        });
        router.push("/dashboard?role=admin");
      } else {
        toast.error(result.error || "Failed to register HR.");
        setLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Smith"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Personal Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            className="rounded-xl"
            required
          />
          <p className="text-xs text-slate-500">Login credentials will be sent to this email.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            placeholder="Human Resources"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            name="address"
            placeholder="Office address"
            className="rounded-xl"
            required
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
          className="rounded-xl bg-cyan-600 font-bold text-white hover:bg-cyan-700"
        >
          {loading ? "Registering..." : "Register HR"}
        </Button>
      </div>
    </form>
  );
}
