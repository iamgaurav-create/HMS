import { redirect } from "next/navigation";

export default async function PharmacyPage() {
  redirect("/dashboard?role=Pharmacist");
}
