"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { cn } from "@/lib/utils";
import {
  BookOpen, Plus, Play, Edit, Trash2, X, Check,
  Zap, Clock, Activity, Shield, ChevronRight,
  AlertTriangle, CheckCircle, Cpu, GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";

type PlaybookStep = {
  id: string;
  order: number;
  action: string;
  type: "manual" | "automated" | "decision";
  timeout_minutes?: number;
};

type Playbook = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  category: string;
  steps: PlaybookStep[];
  executions: number;
  last_executed?: string;
  is_active: boolean;
  created_at: string;
};

const INITIAL_PLAYBOOKS: Playbook[] = [
  {
    id: "pb_001", name: "Ransomware Response", description: "Comprehensive ransomware containment and eradication procedure for P1 incidents.",
    trigger: "Severity Critical + Category Ransomware", category: "malware", executions: 12, is_active: true,
    last_executed: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    steps: [
      { id: "s1", order: 1, action: "Isolate affected hosts from network immediately", type: "automated" },
      { id: "s2", order: 2, action: "Notify IR team and CISO via PagerDuty", type: "automated" },
      { id: "s3", order: 3, action: "Preserve memory dump on affected systems", type: "manual", timeout_minutes: 30 },
      { id: "s4", order: 4, action: "Identify patient zero via EDR telemetry", type: "manual", timeout_minutes: 60 },
      { id: "s5", order: 5, action: "Block C2 IOCs at firewall and DNS", type: "automated" },
      { id: "s6", order: 6, action: "Initiate backup restoration process", type: "manual", timeout_minutes: 240 },
      { id: "s7", order: 7, action: "Verify clean state before re-connecting hosts", type: "decision" },
      { id: "s8", order: 8, action: "Generate incident report and post-mortem", type: "manual", timeout_minutes: 120 },
    ],
  },
  {
    id: "pb_002", name: "Phishing Containment", description: "End-to-end phishing email response from detection to user notification.",
    trigger: "Phishing verdict confirmed (confidence > 85%)", category: "phishing", executions: 47, is_active: true,
    last_executed: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    steps: [
      { id: "s1", order: 1, action: "Quarantine email from all mailboxes", type: "automated" },
      { id: "s2", order: 2, action: "Extract and block IOCs (domains, IPs, hashes)", type: "automated" },
      { id: "s3", order: 3, action: "Identify all recipients of the phishing email", type: "automated" },
      { id: "s4", order: 4, action: "Check if any users clicked the link", type: "manual", timeout_minutes: 20 },
      { id: "s5", order: 5, action: "Send user awareness notification", type: "automated" },
    ],
  },
  {
    id: "pb_003", name: "Insider Threat Investigation", description: "Confidential investigation procedure for suspected insider threat activity.",
    trigger: "Insider threat category + UEBA anomaly score > 80", category: "insider_threat", executions: 3, is_active: false,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    steps: [
      { id: "s1", order: 1, action: "Place legal hold on all digital evidence", type: "manual" },
      { id: "s2", order: 2, action: "Covertly monitor user activity (no alert)", type: "manual", timeout_minutes: 1440 },
      { id: "s3", order: 3, action: "Preserve logs and export for forensics", type: "automated" },
      { id: "s4", order: 4, action: "Notify HR and Legal teams (confidentially)", type: "manual" },
      { id: "s5", order: 5, action: "Revoke access at appropriate time", type: "decision" },
      { id: "s6", order: 6, action: "Document findings and initiate legal process", type: "manual" },
    ],
  },
  {
    id: "pb_004", name: "APT Detection Response", description: "Advanced persistent threat detection and nation-state actor response procedure.",
    trigger: "High severity + APT/Nation-state MITRE tactics", category: "apt", executions: 2, is_active: true,
    last_executed: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    steps: [
      { id: "s1", order: 1, action: "Activate incident commander and war room", type: "manual" },
      { id: "s2", order: 2, action: "Full network packet capture (strategic scope)", type: "automated" },
      { id: "s3", order: 3, action: "Threat intel correlation with known APT groups", type: "automated" },
      { id: "s4", order: 4, action: "Identify full scope — assume full compromise", type: "manual", timeout_minutes: 480 },
      { id: "s5", order: 5, action: "Notify CISA/law enforcement if applicable", type: "decision" },
      { id: "s6", order: 6, action: "Credential rotation for all privileged accounts", type: "manual" },
      { id: "s7", order: 7, action: "Network segmentation and rebuilding strategy", type: "manual" },
      { id: "s8", order: 8, action: "Engage external IR firm for independent forensics", type: "decision" },
      { id: "s9", order: 9, action: "Public/customer communication plan (if needed)", type: "manual" },
      { id: "s10", order: 10, action: "Post-incident MITRE coverage gap analysis", type: "automated" },
    ],
  },
  {
    id: "pb_005", name: "Data Breach Notification", description: "GDPR/CCPA-compliant breach notification and regulatory response workflow.",
    trigger: "Data breach confirmed + PII data affected", category: "data_breach", executions: 1, is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    steps: [
      { id: "s1", order: 1, action: "Determine scope: records affected, data types", type: "manual", timeout_minutes: 120 },
      { id: "s2", order: 2, action: "Legal and DPO notification", type: "manual" },
      { id: "s3", order: 3, action: "72-hour GDPR notification countdown (if EU data)", type: "automated" },
      { id: "s4", order: 4, action: "Prepare breach notification documentation", type: "manual", timeout_minutes: 240 },
      { id: "s5", order: 5, action: "Submit regulatory notification (ICO/FTC)", type: "manual" },
      { id: "s6", order: 6, action: "Notify affected individuals if required", type: "decision" },
    ],
  },
];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  malware:       { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
  phishing:      { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  insider_threat:{ bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  apt:           { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  data_breach:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
};

const STEP_TYPE_CONFIG = {
  manual:    { color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20", label: "Manual" },
  automated: { color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20",  label: "Auto" },
  decision:  { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",   label: "Decision" },
};

function formatRelativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Execute Modal ──
function ExecuteModal({ playbook, onClose }: { playbook: Playbook; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const simulate = async () => {
    setRunning(true);
    for (let i = 0; i < playbook.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setStep(i + 1);
    }
    setDone(true);
    setRunning(false);
    toast.success(`Playbook "${playbook.name}" executed successfully`, { icon: "⚡", duration: 4000 });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between p-5 border-b border-soc-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{playbook.name}</h2>
              <p className="text-xs text-gray-500">Execute playbook — {playbook.steps.length} steps</p>
            </div>
          </div>
          {!running && <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg transition-colors"><X className="w-4 h-4" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {playbook.steps.map((s, i) => {
              const status = i < step ? "done" : i === step && running ? "running" : "pending";
              const typeCfg = STEP_TYPE_CONFIG[s.type];
              return (
                <motion.div
                  key={s.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                    status === "done"    ? "bg-green-500/5 border-green-500/20" :
                    status === "running" ? "bg-blue-500/8 border-blue-500/30" :
                    "bg-soc-dark border-soc-border"
                  )}
                  initial={false}
                  animate={{ opacity: status === "pending" && running ? 0.4 : 1 }}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    status === "done"    ? "bg-green-500/20" :
                    status === "running" ? "bg-blue-500/20" :
                    "bg-soc-border"
                  )}>
                    {status === "done"    ? <Check className="w-3 h-3 text-green-400" /> :
                     status === "running" ? <motion.div className="w-2 h-2 bg-blue-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /> :
                     <span className="text-[10px] text-gray-600 font-bold">{i + 1}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium", status === "done" ? "text-gray-400 line-through" : status === "running" ? "text-white" : "text-gray-400")}>
                      {s.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", typeCfg.bg, typeCfg.color, typeCfg.border)}>{typeCfg.label}</span>
                      {s.timeout_minutes && <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{s.timeout_minutes}m</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-soc-border flex-shrink-0">
          {done ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400 text-sm flex-1">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">Execution complete!</span>
              </div>
              <button onClick={onClose} className="px-4 py-2.5 bg-soc-dark border border-soc-border text-gray-300 text-sm rounded-lg hover:border-gray-600 transition-colors">Close</button>
            </div>
          ) : (
            <motion.button
              onClick={simulate}
              disabled={running}
              className="btn-primary w-full disabled:opacity-40"
              style={{ background: running ? undefined : "linear-gradient(135deg, #16a34a, #15803d)" }}
              whileHover={{ scale: running ? 1 : 1.01 }}
              whileTap={{ scale: running ? 1 : 0.98 }}
            >
              {running
                ? <><motion.div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> Executing step {step + 1}/{playbook.steps.length}...</>
                : <><Play className="w-4 h-4" /> Execute Playbook</>
              }
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── New Playbook Modal ──
function NewPlaybookModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (pb: Playbook) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [category, setCategory] = useState("malware");
  const [steps, setSteps] = useState<PlaybookStep[]>([
    { id: `s${Date.now()}`, order: 1, action: "", type: "manual" },
  ]);
  const [loading, setLoading] = useState(false);

  const addStep = () => {
    setSteps((prev) => [...prev, { id: `s${Date.now()}`, order: prev.length + 1, action: "", type: "manual" }]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (id: string, field: keyof PlaybookStep, value: string) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Playbook name is required"); return; }
    if (steps.some((s) => !s.action.trim())) { toast.error("All steps must have an action"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const newPb: Playbook = {
      id: `pb_${Date.now()}`, name, description, trigger, category,
      steps: steps.filter((s) => s.action.trim()),
      executions: 0, is_active: true,
      created_at: new Date().toISOString(),
    };
    onCreate(newPb);
    toast.success(`Playbook "${name}" created successfully`, { icon: "📖" });
    onClose();
    setLoading(false);
    setName(""); setDescription(""); setTrigger(""); setCategory("malware");
    setSteps([{ id: `s${Date.now()}`, order: 1, action: "", type: "manual" }]);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-2xl bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-soc-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Create New Playbook</h2>
                  <p className="text-xs text-gray-500">Define automated response steps</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Playbook Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BEC Response" className="soc-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="soc-input appearance-none cursor-pointer">
                    {Object.keys(CAT_COLORS).map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of when and why to use this playbook" className="soc-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Trigger Condition</label>
                <input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="e.g. Severity = Critical AND category = ransomware" className="soc-input" />
              </div>

              {/* Steps builder */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-gray-400">Response Steps</label>
                  <button onClick={addStep} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add step
                  </button>
                </div>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 bg-soc-dark border border-soc-border rounded-xl">
                      <div className="flex items-center mt-2 text-gray-600">
                        <GripVertical className="w-3.5 h-3.5" />
                        <span className="text-[10px] w-4 text-center font-bold ml-0.5">{i + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          value={step.action}
                          onChange={(e) => updateStep(step.id, "action", e.target.value)}
                          placeholder={`Step ${i + 1} action...`}
                          className="soc-input text-xs py-2"
                        />
                        <div className="flex gap-2">
                          {(["manual", "automated", "decision"] as const).map((type) => {
                            const cfg = STEP_TYPE_CONFIG[type];
                            return (
                              <button
                                key={type}
                                onClick={() => updateStep(step.id, "type", type)}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded-lg border transition-all",
                                  step.type === type ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-soc-border/30 text-gray-600 border-soc-border hover:border-gray-600"
                                )}
                              >
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {steps.length > 1 && (
                        <button onClick={() => removeStep(step.id)} className="text-gray-700 hover:text-red-400 mt-2 transition-colors flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-soc-border flex-shrink-0">
              <motion.button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
                  : <><BookOpen className="w-4 h-4" /> Create Playbook</>
                }
              </motion.button>
              <button onClick={onClose} className="px-4 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [showNew, setShowNew] = useState(false);
  const [executeTarget, setExecuteTarget] = useState<Playbook | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setPlaybooks((prev) => prev.map((p) =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ));
    const pb = playbooks.find((p) => p.id === id);
    if (pb) {
      toast.success(`Playbook "${pb.name}" ${pb.is_active ? "deactivated" : "activated"}`, {
        icon: pb.is_active ? "⏸️" : "▶️",
      });
    }
  };

  const deletePlaybook = (id: string) => {
    const pb = playbooks.find((p) => p.id === id);
    setPlaybooks((prev) => prev.filter((p) => p.id !== id));
    if (pb) toast.success(`Playbook "${pb.name}" deleted`, { icon: "🗑️" });
  };

  const stats = {
    total: playbooks.length,
    active: playbooks.filter((p) => p.is_active).length,
    totalExecutions: playbooks.reduce((a, p) => a + p.executions, 0),
    steps: playbooks.reduce((a, p) => a + p.steps.length, 0),
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Playbooks" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Total Playbooks",    value: stats.total,           color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-l-cyan-500" },
            { label: "Active",             value: stats.active,          color: "text-green-400",  bg: "bg-green-500/10",  border: "border-l-green-500" },
            { label: "Total Executions",   value: stats.totalExecutions, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-l-blue-500" },
            { label: "Total Steps",        value: stats.steps,           color: "text-purple-400", bg: "bg-purple-500/10", border: "border-l-purple-500" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={cn("soc-card p-4 border-l-2", border)}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Automated response playbooks</span>
          </div>
          <motion.button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-3.5 h-3.5" /> New Playbook
          </motion.button>
        </motion.div>

        {/* Playbook cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {playbooks.map((pb, i) => {
            const catCfg = CAT_COLORS[pb.category] ?? CAT_COLORS.malware;
            const isExpanded = expandedId === pb.id;
            return (
              <motion.div
                key={pb.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                className={cn("soc-card transition-all", pb.is_active ? "" : "opacity-60")}
              >
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize", catCfg.bg, catCfg.text, catCfg.border)}>
                          {pb.category.replace(/_/g, " ")}
                        </span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          pb.is_active ? "text-green-400 bg-green-500/10" : "text-gray-500 bg-gray-500/10"
                        )}>
                          {pb.is_active ? "● Active" : "○ Inactive"}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{pb.name}</h3>
                      {pb.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pb.description}</p>}
                    </div>
                  </div>

                  {/* Trigger */}
                  {pb.trigger && (
                    <div className="flex items-start gap-2 mb-3 p-2.5 bg-soc-dark rounded-lg border border-soc-border">
                      <Zap className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-gray-400 leading-relaxed">{pb.trigger}</p>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{pb.steps.length} steps</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Play className="w-3.5 h-3.5" />
                      <span>{pb.executions} runs</span>
                    </div>
                    {pb.last_executed && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last: {formatRelativeTime(pb.last_executed)}</span>
                      </div>
                    )}
                  </div>

                  {/* Expand steps preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {pb.steps.map((s) => {
                            const typeCfg = STEP_TYPE_CONFIG[s.type];
                            return (
                              <div key={s.id} className="flex items-start gap-2.5 p-2 bg-soc-dark rounded-lg">
                                <span className="text-[10px] text-gray-600 font-bold w-4 mt-0.5 flex-shrink-0">{s.order}.</span>
                                <p className="text-xs text-gray-400 flex-1 leading-relaxed">{s.action}</p>
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                                  {typeCfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.button
                      onClick={() => { setExecuteTarget(pb); }}
                      disabled={!pb.is_active}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/15 hover:bg-green-600/25 disabled:opacity-30 text-green-400 text-xs font-medium rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all"
                      whileHover={{ scale: pb.is_active ? 1.02 : 1 }}
                      whileTap={{ scale: pb.is_active ? 0.98 : 1 }}
                    >
                      <Play className="w-3 h-3" /> Execute
                    </motion.button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : pb.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-soc-dark hover:bg-white/5 text-gray-400 hover:text-gray-200 text-xs font-medium rounded-lg border border-soc-border hover:border-gray-600 transition-all"
                    >
                      <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                      {isExpanded ? "Hide" : "Steps"}
                    </button>

                    <button
                      onClick={() => toggleActive(pb.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ml-auto",
                        pb.is_active
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                      )}
                    >
                      {pb.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => deletePlaybook(pb.id)}
                      className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {playbooks.length === 0 && (
          <motion.div className="soc-card p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No playbooks configured</p>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Create your first playbook
            </button>
          </motion.div>
        )}
      </div>

      <NewPlaybookModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={(pb) => setPlaybooks((prev) => [pb, ...prev])}
      />

      <AnimatePresence>
        {executeTarget && (
          <ExecuteModal playbook={executeTarget} onClose={() => setExecuteTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
