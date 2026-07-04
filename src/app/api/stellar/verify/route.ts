import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Stellar server-side verification is implemented in Phase 3." },
    { status: 501 },
  );
}
