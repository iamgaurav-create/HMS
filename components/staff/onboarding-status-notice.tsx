"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resubmitStaffOnboardingAction } from "@/lib/actions/dashboard-actions";

export function OnboardingStatusNotice({ status, changeRequest, rejectionReason }: { status: string; changeRequest?: string | null; rejectionReason?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (status === "COMPLETED") return null;
  const resubmit = async () => {
    setLoading(true);
    const result = await resubmitStaffOnboardingAction();
    setLoading(false);
    if (result.success) { toast.success("Your onboarding has been resubmitted for HR review."); router.refresh(); }
    else toast.error(result.error || "Unable to resubmit onboarding.");
  };
  const message = status === "CHANGES_REQUESTED" ? changeRequest : status === "REJECTED" ? rejectionReason : "Complete your profile and required documents, then submit them for HR review.";
  return <div className="mx-auto mb-4 max-w-7xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="font-bold">Onboarding: {status.replaceAll("_", " ")}</p><p className="mt-1">{message}</p>{status === "CHANGES_REQUESTED" && <button type="button" disabled={loading} onClick={resubmit} className="mt-3 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-50">{loading ? "Submitting..." : "Resubmit for review"}</button>}</div>;
}
