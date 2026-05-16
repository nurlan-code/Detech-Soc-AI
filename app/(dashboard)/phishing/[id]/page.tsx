"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { phishingApi } from "@/lib/api";
import { PhishingSubmission } from "@/types";
import { Header } from "@/components/shared/Header";
import { cn, formatDate } from "@/lib/utils";
import {
  ArrowLeft, Brain, AlertTriangle, Link2, ShieldAlert, CheckCircle,
  Clock, Mail, Shield, XCircle, Copy, Check, ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import toast from "react-hot-toast";
import { useState } from "react";

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ElementType; desc: string }> = {
  phishing:   { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    label: "PHISHING",   icon: ShieldAlert,   desc: "Confirmed phishing attempt detected" },
  suspicious: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "SUSPICIOUS", icon: AlertTriangle,  desc: "Suspicious content flagged for review" },
  clean:      { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  label: "CLEAN",      icon: CheckCircle,   desc: "No phishing indicators found" },
  unknown:    { color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30",   label: "UNKNOWN",    icon: Clock,         desc: "Analysis inconclusive" },
};

const INDICATOR_SEVERITY: Record<string, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  low:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

const SPF_DKIM_COLOR = (val: string) =>
  val === "pass" ? "text-green-400 bg-green-500/10 border-green-500/20"
  : val === "fail" ? "text-red-400 bg-red-500/10 border-red-500/20"
  : "text-gray-400 bg-gray-500/10 border-gray-500/20";

export default function PhishingDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: sub, isLoading } = useQuery<PhishingSubmission>({
    queryKey: ["phishing", id],
    queryFn: () => phishingApi.get(id).then((r) => r.data),
    refetchInterval: (query) => (query.state.data as PhishingSubmission | undefined)?.status === "analyzing" ? 3000 : false,
  });

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); toast.success("Copied", { duration: 1200 });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (isLoading) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center gap-3 text-gray-600">
        <motion.div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
        Loading analysis...
      </div>
    </div>
  );

  if (!sub) return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Submission not found</p>
          <button onClick={() => router.push("/phishing")} className="mt-4 text-xs text-blue-400 hover:text-blue-300">← Back to Phishing</button>
        </div>
      </div>
    </div>
  );

  const vcfg = VERDICT_CONFIG[sub.verdict] ?? VERDICT_CONFIG.unknown;
  const VIcon = vcfg.icon;

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Breadcrumb */}
          <motion.button
            onClick={() => router.push("/phishing")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-200 text-xs transition-colors group"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Phishing Analysis
          </motion.button>

          {/* Analyzing banner */}
          <AnimatePresence>
            {sub.status === "analyzing" && (
              <motion.div
                className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <motion.div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"
                  animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                <p className="text-xs text-blue-400">AI is analyzing this email — auto-refreshing results...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verdict hero */}
          <motion.div
            className={cn("soc-card p-6 border", vcfg.border, vcfg.bg)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <motion.div
                className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border flex-shrink-0", vcfg.bg, vcfg.border)}
                initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <VIcon className={cn("w-8 h-8", vcfg.color)} />
              </motion.div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className={cn("text-xl font-black px-3 py-1 rounded-xl border", vcfg.color, vcfg.bg, vcfg.border)}>
                    {vcfg.label}
                  </span>
                  <span className="text-xs text-gray-500">{vcfg.desc}</span>
                </div>
                {sub.subject && <p className="text-sm font-semibold text-white mb-1">{sub.subject}</p>}
                {sub.sender  && <p className="text-xs text-gray-500 font-mono">{sub.sender}</p>}
              </div>

              <div className="flex gap-6 flex-shrink-0">
                <div className="text-center">
                  <p className={cn("text-4xl font-black font-mono leading-none",
                    sub.risk_score >= 80 ? "text-red-400" : sub.risk_score >= 50 ? "text-orange-400" : "text-green-400"
                  )}>
                    {sub.risk_score.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">Risk Score</p>
                  <div className="w-16 h-1 bg-soc-dark rounded-full mt-1.5 overflow-hidden mx-auto">
                    <motion.div
                      className={cn("h-full rounded-full", sub.risk_score >= 80 ? "bg-red-500" : sub.risk_score >= 50 ? "bg-orange-500" : "bg-green-500")}
                      initial={{ width: 0 }} animate={{ width: `${sub.risk_score}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black font-mono text-gray-200 leading-none">
                    {(sub.confidence_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">Confidence</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">

              {/* AI Analysis */}
              {sub.ai_analysis && (
                <motion.div
                  className="soc-card p-4 border-blue-500/20"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-blue-400">AI Analysis</h3>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  </div>
                  <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown>{sub.ai_analysis}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* Phishing Indicators */}
              {sub.phishing_indicators?.length > 0 && (
                <motion.div
                  className="soc-card p-4 border-orange-500/15"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-orange-400">Phishing Indicators</h3>
                    <span className="ml-auto text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {sub.phishing_indicators.length} found
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sub.phishing_indicators.map((ind, i) => (
                      <motion.div
                        key={i}
                        className="flex gap-3 p-3 rounded-xl bg-soc-dark border border-soc-border"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.17 + i * 0.04 }}
                      >
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border flex-shrink-0 h-fit", INDICATOR_SEVERITY[ind.severity] ?? "text-gray-400 bg-gray-500/10 border-gray-500/20")}>
                          {ind.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-200 font-semibold mb-0.5">{ind.type}</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{ind.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Extracted URLs */}
              {sub.extracted_urls?.length > 0 && (
                <motion.div
                  className="soc-card p-4 border-blue-500/15"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-blue-400">Extracted URLs</h3>
                    <span className="ml-auto text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {sub.extracted_urls.length} URLs
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {sub.extracted_urls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-soc-dark border border-soc-border group hover:border-blue-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        <p className="text-[11px] font-mono text-gray-400 flex-1 truncate group-hover:text-blue-400 transition-colors">{url}</p>
                        <button onClick={() => copyText(url, `url-${i}`)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5">
                          {copied === `url-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Submission info */}
              <motion.div
                className="soc-card p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Submission Details</h3>
                {[
                  ["Status",    sub.status],
                  ["Submitted", formatDate(sub.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-soc-border last:border-0">
                    <span className="text-[10px] text-gray-600 font-medium">{label}</span>
                    <span className="text-[10px] text-gray-300 capitalize font-mono">{value}</span>
                  </div>
                ))}
                {sub.subject && (
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-600 font-medium mb-1">Subject</p>
                    <p className="text-[11px] text-gray-300 leading-snug">{sub.subject}</p>
                  </div>
                )}
                {sub.sender && (
                  <div>
                    <p className="text-[10px] text-gray-600 font-medium mb-1">Sender</p>
                    <p className="text-[11px] text-gray-400 font-mono break-all">{sub.sender}</p>
                  </div>
                )}
              </motion.div>

              {/* Email Authentication */}
              {sub.spf_dkim_dmarc && (
                <motion.div
                  className="soc-card p-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-3.5 h-3.5 text-gray-500" />
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email Authentication</h3>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(sub.spf_dkim_dmarc).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">{key}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase", SPF_DKIM_COLOR(val as string))}>
                          {val as string}
                        </span>
                      </div>
                    ))}
                  </div>
                  {Object.values(sub.spf_dkim_dmarc).some((v) => v === "fail") && (
                    <div className="mt-3 p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                      <p className="text-[10px] text-red-400">Authentication failures indicate possible spoofing or domain impersonation</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                className="soc-card p-4 space-y-2"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              >
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
                {[
                  { label: "Quarantine Email",    icon: Mail,          action: () => toast.success("Email quarantined successfully", { icon: "🔒", duration: 3000 }) },
                  { label: "Block Sender Domain", icon: ShieldAlert,   action: () => toast.success("Sender domain blocked in email gateway", { icon: "🛡️", duration: 3000 }) },
                  { label: "Create Alert",        icon: AlertTriangle, action: () => toast.success("Alert created from phishing submission", { icon: "🚨", duration: 3000 }) },
                  { label: "Report as False Positive", icon: CheckCircle, action: () => toast("Marked as false positive — improving AI model", { icon: "🔕", duration: 3000 }) },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-soc-dark border border-soc-border hover:border-gray-600 text-xs text-gray-400 hover:text-gray-200 transition-all text-left"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
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
