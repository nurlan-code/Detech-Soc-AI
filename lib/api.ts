import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import {
  MOCK_USER, MOCK_ALERTS, MOCK_INCIDENTS, MOCK_PHISHING, MOCK_REPORTS,
  MOCK_STATS, MOCK_TREND, MOCK_SEVERITY_DIST, MOCK_ACTIVITY, MOCK_AUDIT_LOGS,
  MOCK_TOP_MITRE, MOCK_TOP_ASSETS, MOCK_TOP_USERS, MOCK_EXTENDED_STATS,
  generateMockAIResponse,
} from "./mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";

// ── Real axios instance (used when USE_MOCK=false) ──────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = Cookies.get("refresh_token");
      if (rt) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: rt });
          Cookies.set("access_token", data.access_token, { secure: true, sameSite: "strict" });
          orig.headers.Authorization = `Bearer ${data.access_token}`;
          return api(orig);
        } catch { /* fall through */ }
      }
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Mock helper ─────────────────────────────────────────────────────────────
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
        if (email === "admin@gmail.com" && password === "admin123") {
          return mockOk({ tokens: { access_token: "mock-access-token", refresh_token: "mock-refresh-token", token_type: "bearer", expires_in: 1800 }, requires_mfa: false, mfa_token: "" });
        }
        return Promise.reject({ response: { data: { detail: "Invalid email or password" } } });
      },
      me: () => mockOk(MOCK_USER, 150),
      logout: () => mockOk({ success: true }, 100),
      refresh: (_rt: string) => mockOk({ access_token: "mock-access-token" }, 100),
      verifyMfa: (_token: string, _code: string) => mockOk({ access_token: "mock-access-token", refresh_token: "mock-refresh-token" }),
      setupMfa: () => mockOk({ otpauth_url: "otpauth://totp/Detech%20SOC:admin%40gmail.com?secret=JBSWY3DPEHPK3PXP", secret: "JBSWY3DPEHPK3PXP" }),
      enableMfa: (_code: string) => mockOk({ success: true }),
    }
  : {
      login: (email: string, password: string, mfaCode?: string) => api.post("/auth/login", { email, password, mfa_code: mfaCode }),
      refresh: (refreshToken: string) => api.post("/auth/refresh", { refresh_token: refreshToken }),
      verifyMfa: (mfaToken: string, code: string) => api.post("/auth/mfa/verify", { mfa_token: mfaToken, code }),
      setupMfa: () => api.get("/auth/mfa/setup"),
      enableMfa: (code: string) => api.post("/auth/mfa/enable", null, { params: { code } }),
      logout: () => api.post("/auth/logout"),
      me: () => api.get("/auth/me"),
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
      getAlertTrend: (_days = 30) => mockOk(MOCK_TREND),
      getSeverityDistribution: () => mockOk(MOCK_SEVERITY_DIST),
      getMitreHeatmap: () => mockOk(MOCK_TOP_MITRE),
      getTopIocs: (_limit = 10) => mockOk(MOCK_ALERTS.flatMap((a) => a.iocs).slice(0, _limit)),
      getRecentActivity: (_limit = 8) => mockOk(MOCK_ACTIVITY),
      getTopAssets: (_limit = 5) => mockOk(MOCK_TOP_ASSETS),
      getTopUsers: (_limit = 5) => mockOk(MOCK_TOP_USERS),
      getExtendedStats: () => mockOk(MOCK_EXTENDED_STATS),
    }
  : {
      getStats: () => api.get("/dashboard/stats"),
      getAlertTrend: (days = 30) => api.get("/dashboard/alerts/trend", { params: { days } }),
      getSeverityDistribution: () => api.get("/dashboard/severity/distribution"),
      getMitreHeatmap: () => api.get("/dashboard/mitre/heatmap"),
      getTopIocs: (limit = 10) => api.get("/dashboard/top-iocs", { params: { limit } }),
      getRecentActivity: (limit = 10) => api.get("/dashboard/recent-activity", { params: { limit } }),
      getTopAssets: (limit = 5) => api.get("/dashboard/top-assets", { params: { limit } }),
      getTopUsers: (limit = 5) => api.get("/dashboard/top-users", { params: { limit } }),
      getExtendedStats: () => api.get("/dashboard/extended-stats"),
    };

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => {
        let items = [...MOCK_ALERTS];
        if (params?.search) items = items.filter((a) => a.title.toLowerCase().includes(String(params.search).toLowerCase()) || a.source.includes(String(params.search).toLowerCase()));
        if (params?.severity) items = items.filter((a) => a.severity === params.severity);
        if (params?.status) items = items.filter((a) => a.status === params.status);
        if (params?.source) items = items.filter((a) => a.source === params.source);
        return mockOk(paginate(items, Number(params?.page ?? 1), Number(params?.page_size ?? 25)));
      },
      get: (id: string) => mockOk(MOCK_ALERTS.find((a) => a.id === id) ?? MOCK_ALERTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_ALERTS[0], ...(data as object), id: `alrt_new_${Date.now()}`, created_at: new Date().toISOString() }),
      update: (id: string, data: unknown) => mockOk({ ...MOCK_ALERTS.find((a) => a.id === id), ...(data as object) }),
      triage: (_id: string) => mockOk({ queued: true, message: "AI triage queued" }, 600),
      escalate: (_id: string) => mockOk({ success: true }),
      delete: (_id: string) => mockOk({ success: true }),
    }
  : {
      list: (params?: Record<string, unknown>) => api.get("/alerts", { params }),
      create: (data: unknown) => api.post("/alerts", data),
      get: (id: string) => api.get(`/alerts/${id}`),
      update: (id: string, data: unknown) => api.patch(`/alerts/${id}`, data),
      triage: (id: string) => api.post(`/alerts/${id}/triage`),
      escalate: (id: string) => api.post(`/alerts/${id}/escalate`),
      delete: (id: string) => api.delete(`/alerts/${id}`),
    };

// ── Incidents ─────────────────────────────────────────────────────────────────
export const incidentsApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_INCIDENTS, Number(params?.page ?? 1), Number(params?.page_size ?? 20))),
      get: (id: string) => mockOk(MOCK_INCIDENTS.find((i) => i.id === id) ?? MOCK_INCIDENTS[0]),
      create: (data: unknown) => mockOk({ ...MOCK_INCIDENTS[0], ...(data as object), id: `inc_new_${Date.now()}`, created_at: new Date().toISOString() }),
      update: (id: string, data: unknown) => mockOk({ ...MOCK_INCIDENTS.find((i) => i.id === id), ...(data as object) }),
      addTimeline: (_id: string, event: unknown) => mockOk({ success: true, event }),
      close: (_id: string) => mockOk({ success: true }),
    }
  : {
      list: (params?: Record<string, unknown>) => api.get("/incidents", { params }),
      create: (data: unknown) => api.post("/incidents", data),
      get: (id: string) => api.get(`/incidents/${id}`),
      update: (id: string, data: unknown) => api.patch(`/incidents/${id}`, data),
      addTimeline: (id: string, event: unknown) => api.post(`/incidents/${id}/timeline`, event),
      close: (id: string) => api.post(`/incidents/${id}/close`),
    };

// ── Phishing ──────────────────────────────────────────────────────────────────
export const phishingApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_PHISHING, Number(params?.page ?? 1), Number(params?.page_size ?? 20))),
      get: (id: string) => mockOk(MOCK_PHISHING.find((p) => p.id === id) ?? MOCK_PHISHING[0]),
      submit: (data: unknown) => mockOk({ ...MOCK_PHISHING[5], ...(data as object), id: `ph_new_${Date.now()}`, status: "analyzing", created_at: new Date().toISOString() }, 800),
      uploadEml: (_file: File) => mockOk({ ...MOCK_PHISHING[5], id: `ph_upload_${Date.now()}`, status: "analyzing", created_at: new Date().toISOString() }, 1200),
    }
  : {
      list: (params?: Record<string, unknown>) => api.get("/phishing", { params }),
      submit: (data: unknown) => api.post("/phishing", data),
      uploadEml: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/phishing/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      },
      get: (id: string) => api.get(`/phishing/${id}`),
    };

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const aiChatApi = USE_MOCK
  ? {
      chat: (messages: { role: string; content: string }[]) => {
        const lastMsg = messages[messages.length - 1]?.content ?? "";
        return new Promise<{ data: { response: string } }>((res) => {
          const delay = 800 + Math.random() * 1200;
          setTimeout(() => res({ data: { response: generateMockAIResponse(lastMsg) } }), delay);
        });
      },
      streamChat: () => `${API_URL}/ai-chat/chat`,
      getHistory: () => mockOk([] as unknown[], 100),
      clearHistory: () => mockOk({ success: true }, 100),
    }
  : {
      chat: (messages: unknown[], contextType?: string, contextId?: string) => api.post("/ai-chat/chat", { messages, context_type: contextType, context_id: contextId, stream: false }),
      streamChat: () => `${API_URL}/ai-chat/chat`,
      getHistory: () => api.get("/ai-chat/history"),
      clearHistory: () => api.delete("/ai-chat/history"),
    };

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = USE_MOCK
  ? {
      list: (_params?: Record<string, unknown>) => mockOk(paginate(MOCK_REPORTS)),
      get: (id: string) => mockOk(MOCK_REPORTS.find((r) => r.id === id) ?? MOCK_REPORTS[0]),
      create: (data: unknown) => {
        const newReport = { ...MOCK_REPORTS[0], ...(data as object), id: `rpt_new_${Date.now()}`, status: "generating" as const, created_at: new Date().toISOString(), ai_narrative: null, pdf_path: null };
        return mockOk(newReport, 1000);
      },
      download: (_id: string) => {
        const blob = new Blob(["MOCK SECURITY REPORT\n\nThis is a demo report.\n\nDetech SOC AI — Enterprise Security Platform\n\nAll data is mock/demo data for demonstration purposes."], { type: "application/pdf" });
        return mockOk(blob, 500);
      },
    }
  : {
      list: (params?: Record<string, unknown>) => api.get("/reports", { params }),
      create: (data: unknown) => api.post("/reports", data),
      get: (id: string) => api.get(`/reports/${id}`),
      download: (id: string) => api.get(`/reports/${id}/download`, { responseType: "blob" }),
    };

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = USE_MOCK
  ? {
      list: (params?: Record<string, unknown>) => mockOk(paginate(MOCK_AUDIT_LOGS, Number(params?.page ?? 1), Number(params?.page_size ?? 20))),
      export: (_params?: Record<string, unknown>) => mockOk(new Blob(["AUDIT LOG EXPORT\n\nMock audit data"], { type: "text/csv" })),
    }
  : {
      list: (params?: Record<string, unknown>) => api.get("/audit", { params }),
      export: (params?: Record<string, unknown>) => api.get("/audit/export", { params, responseType: "blob" }),
    };
