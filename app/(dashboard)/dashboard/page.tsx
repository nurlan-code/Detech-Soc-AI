"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { dashboardApi } from "@/lib/api";
import { Header } from "@/components/shared/Header";
import { DashboardStats } from "@/types";
import {
  Bell, Flame, Mail, Activity, ShieldAlert, CheckCircle, TrendingUp, Zap,
  ArrowUpRight, ArrowDownRight, Brain, Clock, Target, Shield, Users,
  Server, AlertTriangle, BarChart2, Eye, Crosshair,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { formatRelativeTime, cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
  info:     "#3b82f6",
};

const TACTIC_COLORS: Record<string, string> = {
  "Initial Access":    "#f97316",
  "Execution":         "#eab308",
  "Persistence":       "#a855f7",
  "Credential Access": "#ef4444",
  "Lateral Movement":  "#f43f5e",
  "Exfiltration":      "#06b6d4",
  "Impact":            "#ef4444",
  "Discovery":         "#3b82f6",
  "Defense Evasion":   "#8b5cf6",
  "Command and Control": "#10b981",
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const step = value / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current += step;
      if (current >= value) {
        setDisplay(value);
        if (ref.current) clearInterval(ref.current);
      } else {
        setDisplay(parseFloat(current.toFixed(decimals)));
      }
    }, duration / steps);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [value, decimals]);
  return <span>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
};

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {badge && (
        <span className="text-[10px] text-gray-500 bg-soc-dark border border-soc-border px-2 py-1 rounded-lg">{badge}</span>
      )}
    </div>
  );
}

type TopMitre = { technique_id: string; name: string; count: number; tactic: string; severity: string };
type TopAsset = { name: string; type: string; alert_count: number; risk_score: number; ip: string };
type TopUser  = { username: string; display_name: string; department: string; alert_count: number; risk_score: number; last_alert: string };
type ExtStats = {
  ai_analyzed_count: number; ai_analyzed_pct: number; false_positive_rate: number;
  avg_response_time_min: number; analyst_time_saved_hrs: number; ai_automation_rate: number;
  mttd_hours: number; mttr_hours: number; total_iocs_blocked: number; playbooks_executed: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    refetchInterval: 30_000,
  });
  const { data: trend = [] } = useQuery<{ date: string; count: number }[]>({
    queryKey: ["alert-trend"],
    queryFn: () => dashboardApi.getAlertTrend(30).then((r) => r.data),
  });
  const { data: severityDist = {} } = useQuery<Record<string, number>>({
    queryKey: ["severity-dist"],
    queryFn: () => dashboardApi.getSeverityDistribution().then((r) => r.data),
  });
  const { data: activity = [] } = useQuery<{ type: string; id: string; title: string; severity: string; created_at: string }[]>({
    queryKey: ["recent-activity"],
    queryFn: () => dashboardApi.getRecentActivity(8).then((r) => r.data),
  });
  const { data: topMitre = [] } = useQuery<TopMitre[]>({
    queryKey: ["top-mitre"],
    queryFn: () => dashboardApi.getMitreHeatmap().then((r) => r.data as TopMitre[]),
  });
  const { data: topAssets = [] } = useQuery<TopAsset[]>({
    queryKey: ["top-assets"],
    queryFn: () => dashboardApi.getTopAssets().then((r) => r.data),
  });
  const { data: topUsers = [] } = useQuery<TopUser[]>({
    queryKey: ["top-users"],
    queryFn: () => dashboardApi.getTopUsers().then((r) => r.data),
  });
  const { data: extStats } = useQuery<ExtStats>({
    queryKey: ["extended-stats"],
    queryFn: () => dashboardApi.getExtendedStats().then((r) => r.data),
  });

  const pieData = Object.entries(severityDist).map(([name, value]) => ({ name, value }));
  const maxMitreCount = topMitre[0]?.count ?? 1;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-soc-surface border border-soc-border rounded-xl px-3 py-2.5 text-xs shadow-2xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-blue-400 font-bold text-sm">{payload[0].value} alerts</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Security Dashboard" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-5">

        {/* ── Primary KPI cards ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {[
            { label: "Total Alerts",      value: stats?.total_alerts      ?? 0,   icon: Bell,        color: "text-blue-400",    bg: "bg-blue-500/8",    bl: "border-l-blue-500",    desc: "All time",        trend: 12 },
            { label: "New / Unread",       value: stats?.new_alerts        ?? 0,   icon: Activity,    color: "text-orange-400",  bg: "bg-orange-500/8",  bl: "border-l-orange-500",  desc: "Need attention",  trend: -5 },
            { label: "Critical",           value: stats?.critical_alerts   ?? 0,   icon: ShieldAlert, color: "text-red-400",     bg: "bg-red-500/8",     bl: "border-l-red-500",     desc: "P1 severity",     trend: 3 },
            { label: "Open Incidents",     value: stats?.open_incidents    ?? 0,   icon: Flame,       color: "text-orange-400",  bg: "bg-orange-500/8",  bl: "border-l-orange-400",  desc: "Active response", trend: 0 },
            { label: "Phishing Today",     value: stats?.phishing_today    ?? 0,   icon: Mail,        color: "text-purple-400",  bg: "bg-purple-500/8",  bl: "border-l-purple-500",  desc: "Submissions",     trend: 34 },
            { label: "Confirmed Threats",  value: stats?.confirmed_phishing?? 0,   icon: CheckCircle, color: "text-red-400",     bg: "bg-red-500/8",     bl: "border-l-red-400",     desc: "Verified",        trend: -2 },
            { label: "Alerts This Week",   value: stats?.alerts_this_week  ?? 0,   icon: TrendingUp,  color: "text-green-400",   bg: "bg-green-500/8",   bl: "border-l-green-500",   desc: "7-day volume",    trend: 23 },
            { label: "IOCs Blocked",       value: extStats?.total_iocs_blocked ?? 0, icon: Shield,    color: "text-cyan-400",    bg: "bg-cyan-500/8",    bl: "border-l-cyan-500",    desc: "Auto-blocked",    trend: 18 },
          ].map(({ label, value, icon: Icon, color, bg, bl, desc, trend: t }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              className={cn("soc-card p-3 sm:p-4 cursor-default border-l-2 transition-shadow", bl)}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-500">{label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                </div>
              </div>
              <p className={cn("text-2xl font-black tabular-nums mb-0.5", color)}>
                <AnimatedNumber value={typeof value === "number" ? value : 0} />
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-600">{desc}</p>
                {t !== undefined && (
                  <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", t > 0 ? "text-red-400" : t < 0 ? "text-green-400" : "text-gray-600")}>
                    {t > 0 ? <ArrowUpRight className="w-3 h-3" /> : t < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {t !== 0 ? `${Math.abs(t)}%` : "—"}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── AI Performance banner ── */}
        <motion.div
          className="soc-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">AI Performance Metrics</h3>
              <p className="text-xs text-gray-600">Multi-agent SOC automation KPIs</p>
            </div>
            <motion.span
              className="ml-auto text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full font-medium"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              AI Active
            </motion.span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {[
              { label: "AI Analyzed",     value: extStats?.ai_analyzed_pct ?? 0,     suffix: "%",  icon: Zap,        color: "text-violet-400", desc: `${(extStats?.ai_analyzed_count ?? 0).toLocaleString()} alerts` },
              { label: "Auto Rate",       value: extStats?.ai_automation_rate ?? 0,   suffix: "%",  icon: Brain,      color: "text-blue-400",   desc: "Automated handling" },
              { label: "False Pos. Rate", value: extStats?.false_positive_rate ?? 0,  suffix: "%",  icon: CheckCircle,color: "text-green-400",  desc: "Industry avg 30%" },
              { label: "Avg. MTTD",       value: extStats?.mttd_hours ?? 0,           suffix: "h",  icon: Eye,        color: "text-cyan-400",   desc: "Mean time to detect", dec: 1 },
              { label: "Avg. MTTR",       value: extStats?.mttr_hours ?? 0,           suffix: "h",  icon: Clock,      color: "text-orange-400", desc: "Mean time to respond", dec: 1 },
              { label: "Analyst Time Saved", value: extStats?.analyst_time_saved_hrs ?? 0, suffix: "h", icon: Target, color: "text-emerald-400", desc: "This month" },
            ].map(({ label, value, suffix, icon: Icon, color, desc, dec }) => (
              <div key={label} className="bg-soc-dark rounded-xl p-3 border border-soc-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={cn("w-3 h-3", color)} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
                <p className={cn("text-xl font-black tabular-nums", color)}>
                  <AnimatedNumber value={value} decimals={dec ?? 0} />
                  <span className="text-sm font-semibold ml-0.5">{suffix}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Area chart */}
          <motion.div
            className="lg:col-span-2 soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <SectionHeader title="Alert Volume" subtitle="Last 30 days" badge="Live" />
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie chart */}
          <motion.div
            className="soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          >
            <SectionHeader title="By Severity" subtitle="Current distribution" />
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={38} outerRadius={62} strokeWidth={0}
                      startAngle={90} endAngle={-270}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#6b7280"} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((e) => {
                    const total = pieData.reduce((s, x) => s + x.value, 0);
                    const pct = Math.round((e.value / total) * 100);
                    return (
                      <div key={e.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLORS[e.name] }} />
                        <span className="text-xs text-gray-400 capitalize flex-1">{e.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{e.value}</span>
                        <div className="w-12 h-1 bg-soc-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SEVERITY_COLORS[e.name] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-gray-600">No data</div>
            )}
          </motion.div>
        </div>

        {/* ── MITRE + Assets + Users row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top MITRE Techniques */}
          <motion.div
            className="lg:col-span-1 soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <SectionHeader title="Top MITRE Techniques" subtitle="By alert frequency" badge={`${topMitre.length} techniques`} />
            <div className="space-y-2.5">
              {topMitre.slice(0, 8).map((t, i) => {
                const pct = Math.round((t.count / maxMitreCount) * 100);
                const barColor = TACTIC_COLORS[t.tactic] ?? "#6b7280";
                return (
                  <div key={t.technique_id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-gray-600 font-mono w-4 flex-shrink-0">{i + 1}</span>
                        <span className="text-xs text-gray-300 truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-gray-600 font-mono">{t.technique_id}</span>
                        <span className="text-xs font-bold" style={{ color: barColor }}>{t.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-soc-border">
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={topMitre.slice(0, 5)} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {topMitre.slice(0, 5).map((t) => (
                      <Cell key={t.technique_id} fill={TACTIC_COLORS[t.tactic] ?? "#6b7280"} opacity={0.8} />
                    ))}
                  </Bar>
                  <XAxis dataKey="technique_id" tick={{ fill: "#374151", fontSize: 9 }} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Attacked Assets */}
          <motion.div
            className="soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          >
            <SectionHeader title="Top Attacked Assets" subtitle="Highest alert count" badge={`${topAssets.length} assets`} />
            <div className="space-y-2">
              {topAssets.map((asset, i) => {
                const riskColor = asset.risk_score >= 90 ? "text-red-400" : asset.risk_score >= 70 ? "text-orange-400" : "text-yellow-400";
                const riskBg = asset.risk_score >= 90 ? "bg-red-500/10" : asset.risk_score >= 70 ? "bg-orange-500/10" : "bg-yellow-500/10";
                return (
                  <div key={asset.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-soc-dark border border-soc-border/50 hover:border-soc-border transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Server className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{asset.name}</p>
                      <p className="text-[10px] text-gray-600">{asset.type} · {asset.ip}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-500 font-mono">{asset.alert_count} alerts</span>
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-md", riskColor, riskBg)}>{asset.risk_score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-soc-border">
              <ResponsiveContainer width="100%" height={55}>
                <BarChart data={topAssets} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <Bar dataKey="risk_score" radius={[3, 3, 0, 0]} fill="#f97316" opacity={0.7} />
                  <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 9 }} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Risky Users */}
          <motion.div
            className="soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <SectionHeader title="Top Risky Users" subtitle="By behavioral risk score" badge={`${topUsers.length} users`} />
            <div className="space-y-2">
              {topUsers.map((user) => {
                const riskColor = user.risk_score >= 85 ? "text-red-400" : user.risk_score >= 70 ? "text-orange-400" : "text-yellow-400";
                const riskPct = user.risk_score;
                return (
                  <div key={user.username} className="p-2.5 rounded-xl bg-soc-dark border border-soc-border/50 hover:border-soc-border transition-colors">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-soc-border flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-blue-400">{user.display_name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">{user.display_name}</p>
                        <p className="text-[10px] text-gray-600">{user.department} · {user.alert_count} alerts</p>
                      </div>
                      <span className={cn("text-xs font-black tabular-nums", riskColor)}>{user.risk_score}</span>
                    </div>
                    <div className="h-1 bg-soc-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: user.risk_score >= 85 ? "#ef4444" : user.risk_score >= 70 ? "#f97316" : "#eab308" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${riskPct}%` }}
                        transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">Last alert {formatRelativeTime(user.last_alert)}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Bottom row: Playbooks + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Playbook / Automation metrics */}
          <motion.div
            className="lg:col-span-2 soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          >
            <SectionHeader title="Automation & Playbooks" subtitle="This period" />
            <div className="space-y-3">
              {[
                { label: "Playbooks Executed", value: extStats?.playbooks_executed ?? 0, icon: Crosshair, color: "text-violet-400", bg: "bg-violet-500/10" },
                { label: "AI Analyzed Alerts",  value: extStats?.ai_analyzed_count ?? 0,  icon: Brain,     color: "text-blue-400",   bg: "bg-blue-500/10"   },
                { label: "IOCs Auto-Blocked",   value: extStats?.total_iocs_blocked ?? 0, icon: Shield,    color: "text-green-400",  bg: "bg-green-500/10"  },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-soc-dark border border-soc-border/50">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                  <span className={cn("text-lg font-black tabular-nums", color)}>
                    <AnimatedNumber value={value} />
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 rounded-xl bg-soc-dark border border-soc-border/50 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">MTTD</p>
                  <p className="text-base font-black text-cyan-400">
                    <AnimatedNumber value={extStats?.mttd_hours ?? 0} decimals={1} />
                    <span className="text-xs ml-0.5 font-semibold">h</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-soc-dark border border-soc-border/50 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">MTTR</p>
                  <p className="text-base font-black text-orange-400">
                    <AnimatedNumber value={extStats?.mttr_hours ?? 0} decimals={1} />
                    <span className="text-xs ml-0.5 font-semibold">h</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="lg:col-span-3 soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <SectionHeader title="Recent Activity" subtitle="Latest alerts & incidents" badge={`${activity.length} events`} />
            {activity.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-0.5">
                {activity.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 + i * 0.04 }}
                    onClick={() => router.push(`/${item.type === "alert" ? "alerts" : "incidents"}/${item.id}`)}
                  >
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide flex-shrink-0 border",
                      item.type === "alert"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    )}>
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-300 flex-1 truncate group-hover:text-white transition-colors">{item.title}</span>
                    {item.severity && (
                      <motion.div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: SEVERITY_COLORS[item.severity] ?? "#6b7280" }}
                        animate={item.severity === "critical" ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <span className="text-xs text-gray-600 flex-shrink-0 tabular-nums">{formatRelativeTime(item.created_at)}</span>
                    <AlertTriangle className="w-3 h-3 text-gray-700 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
