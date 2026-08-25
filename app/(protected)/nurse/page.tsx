import { redirect } from "next/navigation";

export default async function NursePage() {
  redirect("/dashboard?role=Nurse");
}
