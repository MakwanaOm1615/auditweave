"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@auditweave.ai");
  const [password, setPassword] = useState("AuditWeave_admin_2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("AuditWeave_token", data.access_token);
      localStorage.setItem("AuditWeave_user_email", data.email || email);
      localStorage.setItem("AuditWeave_user_role", data.role || "user");
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0D3A35] text-slate-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="h-12 w-12 rounded-xl bg-emerald-600/10 border border-emerald-300/20 flex items-center justify-center text-emerald-300 glow-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Compliance Portal</h1>
          <p className="text-sm text-slate-400 max-w-xs">
            Authenticate to audit privacy policies and review GRC logs.
          </p>
        </div>

        <div className="glass-card border border-slate-800 rounded-2xl p-6 glow-primary">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder-slate-600 text-slate-100 transition"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder-slate-600 text-slate-100 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-300 hover:to-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Access Platform</span>
                </>
              )}
            </button>
          </form>

          {/* Helper Credentials Box */}
          <div className="mt-6 border-t border-slate-800/60 pt-4 text-center">
            <div className="inline-block bg-emerald-600/5 border border-emerald-600/10 rounded-lg p-3 text-left w-full">
              <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
                Demo Credentials
              </p>
              <p className="text-xs text-slate-400">
                Email: <code className="text-slate-200">admin@auditweave.ai</code>
              </p>
              <p className="text-xs text-slate-400">
                Password: <code className="text-slate-200">AuditWeave_admin_2026</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
