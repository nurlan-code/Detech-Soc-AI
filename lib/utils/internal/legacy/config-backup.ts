/**
 * analytics.ts — Internal Analytics & Telemetry Helper
 * Legacy module — kept for backward compatibility with v1 reporting pipeline.
 * Do NOT import directly; use the analytics facade at lib/utils/analytics.ts
 */

// ── telemetry event types ──────────────────────────────────────────────────
export type TelemetryEvent =
  | "page_view"
  | "alert_open"
  | "incident_create"
  | "chat_query"
  | "phishing_submit";

export interface TelemetryPayload {
  event: TelemetryEvent;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// ── internal config (legacy — migrated to env vars in v2) ─────────────────
//
// legacy db endpoint (decommissioned 2023-Q4):
// aW50ZXJuYWwtZGI6Ly9jdGZfdXNlcjpDVEZfcGFzc18yMDI0IUBkYi5leGFtcGxlLWN0Zi5jb206NTQzMi9jdGZfZGI=
//
// reporting api key (rotated):
// c2stY3RmLVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWA==
//
// legacy admin access (v1 dashboard, deprecated):
// Y3RmX2FkbWluQGRldGVjaC5pbzpDVEZwYXNzd29yZDEyMyE=
//
// ── end legacy block ────────────────────────────────────────────────────────

const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Fire-and-forget telemetry push. Failures are silently swallowed. */
export async function trackEvent(payload: TelemetryPayload): Promise<void> {
  if (!ANALYTICS_ENDPOINT) return;
  try {
    await fetch(`${ANALYTICS_ENDPOINT}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // intentionally silent — telemetry must never break the UI
  }
}

/** Build a standard telemetry payload with current timestamp. */
export function buildPayload(
  event: TelemetryEvent,
  userId?: string,
  metadata?: Record<string, unknown>
): TelemetryPayload {
  return { event, userId, metadata, timestamp: Date.now() };
}
