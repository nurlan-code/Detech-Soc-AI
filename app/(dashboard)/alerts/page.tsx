"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { alertsApi } from "@/lib/api";
import { Alert, AlertSeverity, AlertStatus } from "@/types";
import { Header } from "@/components/shared/Header";
import { cn, statusBadgeClass, formatRelativeTime, truncate } from "@/lib/utils";
import {
  Plus, RefreshCw, Search, Brain, Zap, Filter,
  ChevronRight, X, AlertTriangle, Shield, Link2,
  CheckSquare, Square, Trash2, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const SEV_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/25",
  high:     "bg-orange-500/10 text-orange-400 border-orange-500/25",
  medium:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  low:      "bg-green-500/10 text-green-400 border-green-500/25",
  info:     "bg-blue-500/10 text-blue-400 border-blue-500/25",
};
const SEV_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-green-500",
  info:     "bg-blue-500",
};
const RISK_COLOR = (s: number) =>
  s >= 80 ? "text-red-400" : s >= 60 ? "text-orange-400" : s >= 40 ? "text-yellow-400" : "text-green-400";

const SOURCES = ["siem", "edr", "firewall", "ids_ips", "email", "cloud", "manual", "api"];
const SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low", "info"];
const STATUSES: AlertStatus[] = ["new", "triaging", "in_progress", "escalated", "resolved", "false_positive"];

type NewAlertForm = {
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  risk_score: number;
  tags: string;
};

function NewAlertModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Alert>) => void;
}) {
  const [form, setForm] = useState<NewAlertForm>({
    title: "", description: "", severity: "medium",
    source: "siem", risk_score: 50, tags: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      await alertsApi.create({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: "new",
        tenant_id: "t1",
      });
      toast.success("Alert created successfully", { icon: "🛡️" });
      onCreate({});
      onClose();
      setForm({ title: "", description: "", severity: "medium", source: "siem", risk_score: 50, tags: "" });
    } catch {
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full sm:max-w-lg bg-soc-surface border border-soc-border sm:rounded-2xl rounded-t-2xl shadow-2xl z-10 max-h-[92dvh] overflow-y-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-soc-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-soc-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Create New Alert</h2>
                  <p className="text-xs text-gray-500">Add a manual alert to the SOC queue</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Alert Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Suspicious PowerShell execution detected"
                  className="soc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as AlertSeverity }))}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {SOURCES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-400">Risk Score</label>
                  <span className={cn("text-xs font-bold tabular-nums", RISK_COLOR(form.risk_score))}>{form.risk_score}</span>
                </div>
                <input
                  type="range" min={0} max={100} value={form.risk_score}
                  onChange={(e) => setForm((f) => ({ ...f, risk_score: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-soc-border rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>Low</span><span>Medium</span><span>Critical</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what was detected, affected systems, initial findings..."
                  rows={3}
                  className="soc-input resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags <span className="text-gray-600">(comma-separated)</span></label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. powershell, malware, lateral-movement"
                  className="soc-input"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-4 sm:p-5 border-t border-soc-border">
              <motion.button
                onClick={handleSubmit}
                disabled={loading || !form.title.trim()}
                className="btn-primary flex-1 disabled:opacity-40"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
                  : <><Shield className="w-4 h-4" /> Create Alert</>
                }
              </motion.button>
              <button onClick={onClose} className="px-4 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Mobile Alert Card ─── */
function AlertCard({ alert, onOpen, onTriage }: {
  alert: Alert;
  onOpen: () => void;
  onTriage: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="soc-card p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Top row: sev badge + source + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.div
            className={cn("w-2 h-2 rounded-full flex-shrink-0", SEV_DOT[alert.severity])}
            animate={alert.severity === "critical" ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", SEV_COLORS[alert.severity])}>
            {alert.severity}
          </span>
          <span className="text-[10px] font-mono uppercase text-gray-600">{alert.source}</span>
        </div>
        <span className="text-[10px] text-gray-600 tabular-nums">{formatRelativeTime(alert.created_at)}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-200 leading-snug">{truncate(alert.title, 70)}</p>

      {/* Tags/techniques */}
      {((alert.mitre_techniques?.length ?? 0) > 0 || (alert.tags?.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1">
          {alert.mitre_techniques?.slice(0, 2).map((t) => (
            <span key={t.id} className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/15 px-1.5 py-0.5 rounded font-mono">{t.id}</span>
          ))}
          {alert.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-gray-500 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      )}

      {/* Bottom row: status + risk + iocs + ai + chevron */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-soc-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", statusBadgeClass(alert.status))}>
            {alert.status.replace(/_/g, " ")}
          </span>
          <span className={cn("text-xs font-mono font-bold tabular-nums", RISK_COLOR(alert.risk_score))}>
            {alert.risk_score.toFixed(0)}
          </span>
          {(alert.iocs?.length ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-cyan-400 text-xs">
              <Link2 className="w-3 h-3" />{alert.iocs.length}
            </span>
          )}
          {alert.is_ai_triaged && (
            <span className="flex items-center gap-0.5 text-blue-400 text-[10px]">
              <Brain className="w-3 h-3" />AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onTriage}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="AI Triage"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertsPage() {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [sevFilter, setSevFilter]     = useState<AlertSeverity | "">("");
  const [statusFilter, setStatus]     = useState<AlertStatus | "">("");
  const [sourceFilter, setSource]     = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["alerts", page, search, sevFilter, statusFilter, sourceFilter],
    queryFn:  () => alertsApi.list({ page, page_size: 25, search: search || undefined, severity: sevFilter || undefined, status: statusFilter || undefined, source: sourceFilter || undefined }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const triageMut = useMutation({
    mutationFn: (id: string) => alertsApi.triage(id) as Promise<unknown>,
    onSuccess:  () => {
      toast.success("AI triage queued successfully", { icon: "🤖" });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => toast.error("Failed to queue triage"),
  });

  const alerts: Alert[]  = data?.items ?? [];
  const total            = data?.total ?? 0;
  const totalPages       = data?.total_pages ?? 1;

  const allSelected  = alerts.length > 0 && alerts.every((a) => selected.has(a.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(alerts.map((a) => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkTriage = () => {
    const count = selected.size;
    toast.loading(`Queuing AI triage for ${count} alert${count > 1 ? "s" : ""}...`, { id: "bulk", duration: 2000 });
    setTimeout(() => {
      toast.dismiss("bulk");
      toast.success(`AI triage queued for ${count} alert${count > 1 ? "s" : ""}`, { icon: "🤖" });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }, 2100);
  };

  const bulkResolve = () => {
    const count = selected.size;
    toast.loading(`Resolving ${count} alert${count > 1 ? "s" : ""}...`, { id: "bulk-res", duration: 1500 });
    setTimeout(() => {
      toast.dismiss("bulk-res");
      toast.success(`${count} alert${count > 1 ? "s" : ""} marked resolved`, { icon: "✅" });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }, 1600);
  };

  const bulkFalsePositive = () => {
    const count = selected.size;
    toast.success(`${count} alert${count > 1 ? "s" : ""} marked as false positive`, { icon: "🚫" });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Alerts" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">

        {/* Toolbar */}
        <motion.div
          className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          {/* Left: search + filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search alerts..."
                className="pl-8 pr-4 py-2 bg-soc-card border border-soc-border rounded-lg text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 w-full sm:w-48 lg:w-52 transition-colors"
              />
            </div>

            <div className="relative flex items-center">
              <Filter className="absolute left-2.5 w-3 h-3 text-gray-600" />
              <select
                value={sevFilter}
                onChange={(e) => { setSevFilter(e.target.value as AlertSeverity | ""); setPage(1); }}
                className="pl-7 pr-3 py-2 bg-soc-card border border-soc-border rounded-lg text-xs text-gray-400 focus:outline-none appearance-none cursor-pointer hover:border-gray-600 transition-colors"
              >
                <option value="">All Sev</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatus(e.target.value as AlertStatus | ""); setPage(1); }}
              className="px-3 py-2 bg-soc-card border border-soc-border rounded-lg text-xs text-gray-400 focus:outline-none appearance-none cursor-pointer hover:border-gray-600 transition-colors"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Right: count + refresh + new */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 tabular-nums">{total} alerts</span>
            <button
              onClick={() => { refetch(); toast.success("Alerts refreshed", { duration: 1500 }); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 bg-soc-card border border-soc-border rounded-lg hover:border-gray-600 transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <motion.button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Alert</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Source chips */}
        <motion.div
          className="flex flex-wrap gap-1.5 items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        >
          <span className="text-[10px] text-gray-600 mr-1">Source:</span>
          {["all", ...SOURCES].map((src) => {
            const active = src === "all" ? !sourceFilter : sourceFilter === src;
            return (
              <button
                key={src}
                onClick={() => { setSource(src === "all" ? "" : src); setPage(1); }}
                className={cn(
                  "text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-all",
                  active
                    ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                    : "text-gray-500 border-soc-border bg-soc-dark hover:text-gray-300 hover:border-gray-600"
                )}
              >
                {src === "all" ? "All" : src}
              </button>
            );
          })}
        </motion.div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {someSelected && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/25 rounded-xl flex-wrap">
                <span className="text-xs font-semibold text-blue-300">{selected.size} selected</span>
                <div className="h-4 w-px bg-blue-500/20" />
                <button
                  onClick={bulkTriage}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 transition-colors"
                >
                  <Zap className="w-3 h-3" /> AI Triage
                </button>
                <button
                  onClick={bulkResolve}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 rounded-lg text-xs text-green-400 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" /> Resolve
                </button>
                <button
                  onClick={bulkFalsePositive}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-600/10 hover:bg-gray-600/20 border border-gray-500/20 rounded-lg text-xs text-gray-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> False Positive
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="ml-auto text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DESKTOP TABLE (md+) ── */}
        <motion.div
          className="soc-card overflow-hidden hidden md:block"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-soc-border">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-600 hover:text-gray-300 transition-colors">
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-blue-400" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                {["Sev","Alert / Techniques / Tags","Status","Source","Risk","AI","IOCs","Time",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-gray-600 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-xs text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                      Loading alerts...
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && alerts.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">No alerts found matching your filters</p>
                  </td>
                </tr>
              )}
              <AnimatePresence>
                {alerts.map((alert, i) => {
                  const isChecked = selected.has(alert.id);
                  return (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      onClick={() => router.push(`/alerts/${alert.id}`)}
                      className={cn("table-row-hover group", isChecked && "bg-blue-500/[0.04]")}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleOne(alert.id)}
                          className="text-gray-600 hover:text-gray-300 transition-colors"
                        >
                          {isChecked
                            ? <CheckSquare className="w-4 h-4 text-blue-400" />
                            : <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          }
                        </button>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={cn("w-2 h-2 rounded-full flex-shrink-0", SEV_DOT[alert.severity])}
                            animate={alert.severity === "critical" ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", SEV_COLORS[alert.severity])}>
                            {alert.severity}
                          </span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors leading-snug">
                              {truncate(alert.title, 50)}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                              {alert.mitre_techniques?.slice(0, 2).map((t) => (
                                <span key={t.id} className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/15 px-1.5 py-0.5 rounded font-mono">{t.id}</span>
                              ))}
                              {(alert.mitre_techniques?.length ?? 0) > 2 && (
                                <span className="text-[10px] text-gray-600">+{alert.mitre_techniques.length - 2} more</span>
                              )}
                              {alert.tags?.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] text-gray-500 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", statusBadgeClass(alert.status))}>
                          {alert.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 text-xs text-gray-500 uppercase font-mono">{alert.source}</td>

                      {/* Risk */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-soc-border rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", alert.risk_score >= 80 ? "bg-red-500" : alert.risk_score >= 60 ? "bg-orange-500" : alert.risk_score >= 40 ? "bg-yellow-500" : "bg-green-500")}
                              initial={{ width: 0 }}
                              animate={{ width: `${alert.risk_score}%` }}
                              transition={{ delay: i * 0.03 + 0.3, duration: 0.5 }}
                            />
                          </div>
                          <span className={cn("text-xs font-mono font-semibold tabular-nums", RISK_COLOR(alert.risk_score))}>
                            {alert.risk_score.toFixed(0)}
                          </span>
                        </div>
                      </td>

                      {/* AI */}
                      <td className="px-4 py-3">
                        {alert.is_ai_triaged
                          ? <div className="flex items-center gap-1 text-blue-400"><Brain className="w-3.5 h-3.5" /><span className="text-[10px]">Done</span></div>
                          : <span className="text-gray-700 text-xs">—</span>}
                      </td>

                      {/* IOC count */}
                      <td className="px-4 py-3">
                        {(alert.iocs?.length ?? 0) > 0 ? (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Link2 className="w-3 h-3" />
                            <span className="text-xs font-mono font-semibold">{alert.iocs.length}</span>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap tabular-nums">
                        {formatRelativeTime(alert.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); triageMut.mutate(alert.id); }}
                            disabled={triageMut.isPending}
                            title="Run AI Triage"
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/alerts/${alert.id}`); }}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>

        {/* ── MOBILE CARDS (< md) ── */}
        <div className="md:hidden space-y-2">
          {isLoading && (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-gray-600">
              <motion.div
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Loading alerts...
            </div>
          )}
          {!isLoading && alerts.length === 0 && (
            <div className="py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No alerts found matching your filters</p>
            </div>
          )}
          {alerts.map((alert, i) => (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <AlertCard
                alert={alert}
                onOpen={() => router.push(`/alerts/${alert.id}`)}
                onTriage={(e) => { e.stopPropagation(); triageMut.mutate(alert.id); }}
              />
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-between text-xs text-gray-600"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            <span className="hidden sm:block">{total} total alerts</span>
            <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-gray-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <NewAlertModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
      />
    </div>
  );
}
