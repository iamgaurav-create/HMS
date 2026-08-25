import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Welcome to <br />
            <span className="text-blue-700 text-4xl md:text-5xl">
              Gaurav Hospital
            </span>
          </h1>
        </div>
        <div className="max-w-xl text-center flex flex-col item-center justify-center">
          <p className="mb-6">
            We are dedicated to providing exceptional healthcare services and
            improving the well-being of our community.
          </p>
        </div>
        <div className="flex gap-3">
            <>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-medium rounded-xl shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  New Patient
                </Button>
              </Link>

              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base font-medium rounded-xl border-2 transition-all duration-300 hover:bg-blue-600 hover:text-primary-foreground  hover:scale-105"
                >
                  Login to Account
                </Button>
              </Link>
            </>
        </div>
      </div>
      <footer className="mb-4">
        <p className="text-center text-sm">
          &copy; 2026 Gaurav hospital management system. All right reserved
        </p>
      </footer>
    </div>
  );
}
