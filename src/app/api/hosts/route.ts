import "server-only";
import { NextResponse } from "next/server";
import { getHostSummaries } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getHostSummaries();
  return NextResponse.json(data, {
    headers: { "cache-control": "no-store" },
  });
}
