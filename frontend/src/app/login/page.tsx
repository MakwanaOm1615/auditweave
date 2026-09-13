"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { getErrorMessage, login } from "@/lib/api";
import { normalizeEmail, validateLogin } from "@/lib/auth/validation";
import { AuthSidebar } from "../components/AuthSidebar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateLogin(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);

    try {
      await login(normalizeEmail(email), password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to sign in. Please verify your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-brand-cream lg:flex-row">
      <Link href="/" className="absolute left-5 top-5 z-50 flex items-center space-x-2 text-sm font-bold text-brand-deep/50 transition-colors hover:text-brand-deep lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
      
      {/* Left Sidebar (Hidden on mobile) */}
      <AuthSidebar />

      {/* Right Form Content */}
      <section className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-[#FDFBF7] px-5 py-20 sm:px-8 lg:w-1/2 lg:px-10 lg:py-16 [@media(max-height:700px)]:lg:py-8">
        {/* Subtle Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-deep/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="z-10 mx-auto flex w-full max-w-[460px] flex-col">
          <Link
            href="/"
            className="mb-3 hidden items-center self-end rounded-lg px-1 py-1 text-[13px] font-bold text-brand-deep/50 transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 lg:flex"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex flex-col justify-center rounded-[28px] border border-brand-deep/[0.07] bg-white p-6 shadow-[0_18px_60px_rgba(13,58,53,0.08)] sm:p-8 [@media(max-height:700px)]:p-6">
            
            {/* Header */}
            <div className="mb-6 [@media(max-height:700px)]:mb-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4">
                <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-widest">AuditWeave Portal</span>
              </div>
              <h1 className="mb-1 text-[2.25rem] font-extrabold leading-tight tracking-[-0.04em] text-brand-deep [@media(max-height:700px)]:text-[2rem]">
                Welcome back
              </h1>
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
                <label htmlFor="login-email" className="block text-[13px] font-bold text-brand-deep">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 w-full rounded-xl border border-brand-deep/10 bg-brand-cream/40 pl-11 pr-4 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 hover:border-brand-deep/20 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 [@media(max-height:700px)]:h-[52px]"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                  <label htmlFor="login-password" className="block text-[13px] font-bold text-brand-deep">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                    </div>
                    <input
                      id="login-password"
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 w-full rounded-xl border border-brand-deep/10 bg-brand-cream/40 pl-11 pr-12 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 hover:border-brand-deep/20 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 [@media(max-height:700px)]:h-[52px]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-deep/40 hover:text-brand-green"
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex h-14 w-full items-center justify-center space-x-2.5 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all duration-300 hover:-translate-y-px hover:bg-[#1C5E47] hover:shadow-lg hover:shadow-brand-green/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 [@media(max-height:700px)]:h-[52px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Dashboard</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-7 space-y-5 text-center [@media(max-height:700px)]:mt-5 [@media(max-height:700px)]:space-y-4">
              <div className="h-[1px] w-full bg-brand-deep/5 rounded-full" />
              
              <p className="text-[13px] font-medium text-brand-deep/60">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-brand-deep hover:text-brand-green transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
