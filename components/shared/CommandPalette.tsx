"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ALERTS, MOCK_INCIDENTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import {
  Search, LayoutDashboard, Bell, Flame, Mail, MessageSquare,
  FileText, BookOpen, Plug, ClipboardList, Settings,
  AlertTriangle, Zap, Plus, X, ChevronRight,
  Activity, Hash, Shield, Brain,
} from "lucide-react";
import toast from "react-hot-toast";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  action: () => void;
  group: "action" | "navigate" | "alert" | "incident";
  badge?: string;
  badgeColor?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (path: string) => { router.push(path); onClose(); },
    [router, onClose]
  );

  const NAV: CommandItem[] = [
    { id: "n-dashboard",    label: "Dashboard",     description: "Security overview & KPIs",       icon: LayoutDashboard, iconColor: "text-blue-400",   action: () => navigate("/dashboard"),    group: "navigate" },
    { id: "n-alerts",       label: "Alerts",         description: "View and triage alerts",         icon: Bell,            iconColor: "text-orange-400", action: () => navigate("/alerts"),       group: "navigate" },
    { id: "n-incidents",    label: "Incidents",      description: "Active security incidents",      icon: Flame,           iconColor: "text-red-400",    action: () => navigate("/incidents"),    group: "navigate" },
    { id: "n-phishing",     label: "Phishing",       description: "Email threat analysis",          icon: Mail,            iconColor: "text-purple-400", action: () => navigate("/phishing"),     group: "navigate" },
    { id: "n-ai",           label: "AI Assistant",   description: "Chat with SOC AI copilot",       icon: MessageSquare,   iconColor: "text-cyan-400",   action: () => navigate("/ai-chat"),      group: "navigate" },
    { id: "n-reports",      label: "Reports",        description: "Generate security reports",      icon: FileText,        iconColor: "text-green-400",  action: () => navigate("/reports"),      group: "navigate" },
    { id: "n-playbooks",    label: "Playbooks",      description: "Automated response playbooks",   icon: BookOpen,        iconColor: "text-violet-400", action: () => navigate("/playbooks"),    group: "navigate" },
    { id: "n-integrations", label: "Integrations",   description: "Connected data sources",         icon: Plug,            iconColor: "text-yellow-400", action: () => navigate("/integrations"), group: "navigate" },
    { id: "n-audit",        label: "Audit Logs",     description: "Security event audit trail",     icon: ClipboardList,   iconColor: "text-gray-400",   action: () => navigate("/audit-logs"),   group: "navigate" },
    { id: "n-settings",     label: "Settings",       description: "Platform configuration",         icon: Settings,        iconColor: "text-gray-400",   action: () => navigate("/settings"),     group: "navigate" },
  ];

  const ACTIONS: CommandItem[] = [
    {
      id: "a-new-alert", label: "New Alert", description: "Create a manual security alert", icon: Plus, iconColor: "text-blue-400",
      action: () => { navigate("/alerts"); setTimeout(() => toast.success("Click 'New Alert' to create", { icon: "🛡️" }), 400); },
      group: "action",
    },
    {
      id: "a-new-inc", label: "New Incident", description: "Declare a new security incident", icon: Flame, iconColor: "text-orange-400",
      action: () => { navigate("/incidents"); setTimeout(() => toast.success("Click 'New Incident' to declare", { icon: "🔥" }), 400); },
      group: "action",
    },
    {
      id: "a-ai-brief", label: "AI Threat Brief", description: "Get AI threat intelligence summary", icon: Brain, iconColor: "text-violet-400",
      action: () => {
        onClose();
        toast.loading("AI analyzing threat landscape...", { id: "ai-brief", duration: 2500 });
        setTimeout(() => {
          toast.dismiss("ai-brief");
          toast.success("3 critical alerts need immediate attention", { icon: "🤖", duration: 5000 });
        }, 2600);
      },
      group: "action",
    },
    {
      id: "a-triage", label: "Bulk AI Triage", description: "Run AI triage on all new alerts", icon: Zap, iconColor: "text-yellow-400",
      action: () => {
        onClose();
        toast.loading("Queueing AI triage for 7 new alerts...", { id: "bulk-triage", duration: 2000 });
        setTimeout(() => { toast.dismiss("bulk-triage"); toast.success("AI triage queued for 7 alerts", { icon: "🤖" }); }, 2100);
      },
      group: "action",
    },
    {
      id: "a-ioc", label: "Search IOC", description: "Query threat intelligence for an IOC", icon: Hash, iconColor: "text-cyan-400",
      action: () => navigate("/ai-chat"),
      group: "action",
    },
    {
      id: "a-status", label: "System Status", description: "Check all integration health", icon: Activity, iconColor: "text-green-400",
      action: () => {
        onClose();
        toast.success("All 6 integrations healthy · Last sync 2 min ago", { icon: "✅", duration: 4000 });
      },
      group: "action",
    },
  ];

  const alertItems: CommandItem[] = MOCK_ALERTS.filter((a) =>
    !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.source.includes(query.toLowerCase()) || a.severity.includes(query.toLowerCase())
  ).slice(0, 5).map((a) => ({
    id: `alert-${a.id}`,
    label: a.title,
    description: `${a.severity.toUpperCase()} · ${a.source.toUpperCase()} · ${a.status.replace(/_/g, " ")}`,
    icon: AlertTriangle,
    iconColor: a.severity === "critical" ? "text-red-400" : a.severity === "high" ? "text-orange-400" : a.severity === "medium" ? "text-yellow-400" : "text-green-400",
    action: () => navigate(`/alerts/${a.id}`),
    group: "alert" as const,
    badge: a.severity,
    badgeColor: a.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : a.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : a.severity === "medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20",
  }));

  const incidentItems: CommandItem[] = MOCK_INCIDENTS.filter((i) =>
    !query || i.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3).map((i) => ({
    id: `inc-${i.id}`,
    label: i.title,
    description: `${i.severity.toUpperCase()} · ${i.status.replace(/_/g, " ")}`,
    icon: Flame,
    iconColor: i.severity === "critical" ? "text-red-400" : "text-orange-400",
    action: () => navigate(`/incidents/${i.id}`),
    group: "incident" as const,
    badge: i.severity,
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
  }));

  const filteredNav = NAV.filter((c) =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase())
  );
  const filteredActions = ACTIONS.filter((c) =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase())
  );

  const groups: { label: string; items: CommandItem[] }[] = [
    ...(filteredActions.length > 0 ? [{ label: "Quick Actions", items: filteredActions }] : []),
    ...(query && alertItems.length > 0 ? [{ label: "Alerts", items: alertItems }] : []),
    ...(query && incidentItems.length > 0 ? [{ label: "Incidents", items: incidentItems }] : []),
    ...(filteredNav.length > 0 ? [{ label: "Navigate", items: filteredNav }] : []),
  ];

  const allItems = groups.flatMap((g) => g.items);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); allItems[selected]?.action(); }
      if (e.key === "Escape")    { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, allItems, onClose]);

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-3 sm:px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-xl bg-soc-surface border border-soc-border rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-soc-border">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search alerts, incidents, navigate, actions..."
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none min-w-0"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-soc-dark border border-soc-border rounded text-[10px] text-gray-600 font-mono flex-shrink-0">ESC</kbd>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto overscroll-contain py-1.5">
              {groups.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-600">No results for "{query}"</div>
              )}
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider sticky top-0 bg-soc-surface/95 backdrop-blur-sm">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const idx = globalIdx++;
                    const isSelected = idx === selected;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onClick={item.action}
                        onMouseEnter={() => setSelected(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-blue-600/15" : "hover:bg-white/[0.03]"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg bg-soc-dark border border-soc-border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected && "border-blue-500/30 bg-blue-500/10"
                        )}>
                          <Icon className={cn("w-3.5 h-3.5", item.iconColor ?? "text-gray-400")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate transition-colors", isSelected ? "text-white" : "text-gray-300")}>
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
                          )}
                        </div>
                        {item.badge && (
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0", item.badgeColor)}>
                            {item.badge}
                          </span>
                        )}
                        {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-soc-border bg-soc-dark/50">
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-soc-card border border-soc-border rounded font-mono">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-soc-card border border-soc-border rounded font-mono">↵</kbd> select
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 ml-auto">
                <Shield className="w-3 h-3 text-blue-400" />
                <span>Detech SOC AI</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
