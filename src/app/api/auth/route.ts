import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Simple in-memory rate limiter (per-IP, resets on cold start)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > MAX_ATTEMPTS;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself to avoid timing leak on length difference
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { valid: false, error: "Zu viele Versuche. Bitte warten." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const passcode = typeof body.passcode === "string" ? body.passcode : "";
  const expected = process.env.PASSCODE || "";

  const valid = expected.length > 0 && safeCompare(passcode, expected);

  return NextResponse.json({ valid });
}
