import { Pool } from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const get = (key: string) =>
  env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`))?.split("=").slice(1).join("=").replace(/^"|"$/g, "") ?? "";

const pool = new Pool({ connectionString: get("DATABASE_URL")! });

async function main() {
  const secret = get("CLERK_SECRET_KEY");
  const res = await fetch("https://api.clerk.com/v1/users?limit=100&order_by=-created_at", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!Array.isArray(data)) {
    console.log("clerk api response:", JSON.stringify(data).slice(0, 500));
    return;
  }

  const doctors = await pool.query(
    `SELECT id, "clerkUserId", name, email, status FROM "Doctor" ORDER BY "created_at" DESC`,
  );

  console.log("=== clerk users ===");
  for (const u of data) {
    const email = u.email_addresses?.[0]?.email_address ?? "";
    const match = doctors.rows.find(
      (d) => d.clerkUserId === u.id || d.id === u.id || d.email === email
    );
    console.log(
      `${u.id} | ${email} | role=${u.public_metadata?.role ?? "-"} | match=${
        match ? `${match.name} (clerkUserId=${match.clerkUserId})` : "NONE"
      }`
    );
  }

  console.log("\n=== doctor rows without a clerk match ===");
  for (const d of doctors.rows) {
    const match = data.find((u) => u.id === d.clerkUserId || u.id === d.id);
    if (!match) console.log(`${d.id} | clerkUserId=${d.clerkUserId} | ${d.name} | ${d.email}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
