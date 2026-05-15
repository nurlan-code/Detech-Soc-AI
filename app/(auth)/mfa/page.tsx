"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { setTokens } from "@/lib/auth";

function MFAForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaToken = searchParams.get("token") ?? "";
  const { setUser } = useAuthStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyMfa(mfaToken, code);
      setTokens(res.data.access_token, res.data.refresh_token);
      const meRes = await authApi.me();
      setUser(meRes.data);
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
