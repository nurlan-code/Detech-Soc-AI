"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useCreditsStore } from "@/store/creditsStore";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Bell, Flame, Mail, MessageSquare,
  FileText, BookOpen, Plug, ClipboardList, Building2,
  Settings, LogOut, Shield, ChevronLeft, ChevronRight,
  Coins, Gift, Check,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/alerts",       label: "Alerts",        icon: Bell },
  { href: "/incidents",    label: "Incidents",     icon: Flame },
  { href: "/phishing",     label: "Phishing",      icon: Mail },
  { href: "/ai-chat",      label: "AI Assistant",  icon: MessageSquare },
  { href: "/reports",      label: "Reports",       icon: FileText },
  { href: "/playbooks",    label: "Playbooks",     icon: BookOpen },
  { href: "/integrations", label: "Integrations",  icon: Plug },
  { href: "/audit-logs",   label: "Audit Logs",    icon: ClipboardList },
  { href: "/mssp",         label: "MSSP",          icon: Building2 },
  { href: "/settings",     label: "Settings",      icon: Settings },
];

// ─── Credits Widget ──────────────────────────────────────────────────────────
function CreditsWidget({ collapsed }: { collapsed: boolean }) {
  const { credits, streak, lastClaimed, claimDaily } = useCreditsStore();
  const [claiming, setClaiming] = useState(false);
  const [showCoin, setShowCoin] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const alreadyClaimed = lastClaimed === today;

  // Max credits for progress bar (1000 = full)
  const MAX = 1000;
  const pct = Math.min((credits / MAX) * 100, 100);

  const handleClaim = () => {
    if (alreadyClaimed || claiming) return;
    setClaiming(true);
    setShowCoin(true);

    setTimeout(() => {
      const result = claimDaily();
      setClaiming(false);

      if (result.success) {
        toast.success(result.message, {
          icon: "🪙",
          duration: 3500,
          style: { background: "#1a2535", color: "#e2e8f0", border: "1px solid #f59e0b44" },
        });
      } else {
        toast(result.message, {
          icon: "⏳",
          duration: 3000,
        });
      }

      setTimeout(() => setShowCoin(false), 800);
    }, 600);
  };

  if (collapsed) {
    return (
      <div className="mx-2 mb-2 flex flex-col items-center gap-1">
        <motion.button
          onClick={handleClaim}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
            alreadyClaimed
              ? "bg-green-500/10 border-green-500/25 text-green-400"
              : "bg-yellow-500/10 border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/20"
          )}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          title={alreadyClaimed ? `${credits} credits · Claimed today` : `Claim daily credits`}
        >
          <Coins className="w-4 h-4" />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 p-3 bg-gradient-to-br from-blue-600/8 to-purple-600/5 border border-blue-500/15 rounded-xl relative overflow-hidden">
      {/* Floating coin animation */}
      <AnimatePresence>
        {showCoin && (
          <motion.div
            key="coin"
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -40, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-3 right-3 text-xl pointer-events-none z-10"
          >
            🪙
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top row: credits + streak */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={claiming ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
          </motion.div>
          <span className="text-xs font-bold text-yellow-400">{credits.toLocaleString()}</span>
          <span className="text-[10px] text-gray-600">credits</span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/15 border border-orange-500/20 rounded-full">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-orange-400 font-bold">{streak}d</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-soc-border rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Claim button */}
      <motion.button
        onClick={handleClaim}
        disabled={alreadyClaimed}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all",
          alreadyClaimed
            ? "bg-green-500/10 border border-green-500/20 text-green-400 cursor-default"
            : "bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/25 text-yellow-400 cursor-pointer"
        )}
        whileHover={alreadyClaimed ? {} : { scale: 1.02 }}
        whileTap={alreadyClaimed ? {} : { scale: 0.98 }}
      >
        {alreadyClaimed ? (
          <>
            <Check className="w-3 h-3" />
            Claimed today
          </>
        ) : (
          <>
            <Gift className="w-3 h-3" />
            {claiming ? "Claiming…" : `Claim Daily${streak > 0 ? ` (+${Math.min(100 + streak * 10, 200)})` : " (+100)"}`}
          </>
        )}
      </motion.button>

      {/* Streak tip */}
      {!alreadyClaimed && streak > 0 && (
        <p className="text-[9px] text-center text-gray-700 mt-1.5">
          🔥 {streak}-day streak — bonus +{Math.min(streak * 10, 100)} credits today
        </p>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { logout, user } = useAuthStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-soc-border transition-all duration-300 flex-shrink-0",
        "bg-soc-surface",
        sidebarCollapsed ? "w-[60px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-soc-border">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <motion.div
            className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0"
            animate={{ boxShadow: ["0 0 0 rgba(59,130,246,0)", "0 0 12px rgba(59,130,246,0.3)", "0 0 0 rgba(59,130,246,0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Shield className="w-4 h-4 text-blue-400" />
          </motion.div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">Detech SOC</p>
              <p className="text-[10px] text-gray-600 truncate leading-tight">AI Platform</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-100 group relative",
                active
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-200 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-blue-400" : "text-gray-600 group-hover:text-gray-300")} />
              {!sidebarCollapsed && <span className="truncate font-medium">{label}</span>}
              {active && sidebarCollapsed && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute left-0.5 w-1 h-4 bg-blue-500 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Credits widget */}
      <CreditsWidget collapsed={sidebarCollapsed} />

      {/* User footer */}
      <div className="border-t border-soc-border p-2">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-200 truncate">{user.username}</p>
              <p className="text-[10px] text-gray-600 truncate capitalize">{user.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); router.push("/login"); }}
          title={sidebarCollapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm",
            "text-gray-600 hover:bg-red-500/10 hover:text-red-400 border border-transparent",
            "transition-all duration-100"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
