"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { alertsApi } from "@/lib/api";
import { Alert } from "@/types";
import { Header } from "@/components/shared/Header";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { cn, statusBadgeClass, formatDate, riskScoreColor } from "@/lib/utils";
import {
  ArrowLeft, Brain, Zap, ChevronUp, Shield, AlertTriangle,
  Copy, Check, Tag, Clock, Server, Hash, Globe, Mail,
  CheckCircle, XCircle, RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

const IOC_ICON: Record<string, React.ElementType> = {
  hash: Hash, ip: Globe, domain: Globe, url: Globe, email: Mail,
};

export default function AlertDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: alert, isLoading } = useQuery<Alert>({
    queryKey: ["alert", id],
    queryFn: () => alertsApi.get(id).then((r) => r.data),
  });

  const triageMut = useMutation({
    mutationFn: () => alertsApi.triage(id) as Promise<unknown>,
    onMutate: () => toast.loading("Running AI triage analysis...", { id: "triage" }),
    onSuccess: () => {
      toast.dismiss("triage");
      toast.success("AI triage complete — summary updated", { icon: "🤖", duration: 3500 });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
    onError: () => { toast.dismiss("triage"); toast.error("Triage failed — check API connection"); },
  });

  const escalateMut = useMutation({
    mutationFn: () => alertsApi.escalate(id) as Promise<unknown>,
    onMutate: () => toast.loading("Escalating to incident...", { id: "escalate" }),
    onSuccess: () => {
      toast.dismiss("escalate");
      toast.success("Alert escalated — IR team notified", {
        icon: "🔥",
        duration: 4500,
        style: { background: "#1a0800", border: "1px solid #f97316", color: "#fed7aa" },
      });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
    onError: () => { toast.dismiss("escalate"); toast.error("Escalation failed"); },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success("Copied to clipboard", { duration: 1500 });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (isLoading) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center gap-3 text-gray-600">
        <motion.div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
        Loading alert...
      </div>
    </div>
  );

  if (!alert) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Alert not found</p>
          <button onClick={() => router.push("/alerts")} className="mt-4 text-xs text-blue-400 hover:text-blue-300">← Back to Alerts</button>
        </div>
      </div>
    </div>
  );

  const riskColor = alert.risk_score >= 80 ? "text-red-400" : alert.risk_score >= 60 ? "text-orange-400" : alert.risk_score >= 40 ? "text-yellow-400" : "text-green-400";
  const riskBg    = alert.risk_score >= 80 ? "bg-red-500/10 border-red-500/20" : alert.risk_score >= 60 ? "bg-orange-500/10 border-orange-500/20" : "bg-green-500/10 border-green-500/20";

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Breadcrumb */}
          <motion.button
            onClick={() => router.push("/alerts")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-200 text-xs transition-colors group"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Alerts
          </motion.button>

          {/* Header card */}
          <motion.div
            className="soc-card p-5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <SeverityBadge severity={alert.severity} />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", statusBadgeClass(alert.status))}>
                    {alert.status.replace("_", " ").toUpperCase()}
                  </span>
                  {alert.is_ai_triaged && (
                    <motion.span
                      className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Brain className="w-3 h-3" /> AI Triaged
                    </motion.span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-white leading-tight mb-2">{alert.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
                  <span className="font-mono bg-soc-dark border border-soc-border px-2 py-0.5 rounded">{alert.id}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(alert.created_at)}</span>
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" />{alert.source.toUpperCase()}</span>
                  {alert.source_ref && <span className="font-mono">{alert.source_ref}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  onClick={() => triageMut.mutate()}
                  disabled={triageMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 border border-blue-500/30"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  {triageMut.isPending
                    ? <motion.div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    : <Zap className="w-3.5 h-3.5" />
                  }
                  Re-Triage
                </motion.button>
                <motion.button
                  onClick={() => escalateMut.mutate()}
                  disabled={escalateMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 border border-orange-500/30"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  {escalateMut.isPending
                    ? <motion.div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    : <ChevronUp className="w-3.5 h-3.5" />
                  }
                  Escalate
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">

              {/* AI Summary */}
              <AnimatePresence>
                {alert.ai_summary && (
                  <motion.div
                    className="soc-card p-4 border-blue-500/20"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-blue-400">AI Triage Summary</h3>
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown>{alert.ai_summary}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Recommendation */}
              {alert.ai_recommendation && (
                <motion.div
                  className="soc-card p-4 border-green-500/20"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-green-500/15 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-green-400">Recommended Actions</h3>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{alert.ai_recommendation}</p>
                </motion.div>
              )}

              {/* Description */}
              {alert.description && (
                <motion.div
                  className="soc-card p-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{alert.description}</p>
                </motion.div>
              )}

              {/* MITRE ATT&CK */}
              {(alert.mitre_tactics?.length > 0 || alert.mitre_techniques?.length > 0) && (
                <motion.div
                  className="soc-card p-4 border-purple-500/15"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-purple-400">MITRE ATT&CK</h3>
                  </div>
                  <div className="space-y-3">
                    {alert.mitre_tactics?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-2">Tactics</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.mitre_tactics.map((t) => (
                            <span key={t} className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {alert.mitre_techniques?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-2">Techniques</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.mitre_techniques.map((t) => (
                            <span key={t.id} className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg font-mono">
                              {t.id} — {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* IOCs */}
              {alert.iocs?.length > 0 && (
                <motion.div
                  className="soc-card p-4 border-orange-500/15"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-orange-400">Indicators of Compromise</h3>
                    <span className="ml-auto text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {alert.iocs.length} IOCs
                    </span>
                  </div>
                  <div className="space-y-2">
                    {alert.iocs.map((ioc, i) => {
                      const IocIcon = IOC_ICON[ioc.type] ?? Hash;
                      const key = `ioc-${i}`;
                      return (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-soc-dark border border-soc-border group hover:border-orange-500/20 transition-colors"
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.03 }}
                        >
                          <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md uppercase font-bold w-16 justify-center flex-shrink-0">
                            <IocIcon className="w-2.5 h-2.5" /> {ioc.type}
                          </span>
                          <code className="text-xs text-gray-300 font-mono flex-1 truncate">{ioc.value}</code>
                          {ioc.context && <span className="text-[10px] text-gray-600 hidden sm:block">{ioc.context}</span>}
                          <button
                            onClick={() => copyToClipboard(ioc.value, key)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-blue-400 text-gray-600"
                          >
                            {copied === key ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Risk Score */}
              <motion.div
                className={cn("soc-card p-5 text-center border", riskBg)}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              >
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-semibold">Risk Score</p>
                <motion.p
                  className={cn("text-6xl font-black font-mono leading-none", riskColor)}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {alert.risk_score.toFixed(0)}
                </motion.p>
                <p className="text-xs text-gray-600 mt-2">/ 100</p>
                <div className="mt-3 h-1.5 bg-soc-dark rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", alert.risk_score >= 80 ? "bg-red-500" : alert.risk_score >= 60 ? "bg-orange-500" : "bg-green-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${alert.risk_score}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Metadata */}
              <motion.div
                className="soc-card p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              >
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
                {[
                  ["Source",    alert.source.toUpperCase()],
                  ["Severity",  alert.severity],
                  ["Status",    alert.status.replace("_", " ")],
                  ...(alert.source_ref ? [["Reference", alert.source_ref]] as const : []),
                  ...(alert.occurred_at ? [["Occurred", formatDate(alert.occurred_at)]] as const : []),
                  ["Created",   formatDate(alert.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-soc-border last:border-0">
                    <span className="text-[10px] text-gray-600 font-medium">{label}</span>
                    <span className="text-[10px] text-gray-300 capitalize font-mono">{value}</span>
                  </div>
                ))}
              </motion.div>

              {/* Tags */}
              {alert.tags?.length > 0 && (
                <motion.div
                  className="soc-card p-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3 h-3 text-gray-600" />
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-soc-dark border border-soc-border rounded-md text-gray-400 font-mono hover:border-gray-600 transition-colors cursor-default">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick actions */}
              <motion.div
                className="soc-card p-4 space-y-2"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              >
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                {[
                  { label: "Mark Resolved",   icon: CheckCircle, color: "text-green-400", action: () => toast.success("Alert marked as resolved", { icon: "✅" }) },
                  { label: "False Positive",  icon: XCircle,     color: "text-gray-400",  action: () => toast("Marked as false positive", { icon: "🔕", duration: 2000 }) },
                  { label: "Reassign",        icon: RefreshCw,   color: "text-blue-400",  action: () => toast("Reassignment modal coming soon", { icon: "👤" }) },
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
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
