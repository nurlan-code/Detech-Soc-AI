"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { incidentsApi } from "@/lib/api";
import { Incident } from "@/types";
import { Header } from "@/components/shared/Header";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { cn, statusBadgeClass, formatDate, riskScoreColor } from "@/lib/utils";
import {
  ArrowLeft, Brain, Shield, Clock, Server, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Flame, Users, Tag,
  ChevronRight, Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function IncidentDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "remediation">("overview");

  const { data: incident, isLoading } = useQuery<Incident>({
    queryKey: ["incident", id],
    queryFn: () => incidentsApi.get(id).then((r) => r.data),
  });

  const closeMut = useMutation({
    mutationFn: () => incidentsApi.close(id) as Promise<unknown>,
    onMutate: () => toast.loading("Closing incident...", { id: "close-inc" }),
    onSuccess: () => {
      toast.dismiss("close-inc");
      toast.success("Incident closed — post-mortem report queued", { icon: "📋", duration: 4000 });
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
    },
    onError: () => { toast.dismiss("close-inc"); toast.error("Failed to close incident"); },
  });

  if (isLoading) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center gap-3 text-gray-600">
        <motion.div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
        Loading incident...
      </div>
    </div>
  );

  if (!incident) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Incident not found</p>
          <button onClick={() => router.push("/incidents")} className="mt-4 text-xs text-blue-400 hover:text-blue-300">← Back to Incidents</button>
        </div>
      </div>
    </div>
  );

  const riskBg = incident.risk_score >= 80
    ? "bg-red-500/10 border-red-500/20"
    : incident.risk_score >= 60
      ? "bg-orange-500/10 border-orange-500/20"
      : "bg-green-500/10 border-green-500/20";

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Breadcrumb */}
          <motion.button
            onClick={() => router.push("/incidents")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-200 text-xs transition-colors group"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Incidents
          </motion.button>

          {/* SLA Breach Banner */}
          {incident.sla_breach && (
            <motion.div
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
              />
              <p className="text-xs text-red-400 font-semibold">SLA BREACH — Response time exceeded. Escalate immediately.</p>
            </motion.div>
          )}

          {/* Header card */}
          <motion.div
            className="soc-card p-5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <SeverityBadge severity={incident.severity} />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", statusBadgeClass(incident.status))}>
                    {incident.status.replace("_", " ").toUpperCase()}
                  </span>
                  {incident.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 bg-gray-700/30 text-gray-400 font-medium capitalize">
                      {incident.category.replace("_", " ")}
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-white leading-tight mb-2">{incident.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
                  <span className="font-mono bg-soc-dark border border-soc-border px-2 py-0.5 rounded">{incident.id}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(incident.created_at)}</span>
                  {incident.occurred_at && <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Occurred: {formatDate(incident.occurred_at)}</span>}
                </div>
              </div>

              {/* Risk + Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={cn("text-center px-4 py-2 rounded-xl border", riskBg)}>
                  <p className="text-[10px] text-gray-600 mb-1">Risk</p>
                  <p className={cn("text-3xl font-black font-mono leading-none", riskScoreColor(incident.risk_score))}>
                    {incident.risk_score.toFixed(0)}
                  </p>
                </div>
                {incident.status !== "closed" && (
                  <motion.button
                    onClick={() => closeMut.mutate()}
                    disabled={closeMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-700/60 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 border border-gray-600/50"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    {closeMut.isPending
                      ? <motion.div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      : <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    }
                    Close Incident
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="flex gap-1 bg-soc-card border border-soc-border rounded-xl p-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          >
            {([
              ["overview", "Overview", Brain],
              ["timeline", "Timeline", Clock],
              ["remediation", "Remediation", CheckCircle],
            ] as const).map(([tab, label, Icon]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                  activeTab === tab
                    ? "bg-soc-dark text-white border border-soc-border shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-5"
              >
                {/* Left */}
                <div className="lg:col-span-2 space-y-4">
                  {incident.description && (
                    <div className="soc-card p-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">{incident.description}</p>
                    </div>
                  )}

                  {incident.ai_summary && (
                    <div className="soc-card p-4 border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Brain className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-blue-400">AI Analysis</h3>
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto"
                          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      </div>
                      <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown>{incident.ai_summary}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {incident.attack_vector && (
                    <div className="soc-card p-4 border-orange-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-orange-400">Attack Vector</h3>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{incident.attack_vector}</p>
                    </div>
                  )}

                  {incident.business_impact && (
                    <div className="soc-card p-4 border-yellow-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-yellow-400">Business Impact</h3>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{incident.business_impact}</p>
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="space-y-4">
                  <div className="soc-card p-4 space-y-3">
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
                    {[
                      ["Category", incident.category?.replace("_", " ") ?? "—"],
                      ["Status", incident.status.replace("_", " ")],
                      ["Severity", incident.severity],
                      ...(incident.occurred_at ? [["Occurred", formatDate(incident.occurred_at)]] as const : []),
                      ...(incident.closed_at ? [["Closed", formatDate(incident.closed_at)]] as const : []),
                      ["Created", formatDate(incident.created_at)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center py-1 border-b border-soc-border last:border-0">
                        <span className="text-[10px] text-gray-600 font-medium">{label}</span>
                        <span className="text-[10px] text-gray-300 capitalize font-mono">{value}</span>
                      </div>
                    ))}
                  </div>

                  {incident.affected_assets?.length > 0 && (
                    <div className="soc-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Server className="w-3.5 h-3.5 text-gray-500" />
                        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Affected Assets</h3>
                        <span className="ml-auto text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                          {incident.affected_assets.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {incident.affected_assets.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-soc-dark border border-soc-border">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                            <p className="text-[11px] text-gray-300 font-mono truncate">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incident.mitre_attack_chain?.tactics && incident.mitre_attack_chain.tactics.length > 0 && (
                    <div className="soc-card p-4 border-purple-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <h3 className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">MITRE Chain</h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {incident.mitre_attack_chain.tactics.map((t, i) => (
                          <div key={t} className="flex items-center gap-1">
                            <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md font-medium">{t}</span>
                            {i < (incident.mitre_attack_chain?.tactics?.length ?? 0) - 1 && <ChevronRight className="w-3 h-3 text-gray-700" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="soc-card p-4 space-y-2">
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                    {[
                      { label: "Assign Analyst", icon: Users, color: "text-blue-400", action: () => toast("Analyst assignment coming soon", { icon: "👤" }) },
                      { label: "Link Alert",     icon: Activity,    color: "text-cyan-400",  action: () => toast("Alert linking coming soon", { icon: "🔗" }) },
                      { label: "Generate Report",icon: RefreshCw,   color: "text-green-400", action: () => toast.success("Report queued for generation", { icon: "📄" }) },
                    ].map(({ label, icon: Icon, color, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-soc-dark border border-soc-border hover:border-gray-600 text-xs text-gray-400 hover:text-gray-200 transition-all text-left"
                      >
                        <Icon className={cn("w-3.5 h-3.5", color)} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {incident.timeline?.length > 0 ? (
                  <div className="soc-card p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-200">Incident Timeline</h3>
                      <span className="ml-auto text-xs text-gray-600">{incident.timeline.length} events</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-soc-border" />
                      <div className="space-y-4">
                        {incident.timeline.map((event, i) => (
                          <motion.div
                            key={i}
                            className="flex gap-4 pl-6 relative"
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          >
                            <div className="absolute left-0 w-3.5 h-3.5 rounded-full bg-blue-500/20 border-2 border-blue-500/50 top-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-600 mb-1 tabular-nums">{formatDate(event.timestamp)}</p>
                              <p className="text-sm text-gray-300 leading-relaxed">{event.event}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="soc-card p-12 text-center">
                    <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No timeline events recorded yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "remediation" && (
              <motion.div key="remediation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {incident.remediation_steps?.length > 0 ? (
                  <div className="soc-card p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-semibold text-gray-200">Remediation Steps</h3>
                      <span className="ml-auto text-xs text-gray-600">{incident.remediation_steps.length} steps</span>
                    </div>
                    <div className="space-y-3">
                      {incident.remediation_steps.map((step, i) => (
                        <motion.div
                          key={i}
                          className="flex gap-4 p-4 rounded-xl bg-soc-dark border border-soc-border hover:border-green-500/20 transition-colors"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        >
                          <div className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] text-green-400 font-bold">{step.priority}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-200 font-medium leading-snug">{step.action}</p>
                            {step.rationale && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.rationale}</p>}
                          </div>
                          <button
                            onClick={() => toast.success(`Step ${step.priority} marked as done`, { icon: "✅", duration: 2000 })}
                            className="flex-shrink-0 w-7 h-7 rounded-lg border border-soc-border bg-soc-card hover:bg-green-500/10 hover:border-green-500/30 flex items-center justify-center transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-gray-600 hover:text-green-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="soc-card p-12 text-center">
                    <CheckCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No remediation steps defined</p>
                    <button
                      onClick={() => toast.success("AI remediation suggestions queued", { icon: "🤖" })}
                      className="mt-4 btn-primary px-4"
                    >
                      <Brain className="w-3.5 h-3.5" /> Generate with AI
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
