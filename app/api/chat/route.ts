import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert SOC (Security Operations Center) analyst and cybersecurity assistant for Detech SOC AI platform. You help security teams with:
- Threat analysis and investigation
- Incident response procedures
- IOC (Indicators of Compromise) analysis
- MITRE ATT&CK framework mapping
- Malware analysis and containment
- Phishing detection and response
- Vulnerability assessment
- Security playbook creation

Be concise, technical, and actionable. Format responses with markdown when helpful. Focus on practical security guidance.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message ?? "Groq error" }, { status: 500 });
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content ?? "No response generated.";
    return NextResponse.json({ response });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
