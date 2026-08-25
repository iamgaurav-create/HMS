import { redirect } from "next/navigation";

export default async function ReceptionistPage() {
  redirect("/dashboard?role=Receptionist");
}
