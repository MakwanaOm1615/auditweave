"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { login } from "@/lib/api";
import { AuthSidebar } from "../components/AuthSidebar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@auditweave.ai");
  const [password, setPassword] = useState("AuditWeave_admin_2026");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showPassword) {
      setShowPassword(true);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-brand-cream flex w-full relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center space-x-2 text-sm font-bold text-brand-deep/50 hover:text-brand-deep transition-colors z-50 lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
      
      {/* Left Sidebar (Hidden on mobile) */}
      <AuthSidebar />

      {/* Right Form Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-10 lg:w-[50%] bg-[#FDFBF7] relative overflow-hidden">
        {/* Subtle Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-deep/5 rounded-full blur-[80px] pointer-events-none" />

        <Link href="/" className="absolute top-8 right-12 hidden lg:flex items-center space-x-2 text-[13px] font-bold text-brand-deep/50 hover:text-brand-deep transition-colors z-20">
          <span>Back to Home</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="w-full max-w-[440px] mx-auto z-10">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(13,58,53,0.04)] border border-brand-deep/5 flex flex-col justify-center">
            
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4">
                <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-widest">AuditWeave Portal</span>
              </div>
              <h2 className="text-[2.25rem] font-extrabold text-brand-deep tracking-tight leading-tight mb-1">
                Welcome back
              </h2>
              <p className="text-[13px] text-brand-deep/60 font-medium">
                Log in to manage your DPDP Act 2023 compliance and AI privacy audits.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm font-semibold text-red-600 flex items-center space-x-2">
                  <Shield className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5 relative">
                <label className="text-[13px] font-bold text-brand-deep block">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 h-[52px] bg-brand-cream/40 border border-brand-deep/10 rounded-xl text-[14.5px] focus:bg-white focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 text-brand-deep transition-all placeholder:text-brand-deep/30 font-medium"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {showPassword && (
                <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-bold text-brand-deep block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 h-[52px] bg-brand-cream/40 border border-brand-deep/10 rounded-xl text-[14.5px] focus:bg-white focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 text-brand-deep transition-all placeholder:text-brand-deep/30 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] mt-4 bg-brand-green hover:bg-[#1C5E47] hover:-translate-y-[1px] hover:shadow-lg hover:shadow-brand-green/20 rounded-xl text-[15px] font-bold text-white transition-all duration-300 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{showPassword ? "Authenticating..." : "Sending code..."}</span>
                  </>
                ) : (
                  <>
                    <span>{showPassword ? "Log In to Dashboard" : "Continue with Email"}</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-8 text-center space-y-5">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-[13px] font-bold text-brand-green hover:text-brand-deep transition-colors"
              >
                {showPassword ? "Log in with magic link instead" : "Log in with password instead"}
              </button>
              
              <div className="h-[1px] w-full bg-brand-deep/5 rounded-full" />
              
              <p className="text-[13px] font-medium text-brand-deep/60">
                Don't have an account?{" "}
                <Link href="/register" className="font-bold text-brand-deep hover:text-brand-green transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Box */}
          {!showPassword && (
            <div className="mt-8 mx-auto max-w-[380px] bg-brand-deep/5 rounded-xl p-4 flex items-start space-x-3 border border-brand-deep/5 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-brand-green mt-0.5 shrink-0" />
              <p className="text-[12px] text-brand-deep/60 leading-relaxed font-medium">
                We'll send a secure one-time code to your email. No passwords needed to sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
