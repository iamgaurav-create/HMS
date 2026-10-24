"use client";

import { useRouter } from "next/navigation";
import { TestCatalogForm } from "@/components/laboratory/catalog/test-catalog-form";

export default function NewLabTestPage() {
  const router = useRouter();

  return (
    <TestCatalogForm
      onCancel={() => {
        router.push("/lab/catalog");
        router.refresh();
      }}
    />
  );
}
