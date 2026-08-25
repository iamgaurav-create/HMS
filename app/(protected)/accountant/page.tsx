import { redirect } from "next/navigation";

export default async function AccountantPage() {
  redirect("/dashboard?role=Accountant");
}
