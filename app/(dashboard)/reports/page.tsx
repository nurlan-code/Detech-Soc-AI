"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { reportsApi } from "@/lib/api";
import { Report, ReportType } from "@/types";
import { Header } from "@/components/shared/Header";
import { cn, formatDate } from "@/lib/utils";
import {
  FileText, Plus, Download, Loader2, RefreshCw, X,
  BarChart2, Shield, AlertTriangle, TrendingUp, Calendar, FileCheck,
  Printer, Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const REPORT_TYPE_CONFIG: { value: ReportType; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { value: "executive_summary", label: "Executive Summary", icon: BarChart2,    color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { value: "incident_report",   label: "Incident Report",   icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  { value: "threat_intel",      label: "Threat Intel",      icon: Shield,        color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { value: "compliance",        label: "Compliance",        icon: FileCheck,     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  { value: "weekly",            label: "Weekly Report",     icon: Calendar,      color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { value: "monthly",           label: "Monthly Report",    icon: TrendingUp,    color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20" },
];

const STATUS_BADGE: Record<string, string> = {
  completed: "text-green-400 bg-green-500/10 border-green-500/20",
  generating: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  failed:     "text-red-400 bg-red-500/10 border-red-500/20",
};

function ReportViewerModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const typeCfg = REPORT_TYPE_CONFIG.find((c) => c.value === report.report_type);
  const Icon = typeCfg?.icon ?? FileText;

  const printReport = () => {
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; line-height: 1.6; }
          .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #1e3a8a; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          h1 { color: #1a1a2e; font-size: 24px; margin: 8px 0; }
          .meta { color: #6b7280; font-size: 12px; }
          .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
          .narrative { background: #f8fafc; border-left: 4px solid #1e3a8a; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
          .metric { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 20px; font-weight: 900; color: #1e3a8a; }
          .metric-label { font-size: 10px; color: #6b7280; text-transform: capitalize; margin-top: 2px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 10px; display: flex; justify-content: space-between; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛡️ Detech SOC AI — Security Operations Platform</div>
          <h1>${report.title}</h1>
          <div class="meta">
            <span class="badge">${report.report_type.replace(/_/g, ' ').toUpperCase()}</span>
            &nbsp;&nbsp;Generated: ${formatDate(report.created_at)} &nbsp;&nbsp; Status: ${report.status.toUpperCase()}
          </div>
        </div>

        ${report.ai_narrative ? `
        <div class="narrative">
          <strong>Executive Summary</strong><br/><br/>
          ${report.ai_narrative}
        </div>` : ''}

        ${report.metrics && Object.keys(report.metrics).length > 0 ? `
        <h2 style="color:#1e3a8a;font-size:14px;margin-top:24px;">Key Metrics</h2>
        <div class="metrics">
          ${Object.entries(report.metrics).map(([k, v]) => `
            <div class="metric">
              <div class="metric-value">${v}</div>
              <div class="metric-label">${k.replace(/_/g, ' ')}</div>
            </div>
          `).join('')}
        </div>` : ''}

        <div class="footer">
          <span>Confidential — Detech SOC AI Platform</span>
          <span>Report ID: ${report.id} | ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
    toast.success("Opening print dialog...", { icon: "🖨️", duration: 2000 });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-soc-card border border-soc-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 10 }}
      >
        {/* Modal header */}
        <div className="flex items-center gap-4 p-5 border-b border-soc-border flex-shrink-0">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", typeCfg?.bg ?? "bg-soc-dark", typeCfg?.border, "border")}>
            <Icon className={cn("w-5 h-5", typeCfg?.color ?? "text-gray-400")} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight">{report.title}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{report.report_type.replace(/_/g, " ")} · {formatDate(report.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={printReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600/15 hover:bg-green-600/25 text-green-400 text-xs font-semibold rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </motion.button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Document header */}
          <div className="border-b border-soc-border pb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase", STATUS_BADGE[report.status])}>
                {report.status}
              </span>
              <span className="text-[10px] text-gray-600 font-mono">ID: {report.id}</span>
            </div>
            <h1 className="text-xl font-black text-white leading-tight mb-1">{report.title}</h1>
            <p className="text-xs text-gray-500 capitalize">{report.report_type.replace(/_/g, " ")} · Generated {formatDate(report.created_at)}</p>
          </div>

          {/* Narrative */}
          {report.ai_narrative && (
            <div className="p-5 bg-blue-500/5 border border-blue-500/15 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-400">Executive Summary</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{report.ai_narrative}</p>
            </div>
          )}

          {/* Metrics grid */}
          {report.metrics && Object.keys(report.metrics).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(report.metrics).map(([k, v]) => (
                  <motion.div
                    key={k}
                    className="bg-soc-dark border border-soc-border rounded-xl p-4 text-center"
                    whileHover={{ scale: 1.02, borderColor: "rgba(59,130,246,0.3)" }}
                  >
                    <p className="text-2xl font-black text-white mb-1 tabular-nums">{String(v)}</p>
                    <p className="text-[10px] text-gray-500 capitalize leading-tight">{k.replace(/_/g, " ")}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Document sections (demo) */}
          <div className="space-y-4">
            {[
              { title: "Threat Landscape Overview", content: "During the reporting period, the organization's security posture was tested by multiple attack vectors. AI-powered triage successfully classified and prioritized all incoming alerts, reducing analyst workload by an estimated 40%." },
              { title: "Incident Response Performance", content: "Mean Time to Detect (MTTD) improved by 33% compared to the previous period. The automated playbook execution reduced containment time from an average of 4.2 hours to 2.8 hours." },
              { title: "Recommendations", content: "1. Expand MFA enforcement to all privileged accounts. 2. Complete cloud security posture assessment. 3. Conduct tabletop exercise for ransomware scenario. 4. Review and update detection rules for new MITRE ATT&CK techniques." },
            ].map(({ title, content }) => (
              <div key={title} className="p-4 bg-soc-dark border border-soc-border rounded-xl">
                <h4 className="text-xs font-semibold text-gray-300 mb-2">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-soc-border text-[10px] text-gray-700">
            <span>CONFIDENTIAL — Detech SOC AI Platform</span>
            <span>Report ID: {report.id}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [form, setForm] = useState({ title: "", report_type: "executive_summary" as ReportType });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
    refetchInterval: 15_000,
  });

  const createMut = useMutation({
    mutationFn: () => reportsApi.create(form) as Promise<unknown>,
    onSuccess: () => {
      toast.success("Report generation started — AI is compiling data", { icon: "📊", duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setShowCreate(false);
      setForm({ title: "", report_type: "executive_summary" });
    },
    onError: () => toast.error("Failed to create report"),
  });

  const openReport = (report: Report) => {
    if (report.status !== "completed") {
      toast("Report is still generating — check back soon", { icon: "⏳" });
      return;
    }
    setViewingReport(report);
    toast.success("Opening report viewer", { icon: "📄", duration: 1500 });
  };

  const reports: Report[] = data?.items ?? [];

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Reports" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

        {/* Toolbar */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">{data?.total ?? 0} reports</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { refetch(); toast.success("Reports refreshed", { duration: 1500 }); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 bg-soc-card border border-soc-border rounded-lg hover:border-gray-600 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <motion.button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-3.5 h-3.5" /> Generate Report
            </motion.button>
          </div>
        </motion.div>

        {/* Create modal (inline) */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="soc-card p-5 border-green-500/20"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Generate New Report</h3>
                  <p className="text-xs text-gray-500 mt-0.5">AI will compile and analyze security data</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">Report type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REPORT_TYPE_CONFIG.map(({ value, label, icon: Icon, color, bg }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, report_type: value }))}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left",
                        form.report_type === value
                          ? `${bg} ${color} border-current/30`
                          : "bg-soc-dark border-soc-border text-gray-500 hover:border-gray-600"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", form.report_type === value ? color : "text-gray-600")} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-400 mb-2">Report title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Q4 2024 Executive Security Summary..."
                  className="soc-input"
                />
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => createMut.mutate()}
                  disabled={createMut.isPending || !form.title.trim()}
                  className="btn-primary px-5 disabled:opacity-40"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {createMut.isPending ? "Generating..." : "Generate"}
                </motion.button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-2">
            <motion.div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
            Loading reports...
          </div>
        )}

        {/* Reports grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((report, i) => {
            const typeCfg = REPORT_TYPE_CONFIG.find((c) => c.value === report.report_type);
            const Icon = typeCfg?.icon ?? FileText;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                className="soc-card p-5 transition-all hover:border-gray-700 cursor-pointer"
                onClick={() => openReport(report)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white/5", typeCfg?.bg ?? "bg-soc-dark")}>
                    <Icon className={cn("w-5 h-5", typeCfg?.color ?? "text-gray-400")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1", STATUS_BADGE[report.status])}>
                      {report.status === "generating" && <motion.div className="w-2 h-2 border border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />}
                      {report.status}
                    </span>
                    {report.status === "completed" && (
                      <motion.div
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); openReport(report); }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-white mb-1 leading-snug">{report.title}</h3>
                <p className="text-[11px] text-gray-600 capitalize mb-3">{report.report_type.replace(/_/g, " ")}</p>

                {report.ai_narrative && (
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">{report.ai_narrative}</p>
                )}
                {report.status === "generating" && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ width: "50%" }}
                      />
                    </div>
                    <p className="text-[10px] text-blue-400 mt-1">AI generating report...</p>
                  </div>
                )}

                {/* Metrics */}
                {report.metrics && Object.keys(report.metrics).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {Object.entries(report.metrics).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="bg-soc-dark rounded-lg px-2 py-1.5">
                        <p className="text-xs font-semibold text-gray-200">{String(v)}</p>
                        <p className="text-[10px] text-gray-600 capitalize">{k.replace(/_/g, " ")}</p>
                      </div>
                    ))}
                  </div>
                )}

                {report.status === "completed" && (
                  <div className="flex items-center gap-1 mt-2">
                    <Download className="w-3 h-3 text-gray-600" />
                    <span className="text-[10px] text-gray-600">Click to view & export</span>
                  </div>
                )}

                <p className="text-[10px] text-gray-700 mt-1">{formatDate(report.created_at)}</p>
              </motion.div>
            );
          })}
        </div>

        {!isLoading && reports.length === 0 && !showCreate && (
          <motion.div className="soc-card p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No reports generated yet</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-5">
              <Plus className="w-4 h-4" /> Generate your first report
            </button>
          </motion.div>
        )}
      </div>

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {viewingReport && (
          <ReportViewerModal report={viewingReport} onClose={() => setViewingReport(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
