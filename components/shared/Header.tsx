"use client";

import { Bell, Search, Menu, X, CheckCircle, AlertTriangle, Brain, Mail, Zap, Command } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [
  { id: "n1", icon: AlertTriangle, iconColor: "text-red-400",    iconBg: "bg-red-500/10",    title: "Critical: Ransomware on FILESERVER01", desc: "EDR detected CryptoLocker variant — immediate action needed", time: new Date(Date.now() - 7  * 60_000).toISOString(), read: false },
  { id: "n2", icon: Brain,         iconColor: "text-blue-400",   iconBg: "bg-blue-500/10",   title: "AI Triage complete on 5 alerts",        desc: "Severity updated · 2 escalated to critical",               time: new Date(Date.now() - 15 * 60_000).toISOString(), read: false },
  { id: "n3", icon: AlertTriangle, iconColor: "text-orange-400", iconBg: "bg-orange-500/10", title: "Incident INC-001 escalated",            desc: "IR team paged — lateral movement confirmed",               time: new Date(Date.now() - 32 * 60_000).toISOString(), read: false },
  { id: "n4", icon: Mail,          iconColor: "text-purple-400", iconBg: "bg-purple-500/10", title: "Phishing campaign detected",            desc: "47 employees targeted by CEO impersonation email",          time: new Date(Date.now() - 58 * 60_000).toISOString(), read: true  },
  { id: "n5", icon: Zap,           iconColor: "text-green-400",  iconBg: "bg-green-500/10",  title: "Playbook: Brute Force Response run",    desc: "Auto-blocked 12 source IPs via firewall integration",       time: new Date(Date.now() - 90 * 60_000).toISOString(), read: true  },
  { id: "n6", icon: CheckCircle,   iconColor: "text-gray-400",   iconBg: "bg-gray-500/10",   title: "Weekly report generated",              desc: "Executive Summary for current week is ready",               time: new Date(Date.now() - 2  * 3600_000).toISOString(), read: true },
];

interface Props {
  title?: string;
  onCommandPalette?: () => void;
}

export function Header({ title, onCommandPalette }: Props) {
  const { user } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markAllRead = () => setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));

  return (
    <header className="h-14 bg-soc-surface border-b border-soc-border flex items-center justify-between px-3 sm:px-4 flex-shrink-0 z-40 relative">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-sm font-semibold text-white truncate max-w-[100px] sm:max-w-[180px] md:max-w-none flex-shrink-0">
            {title}
          </h1>
        )}

        {/* Search bar — desktop only */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search alerts, incidents, IOCs..."
            className="pl-8 pr-4 py-1.5 bg-soc-dark border border-soc-border rounded-lg text-xs
                       text-gray-400 placeholder-gray-700
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                       transition-colors w-56 xl:w-64"
            onClick={() => {
              // Trigger command palette from header search
              toast("Press Ctrl+K to open the command palette", { icon: "⌨️", duration: 2500 });
            }}
            readOnly
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-700 font-mono hidden xl:block pointer-events-none">
            Ctrl+K
          </kbd>
        </div>

        {/* Command palette trigger — tablet */}
        <button
          onClick={() => toast("Press Ctrl+K to open the command palette", { icon: "⌨️", duration: 2500 })}
          className="hidden md:flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 bg-soc-dark border border-soc-border rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="text-[10px]">Ctrl+K</span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full flex items-center justify-center px-0.5"
              >
                <span className="text-[9px] text-white font-bold leading-none">{unreadCount}</span>
              </motion.span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-[340px] sm:w-96 bg-soc-surface border border-soc-border rounded-xl shadow-2xl z-50 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-soc-border">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[340px] sm:max-h-[400px] overflow-y-auto">
                  {notifs.map((n, i) => {
                    const Icon = n.icon;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { markRead(n.id); setNotifOpen(false); }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-soc-border/50 cursor-pointer transition-colors hover:bg-white/[0.03] last:border-0",
                          !n.read && "bg-blue-500/[0.04]"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", n.iconBg)}>
                          <Icon className={cn("w-4 h-4", n.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 justify-between">
                            <p className={cn("text-xs font-semibold leading-snug truncate", n.read ? "text-gray-400" : "text-white")}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.desc}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{formatRelativeTime(n.time)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-soc-border bg-soc-dark/40 text-center">
                  <button
                    onClick={() => { setNotifOpen(false); toast("Notification history coming soon", { icon: "📋" }); }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User chip */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1.5 bg-soc-dark border border-soc-border rounded-lg">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-200 leading-tight">{user?.username ?? "User"}</p>
            <p className="text-[10px] text-gray-600 leading-tight capitalize">{user?.role?.replace(/_/g, " ") ?? "analyst"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
