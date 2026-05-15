// Auth
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  is_mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

export type UserRole = "super_admin" | "tenant_admin" | "soc_manager" | "soc_analyst" | "read_only";

export interface LoginResponse {
  tokens?: TokenResponse;
  requires_mfa?: boolean;
  mfa_token?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Alerts
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "new" | "triaging" | "in_progress" | "escalated" | "resolved" | "false_positive" | "suppressed";
export type AlertSource = "siem" | "edr" | "firewall" | "ids_ips" | "email" | "cloud" | "manual" | "api";

export interface Alert {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  source: AlertSource;
  source_ref: string | null;
  risk_score: number;
  ai_summary: string | null;
  ai_recommendation: string | null;
  mitre_tactics: string[];
  mitre_techniques: { id: string; name: string }[];
  iocs: IOC[];
  is_ai_triaged: boolean;
  tags: string[];
  occurred_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// Incidents
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "contained" | "eradicated" | "recovering" | "closed" | "post_incident";
export type IncidentCategory = "malware" | "ransomware" | "phishing" | "data_breach" | "insider_threat" | "ddos" | "apt" | "unauthorized_access" | "supply_chain" | "other";

export interface Incident {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory | null;
  risk_score: number;
  ai_summary: string | null;
  attack_vector: string | null;
  business_impact: string | null;
  remediation_steps: RemediationStep[];
  mitre_attack_chain: MitreAttackChain;
  affected_assets: string[];
  iocs: IOC[];
  timeline: TimelineEvent[];
  tags: string[];
  sla_breach: boolean;
  sla_deadline: string | null;
  occurred_at: string | null;
  created_at: string;
  closed_at: string | null;
}

// Phishing
export type PhishingVerdict = "phishing" | "suspicious" | "clean" | "unknown";
export type PhishingStatus = "pending" | "analyzing" | "completed" | "failed";

export interface PhishingSubmission {
  id: string;
  verdict: PhishingVerdict;
  status: PhishingStatus;
  confidence_score: number;
  risk_score: number;
  ai_analysis: string | null;
  phishing_indicators: PhishingIndicator[];
  extracted_urls: string[];
  iocs: IOC[];
  header_analysis: Record<string, unknown>;
  spf_dkim_dmarc: Record<string, string>;
  url_scan_results: Record<string, unknown>;
  created_at: string;
  subject?: string;
  sender?: string;
}

// Shared types
export interface IOC {
  type: "ip" | "domain" | "hash" | "url" | "email";
  value: string;
  context?: string;
}

export interface RemediationStep {
  priority: number;
  action: string;
  rationale: string;
}

export interface MitreAttackChain {
  tactics?: string[];
  techniques?: { id: string; name: string; description?: string }[];
  kill_chain_phase?: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  added_by?: string;
}

export interface PhishingIndicator {
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

// Dashboard
export interface DashboardStats {
  total_alerts: number;
  new_alerts: number;
  critical_alerts: number;
  open_incidents: number;
  phishing_today: number;
  confirmed_phishing: number;
  alerts_this_week: number;
  as_of: string;
}

// Reports
export type ReportType = "executive_summary" | "incident_report" | "threat_intel" | "compliance" | "weekly" | "monthly";
export type ReportStatus = "generating" | "completed" | "failed";

export interface Report {
  id: string;
  title: string;
  report_type: ReportType;
  status: ReportStatus;
  period_start: string | null;
  period_end: string | null;
  content: Record<string, unknown>;
  ai_narrative: string | null;
  metrics: Record<string, unknown>;
  pdf_path: string | null;
  created_at: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}
