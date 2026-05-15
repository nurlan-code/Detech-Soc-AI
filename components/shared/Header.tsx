"use client";

import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import toast from "react-hot-toast";

const MOCK_NOTIFS = [
  "🚨 Critical alert: Ransomware detected on FILESERVER01",
  "🔥 Incident INC-001 escalated — IR team paged",
  "🤖 AI triage completed on 5 new alerts",
  "📧 Phishing submission analyzed — THREAT confirmed",
];

interface Props {
  title?: string;
}

export function Header({ title }: Props) {
  const { user } = useAuthStore();
  const [hasNotif, setHasNotif] = useState(true);

  const handleNotif = () => {
    setHasNotif(false);
    const notif = MOCK_NOTIFS[Math.floor(Math.random() * MOCK_NOTIFS.length)];
    toast(notif, {
      duration: 4000,
      style: { background: "#111827", border: "1px solid #1f2937", color: "#d1d5db", fontSize: "12px" },
    });
  };

  return (
    <header className="h-14 bg-soc-surface border-b border-soc-border flex items-center justify-between px-5 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        {title && <h1 className="text-base font-semibold text-white">{title}</h1>}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search alerts, incidents, IOCs..."
            className="pl-8 pr-4 py-1.5 bg-soc-dark border border-soc-border rounded-lg text-xs
                       text-gray-400 placeholder-gray-700
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                       transition-colors w-64"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          onClick={handleNotif}
          className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-soc-surface animate-pulse" />
          )}
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-soc-dark border border-soc-border rounded-lg">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-[11px] font-bold text-white">
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
