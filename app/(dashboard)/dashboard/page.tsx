"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { dashboardApi } from "@/lib/api";
import { Header } from "@/components/shared/Header";
import { DashboardStats } from "@/types";
import {
  Bell, Flame, Mail, Activity, ShieldAlert, CheckCircle, TrendingUp, Zap,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatRelativeTime, cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
  info:     "#3b82f6",
};

function AnimatedNumber({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(0);
  const target = typeof value === "number" ? value : null;
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (target === null) return;
    const duration = 1200;
    const steps = 60;
    const step = target / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current += step;
      if (current >= target) { setDisplay(target); if (ref.current) clearInterval(ref.current); }
      else setDisplay(Math.round(current));
    }, duration / steps);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [target]);

  if (target === null) return <span>{value}</span>;
  return <span>{display.toLocaleString()}</span>;
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } },
};

interface StatCard {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; borderLeft: string; desc: string; trend?: number;
}

export default function DashboardPage() {
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

  const pieData = Object.entries(severityDist).map(([name, value]) => ({ name, value }));

  const statCards: StatCard[] = [
    { label: "Total Alerts",       value: stats?.total_alerts      ?? 0,   icon: Bell,        color: "text-blue-400",    bg: "bg-blue-500/8",    borderLeft: "border-l-blue-500",    desc: "All time",       trend: 12 },
    { label: "New / Unread",       value: stats?.new_alerts        ?? 0,   icon: Activity,    color: "text-orange-400",  bg: "bg-orange-500/8",  borderLeft: "border-l-orange-500",  desc: "Need attention",  trend: -5 },
    { label: "Critical",           value: stats?.critical_alerts   ?? 0,   icon: ShieldAlert, color: "text-red-400",     bg: "bg-red-500/8",     borderLeft: "border-l-red-500",     desc: "P1 severity",    trend: 3 },
    { label: "Open Incidents",     value: stats?.open_incidents    ?? 0,   icon: Flame,       color: "text-orange-400",  bg: "bg-orange-500/8",  borderLeft: "border-l-orange-400",  desc: "Active response", trend: 0 },
    { label: "Phishing Today",     value: stats?.phishing_today    ?? 0,   icon: Mail,        color: "text-purple-400",  bg: "bg-purple-500/8",  borderLeft: "border-l-purple-500",  desc: "Submissions",    trend: 34 },
    { label: "Confirmed Threats",  value: stats?.confirmed_phishing?? 0,   icon: CheckCircle, color: "text-red-400",     bg: "bg-red-500/8",     borderLeft: "border-l-red-400",     desc: "Verified",       trend: -2 },
    { label: "Alerts This Week",   value: stats?.alerts_this_week  ?? 0,   icon: TrendingUp,  color: "text-green-400",   bg: "bg-green-500/8",   borderLeft: "border-l-green-500",   desc: "7-day volume",   trend: 23 },
    { label: "AI Triage",          value: "Active",                         icon: Zap,         color: "text-cyan-400",    bg: "bg-cyan-500/8",    borderLeft: "border-l-cyan-500",    desc: "Auto-triage ON", trend: undefined },
  ];

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
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {statCards.map(({ label, value, icon: Icon, color, bg, borderLeft, desc, trend: t }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              className={cn("soc-card p-4 cursor-default border-l-2 transition-shadow", borderLeft)}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-500">{label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                </div>
              </div>
              <p className={cn("text-2xl font-black tabular-nums mb-0.5", color)}>
                {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Area chart */}
          <motion.div
            className="lg:col-span-2 soc-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-100">Alert Volume</h3>
                <p className="text-xs text-gray-600 mt-0.5">Last 30 days</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Live
                </motion.span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
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
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-100">By Severity</h3>
              <p className="text-xs text-gray-600 mt-0.5">Current distribution</p>
            </div>
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
              <div className="h-40 flex items-center justify-center text-xs text-gray-600">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* Recent activity */}
        <motion.div
          className="soc-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-100">Recent Activity</h3>
              <p className="text-xs text-gray-600 mt-0.5">Latest alerts & incidents</p>
            </div>
            <span className="text-xs text-gray-600 bg-soc-dark border border-soc-border px-2 py-1 rounded-lg">{activity.length} events</span>
          </div>
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
                  transition={{ delay: 0.55 + i * 0.05 }}
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
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
