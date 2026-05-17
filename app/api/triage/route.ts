import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { alertId } = await req.json();

    const { data: alert } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    const prompt = `Analyze this security alert and provide a concise triage assessment:

Title: ${alert.title}
Severity: ${alert.severity}
Source: ${alert.source}
Description: ${alert.description ?? "N/A"}
Risk Score: ${alert.risk_score}

Provide:
1. A 2-3 sentence AI summary of the threat
2. Specific recommended actions (3-4 bullet points)
3. Risk assessment

Be concise and actionable.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a SOC analyst. Be concise and technical." },
          { role: "user", content: prompt },
        ],
        max_tokens: 512,
        temperature: 0.5,
      }),
    });

    const aiData = await res.json();
    const aiText = aiData.choices?.[0]?.message?.content ?? "";

    const lines = aiText.split("\n").filter(Boolean);
    const summary = lines.slice(0, 3).join(" ");
    const recommendation = lines.slice(3).join("\n") || "Review and escalate if needed.";

    await supabaseAdmin
      .from("alerts")
      .update({
        ai_summary: summary,
        ai_recommendation: recommendation,
        is_ai_triaged: true,
        status: "triaging",
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    return NextResponse.json({ success: true, ai_summary: summary, ai_recommendation: recommendation });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
