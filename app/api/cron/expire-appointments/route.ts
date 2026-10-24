import { NextResponse } from "next/server";
import { expireElapsedAppointments } from "@/lib/db/appointment-expiry";

export const dynamic = "force-dynamic";

/**
 * Rejects appointment requests whose booked date/time has passed.
 *
 * The sweep also runs on every appointment/dashboard read, so this endpoint is
 * only needed to keep the database clean while nobody is looking at the app.
 * Call it from a platform scheduler (Vercel Cron, GitHub Actions, etc.) with
 * header: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");

  if (secret && provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rejected = await expireElapsedAppointments();
    return NextResponse.json({ ok: true, rejected });
  } catch (error) {
    console.error("[appointment expiry]", error);
    return NextResponse.json(
      { error: "Failed to expire elapsed appointments" },
      { status: 500 }
    );
  }
}