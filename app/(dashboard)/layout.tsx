"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { MOCK_ALERTS } from "@/lib/mockData";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const LIVE_THREATS = MOCK_ALERTS.filter((a) => ["critical", "high"].includes(a.severity)).slice(0, 8);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, user } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        // Sync Supabase user into Zustand store if not already there
        if (!user) {
          const su = data.session.user;
          const meta = su.user_metadata ?? {};
          setUser({
            id: su.id,
            username: meta.username ?? meta.full_name ?? su.email?.split("@")[0] ?? "User",
            email: su.email ?? "",
            role: (meta.role ?? "soc_analyst") as "soc_analyst" | "soc_manager" | "tenant_admin" | "mssp_admin" | "super_admin",
            tenant_id: meta.tenant_id ?? "t1",
            is_active: true,
            created_at: su.created_at ?? new Date().toISOString(),
          });
        }
        setReady(true);
      }
    });

    // Listen for auth changes (logout from another tab, token expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser, user]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((v) => !v);
    }
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

  // Supabase Realtime — live DB updates
  useEffect(() => {
    if (!ready) return;
    const channel = supabase
      .channel("db-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        if (payload.eventType === "INSERT") {
          const a = payload.new as { title: string; severity: string };
          const emoji = a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "🔔";
          toast(`${emoji} New alert: ${a.title}`, {
            duration: 6000,
            style: {
              background: a.severity === "critical" ? "#1a0000" : "#0d1117",
              border: `1px solid ${a.severity === "critical" ? "#ef444440" : "#1f2937"}`,
              color: "#d1d5db",
              fontSize: "12px",
            },
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "phishing_cases" }, () => {
        queryClient.invalidateQueries({ queryKey: ["phishing"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ready, queryClient]);

  // Live threat feed
  useEffect(() => {
    if (!ready) return;
    const showThreat = () => {
      const alert = LIVE_THREATS[Math.floor(Math.random() * LIVE_THREATS.length)];
      const emoji = alert.severity === "critical" ? "🚨" : "⚠️";
      toast(`${emoji} ${alert.title}`, {
        duration: 5000,
        style: {
          background: alert.severity === "critical" ? "#1a0000" : "#1a0d00",
          border: `1px solid ${alert.severity === "critical" ? "#ef444440" : "#f9731640"}`,
          color: "#d1d5db",
          fontSize: "12px",
        },
      });
    };
    const firstTimer = setTimeout(showThreat, 45_000);
    const interval = setInterval(showThreat, 90_000);
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
