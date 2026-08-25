import { redirect } from "next/navigation";

export default async function LabPage() {
  redirect("/dashboard?role=LabTechnician");
}
