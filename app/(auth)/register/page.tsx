"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, Shield, Lock, Mail, User,
  CheckCircle, Zap, AlertTriangle, Building2, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

const registerSchema = z.object({
  username: z.string().min(3, "Min 3 characters").max(30, "Max 30 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["soc_analyst", "soc_manager", "tenant_admin"]),
  password: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const ROLES = [
  { value: "soc_analyst",   label: "SOC Analyst",    desc: "Alert triage & investigation" },
  { value: "soc_manager",   label: "SOC Manager",    desc: "Team management & reporting" },
  { value: "tenant_admin",  label: "Tenant Admin",   desc: "Full platform administration" },
];

const FEATURES = [
  "AI-powered threat detection & triage",
  "MITRE ATT&CK framework integration",
  "Automated incident response playbooks",
  "Executive reporting & compliance dashboards",
  "Multi-tenant MSSP management",
];

const STATS = [
  { label: "Threats Stopped",   value: "98.7%",  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  { label: "Avg Response",       value: "<2 min", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { label: "Active Analysts",    value: "3,500+", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { label: "Alerts Processed",   value: "2.4M+",  color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "soc_analyst" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.username,
            role: data.role,
          },
        },
      });
      if (error) throw error;
      setSuccess(true);
      toast.success(`Account created for ${data.username}! Please sign in.`, { duration: 3500, icon: "✅" });
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-soc-dark flex overflow-hidden">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-7 xl:p-9 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #060a12 0%, #0d1117 55%, #071028 100%)" }}
      >
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <motion.div
          className="absolute top-1/3 left-1/2 w-[360px] h-[360px] rounded-full pointer-events-none -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo */}
        <motion.div className="relative z-10 flex-shrink-0" {...fadeUp(0)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold tracking-tight text-sm">Detech SOC AI</p>
              <p className="text-[10px] text-gray-600">Enterprise Security Platform</p>
            </div>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div className="relative z-10 flex-1 flex flex-col justify-center py-4" {...fadeUp(0.1)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3 w-fit">
            <Building2 className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-blue-400 font-medium">Join 3,500+ Security Professionals</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2 leading-[1.1] tracking-tight">
            Start Protecting<br />
            <span className="gradient-text">Your Organization</span><br />
            Today
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed mb-3 max-w-sm">
            Get instant access to AI-powered threat detection, automated response playbooks,
            and enterprise-grade security operations tooling.
          </p>

          <ul className="space-y-1.5 mb-3">
            {FEATURES.map((f, i) => (
              <motion.li key={f} className="flex items-center gap-2" {...fadeUp(0.2 + i * 0.05)}>
                <div className="w-4 h-4 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <span className="text-xs text-gray-300">{f}</span>
              </motion.li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2">
            {STATS.map(({ label, value, color, bg, border }, i) => (
              <motion.div
                key={label}
                className={`${bg} ${border} border rounded-lg p-2.5`}
                {...fadeUp(0.42 + i * 0.06)}
              >
                <p className={`text-base font-black ${color} mb-0.5`}>{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Status bar */}
        <motion.div className="relative z-10 flex-shrink-0" {...fadeUp(0.7)}>
          <div className="flex items-center gap-3 p-2.5 bg-green-500/8 border border-green-500/15 rounded-xl">
            <motion.div
              className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-xs text-green-400 font-medium flex-1">Free 14-day trial · No credit card required</p>
            <span className="text-[10px] text-green-500/60 border border-green-500/20 px-2 py-0.5 rounded-full">Demo</span>
          </div>
        </motion.div>
      </div>

      {/* ── Right: register form ── */}
      <div
        className="flex-1 relative overflow-y-auto"
        style={{ background: "linear-gradient(180deg, #080c14 0%, #050810 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.04) 0%, transparent 100%)" }} />

        <div className="min-h-full flex items-center justify-center p-5">
        <div className="w-full max-w-[400px] relative z-10 py-4">

          {/* Mobile logo */}
          <motion.div className="flex items-center justify-center gap-2 mb-5 lg:hidden" {...fadeUp(0)}>
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-white">Detech SOC AI</span>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <motion.div
                  className="w-16 h-16 rounded-3xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Account Created!</h2>
                <p className="text-sm text-gray-500">Redirecting to login page...</p>
                <div className="mt-4 flex justify-center">
                  <motion.div
                    className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
                <motion.div {...fadeUp(0)}>
                  <h2 className="text-2xl font-black text-white mb-0.5">Create account</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Join your SOC team on Detech · {" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                      Sign in instead
                    </Link>
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

                  {/* Username */}
                  <motion.div {...fadeUp(0.05)}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...register("username")}
                        type="text"
                        autoComplete="username"
                        placeholder="analyst_john"
                        className="soc-input pl-10"
                      />
                    </div>
                    {errors.username && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.username.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Email */}
                  <motion.div {...fadeUp(0.1)}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email address</label>
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
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.email.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Role */}
                  <motion.div {...fadeUp(0.13)}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                    <div className="relative">
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                      <select
                        {...register("role")}
                        className="soc-input appearance-none pr-10 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div {...fadeUp(0.16)}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...register("password")}
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min. 8 characters"
                        className="soc-input pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.password.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div {...fadeUp(0.19)}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...register("confirmPassword")}
                        type={showConfPwd ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        className="soc-input pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowConfPwd(!showConfPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                        {showConfPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{errors.confirmPassword.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-2.5 mt-0.5 text-sm"
                    {...fadeUp(0.22)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                      : <><Zap className="w-4 h-4" /> Create Account</>
                    }
                  </motion.button>
                </form>

                <motion.div className="mt-3 pt-3 border-t border-soc-border flex items-center gap-2 text-xs text-gray-700" {...fadeUp(0.25)}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Demo mode — no real account is created</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}
