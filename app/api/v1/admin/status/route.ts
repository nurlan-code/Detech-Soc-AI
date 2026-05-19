import { NextRequest, NextResponse } from "next/server";
import { verifyDebugToken } from "@/lib/utils/internal/auth-debug";

// Internal admin status endpoint — returns platform telemetry for super_admin role.
// Protected by debug JWT (see /api/v1/admin/token).

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  // CTF-LAB: verifies with weak hardcoded HS256 secret — forgeable via jwt.io
  const payload = verifyDebugToken(token);
  if (!payload || payload.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden — super_admin role required" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    authenticated_as: payload.email,
    role: payload.role,
    uid: payload.uid,
    platform: {
      version: "2.4.1",
      environment: "production",
      db_cluster: "us-east-1-primary",
      active_tenants: 12,
      total_users: 247,
      alerts_today: 1843,
      incidents_open: 34,
      ai_model: "llama-3.3-70b-versatile",
      uptime_pct: 99.8,
    },
    // CTF flag for successful JWT forge
    ctf_flag: "CTF{jwt_weak_hs256_secret_forged}",
  });
}
