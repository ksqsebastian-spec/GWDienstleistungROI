import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { passcode } = await request.json();
  const valid = passcode === process.env.PASSCODE;
  return NextResponse.json({ valid });
}
