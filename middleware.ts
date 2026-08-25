import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import {
  findRouteAccessViolation,
  isDashboardRoute,
  isPublicRoute,
  routeMatchers,
} from "@/lib/routes";

const isProtectedAppRoute = createRouteMatcher([
  "/admin(.*)",
  "/hr(.*)",
  "/hr/registration(.*)",
  "/doctor(.*)",
  "/patient(.*)",
  "/patient/registration(.*)",
  "/receptionist(.*)",
  "/nurse(.*)",
  "/lab(.*)",
  "/pharmacy(.*)",
  "/accountant(.*)",
  "/dashboard(.*)",
  "/patients(.*)",
  "/doctors(.*)",
  "/appointments(.*)",
  "/prescriptions(.*)",
  "/medical-records(.*)",
  "/laboratory(.*)",
  "/pharmacy(.*)",
  "/billing(.*)",
  "/inventory(.*)",
  "/reports(.*)",
  "/staffs(.*)",
  "/staff/change-password(.*)",
  "/settings(.*)",
  "/api/admin(.*)",
]);

const isPatientRegistrationRoute = createRouteMatcher(["/patient/registration(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (isPublicRoute(req)) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  if (!userId && isProtectedAppRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (!userId) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (isPatientRegistrationRoute(req)) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  if (isProtectedAppRoute(req) && !role && !isDashboardRoute(req) && !routeMatchers.patientPortal(req)) {
    const url = new URL("/unauthorized", req.url);
    url.searchParams.set("reason", "missing_role");
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute(req) && role) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  if (role) {
    const violation = findRouteAccessViolation(req, role);
    if (violation) {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("from", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", req.nextUrl.pathname);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
