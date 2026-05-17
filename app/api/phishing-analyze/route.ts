import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { caseId, content, subject, sender, urls } = await req.json();

    const analysisPrompt = `You are a phishing email analyst. Analyze this submission and return a JSON response only.

Subject: ${subject ?? "Unknown"}
Sender: ${sender ?? "Unknown"}
Content/URLs: ${content ?? urls?.join(", ") ?? "EML file uploaded"}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "verdict": "phishing" | "suspicious" | "clean" | "unknown",
  "confidence_score": 0.0-1.0,
  "risk_score": 0-100,
  "ai_analysis": "2-3 sentence analysis",
  "phishing_indicators": [
    {"type": "string", "description": "string", "severity": "high"|"medium"|"low"}
  ],
  "spf_dkim_dmarc": {
    "spf": "pass"|"fail"|"unknown",
    "dkim": "pass"|"fail"|"unknown",
    "dmarc": "pass"|"fail"|"unknown"
  }
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a cybersecurity expert specializing in phishing detection. Always respond with valid JSON only." },
          { role: "user", content: analysisPrompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    const aiData = await res.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "{}";

    let analysis: Record<string, unknown> = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = { verdict: "unknown", confidence_score: 0, risk_score: 0, ai_analysis: rawText };
    }

    await supabaseAdmin.from("phishing_cases").update({
      verdict: analysis.verdict ?? "unknown",
      confidence_score: analysis.confidence_score ?? 0,
      risk_score: analysis.risk_score ?? 0,
      ai_analysis: analysis.ai_analysis ?? null,
      phishing_indicators: analysis.phishing_indicators ?? [],
      spf_dkim_dmarc: analysis.spf_dkim_dmarc ?? {},
      status: "completed",
    }).eq("id", caseId);

    return NextResponse.json({ success: true, analysis });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
