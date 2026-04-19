import { NextRequest, NextResponse } from "next/server";
import { detectApplicableExemptions } from "@/lib/demos/rural/reimbursement/exemption-db";

export async function GET(request: NextRequest) {
  const designations = request.nextUrl.searchParams.get("designations")?.split(",") || [];
  const payers = request.nextUrl.searchParams.get("payers")?.split(",");

  const exemptions = detectApplicableExemptions(designations, payers);
  return NextResponse.json({ exemptions, count: exemptions.length });
}
