"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { auditApi } from "@/lib/api";
import { Header } from "@/components/shared/Header";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Download, Search, Filter, RefreshCw,
  CheckCircle, XCircle, Shield, LogIn, LogOut,
  FileEdit, UserCheck, Bell, Play, Settings, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  LOGIN_SUCCESS:      { color: "text-green-400",  bg: "bg-green-500/10",  icon: LogIn,    label: "Login" },
  USER_LOGOUT:        { color: "text-gray-400",   bg: "bg-gray-500/10",   icon: LogOut,   label: "Logout" },
  ALERT_UPDATED:      { color: "text-blue-400",   bg: "bg-blue-500/10",   icon: FileEdit, label: "Alert Updated" },
  ALERT_RESOLVED:     { color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle, label: "Alert Resolved" },
  INCIDENT_CREATED:   { color: "text-orange-400", bg: "bg-orange-500/10", icon: Shield,   label: "Incident Created" },
  INCIDENT_CLOSED:    { color: "text-gray-400",   bg: "bg-gray-500/10",   icon: CheckCircle, label: "Incident Closed" },
  REPORT_GENERATED:   { color: "text-purple-400", bg: "bg-purple-500/10", icon: FileEdit, label: "Report Generated" },
  TRIAGE_STARTED:     { color: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: Play,     label: "Triage Started" },
  PLAYBOOK_EXECUTED:  { color: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: Play,     label: "Playbook Run" },
  SETTINGS_CHANGED:   { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Settings, label: "Settings Changed" },
};

const STATUS_CONFIG = {
  SUCCESS: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
  FAILED:  { color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20",   icon: XCircle },
};

type LogEntry = {
  id: string;
  user: string;
  action: string;
  resource: string;
  ip_address: string;
  status: string;
  created_at: string;
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "SUCCESS" | "FAILED">("");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => auditApi.list({ page, page_size: 50 }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const allLogs: LogEntry[] = data?.items ?? [];

  const filteredLogs = allLogs.filter((log) => {
    const matchSearch = !search || log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportLogs = async () => {
    setExporting(true);
    try {
      const res = await auditApi.export({ format: "csv" });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Audit logs exported successfully", { icon: "📄" });
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const stats = {
    total: allLogs.length,
    success: allLogs.filter((l) => l.status === "SUCCESS").length,
    failed: allLogs.filter((l) => l.status === "FAILED").length,
    users: new Set(allLogs.map((l) => l.user)).size,
  };

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Audit Logs" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Total Events",   value: stats.total,   color: "text-gray-300",  border: "border-l-gray-500" },
            { label: "Successful",     value: stats.success, color: "text-green-400", border: "border-l-green-500" },
            { label: "Failed",         value: stats.failed,  color: "text-red-400",   border: "border-l-red-500" },
            { label: "Active Users",   value: stats.users,   color: "text-blue-400",  border: "border-l-blue-500" },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={cn("soc-card p-3 border-l-2", border)}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="flex flex-wrap items-center gap-2 justify-between"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions, users..."
                className="pl-8 pr-4 py-2 bg-soc-card border border-soc-border rounded-lg text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 w-48 transition-colors"
              />
            </div>

            {/* Status filter */}
            <div className="relative flex items-center">
              <Filter className="absolute left-2.5 w-3 h-3 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="pl-7 pr-3 py-2 bg-soc-card border border-soc-border rounded-lg text-xs text-gray-400 focus:outline-none appearance-none cursor-pointer hover:border-gray-600 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{filteredLogs.length} events</span>
            <button
              onClick={() => { refetch(); toast.success("Audit logs refreshed", { duration: 1500 }); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 bg-soc-card border border-soc-border rounded-lg hover:border-gray-600 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <motion.button
              onClick={exportLogs}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-soc-card border border-soc-border hover:bg-white/5 hover:border-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all disabled:opacity-40"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {exporting
                ? <div className="w-3.5 h-3.5 border border-gray-400/40 border-t-gray-400 rounded-full animate-spin" />
                : <Download className="w-3.5 h-3.5" />
              }
              Export CSV
            </motion.button>
          </div>
        </motion.div>

        {/* Logs table */}
        <motion.div
          className="soc-card overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-2">
              <motion.div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No audit events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-soc-border">
                    {["Status", "Action", "User", "Resource", "IP Address", "Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] text-gray-600 font-semibold uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredLogs.map((log, i) => {
                      const actionCfg = ACTION_CONFIG[log.action];
                      const statusCfg = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG];
                      const ActionIcon = actionCfg?.icon ?? ClipboardList;
                      const StatusIcon = statusCfg?.icon ?? CheckCircle;

                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.2 }}
                          className="border-b border-soc-border hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Status */}
                          <td className="px-4 py-3">
                            {statusCfg && (
                              <span className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border w-fit font-semibold", statusCfg.color, statusCfg.bg, statusCfg.border)}>
                                <StatusIcon className="w-2.5 h-2.5" />
                                {log.status}
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {actionCfg && (
                                <span className={cn("w-5 h-5 rounded flex items-center justify-center flex-shrink-0", actionCfg.bg)}>
                                  <ActionIcon className={cn("w-3 h-3", actionCfg.color)} />
                                </span>
                              )}
                              <span className="text-xs font-mono text-gray-300">{log.action}</span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[8px] text-blue-400 font-bold">{log.user?.[0]?.toUpperCase()}</span>
                              </div>
                              <span className="text-xs text-gray-400">{log.user}</span>
                            </div>
                          </td>

                          {/* Resource */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 font-mono">{log.resource}</span>
                          </td>

                          {/* IP */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-gray-600">{log.ip_address ?? "—"}</span>
                          </td>

                          {/* Time */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-600 tabular-nums">{formatDate(log.created_at)}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {(data?.total_pages ?? 1) > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{data?.total ?? 0} total events</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors">← Prev</button>
              <span className="px-3 py-1.5 text-gray-400">{page} / {data?.total_pages ?? 1}</span>
              <button onClick={() => setPage((p) => Math.min(data?.total_pages ?? 1, p + 1))} disabled={page === (data?.total_pages ?? 1)}
                className="px-3 py-1.5 bg-soc-card border border-soc-border rounded-lg disabled:opacity-30 hover:border-gray-600 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
