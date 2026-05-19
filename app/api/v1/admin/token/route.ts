import { NextRequest, NextResponse } from "next/server";
import { signDebugToken } from "@/lib/utils/internal/auth-debug";

// Debug token generator — QA / automation use only.
// Reference: lib/utils/internal/auth-debug.ts
// TODO: gate behind feature flag before next release

export async function GET(req: NextRequest) {
  // CTF-LAB: "auth check" is just a header — trivially bypassable
  const devMode = req.headers.get("x-dev-mode");
  if (devMode !== "1") {
    // Return 404-like response to obscure endpoint existence
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = signDebugToken({
    sub: "debug-user",
    role: "super_admin",
    uid: "dbg-internal-001",
    email: "debug@detech.internal",
    tenant: "ctf-lab",
  });

  return NextResponse.json({
    token,
    type: "Bearer",
    expires_in: 86400,
    note: "Use as Authorization: Bearer <token> against /api/v1/admin/status",
  });
}
