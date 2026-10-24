import { NextResponse } from "next/server";
import { clearSessionCookie, jsonOk } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await clearSessionCookie();
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }
  return jsonOk();
}
