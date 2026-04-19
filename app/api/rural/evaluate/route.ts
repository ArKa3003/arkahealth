import { NextRequest, NextResponse } from "next/server";
import { evaluateRAAS } from "@/lib/demos/rural/scoring/raas-engine";
import type { RAASInput } from "@/lib/demos/rural/types";

export async function POST(request: NextRequest) {
  try {
    const body: RAASInput = await request.json();
    const result = evaluateRAAS(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Evaluation failed", details: String(error) },
      { status: 500 }
    );
  }
}
