import { redirect } from "next/navigation";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function DoctorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const doctor = await db.doctor.findFirst({
    where: { clerkUserId: userId },
    select: { mustChangePassword: true, onboardingCompleted: true },
  });

  if (doctor?.mustChangePassword) {
    redirect("/doctor/change-password");
  }

  redirect("/dashboard?role=Doctor");
}
