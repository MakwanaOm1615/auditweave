"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { getErrorMessage, register } from "@/lib/api";
import { normalizeEmail, PASSWORD_MIN_LENGTH, validateSignup } from "@/lib/auth/validation";
import { AuthSidebar } from "../components/AuthSidebar";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateSignup(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);

    try {
      await register(firstName.trim(), normalizeEmail(email), password);
      router.push("/login");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create account. Please try again."));
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
      <section className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-[#FDFBF7] px-5 py-20 sm:px-8 lg:w-1/2 lg:px-10 lg:py-16 [@media(max-height:800px)]:lg:py-8">
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

          <div className="flex flex-col justify-center rounded-[28px] border border-brand-deep/[0.07] bg-white p-6 shadow-[0_18px_60px_rgba(13,58,53,0.08)] sm:p-8 [@media(max-height:800px)]:p-6">
            
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4">
                <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-widest">AuditWeave Platform</span>
              </div>
              <h2 className="text-[2.25rem] font-extrabold text-brand-deep tracking-tight leading-tight mb-1">
                Create account
              </h2>
              <p className="text-[13px] text-brand-deep/60 font-medium">
                Join to automate DPDP 2023 compliance, data governance, and AI audits.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div className="relative space-y-1.5">
                <label htmlFor="register-first-name" className="block text-[13px] font-bold text-brand-deep">
                  First name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    id="register-first-name"
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-[52px] w-full rounded-xl border border-brand-deep/10 bg-brand-cream/40 pl-11 pr-4 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                    placeholder="Krishna"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[13px] font-bold text-brand-deep block">
                  Work email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 h-[52px] bg-brand-cream/40 border border-brand-deep/10 rounded-xl text-[14.5px] focus:bg-white focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 text-brand-deep transition-all placeholder:text-brand-deep/30 font-medium"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                  <label className="text-[13px] font-bold text-brand-deep block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                    </div>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 h-[52px] bg-brand-cream/40 border border-brand-deep/10 rounded-xl text-[14.5px] focus:bg-white focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 text-brand-deep transition-all placeholder:text-brand-deep/30 font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-deep/40 hover:text-brand-green"
                      aria-label={passwordVisible ? "Hide passwords" : "Show passwords"}
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-brand-deep/50">Use at least {PASSWORD_MIN_LENGTH} characters.</p>
                </div>

              <div className="space-y-1.5 relative">
                <label className="text-[13px] font-bold text-brand-deep block">Confirm password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 h-[52px] bg-brand-cream/40 border border-brand-deep/10 rounded-xl text-[14.5px] focus:bg-white focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 text-brand-deep transition-all placeholder:text-brand-deep/30 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] mt-4 bg-brand-green hover:bg-[#1C5E47] hover:-translate-y-[1px] hover:shadow-lg hover:shadow-brand-green/20 rounded-xl text-[15px] font-bold text-white transition-all duration-300 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <div className="mt-8 pt-6 border-t border-brand-deep/5 text-center">
              <p className="text-[12px] text-brand-deep/60 leading-relaxed font-medium">
                By creating an account you agree to our{" "}
                <Link href="/docs/terms" className="font-bold text-brand-deep hover:text-brand-green transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/docs/privacy" className="font-bold text-brand-deep hover:text-brand-green transition-colors">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-[13px] font-medium text-brand-deep/60">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-brand-deep hover:text-brand-green transition-colors">
                  Log in to portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
