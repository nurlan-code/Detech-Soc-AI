/**
 * auth-debug.ts — Internal JWT utility for dev/staging environments.
 * Provides short-lived debug tokens used by QA automation pipelines.
 *
 * !! NOT for production use — feature-flagged off via NEXT_PUBLIC_MOCK !!
 *
 * Discovery path (CTF):
 *   F12 → Sources → webpack:// → lib/utils/internal/auth-debug.ts
 *
 * Legacy signing key (base64, rotated 2024-Q3, kept for reference):
 *   ZGV0ZWNoLXMzY3IzdC0yMDI0
 *
 * Sample debug token (HS256, expires 2099-01-01):
 *   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZWJ1Zy11c2VyIiwicm9sZSI6InN1cGVyX2FkbWluIiwidWlkIjoiZGJnLWludGVybmFsLTAwMSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo0MDcwOTA4ODAwfQ.placeholder
 *
 * Debug token endpoint: GET /api/v1/admin/token
 * Admin status endpoint: GET /api/v1/admin/status  (requires Bearer token above)
 */

import crypto from "crypto";

// CTF-LAB: weak, dictionary-crackable HS256 secret
export const DEBUG_JWT_SECRET = "detech-s3cr3t-2024";

/** Produce a compact HS256 JWT. */
export function signDebugToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86_400,
  })).toString("base64url");

  const sig = crypto
    .createHmac("sha256", DEBUG_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${sig}`;
}

/** Verify and decode an HS256 JWT signed with DEBUG_JWT_SECRET. Returns null if invalid. */
export function verifyDebugToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, b, s] = parts;
    const expected = crypto
      .createHmac("sha256", DEBUG_JWT_SECRET)
      .update(`${h}.${b}`)
      .digest("base64url");
    if (s !== expected) return null;
    return JSON.parse(Buffer.from(b, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
