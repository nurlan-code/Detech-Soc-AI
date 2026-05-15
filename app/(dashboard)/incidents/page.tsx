"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { incidentsApi } from "@/lib/api";
import { Incident, IncidentSeverity, IncidentCategory } from "@/types";
import { Header } from "@/components/shared/Header";
import { cn, statusBadgeClass, formatRelativeTime, truncate } from "@/lib/utils";
import {
  Plus, RefreshCw, Flame, Shield, Clock,
  AlertTriangle, ChevronRight, Activity, X, Tags,
} from "lucide-react";
import toast from "react-hot-toast";

const SEV_COLORS: Record<string, { dot: string; card: string; glow: string }> = {
  critical: { dot: "bg-red-500",    card: "border-l-red-500",    glow: "bg-red-500/5" },
  high:     { dot: "bg-orange-500", card: "border-l-orange-500", glow: "bg-orange-500/5" },
  medium:   { dot: "bg-yellow-500", card: "border-l-yellow-500", glow: "bg-yellow-500/5" },
  low:      { dot: "bg-green-500",  card: "border-l-green-500",  glow: "bg-green-500/5" },
};

const CAT_ICONS: Record<string, React.ElementType> = {
  ransomware:          Flame,
  apt:                 Shield,
  data_breach:         AlertTriangle,
  phishing:            Activity,
  insider_threat:      AlertTriangle,
  malware:             Flame,
  ddos:                Activity,
  unauthorized_access: Shield,
  supply_chain:        Shield,
  other:               Shield,
};

const SEVERITIES: IncidentSeverity[] = ["critical", "high", "medium", "low"];
const CATEGORIES: IncidentCategory[] = [
  "malware", "ransomware", "phishing", "data_breach",
  "insider_threat", "ddos", "apt", "unauthorized_access", "supply_chain", "other",
];

type IncidentWithCount = Incident & { alert_count?: number };

type NewIncidentForm = {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  affected_assets: string;
  attack_vector: string;
  tags: string;
};

function NewIncidentModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  const [form, setForm] = useState<NewIncidentForm>({
    title: "", description: "", severity: "high", category: "malware",
    affected_assets: "", attack_vector: "", tags: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      await incidentsApi.create({
        ...form,
        status: "open",
        tenant_id: "t1",
        risk_score: form.severity === "critical" ? 95 : form.severity === "high" ? 80 : form.severity === "medium" ? 60 : 40,
        affected_assets: form.affected_assets.split(",").map((a) => a.trim()).filter(Boolean),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        timeline: [],
        iocs: [],
        remediation_steps: [],
        mitre_attack_chain: {},
      });
      toast.success("Incident created and IR team notified", { icon: "🔥", duration: 4000 });
      onCreate();
      onClose();
      setForm({ title: "", description: "", severity: "high", category: "malware", affected_assets: "", attack_vector: "", tags: "" });
    } catch {
      toast.error("Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-lg bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-soc-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Open New Incident</h2>
                  <p className="text-xs text-gray-500">Declare and track a security incident</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Incident Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Ransomware attack on Finance department"
                  className="soc-input"
                />
              </div>

              {/* Severity + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as IncidentSeverity }))}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as IncidentCategory }))}
                    className="soc-input appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>

              {/* Attack Vector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Attack Vector</label>
                <input
                  value={form.attack_vector}
                  onChange={(e) => setForm((f) => ({ ...f, attack_vector: e.target.value }))}
                  placeholder="e.g. Phishing email with malicious macro"
                  className="soc-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the incident, timeline, impact, and initial findings..."
                  rows={3}
                  className="soc-input resize-none"
                />
              </div>

              {/* Affected Assets */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Affected Assets <span className="text-gray-600">(comma-separated)</span></label>
                <input
                  value={form.affected_assets}
                  onChange={(e) => setForm((f) => ({ ...f, affected_assets: e.target.value }))}
                  placeholder="e.g. WS-FIN-022, FILESERVER01, DC01"
                  className="soc-input"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags <span className="text-gray-600">(comma-separated)</span></label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. ransomware, p1, active"
                  className="soc-input"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-5 border-t border-soc-border flex-shrink-0">
              <motion.button
                onClick={handleSubmit}
                disabled={loading || !form.title.trim()}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
                  : <><Flame className="w-4 h-4" /> Open Incident</>
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

export default function IncidentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["incidents", page],
    queryFn: () => incidentsApi.list({ page, page_size: 20 }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const incidents: IncidentWithCount[] = data?.items ?? [];
  const total     = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const summaryStats = {
    open:          incidents.filter((i) => i.status === "open").length,
    critical:      incidents.filter((i) => i.severity === "critical").length,
    slaBreached:   incidents.filter((i) => i.sla_breach).length,
    investigating: incidents.filter((i) => i.status === "investigating").length,
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Incidents" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Summary bar */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        >
          {[
            { label: "Open",          value: summaryStats.open,          color: "text-orange-400", bg: "bg-orange-500/10", border: "border-l-orange-500" },
            { label: "Critical",      value: summaryStats.critical,      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-l-red-500" },
            { label: "SLA Breached",  value: summaryStats.slaBreached,   color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-l-rose-500" },
            { label: "Investigating", value: summaryStats.investigating,  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-l-blue-500" },
          ].map((s) => (
            <div key={s.label} className={cn("soc-card p-3 border-l-2", s.border)}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={cn("text-2xl font-black tabular-nums", s.color)}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-400">{total} total incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetch(); toast.success("Incidents refreshed", { duration: 1500 }); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 bg-soc-card border border-soc-border rounded-lg hover:border-gray-600 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <motion.button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-3.5 h-3.5" /> New Incident
            </motion.button>
          </div>
        </motion.div>

        {/* Incident cards */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-2">
            <motion.div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
            Loading incidents...
          </div>
        )}

        {!isLoading && incidents.length === 0 && (
          <div className="soc-card p-12 text-center">
            <Flame className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No incidents found</p>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Open your first incident
            </button>
          </div>
        )}

        <div className="space-y-3">
          {incidents.map((inc, i) => {
            const sevStyle  = SEV_COLORS[inc.severity] ?? SEV_COLORS.low;
            const CatIcon   = CAT_ICONS[inc.category ?? "other"] ?? Shield;
            return (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                whileHover={{ y: -1, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                onClick={() => router.push(`/incidents/${inc.id}`)}
                className={cn("soc-card p-5 border-l-2 cursor-pointer group transition-all", sevStyle.card)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", sevStyle.glow, "border border-white/5")}>
                    <CatIcon className={cn("w-5 h-5", inc.severity === "critical" ? "text-red-400" : inc.severity === "high" ? "text-orange-400" : inc.severity === "medium" ? "text-yellow-400" : "text-green-400")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded border font-bold uppercase",
                            inc.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/25"
                            : inc.severity === "high"   ? "bg-orange-500/10 text-orange-400 border-orange-500/25"
                            : inc.severity === "medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                            : "bg-green-500/10 text-green-400 border-green-500/25"
                          )}>
                            {inc.severity}
                          </span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", statusBadgeClass(inc.status))}>
                            {inc.status.replace(/_/g, " ")}
                          </span>
                          {inc.category && (
                            <span className="text-[10px] text-gray-600 uppercase font-mono">{inc.category.replace(/_/g, " ")}</span>
                          )}
                          {inc.sla_breach && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />SLA Breach
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-100 group-hover:text-white transition-colors truncate">
                          {truncate(inc.title, 70)}
                        </h3>
                        {inc.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{inc.description}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className={cn("text-2xl font-black tabular-nums", inc.risk_score >= 80 ? "text-red-400" : inc.risk_score >= 60 ? "text-orange-400" : "text-yellow-400")}>
                          {inc.risk_score.toFixed(0)}
                        </p>
                        <p className="text-[10px] text-gray-600">risk score</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-soc-border/50">
                      <div className="flex items-center gap-4">
                        {inc.affected_assets?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1">
                              {inc.affected_assets.slice(0, 3).map((asset) => (
                                <span key={asset} className="text-[10px] text-gray-500 bg-soc-dark border border-soc-border px-2 py-0.5 rounded font-mono">{asset}</span>
                              ))}
                              {inc.affected_assets.length > 3 && <span className="text-[10px] text-gray-600">+{inc.affected_assets.length - 3}</span>}
                            </div>
                          </div>
                        )}
                        {(inc as IncidentWithCount).alert_count !== undefined && (
                          <span className="text-[10px] text-gray-600">{(inc as IncidentWithCount).alert_count} alerts linked</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 tabular-nums">{formatRelativeTime(inc.created_at)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{total} total</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors">← Prev</button>
              <span className="px-3 py-1.5 text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      <NewIncidentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={() => queryClient.invalidateQueries({ queryKey: ["incidents"] })}
      />
    </div>
  );
}
