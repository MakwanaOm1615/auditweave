"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { register } from "@/lib/api";
import { AuthSidebar } from "../components/AuthSidebar";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await register(email, password);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex w-full relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center space-x-2 text-sm font-bold text-brand-deep/50 hover:text-brand-deep transition-colors z-50 lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
      
      {/* Left Sidebar (Hidden on mobile) */}
      <AuthSidebar />

      {/* Right Form Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-16 lg:w-[50%] bg-brand-cream relative">
        <Link href="/" className="absolute top-8 right-12 hidden lg:flex items-center space-x-2 text-[13px] font-bold text-brand-deep/60 hover:text-brand-deep transition-colors">
          <span>Back to Home</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="w-full max-w-[440px] mx-auto flex flex-col justify-center h-full pt-4">
          
          {/* Header */}
          <div className="mb-10">
            <p className="text-[13px] text-brand-deep/70 font-medium mb-1">
              Welcome to <span className="font-bold text-brand-deep">AuditWeave</span>
            </p>
            <h2 className="text-[3rem] font-extrabold text-brand-deep mb-2 tracking-tight leading-[1.1] font-sans">
              Create your account
            </h2>
            <p className="text-[14.5px] text-brand-deep/70 font-medium">
              Get started with AI-powered compliance management
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13.5px] font-bold text-brand-deep block">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 h-[52px] bg-white border border-brand-deep/10 rounded-[8px] text-[15px] focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep transition-all placeholder:text-brand-deep/40 shadow-[0_1px_2px_rgba(13,58,53,0.02)]"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13.5px] font-bold text-brand-deep block">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 h-[52px] bg-white border border-brand-deep/10 rounded-[8px] text-[15px] focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep transition-all placeholder:text-brand-deep/40 shadow-[0_1px_2px_rgba(13,58,53,0.02)]"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13.5px] font-bold text-brand-deep block">
                Work email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 h-[52px] bg-white border border-brand-deep/10 rounded-[8px] text-[15px] focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep transition-all placeholder:text-brand-deep/40 shadow-[0_1px_2px_rgba(13,58,53,0.02)]"
                placeholder="you@company.com"
              />
            </div>

            {showPassword && (
              <div className="space-y-2">
                <label className="text-[13.5px] font-bold text-brand-deep block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 h-[52px] bg-white border border-brand-deep/10 rounded-[8px] text-[15px] focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-deep transition-all placeholder:text-brand-deep/40 shadow-[0_1px_2px_rgba(13,58,53,0.02)]"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] mt-2 bg-brand-green hover:bg-[#1f4f42] rounded-[8px] text-[15px] font-bold text-white transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{showPassword ? "Creating Account..." : "Processing..."}</span>
                </>
              ) : (
                <>
                  <span>{showPassword ? "Create Account" : "Continue with Email"}</span>
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </form>

          {/* Footer Text */}
          <div className="mt-8 text-center">
            <p className="text-[12.5px] text-brand-deep/70 leading-[1.6] font-medium">
              By creating an account you agree to our{" "}
              <Link href="/docs/terms" className="font-bold border-b border-brand-deep/20 text-brand-deep hover:text-brand-green hover:border-brand-green transition-colors pb-[1px]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/docs/privacy" className="font-bold border-b border-brand-deep/20 text-brand-deep hover:text-brand-green hover:border-brand-green transition-colors pb-[1px]">
                Privacy Policy
              </Link>.
            </p>
          </div>

          {/* Links */}
          <div className="mt-10 text-center">
            <p className="text-[13.5px] font-medium text-brand-deep/70">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-brand-deep hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
