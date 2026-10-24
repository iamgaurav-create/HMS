import { LabSectionPlaceholder } from "@/components/laboratory/shared/lab-section-placeholder";

export const dynamic = "force-dynamic";

export default function LabHistoryPage() {
  return (
    <LabSectionPlaceholder
      title="Lab History"
      description="Completed and archived laboratory orders will be listed here."
    />
  );
}
