import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const get = (key: string) =>
  env
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`))
    ?.split("=")
    .slice(1)
    .join("=")
    .replace(/^"|"$/g, "") ?? "";

async function main() {
  const secret = get("CLERK_SECRET_KEY");
  const userId = process.argv[2];

  const res = await fetch("https://api.clerk.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });
  const data: any = await res.json();
  const sessionId = data.id;

  const tokenRes = await fetch(
    `https://api.clerk.com/v1/sessions/${sessionId}/tokens?expires_in_seconds=3600`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    }
  );
  const tokenData: any = await tokenRes.json();
  writeFileSync(".tmp-jwt.txt", tokenData.jwt, "utf8");
  console.log("written .tmp-jwt.txt");
}

main();
