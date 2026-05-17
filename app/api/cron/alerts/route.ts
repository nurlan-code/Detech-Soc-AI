import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEMPLATES = [
  { title: "Suspicious PowerShell Execution Detected", severity: "critical", source: "edr", risk_score: 92, description: "Encoded PowerShell command executed on WORKSTATION-07. Possible fileless malware." },
  { title: "Brute Force Login Attempt", severity: "high", source: "firewall", risk_score: 76, description: "247 failed SSH login attempts from IP 185.220.101.47 in last 5 minutes." },
  { title: "Lateral Movement Detected", severity: "critical", source: "siem", risk_score: 95, description: "Abnormal SMB traffic between internal hosts. Possible credential dumping via Mimikatz." },
  { title: "Phishing Email Campaign Detected", severity: "high", source: "email", risk_score: 78, description: "Mass phishing campaign targeting finance department. 14 emails with malicious attachment." },
  { title: "Data Exfiltration Attempt", severity: "critical", source: "ids_ips", risk_score: 98, description: "Large outbound data transfer (4.2GB) to external IP 45.33.32.156 via port 443." },
  { title: "Ransomware Behavioral Pattern", severity: "critical", source: "edr", risk_score: 99, description: "Mass file encryption activity detected on FILE-SERVER-01. Possible LockBit 3.0 variant." },
  { title: "Suspicious DNS Queries", severity: "medium", source: "siem", risk_score: 58, description: "High volume of DNS queries to recently registered domain. Possible C2 beaconing." },
  { title: "Privilege Escalation Attempt", severity: "high", source: "edr", risk_score: 82, description: "Attempt to add user to Domain Admins group from non-admin account on DC-01." },
  { title: "Port Scan from Internal Host", severity: "medium", source: "ids_ips", risk_score: 55, description: "Internal IP 10.0.4.22 performing nmap-style scan across /24 subnet." },
  { title: "Credential Stuffing Attack", severity: "high", source: "firewall", risk_score: 74, description: "2,400 login attempts with previously breached credentials against VPN portal." },
  { title: "Malware Download Blocked", severity: "medium", source: "firewall", risk_score: 61, description: "Endpoint attempted to download known malware payload. Blocked by proxy. User: jsmith." },
  { title: "Unauthorized Cloud Storage Access", severity: "high", source: "cloud", risk_score: 80, description: "S3 bucket accessed from unrecognized IP in Romania. 3,200 files downloaded." },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

  const { error } = await supabaseAdmin.from("alerts").insert([{
    ...template,
    status: "new",
    is_ai_triaged: false,
    mitre_tactics: [],
    mitre_techniques: [],
    iocs: [],
    tags: [],
    created_at: new Date().toISOString(),
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify for critical alerts
  if (template.severity === "critical") {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://detech-soc-ai-vcr9.vercel.app"}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: template.title, severity: template.severity, description: template.description }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, alert: template.title });
}
