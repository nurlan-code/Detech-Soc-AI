"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Settings, Shield, Bell, Key, User, Lock, Eye, EyeOff,
  Copy, Check, RefreshCw, X, QrCode, AlertTriangle,
  Trash2, ChevronRight, Globe, Moon, Zap, Save, Monitor,
  Wifi, LogOut as LogOutIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const MOCK_QR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIxMzAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9ImJsYWNrIi8+PHJlY3QgeD0iMTQwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjE1MCIgeT0iMzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIxMCIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9ImJsYWNrIi8+PHJlY3QgeD0iMjAiIHk9IjE0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjMwIiB5PSIxNTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=";

type NotifSetting = { id: string; label: string; desc: string; enabled: boolean };
type ApiKey = { id: string; name: string; key: string; created: string; lastUsed?: string };
type Session = { id: string; ip: string; location: string; device: string; time: string; current: boolean };

const MOCK_SESSIONS: Session[] = [
  { id: "s1", ip: "192.168.1.42",  location: "Baku, AZ",        device: "Chrome / Windows",  time: "2025-05-15T09:12:00Z", current: true  },
  { id: "s2", ip: "185.22.104.91", location: "London, UK",       device: "Firefox / Linux",   time: "2025-05-14T22:44:00Z", current: false },
  { id: "s3", ip: "10.0.0.5",      location: "Internal Network", device: "Edge / Windows",    time: "2025-05-14T08:31:00Z", current: false },
  { id: "s4", ip: "37.214.78.200", location: "Istanbul, TR",     device: "Safari / macOS",    time: "2025-05-12T14:20:00Z", current: false },
  { id: "s5", ip: "172.16.0.23",   location: "Internal Network", device: "CLI / Linux",       time: "2025-05-10T03:05:00Z", current: false },
];

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-10 rounded-full transition-colors duration-200 flex-shrink-0",
        enabled ? "bg-blue-600" : "bg-soc-border"
      )}
      style={{ height: "22px" }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

// ─── Security Score ───────────────────────────────────────────────────────────
function SecurityScoreBanner({
  mfaEnabled,
  notifications,
  sessionTimeout,
  apiKeysCount,
}: {
  mfaEnabled: boolean;
  notifications: NotifSetting[];
  sessionTimeout: string;
  apiKeysCount: number;
}) {
  const items = [
    { label: "Two-factor authentication",   ok: mfaEnabled,                                            pts: 30 },
    { label: "Password protected",           ok: true,                                                  pts: 15 },
    { label: "Critical alerts enabled",      ok: notifications.find((n) => n.id === "n1")?.enabled ?? false, pts: 15 },
    { label: "Session timeout ≤ 30 min",     ok: parseInt(sessionTimeout) <= 30,                        pts: 15 },
    { label: "API keys configured",          ok: apiKeysCount > 0,                                      pts: 10 },
    { label: "Multiple notifications active",ok: notifications.filter((n) => n.enabled).length >= 3,    pts: 15 },
  ];

  const score = items.reduce((sum, item) => sum + (item.ok ? item.pts : 0), 0);
  const color = score >= 70 ? "text-green-400" : score >= 40 ? "text-orange-400" : "text-red-400";
  const ringColor = score >= 70 ? "stroke-green-400" : score >= 40 ? "stroke-orange-400" : "stroke-red-400";
  const bgColor = score >= 70 ? "bg-green-500/8 border-green-500/20" : score >= 40 ? "bg-orange-500/8 border-orange-500/20" : "bg-red-500/8 border-red-500/20";
  const label = score >= 70 ? "Good" : score >= 40 ? "Fair" : "At Risk";

  const circumference = 2 * Math.PI * 28;
  const dash = (score / 100) * circumference;

  return (
    <motion.div
      className={cn("rounded-xl border p-5 mb-5", bgColor)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0 w-20 h-20">
          <svg viewBox="0 0 64 64" className="w-20 h-20 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-soc-border" />
            <motion.circle
              cx="32" cy="32" r="28" fill="none" strokeWidth="5"
              className={ringColor}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-black leading-none", color)}>{score}</span>
            <span className="text-[9px] text-gray-600 leading-none mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Shield className={cn("w-4 h-4", color)} />
            <span className="text-sm font-bold text-white">Security Score</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", score >= 70 ? "bg-green-500/15 text-green-400" : score >= 40 ? "bg-orange-500/15 text-orange-400" : "bg-red-500/15 text-red-400")}>
              {label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={item.ok ? "text-green-400" : "text-red-400/60"} style={{ fontSize: "11px" }}>
                  {item.ok ? "✓" : "✗"}
                </span>
                <span className={cn("text-xs truncate", item.ok ? "text-gray-400" : "text-gray-600")}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── SectionCard — defined at module level so React never remounts it on re-render ──
function SectionCard({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div className="soc-card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-soc-border">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color + "/10 border border-current/20")}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  // Profile state — initialized from auth store
  const [profile, setProfile] = useState({
    username: user?.username ?? "admin",
    email: user?.email ?? "admin@gmail.com",
    displayName: "Security Operations Center",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Detect unsaved profile changes (compared to committed auth store values)
  const profileDirty =
    profile.username !== (user?.username ?? "") ||
    profile.email    !== (user?.email    ?? "");

  // Password state
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwds, setShowPwds] = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  // MFA state
  const [mfaStep, setMfaStep] = useState<"idle" | "scan" | "verify" | "done">("idle");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(user?.is_mfa_enabled ?? false);
  const MOCK_SECRET = "JBSWY3DPEHPK3PXP";

  // Notifications
  const [notifications, setNotifications] = useState<NotifSetting[]>([
    { id: "n1", label: "Critical alerts via email",      desc: "Receive P1/P2 alert notifications immediately",     enabled: true  },
    { id: "n2", label: "New incident assignments",       desc: "Get notified when an incident is assigned to you",  enabled: true  },
    { id: "n3", label: "SLA breach warnings",            desc: "Alerts 30 minutes before SLA deadline",            enabled: true  },
    { id: "n4", label: "Weekly digest report",           desc: "Summary of SOC activity every Monday morning",     enabled: false },
    { id: "n5", label: "AI triage completions",          desc: "When AI finishes triaging an alert",               enabled: false },
    { id: "n6", label: "Phishing detection alerts",      desc: "Email when phishing is confirmed",                 enabled: true  },
    { id: "n7", label: "Playbook execution results",     desc: "Get notified after automated playbook runs",       enabled: false },
    { id: "n8", label: "System health alerts",           desc: "Platform uptime and performance notifications",    enabled: true  },
  ]);

  // Preferences
  const [prefs, setPrefs] = useState({ theme: "dark", timezone: "UTC", language: "en", sessionTimeout: "30" });

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "ak1", name: "SIEM Ingest Key", key: "soc_live_aB3kL9mN2xQrT7vW5yZ", created: "2024-10-15", lastUsed: "2024-12-28" },
    { id: "ak2", name: "Reporting API",   key: "soc_live_xK8pR4dE1wJ6cF2hM9nS", created: "2024-11-01", lastUsed: "2024-12-20" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!profile.username.trim()) { toast.error("Username cannot be empty"); return; }
    if (!profile.email.trim()) { toast.error("Email cannot be empty"); return; }
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 200));
    // Update the auth store — header and sidebar read from here
    setUser({ ...user!, username: profile.username, email: profile.email });
    setSavingProfile(false);
    toast.success("Profile updated — changes reflected across the platform", { icon: "✅" });
  };

  const changePassword = async () => {
    if (!pwdForm.current) { toast.error("Current password is required"); return; }
    if (pwdForm.newPwd.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { toast.error("Passwords do not match"); return; }
    setSavingPwd(true);
    await new Promise((r) => setTimeout(r, 250));
    setSavingPwd(false);
    setPwdForm({ current: "", newPwd: "", confirm: "" });
    toast.success("Password changed successfully", { icon: "🔒" });
  };

  const setupMfa = () => {
    setMfaStep("scan");
    toast("Scan the QR code with your authenticator app", { icon: "📱" });
  };

  const verifyMfa = async () => {
    if (mfaCode.length !== 6) { toast.error("Enter a 6-digit code"); return; }
    await new Promise((r) => setTimeout(r, 200));
    setMfaEnabled(true);
    setMfaStep("done");
    setMfaCode("");
    toast.success("Two-factor authentication enabled!", { icon: "🔐", duration: 4000 });
  };

  const disableMfa = async () => {
    await new Promise((r) => setTimeout(r, 150));
    setMfaEnabled(false);
    setMfaStep("idle");
    toast.success("MFA disabled", { icon: "⚠️" });
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) { toast.error("Key name is required"); return; }
    setGeneratingKey(true);
    await new Promise((r) => setTimeout(r, 250));
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const key = "soc_live_" + Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setApiKeys((prev) => [{ id: `ak${Date.now()}`, name: newKeyName, key, created: new Date().toISOString().split("T")[0] }, ...prev]);
    setNewKeyName("");
    setGeneratingKey(false);
    toast.success(`API key "${newKeyName}" generated`, { icon: "🔑" });
  };

  const copyKey = (apiKey: ApiKey) => {
    navigator.clipboard.writeText(apiKey.key).catch(() => {});
    setCopied(apiKey.id);
    toast.success("API key copied to clipboard", { icon: "📋", duration: 2000 });
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteKey = (id: string) => {
    const key = apiKeys.find((k) => k.id === id);
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success(`Key "${key?.name}" revoked`, { icon: "🗑️" });
  };

  const toggleNotif = (id: string, value: boolean) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, enabled: value } : n));
    const notif = notifications.find((n) => n.id === id);
    toast.success(`"${notif?.label}" ${value ? "enabled" : "disabled"}`, { duration: 1500 });
  };

  const revokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other sessions revoked", { icon: "🔒", duration: 3000 });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">

        {/* Security Score Banner — spans full width */}
        <SecurityScoreBanner
          mfaEnabled={mfaEnabled}
          notifications={notifications}
          sessionTimeout={prefs.sessionTimeout}
          apiKeysCount={apiKeys.length}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Profile */}
            <SectionCard title="Profile" icon={User} color="text-blue-400">
              <div className="space-y-4">
                {/* Avatar — reads committed auth store values, not local edit state */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                    {user?.username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.username ?? "—"}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.replace(/_/g, " ") ?? "SOC Analyst"}</p>
                    <p className="text-xs text-gray-600">{user?.email ?? "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
                    <input
                      value={profile.username}
                      onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                      className="soc-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Display Name</label>
                    <input
                      value={profile.displayName}
                      onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                      className="soc-input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="soc-input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <motion.button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="btn-primary px-5 disabled:opacity-40 text-sm"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  >
                    {savingProfile
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                      : <><Save className="w-4 h-4" /> Save Profile</>
                    }
                  </motion.button>
                  {/* Unsaved changes badge */}
                  <AnimatePresence>
                    {profileDirty && !savingProfile && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        Unsaved changes
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SectionCard>

            {/* Change Password */}
            <SectionCard title="Change Password" icon={Lock} color="text-yellow-400">
              <div className="space-y-3">
                {(["current", "newPwd", "confirm"] as const).map((field) => {
                  const labels = { current: "Current Password", newPwd: "New Password", confirm: "Confirm New Password" };
                  return (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{labels[field]}</label>
                      <div className="relative">
                        <input
                          type={showPwds[field] ? "text" : "password"}
                          value={pwdForm[field]}
                          onChange={(e) => setPwdForm((p) => ({ ...p, [field]: e.target.value }))}
                          placeholder="••••••••"
                          className="soc-input pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwds((p) => ({ ...p, [field]: !p[field] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          {showPwds[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <motion.button
                  onClick={changePassword}
                  disabled={savingPwd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600/15 hover:bg-yellow-600/25 disabled:opacity-40 text-yellow-400 text-sm font-medium rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                >
                  {savingPwd
                    ? <><div className="w-4 h-4 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" /> Updating...</>
                    : <><Lock className="w-4 h-4" /> Update Password</>
                  }
                </motion.button>
              </div>
            </SectionCard>

            {/* Two-Factor Authentication */}
            <SectionCard title="Two-Factor Authentication" icon={Shield} color="text-green-400">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-300">TOTP Authenticator</p>
                    <p className="text-xs text-gray-500 mt-0.5">Use Google Authenticator, Authy, or similar app</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold",
                    mfaEnabled ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {mfaEnabled ? "● Enabled" : "○ Disabled"}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {mfaStep === "idle" && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {mfaEnabled ? (
                        <button
                          onClick={disableMfa}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 hover:border-red-500/35 transition-all"
                        >
                          <X className="w-4 h-4" /> Disable MFA
                        </button>
                      ) : (
                        <motion.button
                          onClick={setupMfa}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm rounded-lg border border-green-500/20 hover:border-green-500/35 transition-all"
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        >
                          <Shield className="w-4 h-4" /> Enable MFA
                        </motion.button>
                      )}
                    </motion.div>
                  )}

                  {mfaStep === "scan" && (
                    <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="bg-soc-dark border border-soc-border rounded-xl p-5 text-center space-y-4">
                        <p className="text-xs text-gray-400">Scan this QR code with your authenticator app</p>
                        <div className="flex justify-center">
                          <div className="p-3 bg-white rounded-xl inline-block">
                            <img src={MOCK_QR} alt="MFA QR Code" className="w-36 h-36" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 mb-1">Or enter manually:</p>
                          <code className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg font-mono tracking-widest">{MOCK_SECRET}</code>
                        </div>
                        <motion.button
                          onClick={() => setMfaStep("verify")}
                          className="btn-primary w-full"
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        >
                          <ChevronRight className="w-4 h-4" /> I&apos;ve scanned — Next
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {mfaStep === "verify" && (
                    <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="bg-soc-dark border border-soc-border rounded-xl p-5 space-y-4">
                        <p className="text-xs text-gray-400">Enter the 6-digit code from your authenticator app</p>
                        <input
                          type="text"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && verifyMfa()}
                          placeholder="000000"
                          className="w-full px-4 py-3 bg-soc-surface border border-soc-border rounded-xl text-white text-center text-2xl font-mono tracking-[0.7rem] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <motion.button
                            onClick={verifyMfa}
                            disabled={mfaCode.length !== 6}
                            className="btn-primary flex-1 disabled:opacity-40"
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          >
                            <Check className="w-4 h-4" /> Verify & Enable
                          </motion.button>
                          <button
                            onClick={() => { setMfaStep("idle"); setMfaCode(""); }}
                            className="px-4 py-2.5 bg-soc-surface border border-soc-border text-gray-400 rounded-lg hover:text-white text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {mfaStep === "done" && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center gap-3 p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
                        <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-green-400 font-semibold">MFA is now active</p>
                          <p className="text-xs text-gray-500">Your account is protected with 2FA</p>
                        </div>
                        <button onClick={disableMfa} className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">Disable</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SectionCard>

          </div>{/* end left column */}

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Notifications */}
            <SectionCard title="Notifications" icon={Bell} color="text-yellow-400">
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-center justify-between py-1">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm text-gray-200">{n.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                    </div>
                    <Toggle enabled={n.enabled} onChange={(v) => toggleNotif(n.id, v)} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Preferences */}
            <SectionCard title="Preferences" icon={Settings} color="text-purple-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Theme</label>
                  <select
                    value={prefs.theme}
                    onChange={(e) => { setPrefs((p) => ({ ...p, theme: e.target.value })); toast.success("Theme preference saved", { duration: 1500 }); }}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    <option value="dark">Dark (Default)</option>
                    <option value="darker">Darker</option>
                    <option value="midnight">Midnight Blue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Timezone</label>
                  <select
                    value={prefs.timezone}
                    onChange={(e) => { setPrefs((p) => ({ ...p, timezone: e.target.value })); toast.success("Timezone updated", { duration: 1500 }); }}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {["UTC", "US/Eastern", "US/Pacific", "Europe/London", "Asia/Dubai"].map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Session Timeout</label>
                  <select
                    value={prefs.sessionTimeout}
                    onChange={(e) => { setPrefs((p) => ({ ...p, sessionTimeout: e.target.value })); toast.success("Session timeout updated", { duration: 1500 }); }}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {["15", "30", "60", "120", "480"].map((t) => (
                      <option key={t} value={t}>{t} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* Session History */}
            <SectionCard title="Session History" icon={Monitor} color="text-cyan-400">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Recent login activity for your account.</p>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-xs",
                      session.current
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-soc-dark border-soc-border"
                    )}
                  >
                    <Wifi className={cn("w-4 h-4 flex-shrink-0", session.current ? "text-green-400" : "text-gray-600")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-300 font-medium">{session.ip}</span>
                        {session.current && (
                          <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-0.5 truncate">{session.location} · {session.device}</p>
                    </div>
                    <span className="text-gray-600 flex-shrink-0 text-right">{formatRelativeTime(session.time)}</span>
                  </motion.div>
                ))}

                {sessions.length > 1 && (
                  <motion.button
                    onClick={revokeOtherSessions}
                    className="w-full flex items-center justify-center gap-2 mt-3 py-2 text-xs text-red-400 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/35 rounded-lg transition-all"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  >
                    <LogOutIcon className="w-3.5 h-3.5" /> Revoke all other sessions
                  </motion.button>
                )}
                {sessions.length === 1 && (
                  <p className="text-center text-xs text-gray-700 mt-2">No other active sessions</p>
                )}
              </div>
            </SectionCard>

            {/* API Keys */}
            <SectionCard title="API Keys" icon={Key} color="text-purple-400">
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Generate keys for external integrations and programmatic access to the SOC API.</p>
                <div className="flex gap-2">
                  <input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g. SIEM Integration)"
                    className="soc-input flex-1"
                    onKeyDown={(e) => e.key === "Enter" && generateApiKey()}
                  />
                  <motion.button
                    onClick={generateApiKey}
                    disabled={generatingKey || !newKeyName.trim()}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-purple-600/15 hover:bg-purple-600/25 disabled:opacity-40 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all whitespace-nowrap"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    {generatingKey
                      ? <div className="w-3.5 h-3.5 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
                      : <Key className="w-3.5 h-3.5" />
                    }
                    {generatingKey ? "Generating..." : "Generate"}
                  </motion.button>
                </div>

                <div className="space-y-2">
                  {apiKeys.map((apiKey) => (
                    <motion.div
                      key={apiKey.id}
                      className="flex items-center gap-3 p-3 bg-soc-dark border border-soc-border rounded-xl"
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200">{apiKey.name}</p>
                        <code className="text-[10px] text-gray-600 font-mono">
                          {showKeys[apiKey.id] ? apiKey.key : apiKey.key.slice(0, 12) + "•".repeat(12)}
                        </code>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setShowKeys((p) => ({ ...p, [apiKey.id]: !p[apiKey.id] }))}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          {showKeys[apiKey.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyKey(apiKey)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          {copied === apiKey.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteKey(apiKey.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Danger Zone */}
            <motion.div
              className="border border-red-500/20 rounded-xl p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-soc-border">
                  <div>
                    <p className="text-sm text-gray-200">Reset all settings</p>
                    <p className="text-xs text-gray-500">Revert all settings to defaults</p>
                  </div>
                  <button
                    onClick={() => toast("This would reset all settings in production", { icon: "⚠️" })}
                    className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 hover:border-red-500/35 transition-all"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray-200">Delete account</p>
                    <p className="text-xs text-gray-500">Permanently remove your account and data</p>
                  </div>
                  <button
                    onClick={() => toast.error("Account deletion requires admin approval in production", { duration: 3000 })}
                    className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 hover:border-red-500/35 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>

          </div>{/* end right column */}
        </div>
      </div>
    </div>
  );
}
