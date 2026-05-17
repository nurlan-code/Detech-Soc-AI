import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, severity, description } = await req.json();

    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL ?? "admin@detech.io";

    if (!resendKey) {
      // Resend not configured — skip silently
      return NextResponse.json({ success: false, reason: "RESEND_API_KEY not set" });
    }

    const severityColors: Record<string, string> = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e",
    };
    const color = severityColors[severity] ?? "#3b82f6";

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #080c14; color: #e2e8f0; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #0d1117; border: 1px solid #1f2937; border-radius: 12px; padding: 28px;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
      <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></div>
      <h2 style="margin: 0; color: white; font-size: 18px;">🚨 Detech SOC AI — ${severity.toUpperCase()} Alert</h2>
    </div>
    <div style="background: ${color}15; border: 1px solid ${color}40; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0 0 8px; font-weight: bold; color: ${color}; font-size: 15px;">${title}</p>
      <p style="margin: 0; color: #94a3b8; font-size: 13px;">${description}</p>
    </div>
    <p style="color: #64748b; font-size: 12px; margin: 0;">
      This alert requires immediate attention. Log in to your SOC platform to investigate.
    </p>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #1f2937;">
      <a href="https://detech-soc-ai-vcr9.vercel.app/alerts"
         style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
        View in SOC Platform →
      </a>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Detech SOC AI <onboarding@resend.dev>",
        to: [notifyEmail],
        subject: `🚨 [${severity.toUpperCase()}] ${title}`,
        html,
      }),
    });

    const emailData = await emailRes.json();
    return NextResponse.json({ success: emailRes.ok, data: emailData });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
