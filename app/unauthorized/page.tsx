import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_HOME_PATH, ROLE_LABELS } from "@/lib/auth/roles";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{ from?: string; reason?: string }>;
};

export default async function UnauthorizedPage({ searchParams }: Props) {
  const params = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromSessionClaims(sessionClaims);

  const homeHref = role ? ROLE_HOME_PATH[role] : "/";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view this area of the hospital
            system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {params.reason === "missing_role" && (
            <p>
              Your account is signed in but no role is assigned. Contact an
              administrator or complete registration.
            </p>
          )}
          {params.from && (
            <p>
              Requested path:{" "}
              <span className="font-mono text-foreground">{params.from}</span>
            </p>
          )}
          {role && (
            <p>
              Your role:{" "}
              <span className="font-medium text-foreground">
                {ROLE_LABELS[role]}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={homeHref}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              {userId ? "Go to my workspace" : "Back to home"}
            </Link>
            {!userId && (
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Sign in
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
