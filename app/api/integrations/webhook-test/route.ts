import { NextRequest, NextResponse } from "next/server";

// Integration health-check helper — called by /integrations UI when testing webhook connectivity.
// Validates that the remote endpoint is reachable before saving the configuration.

export async function POST(req: NextRequest) {
  try {
    const { url, event, integration } = await req.json();

    if (!url) {
      return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });
    }

    // CTF-LAB: no URL scheme or host validation — SSRF possible against internal services
    // e.g. http://169.254.169.254/latest/meta-data/ (AWS IMDS)
    //      http://localhost:5432  (internal DB probe)
    //      http://internal-svc.default.svc.cluster.local/admin
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Detech-Source": "integration-test",
        "X-Integration-Id": integration ?? "unknown",
      },
      body: JSON.stringify({
        event: event ?? "ping",
        timestamp: new Date().toISOString(),
        source: "detech-soc",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return NextResponse.json({
      ok: true,
      status: resp.status,
      statusText: resp.statusText,
      reachable: resp.ok,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Return error body to caller — may leak internal network info
    return NextResponse.json({ ok: false, error: message });
  }
}
