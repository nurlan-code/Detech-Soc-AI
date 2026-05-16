"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Eye, EyeOff, Loader2, Shield, Lock, Mail, Activity,
  AlertTriangle, Cpu, CheckCircle, ArrowRight, Zap, UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { setTokens } from "@/lib/auth";

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

const STATS = [
  { label: "Alerts Triaged",   value: "2.4M+",  icon: Activity,       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { label: "Threats Blocked",  value: "98.7%",  icon: Shield,         color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  { label: "Avg Response",     value: "<2 min", icon: Cpu,            color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { label: "Active Tenants",   value: "500+",   icon: CheckCircle,    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
];

const FEATURES = [
  "AI-powered alert triage & correlation",
  "Real-time threat intelligence feeds",
  "Automated incident response playbooks",
  "Executive reporting & compliance",
];

const fadeUp = (delay = 0) => ({
  initial:   { opacity: 0, y: 24 },
  animate:   { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [mfa, setMfa] = useState<{ required: boolean; token: string; code: string }>({
    required: false, token: "", code: "",
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const fillDemo = () => {
    setValue("email",    "admin@gmail.com");
    setValue("password", "admin123");
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      const { tokens, requires_mfa, mfa_token } = res.data as {
        tokens: { access_token: string; refresh_token: string };
        requires_mfa: boolean;
        mfa_token: string;
      };
      if (requires_mfa) {
        setMfa({ required: true, token: mfa_token, code: "" });
        return;
      }
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me.data);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Invalid credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async () => {
    if (mfa.code.length !== 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyMfa(mfa.token, mfa.code);
      const d = res.data as { access_token: string; refresh_token: string };
      setTokens(d.access_token, d.refresh_token);
      const me = await authApi.me();
      setUser(me.data);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Invalid MFA code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-soc-dark flex overflow-hidden">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col h-full overflow-hidden p-8 xl:p-10 relative"
        style={{ background: "linear-gradient(145deg, #060a12 0%, #0d1117 55%, #071028 100%)" }}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />

        {/* Cyber scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Glowing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Logo */}
        <motion.div className="relative z-10 flex-shrink-0" {...fadeUp(0)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold tracking-tight text-sm">Detech SOC AI</p>
              <p className="text-[10px] text-gray-600">Enterprise Security Platform</p>
            </div>
          </div>
        </motion.div>

        {/* Hero text — fills remaining vertical space */}
        <motion.div className="relative z-10 flex-1 flex flex-col justify-center py-4" {...fadeUp(0.1)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 w-fit">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-blue-400 font-medium">AI-Powered SOC Platform</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white mb-3 leading-[1.05] tracking-tight">
            Security<br />
            <span className="gradient-text">Operations</span><br />
            Center
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed mb-5 max-w-md">
            Automated threat detection, AI-assisted triage, and real-time incident response
            — all in one platform built for modern security teams.
          </p>

          {/* Feature list */}
          <ul className="space-y-1.5 mb-5">
            {FEATURES.map((f, i) => (
              <motion.li key={f} className="flex items-center gap-2" {...fadeUp(0.2 + i * 0.07)}>
                <div className="w-4 h-4 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <span className="text-xs text-gray-300">{f}</span>
              </motion.li>
            ))}
          </ul>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {STATS.map(({ label, value, icon: Icon, color, bg, border }, i) => (
              <motion.div
                key={label}
                className={`${bg} ${border} border rounded-xl p-3 backdrop-blur-sm`}
                {...fadeUp(0.45 + i * 0.06)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className={`text-xl font-black ${color}`}>{value}</span>
                </div>
                <p className="text-[10px] text-gray-500">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Status bar */}
        <motion.div className="relative z-10 flex-shrink-0" {...fadeUp(0.7)}>
          <div className="flex items-center gap-3 p-2.5 bg-green-500/8 border border-green-500/15 rounded-xl">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="flex-1">
              <p className="text-xs text-green-400 font-medium">All systems operational</p>
              <p className="text-[10px] text-gray-600">Last check: just now</p>
            </div>
            <span className="text-[10px] text-green-500/60 border border-green-500/20 px-2 py-0.5 rounded-full">Live</span>
          </div>
        </motion.div>
      </div>

      {/* ── Right: login form panel ── */}
      <div
        className="flex-1 relative overflow-y-auto"
        style={{ background: "linear-gradient(180deg, #080c14 0%, #050810 100%)" }}
      >
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.04) 0%, transparent 100%)" }} />

        <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] relative z-10">

          {/* Mobile logo */}
          <motion.div className="flex items-center justify-center gap-2 mb-8 lg:hidden" {...fadeUp(0)}>
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-white">Detech SOC AI</span>
          </motion.div>

          <AnimatePresence mode="wait">
            {!mfa.required ? (
              /* ── Login form ── */
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div {...fadeUp(0)}>
                  <h2 className="text-3xl font-black text-white mb-1">Sign in</h2>
                  <p className="text-sm text-gray-500 mb-8">Access your security operations center</p>
                </motion.div>

                {/* Demo credential hint */}
                <motion.button
                  type="button"
                  onClick={fillDemo}
                  className="w-full flex items-center gap-3 px-4 py-3 mb-6 bg-blue-600/8 border border-blue-500/20 rounded-xl hover:bg-blue-600/15 hover:border-blue-500/35 transition-all group"
                  {...fadeUp(0.05)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs font-semibold text-blue-400">Demo Account</p>
                    <p className="text-[11px] text-gray-600 font-mono">admin@gmail.com · admin123</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                </motion.button>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <motion.div {...fadeUp(0.1)}>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...register("email")}
                        type="email"
                        autoComplete="email"
                        placeholder="analyst@company.com"
                        className="soc-input pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.email.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Password */}
                  <motion.div {...fadeUp(0.15)}>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...register("password")}
                        type={showPwd ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••••"
                        className="soc-input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.password.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 mt-2 text-sm"
                    {...fadeUp(0.2)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                      : <><Lock className="w-4 h-4" /> Sign In to SOC</>
                    }
                  </motion.button>
                </form>

                <motion.div className="mt-5 pt-5 border-t border-soc-border space-y-3" {...fadeUp(0.25)}>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Protected by enterprise-grade TLS encryption</span>
                  </div>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs text-gray-400 hover:text-blue-400 border border-soc-border hover:border-blue-500/30 rounded-xl transition-all group"
                  >
                    <UserPlus className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
                    Don&apos;t have an account? <span className="text-blue-400 font-semibold">Create one</span>
                  </Link>
                </motion.div>
              </motion.div>

            ) : (
              /* ── MFA form ── */
              <motion.div
                key="mfa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-6"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Shield className="w-8 h-8 text-blue-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1">Two-factor auth</h2>
                <p className="text-sm text-gray-500 mb-8">Enter the 6-digit code from your authenticator app</p>

                <input
                  type="text"
                  maxLength={6}
                  value={mfa.code}
                  onChange={(e) => setMfa((s) => ({ ...s, code: e.target.value.replace(/\D/g, "") }))}
                  onKeyDown={(e) => e.key === "Enter" && handleMfa()}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-soc-dark border border-soc-border rounded-xl text-white text-center text-3xl font-mono tracking-[0.8rem] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-4"
                />

                <button
                  onClick={handleMfa}
                  disabled={loading || mfa.code.length !== 6}
                  className="btn-primary w-full py-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <button
                  onClick={() => setMfa({ required: false, token: "", code: "" })}
                  className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-300 transition-colors"
                >
                  ← Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}
