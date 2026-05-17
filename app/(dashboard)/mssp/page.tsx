"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { cn } from "@/lib/utils";
import {
  Building2, Plus, Users, AlertTriangle, Flame,
  X, ChevronRight, Shield, Activity, CheckCircle,
  Globe, Zap, Settings, Trash2, BarChart2, Eye,
} from "lucide-react";
import toast from "react-hot-toast";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "suspended";
  alerts: number;
  incidents: number;
  analysts: number;
  country: string;
  industry: string;
  joinedAt: string;
  healthScore: number;
};

const INITIAL_TENANTS: Tenant[] = [
  { id: "t1", name: "Acme Corp",       slug: "acme",       plan: "enterprise",   status: "active",    alerts: 124, incidents: 3,  analysts: 8,  country: "US",  industry: "Manufacturing",   joinedAt: "2024-01-15", healthScore: 94 },
  { id: "t2", name: "TechStart Inc",   slug: "techstart",  plan: "professional", status: "active",    alerts: 45,  incidents: 1,  analysts: 3,  country: "CA",  industry: "Technology",      joinedAt: "2024-03-22", healthScore: 88 },
  { id: "t3", name: "MegaBank",        slug: "megabank",   plan: "enterprise",   status: "active",    alerts: 890, incidents: 12, analysts: 15, country: "UK",  industry: "Finance",         joinedAt: "2023-11-01", healthScore: 97 },
  { id: "t4", name: "RetailCo",        slug: "retailco",   plan: "starter",      status: "trial",     alerts: 12,  incidents: 0,  analysts: 2,  country: "AU",  industry: "Retail",          joinedAt: "2024-12-01", healthScore: 72 },
  { id: "t5", name: "HealthShield",    slug: "healthshield",plan: "professional",status: "active",    alerts: 67,  incidents: 2,  analysts: 5,  country: "DE",  industry: "Healthcare",      joinedAt: "2024-06-10", healthScore: 91 },
  { id: "t6", name: "EnergyGrid Ltd",  slug: "energygrid", plan: "enterprise",   status: "active",    alerts: 203, incidents: 5,  analysts: 10, country: "US",  industry: "Energy/OT",       joinedAt: "2024-02-28", healthScore: 89 },
  { id: "t7", name: "LogiTrans",       slug: "logitrans",  plan: "starter",      status: "suspended", alerts: 8,   incidents: 0,  analysts: 1,  country: "FR",  industry: "Logistics",       joinedAt: "2024-09-05", healthScore: 45 },
];

const PLAN_CONFIG = {
  enterprise:   { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  professional: { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
  starter:      { bg: "bg-gray-500/10",   text: "text-gray-400",   border: "border-gray-500/20" },
};

const STATUS_CONFIG = {
  active:    { bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-500" },
  trial:     { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  suspended: { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-500" },
};

const HEALTH_COLOR = (score: number) =>
  score >= 90 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
const HEALTH_BG = (score: number) =>
  score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500";

function AddTenantModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (t: Tenant) => void;
}) {
  const [form, setForm] = useState({
    name: "", slug: "", plan: "starter" as Tenant["plan"],
    country: "US", industry: "", contactEmail: "", contactName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Tenant name is required"); return; }
    if (!form.slug.trim()) { toast.error("Tenant slug is required"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const newTenant: Tenant = {
      id: `t${Date.now()}`, name: form.name, slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
      plan: form.plan, status: "trial", alerts: 0, incidents: 0, analysts: 0,
      country: form.country, industry: form.industry, joinedAt: new Date().toISOString().split("T")[0],
      healthScore: 100,
    };
    onCreate(newTenant);
    toast.success(`Tenant "${form.name}" provisioned successfully!`, { icon: "🏢", duration: 4000 });
    onClose();
    setLoading(false);
    setForm({ name: "", slug: "", plan: "starter", country: "US", industry: "", contactEmail: "", contactName: "" });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-lg bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-soc-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Add New Tenant</h2>
                  <p className="text-xs text-gray-500">Provision a new managed organization</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization Name *</label>
                  <input value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })); }} placeholder="e.g. Acme Corp" className="soc-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Slug (URL) *</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="acme-corp" className="soc-input font-mono text-xs" />
                </div>
              </div>

              {/* Plan selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["starter", "professional", "enterprise"] as const).map((plan) => {
                    const cfg = PLAN_CONFIG[plan];
                    return (
                      <button
                        key={plan}
                        onClick={() => setForm((f) => ({ ...f, plan }))}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all",
                          form.plan === plan ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "bg-soc-dark border-soc-border text-gray-500 hover:border-gray-600"
                        )}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
                  <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="soc-input appearance-none cursor-pointer">
                    {["US", "UK", "CA", "AU", "DE", "FR", "JP", "SG", "UAE", "NL"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Industry</label>
                  <input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Finance, Healthcare" className="soc-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Name</label>
                  <input value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="John Smith" className="soc-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@company.com" className="soc-input" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-soc-border flex-shrink-0">
              <motion.button
                onClick={handleCreate}
                disabled={loading || !form.name.trim() || !form.slug.trim()}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Provisioning...</>
                  : <><Building2 className="w-4 h-4" /> Add Tenant</>
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

function ManageTenantModal({ tenant, onClose, onUpdate, onDelete }: {
  tenant: Tenant;
  onClose: () => void;
  onUpdate: (t: Tenant) => void;
  onDelete: (id: string) => void;
}) {
  const [status, setStatus] = useState(tenant.status);
  const [plan, setPlan] = useState(tenant.plan);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    onUpdate({ ...tenant, status, plan });
    toast.success(`${tenant.name} updated successfully`, { icon: "✅" });
    setSaving(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete(tenant.id);
    toast.success(`Tenant "${tenant.name}" removed`, { icon: "🗑️" });
    onClose();
  };

  const statusCfg = STATUS_CONFIG[status];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-soc-border">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div>
                <h2 className="text-sm font-semibold text-white">{tenant.name}</h2>
                <p className="text-xs text-gray-500 font-mono">{tenant.slug}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Alerts",    value: tenant.alerts,    color: "text-orange-400" },
                { label: "Incidents", value: tenant.incidents, color: "text-red-400" },
                { label: "Analysts",  value: tenant.analysts,  color: "text-blue-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="soc-card p-3 text-center">
                  <p className={cn("text-xl font-black tabular-nums", color)}>{value}</p>
                  <p className="text-[10px] text-gray-600">{label}</p>
                </div>
              ))}
            </div>

            {/* Health */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Health Score</span>
                <span className={cn("text-sm font-bold tabular-nums", HEALTH_COLOR(tenant.healthScore))}>{tenant.healthScore}%</span>
              </div>
              <div className="h-2 bg-soc-border rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", HEALTH_BG(tenant.healthScore))}
                  initial={{ width: 0 }}
                  animate={{ width: `${tenant.healthScore}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Status change */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
              <div className="flex gap-2">
                {(["active", "trial", "suspended"] as const).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-all",
                        status === s ? `${cfg.bg} ${cfg.text}` : "bg-soc-dark border-soc-border text-gray-500 hover:border-gray-600"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan change */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Plan</label>
              <div className="flex gap-2">
                {(["starter", "professional", "enterprise"] as const).map((p) => {
                  const cfg = PLAN_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-all",
                        plan === p ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "bg-soc-dark border-soc-border text-gray-500 hover:border-gray-600"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-5 border-t border-soc-border">
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
            <button onClick={handleDelete} className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 hover:border-red-500/35 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="px-3 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MSSPPage() {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [showAdd, setShowAdd] = useState(false);
  const [managingTenant, setManagingTenant] = useState<Tenant | null>(null);

  const stats = {
    total:      tenants.length,
    alerts:     tenants.reduce((a, t) => a + t.alerts, 0),
    incidents:  tenants.reduce((a, t) => a + t.incidents, 0),
    analysts:   tenants.reduce((a, t) => a + t.analysts, 0),
    active:     tenants.filter((t) => t.status === "active").length,
    avgHealth:  Math.round(tenants.reduce((a, t) => a + t.healthScore, 0) / tenants.length),
  };

  const handleUpdate = (updated: Tenant) => {
    setTenants((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  };

  const handleDelete = (id: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="MSSP Management" />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5">

        {/* Stats */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          {[
            { label: "Tenants",       value: stats.total,     color: "text-indigo-400", border: "border-l-indigo-500" },
            { label: "Active",        value: stats.active,    color: "text-green-400",  border: "border-l-green-500" },
            { label: "Total Alerts",  value: stats.alerts,    color: "text-orange-400", border: "border-l-orange-500" },
            { label: "Incidents",     value: stats.incidents, color: "text-red-400",    border: "border-l-red-500" },
            { label: "Analysts",      value: stats.analysts,  color: "text-blue-400",   border: "border-l-blue-500" },
            { label: "Avg Health",    value: `${stats.avgHealth}%`, color: HEALTH_COLOR(stats.avgHealth), border: "border-l-cyan-500" },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={cn("soc-card p-3 border-l-2", border)}>
              <p className="text-[10px] text-gray-500 mb-1">{label}</p>
              <p className={cn("text-xl font-black tabular-nums", color)}>{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-400">{tenants.length} managed organizations</span>
          </div>
          <motion.button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Tenant
          </motion.button>
        </motion.div>

        {/* Tenant cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.map((tenant, i) => {
            const planCfg = PLAN_CONFIG[tenant.plan];
            const statusCfg = STATUS_CONFIG[tenant.status];

            return (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
                className="soc-card p-5 hover:border-gray-600 transition-all group"
                whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
                      {tenant.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{tenant.name}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize", planCfg.bg, planCfg.text, planCfg.border)}>
                      {tenant.plan}
                    </span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1", statusCfg.bg, statusCfg.text)}>
                      <motion.div
                        className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)}
                        animate={tenant.status === "active" ? { opacity: [1, 0.4, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {tenant.status}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-3 mb-4 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{tenant.country}</span>
                  {tenant.industry && <span>• {tenant.industry}</span>}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-soc-dark rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-orange-400 tabular-nums">{tenant.alerts}</p>
                    <p className="text-[9px] text-gray-600">Alerts</p>
                  </div>
                  <div className="bg-soc-dark rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-red-400 tabular-nums">{tenant.incidents}</p>
                    <p className="text-[9px] text-gray-600">Incidents</p>
                  </div>
                  <div className="bg-soc-dark rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-blue-400 tabular-nums">{tenant.analysts}</p>
                    <p className="text-[9px] text-gray-600">Analysts</p>
                  </div>
                </div>

                {/* Health bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-600">Health Score</span>
                    <span className={cn("text-[10px] font-bold tabular-nums", HEALTH_COLOR(tenant.healthScore))}>{tenant.healthScore}%</span>
                  </div>
                  <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", HEALTH_BG(tenant.healthScore))}
                      initial={{ width: 0 }}
                      animate={{ width: `${tenant.healthScore}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setManagingTenant(tenant)}
                    className="flex items-center gap-1.5 px-3 py-1.5 flex-1 justify-center bg-indigo-500/8 hover:bg-indigo-500/15 text-indigo-400 text-xs font-medium rounded-lg border border-indigo-500/15 hover:border-indigo-500/30 transition-all"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-3 h-3" /> Manage
                  </motion.button>
                  <button
                    onClick={() => toast(`Viewing ${tenant.name} dashboard`, { icon: "👁️" })}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                    title="View dashboard"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toast(`Generating report for ${tenant.name}`, { icon: "📊" })}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                    title="View reports"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {tenants.length === 0 && (
          <motion.div className="soc-card p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No tenants configured</p>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Add your first tenant
            </button>
          </motion.div>
        )}
      </div>

      <AddTenantModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={(t) => setTenants((prev) => [t, ...prev])}
      />

      <AnimatePresence>
        {managingTenant && (
          <ManageTenantModal
            tenant={managingTenant}
            onClose={() => setManagingTenant(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
