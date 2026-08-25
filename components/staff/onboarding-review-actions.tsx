"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reviewStaffOnboardingAction } from "@/lib/actions/dashboard-actions";

export function OnboardingReviewActions({ staffId, staffName }: { staffId: string; staffName: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"REQUEST_CHANGES" | "REJECT" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (choice: "APPROVE" | "REQUEST_CHANGES" | "REJECT") => {
    if (choice !== "APPROVE" && !reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    setLoading(true);
    const result = await reviewStaffOnboardingAction(staffId, choice, reason);
    setLoading(false);
    if (result.success) {
      toast.success(`Onboarding for ${staffName} has been ${choice === "APPROVE" ? "approved" : choice === "REJECT" ? "rejected" : "returned for changes"}.`);
      setDecision(null);
      setReason("");
      router.refresh();
    } else {
      toast.error(result.error || "Unable to review onboarding.");
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <button type="button" disabled={loading} onClick={() => submit("APPROVE")} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
        <button type="button" disabled={loading} onClick={() => setDecision("REQUEST_CHANGES")} className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50">Request changes</button>
        <button type="button" disabled={loading} onClick={() => setDecision("REJECT")} className="rounded-lg bg-red-100 px-2.5 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-200 disabled:opacity-50">Reject</button>
      </div>
      {decision && (
        <dialog open className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="fixed inset-0 bg-black/40" onClick={() => !loading && setDecision(null)} />
          <div className="relative z-10 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{decision === "REJECT" ? "Reject onboarding" : "Request onboarding changes"}</h3>
            <p className="mt-2 text-sm text-slate-500">A reason is required and will be visible to {staffName}.</p>
            <textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900" placeholder="Describe what needs attention..." />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={loading} onClick={() => setDecision(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button type="button" disabled={loading} onClick={() => submit(decision)} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{loading ? "Saving..." : "Confirm"}</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
