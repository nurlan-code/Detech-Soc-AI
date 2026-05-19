"use client";

// TODO: disable before prod — /api/v1/debug/users
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLegacySession, ensureDefaultSession } from "@/lib/auth/session-helper";

export default function AdminPanelPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [session, setSession] = useState<ReturnType<typeof getLegacySession>>(null);

  useEffect(() => {
    // Seed analyst session for demo users who haven't logged through legacy flow
    ensureDefaultSession("demo-uid-001", "user@detech.io");

    const sess = getLegacySession();
    setSession(sess);

    // CTF-LAB: client-side only role check — localStorage can be modified in DevTools
    if (!sess || sess.role !== "admin") {
      router.push("/unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
        <p className="text-gray-400 text-sm mt-1">
          Logged in as: <span className="text-blue-400">{session?.email}</span> — role:{" "}
          <span className="text-green-400 font-semibold">{session?.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { label: "Total Users", value: "247", color: "blue" },
          { label: "Active Tenants", value: "12", color: "green" },
          { label: "Open Incidents", value: "34", color: "orange" },
          { label: "System Health", value: "99.8%", color: "emerald" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">System Configuration</h2>
        <div className="space-y-3 text-sm">
          {[
            { key: "Platform Version", val: "v2.4.1" },
            { key: "DB Cluster", val: "us-east-1 (primary)" },
            { key: "Backup Schedule", val: "Daily 02:00 UTC" },
            { key: "AI Model", val: "llama-3.3-70b-versatile" },
            { key: "Cron Secret", val: "••••••••••••••" },
          ].map((row) => (
            <div key={row.key} className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">{row.key}</span>
              <span className="text-gray-200 font-mono">{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
