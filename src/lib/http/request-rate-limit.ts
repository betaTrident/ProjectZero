import type { NextRequest } from "next/server";

const rateMap = new Map<string, number>();

export function getClientFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

export function isRateLimited(key: string, windowMs: number, now = Date.now()) {
  pruneRateMap(windowMs, now);

  const lastRequest = rateMap.get(key) ?? 0;
  if (now - lastRequest < windowMs) {
    return true;
  }

  rateMap.set(key, now);
  return false;
}

function pruneRateMap(windowMs: number, now: number) {
  for (const [rateLimitKey, lastRequest] of rateMap.entries()) {
    if (now - lastRequest >= windowMs) {
      rateMap.delete(rateLimitKey);
    }
  }
}

export function resetRateLimitStoreForTests() {
  rateMap.clear();
}
