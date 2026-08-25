import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import db from "@/lib/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn();
  }

  const role = sessionClaims?.metadata?.role;
  // Most protected routes do not need the Clerk user profile. Avoid a remote
  // Clerk API call for every dashboard navigation; only patient setup needs it.
  try {
    if (role === "patient") {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const user = await client.users.getUser(userId!);
      const email = user.emailAddresses[0]?.emailAddress;

      if (email) {
        const existingPatient = await db.patient.findUnique({
          where: { email },
        });

        if (!existingPatient) {
          const headersList = await headers();
          const pathname = headersList.get("x-pathname") || "";

          if (!pathname.startsWith("/patient/registration")) {
            redirect("/patient/registration");
          }
        }
      }
    }

    if (role === "patient") {
      const headersList = await headers();
      const pathname = headersList.get("x-pathname") || "";

      if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/patient/registration") && !pathname.startsWith("/patient/appointments")) {
        redirect("/dashboard/role/patient");
      }
    }

  } catch {
    // If layout guard fails (e.g. DB error), render children anyway
    // Individual pages will handle their own guards
  }

  return <div className="h-full w-full">{children}</div>;
}
