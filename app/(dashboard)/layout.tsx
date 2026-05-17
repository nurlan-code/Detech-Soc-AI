"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { isAuthenticated } from "@/lib/auth";
import { MOCK_ALERTS } from "@/lib/mockData";
import toast from "react-hot-toast";

const LIVE_THREATS = MOCK_ALERTS.filter((a) => ["critical", "high"].includes(a.severity)).slice(0, 8);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K / Cmd+K → Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((v) => !v);
    }
    // ? → show shortcuts hint (only when not focused on an input)
    if (e.key === "?" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      toast(
        (t) => (
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-white mb-2 flex items-center gap-1.5">⌨️ Keyboard Shortcuts</p>
            <p><kbd className="bg-gray-800 px-1 py-0.5 rounded text-[10px] mr-1.5">Ctrl+K</kbd>Command Palette</p>
            <p><kbd className="bg-gray-800 px-1 py-0.5 rounded text-[10px] mr-1.5">?</kbd>Show shortcuts</p>
            <button onClick={() => toast.dismiss(t.id)} className="mt-2 text-[10px] text-gray-500 hover:text-gray-300">Dismiss</button>
          </div>
        ),
        { duration: 6000, style: { background: "#111827", border: "1px solid #1f2937", color: "#d1d5db" } }
      );
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Live threat feed — random alert toast every ~90s
  useEffect(() => {
    if (!ready) return;
    const showThreat = () => {
      const alert = LIVE_THREATS[Math.floor(Math.random() * LIVE_THREATS.length)];
      const emoji = alert.severity === "critical" ? "🚨" : "⚠️";
      toast(
        `${emoji} ${alert.title}`,
        {
          duration: 5000,
          style: {
            background: alert.severity === "critical" ? "#1a0000" : "#1a0d00",
            border: `1px solid ${alert.severity === "critical" ? "#ef444440" : "#f9731640"}`,
            color: "#d1d5db",
            fontSize: "12px",
          },
        }
      );
    };

    // First one after 45s, then every 90s
    const firstTimer = setTimeout(showThreat, 45_000);
    const interval   = setInterval(showThreat, 90_000);
    return () => { clearTimeout(firstTimer); clearInterval(interval); };
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-soc-dark">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-soc-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
