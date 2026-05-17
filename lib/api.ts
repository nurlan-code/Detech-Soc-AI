import {
  MOCK_USER, MOCK_ALERTS, MOCK_INCIDENTS, MOCK_PHISHING, MOCK_REPORTS,
  MOCK_STATS, MOCK_TREND, MOCK_SEVERITY_DIST, MOCK_ACTIVITY, MOCK_AUDIT_LOGS,
  MOCK_TOP_MITRE, MOCK_TOP_ASSETS, MOCK_TOP_USERS, MOCK_EXTENDED_STATS,
  generateMockAIResponse,
} from "./mockData";
import { supabase } from "./supabase";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";

// ── Mock helpers ─────────────────────────────────────────────────────────────
function mockOk<T>(data: T, delay = 350): Promise<{ data: T }> {
  return new Promise((res) => setTimeout(() => res({ data }), delay));
}

function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(items.length / pageSize),
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = USE_MOCK
  ? {
      login: (email: string, password: string) => {
        if (email === "admin@detech.io" && password === "Admin1234!") {
          return mockOk({ tokens: { access_token: "mock-token", refresh_token: "mock-refresh", token_type: "bearer", expires_in: 1800 }, requires_mfa: false });
        }
        return Promise.reject({ response: { data: { detail: "Invalid credentials" } } });
      },
      me: () => mockOk(MOCK_USER, 150),
      logout: () => mockOk({ success: true }),
      refresh: (_rt: string) => mockOk({ access_token: "mock-token" }),
      verifyMfa: (_token: string, _code: string) => mockOk({ access_token: "mock-token", refresh_token: "mock-refresh" }),
      setupMfa: () => mockOk({ otpauth_url: "", secret: "MOCK" }),
      enableMfa: (_code: string) => mockOk({ success: true }),
    }
  : {
      login: () => Promise.resolve({ data: null }),
      me: () => Promise.resolve({ data: MOCK_USER }),
      logout: () => Promise.resolve({ data: null }),
      refresh: (_rt: string) => Promise.resolve({ data: null }),
      verifyMfa: (_token: string, _code: string) => Promise.resolve({ data: null }),
      setupMfa: () => Promise.resolve({ data: null }),
      enableMfa: (_code: string) => Promise.resolve({ data: null }),
    };

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi: {
  getStats: () => Promise<{ data: any }>;
  getAlertTrend: (days?: number) => Promise<{ data: any }>;
  getSeverityDistribution: () => Promise<{ data: any }>;
  getMitreHeatmap: () => Promise<{ data: any }>;
  getTopIocs: (limit?: number) => Promise<{ data: any }>;
  getRecentActivity: (limit?: number) => Promise<{ data: any }>;
  getTopAssets: (limit?: number) => Promise<{ data: any }>;
  getTopUsers: (limit?: number) => Promise<{ data: any }>;
  getExtendedStats: () => Promise<{ data: any }>;
} = USE_MOCK
  ? {
      getStats: () => mockOk(MOCK_STATS),
      getAlertTrend: () => mockOk(MOCK_TREND),
      getSeverityDistribution: () => mockOk(MOCK_SEVERITY_DIST),
      getMitreHeatmap: () => mockOk(MOCK_TOP_MITRE),
      getTopIocs: (_limit = 10) => mockOk(MOCK_ALERTS.flatMap((a) => a.iocs).slice(0, _limit)),
      getRecentActivity: () => mockOk(MOCK_ACTIVITY),
      getTopAssets: () => mockOk(MOCK_TOP_ASSETS),
      getTopUsers: () => mockOk(MOCK_TOP_USERS),
      getExtendedStats: () => mockOk(MOCK_EXTENDED_STATS),
    }
  : {
      getStats: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [{ data: alerts }, { data: incidents }, { data: phishing }] = await Promise.all([
          supabase.from("alerts").select("severity, status, created_at"),
          supabase.from("incidents").select("status"),
          supabase.from("phishing_cases").select("verdict, created_at"),
        ]);
        const a = alerts ?? [], inc = incidents ?? [], ph = phishing ?? [];
        return {
          data: {
            total_alerts: a.length,
            new_alerts: a.filter((x) => x.status === "new").length,
            critical_alerts: a.filter((x) => x.severity === "critical").length,
            open_incidents: inc.filter((x) => x.status !== "closed").length,
            phishing_today: ph.filter((x) => x.created_at?.startsWith(today)).length,
            confirmed_phishing: ph.filter((x) => x.verdict === "phishing").length,
            alerts_this_week: a.filter((x) => x.created_at >= weekAgo).length,
            as_of: new Date().toISOString(),
          },
        };
      },
      getAlertTrend: async () => {
        const { data } = await supabase.from("alerts").select("created_at, severity").order("created_at");
        const days: Record<string, { date: string; count: number; critical: number; high: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          days[d] = { date: d, count: 0, critical: 0, high: 0 };
        }
        (data ?? []).forEach((a) => {
          const d = a.created_at?.slice(0, 10);
          if (d && days[d]) {
            days[d].count++;
            if (a.severity === "critical") days[d].critical++;
            if (a.severity === "high") days[d].high++;
          }
        });
        return { data: Object.values(days) };
      },
      getSeverityDistribution: async () => {
        const { data } = await supabase.from("alerts").select("severity");
        const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        (data ?? []).forEach((a) => { if (a.severity in counts) counts[a.severity]++; });
        const colors: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e", info: "#3b82f6" };
        return { data: Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, color: colors[name] })) };
      },
      getMitreHeatmap: () => mockOk(MOCK_TOP_MITRE),
      getTopIocs: async (limit = 10) => {
        const { data } = await supabase.from("alerts").select("iocs").limit(20);
        const iocs = (data ?? []).flatMap((a) => (Array.isArray(a.iocs) ? a.iocs : [])).slice(0, limit);
        return { data: iocs.length > 0 ? iocs : MOCK_ALERTS.flatMap((a) => a.iocs).slice(0, limit) };
      },
      getRecentActivity: async (limit = 8) => {
        const { data: alerts } = await supabase.from("alerts").select("id, title, severity, created_at").order("created_at", { ascending: false }).limit(limit);
        if (!alerts?.length) return { data: MOCK_ACTIVITY };
        return {
          data: alerts.map((a) => ({
            type: "alert",
            message: a.title,
            severity: a.severity,
            timestamp: a.created_at,
          })),
        };
      },
      getTopAssets: () => mockOk(MOCK_TOP_ASSETS),
      getTopUsers: () => mockOk(MOCK_TOP_USERS),
      getExtendedStats: () => mockOk(MOCK_EXTENDED_STATS),
    };

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => {
        let items = [...MOCK_ALERTS];
        if (params?.search) items = items.filter((a) => a.title.toLowerCase().includes(String(params.search).toLowerCase()));
        if (params?.severity) items = items.filter((a) => a.severity === params.severity);
        if (params?.status) items = items.filter((a) => a.status === params.status);
        if (params?.source) items = items.filter((a) => a.source === params.source);
        return mockOk(paginate(items, Number(params?.page ?? 1), Number(params?.page_size ?? 25)));
      },
      get: (id: string) => mockOk(MOCK_ALERTS.find((a) => a.id === id) ?? MOCK_ALERTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_ALERTS[0], ...(data as object), id: `alrt_${Date.now()}`, created_at: new Date().toISOString() }),
      update: (id: string, data: unknown) => mockOk({ ...MOCK_ALERTS.find((a) => a.id === id), ...(data as object) }),
      triage: (_id: string) => mockOk({ queued: true }, 600),
      escalate: (_id: string) => mockOk({ success: true }),
      delete: (_id: string) => mockOk({ success: true }),
    }
  : {
      list: async (params?: Record<string, unknown>) => {
        const page = Number(params?.page ?? 1);
        const pageSize = Number(params?.page_size ?? 25);
        const from = (page - 1) * pageSize;

        let query = supabase.from("alerts").select("*", { count: "exact" }).order("created_at", { ascending: false });
        if (params?.severity) query = query.eq("severity", String(params.severity));
        if (params?.status) query = query.eq("status", String(params.status));
        if (params?.source) query = query.eq("source", String(params.source));
        if (params?.search) query = query.ilike("title", `%${params.search}%`);
        query = query.range(from, from + pageSize - 1);

        const { data, count, error } = await query;
        if (error) throw error;
        return { data: { items: data ?? [], total: count ?? 0, page, page_size: pageSize, total_pages: Math.ceil((count ?? 0) / pageSize) } };
      },
      get: async (id: string) => {
        const { data, error } = await supabase.from("alerts").select("*").eq("id", id).single();
        if (error) throw error;
        return { data };
      },
      create: async (data: unknown) => {
        const { data: created, error } = await supabase.from("alerts").insert([data as object]).select().single();
        if (error) throw error;
        return { data: created };
      },
      update: async (id: string, data: unknown) => {
        const { data: updated, error } = await supabase.from("alerts").update({ ...(data as object), updated_at: new Date().toISOString() }).eq("id", id).select().single();
        if (error) throw error;
        return { data: updated };
      },
      triage: async (id: string) => {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId: id }),
        });
        return { data: await res.json() };
      },
      escalate: async (id: string) => {
        const { error } = await supabase.from("alerts").update({ status: "escalated", updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        return { data: { success: true } };
      },
      delete: async (id: string) => {
        const { error } = await supabase.from("alerts").delete().eq("id", id);
        if (error) throw error;
        return { data: { success: true } };
      },
    };

// ── Incidents ─────────────────────────────────────────────────────────────────
export const incidentsApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_INCIDENTS, Number(params?.page ?? 1), 20)),
      get: (id: string) => mockOk(MOCK_INCIDENTS.find((i) => i.id === id) ?? MOCK_INCIDENTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_INCIDENTS[0], ...(data as object), id: `inc_${Date.now()}`, created_at: new Date().toISOString() }),
      update: (id: string, data: unknown) => mockOk({ ...MOCK_INCIDENTS.find((i) => i.id === id), ...(data as object) }),
      addTimeline: (_id: string, event: unknown) => mockOk({ success: true, event }),
      close: (_id: string) => mockOk({ success: true }),
    }
  : {
      list: async (params?: Record<string, unknown>) => {
        const page = Number(params?.page ?? 1);
        const pageSize = Number(params?.page_size ?? 20);
        const from = (page - 1) * pageSize;

        let query = supabase.from("incidents").select("*", { count: "exact" }).order("created_at", { ascending: false });
        if (params?.severity) query = query.eq("severity", String(params.severity));
        if (params?.status) query = query.eq("status", String(params.status));
        query = query.range(from, from + pageSize - 1);

        const { data, count, error } = await query;
        if (error) throw error;
        return { data: { items: data ?? [], total: count ?? 0, page, page_size: pageSize, total_pages: Math.ceil((count ?? 0) / pageSize) } };
      },
      get: async (id: string) => {
        const { data, error } = await supabase.from("incidents").select("*").eq("id", id).single();
        if (error) throw error;
        return { data };
      },
      create: async (data: unknown) => {
        const { data: created, error } = await supabase.from("incidents").insert([data as object]).select().single();
        if (error) throw error;
        return { data: created };
      },
      update: async (id: string, data: unknown) => {
        const { data: updated, error } = await supabase.from("incidents").update({ ...(data as object) }).eq("id", id).select().single();
        if (error) throw error;
        return { data: updated };
      },
      addTimeline: async (id: string, event: unknown) => {
        const { data: inc } = await supabase.from("incidents").select("timeline").eq("id", id).single();
        const current = Array.isArray(inc?.timeline) ? inc.timeline : [];
        const { error } = await supabase.from("incidents").update({ timeline: [...current, event] }).eq("id", id);
        if (error) throw error;
        return { data: { success: true } };
      },
      close: async (id: string) => {
        const { error } = await supabase.from("incidents").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        return { data: { success: true } };
      },
    };

// ── Phishing ──────────────────────────────────────────────────────────────────
export const phishingApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_PHISHING, Number(params?.page ?? 1), 20)),
      get: (id: string) => mockOk(MOCK_PHISHING.find((p) => p.id === id) ?? MOCK_PHISHING[0]),
      submit: (data: unknown) => mockOk({ ...MOCK_PHISHING[0], ...(data as object), id: `ph_${Date.now()}`, status: "analyzing", created_at: new Date().toISOString() }, 800),
      uploadEml: (_file: File) => mockOk({ ...MOCK_PHISHING[0], id: `ph_${Date.now()}`, status: "analyzing", created_at: new Date().toISOString() }, 1200),
    }
  : {
      list: async (params?: Record<string, unknown>) => {
        const page = Number(params?.page ?? 1);
        const pageSize = Number(params?.page_size ?? 20);
        const from = (page - 1) * pageSize;
        const { data, count, error } = await supabase.from("phishing_cases").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
        if (error) throw error;
        return { data: { items: data ?? [], total: count ?? 0, page, page_size: pageSize, total_pages: Math.ceil((count ?? 0) / pageSize) } };
      },
      get: async (id: string) => {
        const { data, error } = await supabase.from("phishing_cases").select("*").eq("id", id).single();
        if (error) throw error;
        return { data };
      },
      submit: async (data: unknown) => {
        const payload = data as Record<string, unknown>;
        const { data: created, error } = await supabase.from("phishing_cases").insert([{
          subject: payload.subject ?? "Manual submission",
          sender: payload.sender ?? "unknown",
          verdict: "unknown",
          status: "analyzing",
          confidence_score: 0,
          risk_score: 0,
        }]).select().single();
        if (error) throw error;
        return { data: created };
      },
      uploadEml: async (_file: File) => {
        const { data: created, error } = await supabase.from("phishing_cases").insert([{
          subject: _file.name,
          sender: "uploaded",
          verdict: "unknown",
          status: "analyzing",
          confidence_score: 0,
          risk_score: 0,
        }]).select().single();
        if (error) throw error;
        return { data: created };
      },
    };

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const aiChatApi = USE_MOCK
  ? {
      chat: (messages: { role: string; content: string }[]) => {
        const last = messages[messages.length - 1]?.content ?? "";
        return new Promise<{ data: { response: string } }>((res) =>
          setTimeout(() => res({ data: { response: generateMockAIResponse(last) } }), 900 + Math.random() * 800)
        );
      },
      streamChat: () => "",
      getHistory: () => mockOk([] as unknown[]),
      clearHistory: () => mockOk({ success: true }),
    }
  : {
      chat: async (messages: { role: string; content: string }[]) => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        if (!res.ok) throw new Error("AI request failed");
        return { data: await res.json() };
      },
      streamChat: () => "/api/chat",
      getHistory: () => Promise.resolve({ data: [] }),
      clearHistory: () => Promise.resolve({ data: { success: true } }),
    };

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = USE_MOCK
  ? {
      list: (_params?: Record<string, unknown>) => mockOk(paginate(MOCK_REPORTS)),
      get: (id: string) => mockOk(MOCK_REPORTS.find((r) => r.id === id) ?? MOCK_REPORTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_REPORTS[0], ...(data as object), id: `rpt_${Date.now()}`, status: "generating" as const, created_at: new Date().toISOString() }, 1000),
      download: (_id: string) => mockOk(new Blob(["MOCK REPORT"], { type: "application/pdf" }), 500),
    }
  : {
      list: (_params?: Record<string, unknown>) => mockOk(paginate(MOCK_REPORTS)),
      get: (id: string) => mockOk(MOCK_REPORTS.find((r) => r.id === id) ?? MOCK_REPORTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_REPORTS[0], ...(data as object), id: `rpt_${Date.now()}`, status: "generating" as const, created_at: new Date().toISOString() }, 1000),
      download: (_id: string) => mockOk(new Blob(["REPORT"], { type: "application/pdf" }), 500),
    };

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_AUDIT_LOGS, Number(params?.page ?? 1), 20)),
      export: (_params?: Record<string, unknown>) => mockOk(new Blob(["AUDIT LOG"], { type: "text/csv" })),
    }
  : {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_AUDIT_LOGS, Number(params?.page ?? 1), 20)),
      export: (_params?: Record<string, unknown>) => mockOk(new Blob(["AUDIT LOG"], { type: "text/csv" })),
    };

// Keep axios instance export for any legacy usage
export { supabase as api };
