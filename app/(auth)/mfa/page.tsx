"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

function MFAForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      // Supabase MFA challenge/verify flow
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: "totp" });
      if (challengeError) throw challengeError;
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: "totp",
        challengeId: challengeData.id,
        code,
      });
      if (error) throw error;
      // After successful MFA, get the session to populate user
      const { data: sessionData } = await supabase.auth.getSession();
      const supaUser = sessionData.session?.user;
      if (supaUser) {
        const meta = supaUser.user_metadata ?? {};
        setUser({
          id: supaUser.id,
          email: supaUser.email ?? "",
          username: meta.username ?? meta.full_name ?? supaUser.email ?? "",
          role: meta.role ?? "soc_analyst",
          is_active: true,
          is_mfa_enabled: true,
          created_at: supaUser.created_at,
          tenant_id: meta.tenant_id,
        });
      }
      void data;
      router.push("/dashboard");
    } catch {
      toast.error("Invalid MFA code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-soc-surface border border-soc-border rounded-xl p-8 text-center">
      <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">MFA Verification</h2>
      <p className="text-gray-400 text-sm mb-6">Enter the code from your authenticator app</p>
      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="w-full px-4 py-3 bg-soc-dark border border-soc-border rounded-md text-white text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500 mb-4"
        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
      />
      <button
        onClick={handleVerify}
        disabled={loading || code.length !== 6}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Verify
      </button>
    </div>
  );
}

export default function MFAPage() {
  return (
    <div className="min-h-screen bg-soc-dark flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
        <MFAForm />
      </Suspense>
    </div>
  );
}
