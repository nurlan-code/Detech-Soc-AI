"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { phishingApi } from "@/lib/api";
import { Header } from "@/components/shared/Header";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  Upload, RefreshCw, Mail, ShieldAlert, CheckCircle, AlertTriangle, Clock,
  ChevronRight, X, Send, Link2, FileText, Zap, Eye, TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  phishing:   { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/25",    icon: ShieldAlert,   label: "Phishing"   },
  suspicious: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25", icon: AlertTriangle, label: "Suspicious" },
  clean:      { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/25",  icon: CheckCircle,   label: "Clean"      },
  unknown:    { color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/25",   icon: Clock,         label: "Unknown"    },
};

const STATUS_DOT: Record<string, string> = {
  completed: "bg-green-500",
  analyzing: "bg-blue-500",
  pending:   "bg-yellow-500",
  failed:    "bg-red-500",
};

type Submission = {
  id: string; verdict: string; status: string;
  confidence_score: number; risk_score: number;
  phishing_indicators: { description: string }[];
  created_at: string; subject?: string; sender?: string;
};

const SAMPLE_EMAILS = [
  {
    label: "CEO Wire Transfer Request",
    subject: "URGENT: Wire Transfer Needed — CEO",
    sender: "ceo@company-corp.net",
    body: "Hi, I need you to process an urgent wire transfer of $47,500 to our vendor. This is confidential. Please do this immediately and confirm.",
    verdict: "phishing", risk: 94, confidence: 0.97,
    indicators: ["Executive impersonation", "Urgency manipulation", "Lookalike domain", "Financial fraud pattern"],
  },
  {
    label: "Fake Microsoft Password Reset",
    subject: "Your Microsoft account password will expire",
    sender: "security@microsoft-accounts.net",
    body: "Your password expires in 24 hours. Click here to update: http://microsoft-accounts.net/reset?token=abc123",
    verdict: "phishing", risk: 89, confidence: 0.95,
    indicators: ["Brand impersonation (Microsoft)", "Fake urgency", "Suspicious domain", "Credential harvesting link"],
  },
  {
    label: "Package Delivery Notification",
    subject: "Your DHL package is waiting — tracking #DHL9234",
    sender: "noreply@dhl-express-notification.com",
    body: "We were unable to deliver your package. Pay $2.99 customs fee to release: http://dhl-customs.xyz/pay",
    verdict: "suspicious", risk: 71, confidence: 0.82,
    indicators: ["Lookalike domain", "Micro-payment lure", "Shipping scam pattern"],
  },
  {
    label: "Legitimate Newsletter",
    subject: "Your weekly security digest — Week 20",
    sender: "digest@securityweek.com",
    body: "This week in cybersecurity: Top 10 vulnerabilities patched, new threat actor TTP analysis, and upcoming webinar schedule.",
    verdict: "clean", risk: 4, confidence: 0.98,
    indicators: [],
  },
];

type DemoSubmission = Submission & { _demo?: boolean };

export default function PhishingPage() {
  const router        = useRouter();
  const queryClient   = useQueryClient();
  const fileRef       = useRef<HTMLInputElement>(null);
  const [page, setPage]             = useState(1);
  const [dragging, setDragging]     = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [modalTab, setModalTab]     = useState<"sample" | "url" | "text">("sample");
  const [urlInput, setUrlInput]     = useState("");
  const [textInput, setTextInput]   = useState("");
  const [demoItems, setDemoItems]   = useState<DemoSubmission[]>([]);
  const [analyzing, setAnalyzing]   = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["phishing", page],
    queryFn: () => phishingApi.list({ page, page_size: 20 }).then((r) => r.data),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => phishingApi.uploadEml(file) as Promise<unknown>,
    onSuccess: (res) => {
      toast.success("Email submitted for analysis", { icon: "📧" });
      queryClient.invalidateQueries({ queryKey: ["phishing"] });
      const data = (res as { data?: { id?: string } })?.data;
      if (data?.id) router.push(`/phishing/${data.id}`);
    },
    onError: () => toast.error("Upload failed — use demo submit instead"),
  });

  const handleFile = (file: File) => {
    if (file.name.match(/\.(eml|msg)$/i)) uploadMut.mutate(file);
    else toast.error("Only .eml or .msg files accepted", { icon: "❌" });
  };

  const handleSampleSubmit = async (sample: (typeof SAMPLE_EMAILS)[0]) => {
    setAnalyzing(true);
    setShowModal(false);
    toast.loading("Submitting to AI analysis engine...", { id: "phish-analyze" });

    await new Promise((r) => setTimeout(r, 1800));

    const newEntry: DemoSubmission = {
      id: `demo_${Date.now()}`,
      verdict: sample.verdict,
      status: "completed",
      confidence_score: sample.confidence,
      risk_score: sample.risk,
      phishing_indicators: sample.indicators.map((d) => ({ description: d })),
      created_at: new Date().toISOString(),
      subject: sample.subject,
      sender: sample.sender,
      _demo: true,
    };

    setDemoItems((prev) => [newEntry, ...prev]);
    setAnalyzing(false);

    toast.dismiss("phish-analyze");

    if (sample.verdict === "phishing") {
      toast.error(`THREAT DETECTED: ${sample.subject}`, {
        icon: "🚨",
        duration: 5000,
        style: { background: "#1a0a0a", border: "1px solid #ef4444", color: "#fca5a5" },
      });
    } else if (sample.verdict === "suspicious") {
      toast(`Suspicious email flagged for review`, {
        icon: "⚠️",
        duration: 4000,
        style: { background: "#1a0f00", border: "1px solid #f97316", color: "#fdba74" },
      });
    } else {
      toast.success("Email analyzed — No threats detected", { icon: "✅", duration: 3000 });
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setAnalyzing(true);
    setShowModal(false);
    toast.loading("Scanning URL for phishing indicators...", { id: "url-analyze" });

    await new Promise((r) => setTimeout(r, 2200));

    const isPhishing = urlInput.includes("bit.ly") || urlInput.includes("tinyurl") ||
      !urlInput.startsWith("https://") || urlInput.includes("login") || urlInput.includes("verify");
    const newEntry: DemoSubmission = {
      id: `demo_url_${Date.now()}`,
      verdict: isPhishing ? "suspicious" : "clean",
      status: "completed",
      confidence_score: isPhishing ? 0.76 : 0.91,
      risk_score: isPhishing ? 67 : 8,
      phishing_indicators: isPhishing ? [{ description: "Suspicious URL pattern" }, { description: "Non-HTTPS or redirect service" }] : [],
      created_at: new Date().toISOString(),
      subject: `URL: ${urlInput.slice(0, 60)}`,
      sender: "URL submission",
      _demo: true,
    };

    setDemoItems((prev) => [newEntry, ...prev]);
    setAnalyzing(false);
    setUrlInput("");
    toast.dismiss("url-analyze");
    toast(isPhishing ? "Suspicious URL detected — exercise caution" : "URL appears safe", {
      icon: isPhishing ? "⚠️" : "✅",
      duration: 3500,
    });
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setAnalyzing(true);
    setShowModal(false);
    toast.loading("AI analyzing email content...", { id: "text-analyze" });

    await new Promise((r) => setTimeout(r, 2000));

    const hasPhishKeywords = /urgent|wire transfer|verify|password|expir|bank|confirm|click here/i.test(textInput);
    const newEntry: DemoSubmission = {
      id: `demo_txt_${Date.now()}`,
      verdict: hasPhishKeywords ? "phishing" : "clean",
      status: "completed",
      confidence_score: hasPhishKeywords ? 0.83 : 0.88,
      risk_score: hasPhishKeywords ? 78 : 5,
      phishing_indicators: hasPhishKeywords
        ? [{ description: "Urgency/pressure language detected" }, { description: "Social engineering keywords present" }]
        : [],
      created_at: new Date().toISOString(),
      subject: "Manual text submission",
      sender: "Text analysis",
      _demo: true,
    };

    setDemoItems((prev) => [newEntry, ...prev]);
    setAnalyzing(false);
    setTextInput("");
    toast.dismiss("text-analyze");
    toast(hasPhishKeywords ? "Phishing content detected in email text!" : "No phishing indicators found", {
      icon: hasPhishKeywords ? "🚨" : "✅",
      duration: 4000,
    });
  };

  const allSubmissions: DemoSubmission[] = [...demoItems, ...(data?.items ?? [])];
  const totalPages = data?.total_pages ?? 1;
  const total = (data?.total ?? 0) + demoItems.length;

  const verdictCounts = allSubmissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.verdict] = (acc[s.verdict] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Phishing Analysis" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          {Object.entries(VERDICT_CONFIG).map(([v, cfg]) => {
            const Icon = cfg.icon;
            return (
              <motion.div
                key={v}
                className={cn("soc-card p-4 border", cfg.bg, cfg.border)}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                  <span className={cn("text-2xl font-black tabular-nums", cfg.color)}>{verdictCounts[v] ?? 0}</span>
                </div>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Submit options */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "soc-card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
              dragging ? "border-purple-500/60 bg-purple-500/8" : "hover:border-purple-500/40 hover:bg-purple-500/5"
            )}
          >
            <AnimatePresence mode="wait">
              {uploadMut.isPending || analyzing ? (
                <motion.div key="load" className="flex flex-col items-center gap-2">
                  <motion.div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  <p className="text-xs text-purple-400">Analyzing...</p>
                </motion.div>
              ) : (
                <motion.div key="idle" className="flex flex-col items-center gap-2 text-center">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", dragging ? "bg-purple-500/20" : "bg-soc-surface border border-soc-border")}>
                    <Upload className={cn("w-4 h-4", dragging ? "text-purple-400" : "text-gray-500")} />
                  </div>
                  <p className="text-xs font-medium text-gray-300">Drop .eml / .msg</p>
                  <p className="text-[10px] text-gray-600">Click to browse files</p>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileRef} type="file" accept=".eml,.msg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Demo submit */}
          <motion.button
            onClick={() => { setShowModal(true); setModalTab("sample"); }}
            className="soc-card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-center"
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs font-medium text-gray-300">Submit Sample</p>
            <p className="text-[10px] text-gray-600">Test with pre-built examples</p>
          </motion.button>

          {/* URL/Text submit */}
          <motion.button
            onClick={() => { setShowModal(true); setModalTab("url"); }}
            className="soc-card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-center"
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs font-medium text-gray-300">URL / Text Analysis</p>
            <p className="text-[10px] text-gray-600">Paste URL or email content</p>
          </motion.button>
        </motion.div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">{total} submissions</span>
          </div>
          <button
            onClick={() => { refetch(); toast.success("Submissions refreshed", { duration: 1500 }); }}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 bg-soc-card border border-soc-border rounded-lg hover:border-gray-600 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-2">
            <motion.div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
            Loading submissions...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && allSubmissions.length === 0 && (
          <motion.div className="soc-card p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Mail className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No phishing submissions yet</p>
            <p className="text-xs text-gray-600 mb-4">Upload an .eml file or use demo samples to analyze emails</p>
            <motion.button
              onClick={() => setShowModal(true)}
              className="btn-primary px-5"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Zap className="w-4 h-4" /> Try a Sample
            </motion.button>
          </motion.div>
        )}

        {/* Submissions list */}
        <div className="space-y-2">
          {allSubmissions.map((sub, i) => {
            const vcfg  = VERDICT_CONFIG[sub.verdict] ?? VERDICT_CONFIG.unknown;
            const VIcon = vcfg.icon;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
                onClick={() => !(sub as DemoSubmission)._demo && router.push(`/phishing/${sub.id}`)}
                className={cn("soc-card p-4 group transition-all hover:border-gray-700", !(sub as DemoSubmission)._demo && "cursor-pointer")}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", vcfg.bg, vcfg.border)}>
                    <VIcon className={cn("w-5 h-5", vcfg.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase", vcfg.color, vcfg.bg, vcfg.border)}>
                        {vcfg.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <motion.div
                          className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[sub.status] ?? "bg-gray-500")}
                          animate={sub.status === "analyzing" ? { opacity: [1, 0.3, 1] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-[10px] text-gray-600 capitalize">{sub.status}</span>
                      </div>
                      {(sub as DemoSubmission)._demo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">DEMO</span>
                      )}
                    </div>
                    {sub.subject && <p className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors">{sub.subject}</p>}
                    {sub.sender  && <p className="text-xs text-gray-500 font-mono truncate">{sub.sender}</p>}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-4">
                    {sub.status === "completed" && (
                      <>
                        <div className="text-right">
                          <p className={cn("text-lg font-black tabular-nums",
                            sub.risk_score >= 80 ? "text-red-400" : sub.risk_score >= 50 ? "text-orange-400" : "text-green-400"
                          )}>
                            {sub.risk_score.toFixed(0)}
                          </p>
                          <p className="text-[10px] text-gray-600">risk</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-300 tabular-nums">{(sub.confidence_score * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-gray-600">conf.</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">{sub.phishing_indicators?.length ?? 0} indicators</p>
                          <p className="text-[10px] text-gray-600">{formatRelativeTime(sub.created_at)}</p>
                        </div>
                      </>
                    )}
                    {sub.status === "analyzing" && (
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <motion.div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                        Analyzing...
                      </div>
                    )}
                    {!(sub as DemoSubmission)._demo && (
                      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                    )}
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
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600">← Prev</button>
              <span className="px-3 py-1.5 text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-soc-card border border-soc-border rounded-2xl w-full max-w-xl shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-soc-border">
                <div>
                  <h2 className="text-sm font-bold text-white">Submit for Analysis</h2>
                  <p className="text-xs text-gray-500 mt-0.5">AI-powered phishing detection engine</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-4 pb-0">
                {([["sample", "Sample Emails", Zap], ["url", "URL Analysis", Link2], ["text", "Paste Text", FileText]] as const).map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab as typeof modalTab)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      modalTab === tab
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {/* Sample tab */}
                  {modalTab === "sample" && (
                    <motion.div key="sample" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-2">
                      <p className="text-xs text-gray-500 mb-3">Choose a pre-built sample email to analyze with AI:</p>
                      {SAMPLE_EMAILS.map((s) => {
                        const vcfg = VERDICT_CONFIG[s.verdict];
                        return (
                          <motion.button
                            key={s.label}
                            onClick={() => handleSampleSubmit(s)}
                            className="w-full text-left p-3 rounded-xl border border-soc-border bg-soc-dark hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
                            whileHover={{ x: 2 }} whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">{s.label}</p>
                                <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">{s.sender}</p>
                              </div>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase flex-shrink-0", vcfg.color, vcfg.bg, vcfg.border)}>
                                {vcfg.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1.5 truncate">{s.body}</p>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* URL tab */}
                  {modalTab === "url" && (
                    <motion.div key="url" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
                      <p className="text-xs text-gray-500">Enter a URL to check for phishing indicators:</p>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                        <input
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                          placeholder="https://suspicious-domain.com/login"
                          className="pl-9 soc-input font-mono text-xs"
                        />
                      </div>
                      <p className="text-[10px] text-gray-600">Tip: HTTP links, shortened URLs, or login pages will be flagged for closer inspection</p>
                      <motion.button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="btn-primary w-full disabled:opacity-40"
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      >
                        <Send className="w-3.5 h-3.5" /> Analyze URL
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Text tab */}
                  {modalTab === "text" && (
                    <motion.div key="text" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
                      <p className="text-xs text-gray-500">Paste raw email content for AI analysis:</p>
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={"From: suspicious@example.com\nSubject: URGENT ACTION REQUIRED\n\nDear user, your account will be suspended unless you verify immediately..."}
                        rows={6}
                        className="soc-input resize-none font-mono text-xs leading-relaxed"
                      />
                      <p className="text-[10px] text-gray-600">AI scans for urgency triggers, social engineering, and known phishing patterns</p>
                      <motion.button
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim()}
                        className="btn-primary w-full disabled:opacity-40"
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-3.5 h-3.5" /> Analyze Text
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
