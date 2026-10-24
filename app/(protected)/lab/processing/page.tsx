import { LabSectionPlaceholder } from "@/components/laboratory/shared/lab-section-placeholder";

export const dynamic = "force-dynamic";

export default function LabProcessingPage() {
  return (
    <LabSectionPlaceholder
      title="Sample Processing"
      description="Samples that are currently being analysed will be listed here."
    />
  );
}
