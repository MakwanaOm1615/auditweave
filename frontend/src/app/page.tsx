"use client";

import Link from "next/link";
import { Shield, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, FileLock2, Award, BookOpen, KeyRound } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0D3A35] text-slate-100 overflow-hidden flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between border-b border-slate-900/60 z-10">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-emerald-300 glow-primary" />
          <span className="font-extrabold text-xl tracking-wider text-slate-100">
            AuditWeave <span className="text-emerald-300">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/audit/new"
            className="text-xs font-semibold text-slate-400 hover:text-white uppercase tracking-wider px-4 py-2 border border-slate-800 rounded-lg hover:bg-slate-900/60 transition"
          >
            Go to Auditor
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center flex-1 z-10 w-full">
        {/* Left text column */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-emerald-600/10 border border-emerald-300/20 px-3.5 py-2 rounded-full text-xs font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4" />
            <span>AI-GRC Compliance Engine for DPDP Act 2023</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            India's AI-Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              DPDP Compliance
            </span> <br />
            Intelligence Platform.
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            Audit privacy policies, identify structural compliance gaps, evaluate regulatory liabilities, and generate executive-ready GRC reports. Built on a hybrid deterministic rule engine and Gemini AI.
          </p>

          {/* Differentiated CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              href="/audit/new"
              className="flex items-center justify-center space-x-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-300 hover:to-indigo-500 px-8 py-4 rounded-xl border border-emerald-300/20 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all duration-300 cursor-pointer"
            >
              <span>Initialize GRC Audit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center space-x-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850 px-8 py-4 rounded-xl transition-all cursor-pointer"
            >
              <span>Contact & Support</span>
            </Link>
          </div>

          {/* Trust statistics row */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-900 max-w-lg">
            <div>
              <p className="text-2xl font-bold text-white">40+</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rule Checks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">96%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Confidence</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">100%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DPDP Mapped</p>
            </div>
          </div>
        </div>

        {/* Right mockup column wrapped in Conic Glowing Border */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-emerald-600/5 rounded-2xl filter blur-3xl pointer-events-none" />
          
          <div className="animated-border p-[1px] glow-primary">
            <div className="bg-[#080d1a] border border-slate-900 rounded-xl p-6 overflow-hidden">
              {/* Top window bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <span className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">console.auditweave.ai</span>
              </div>

              {/* Simulated Live Score Card */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono">AUDITED ENTITY</p>
                    <p className="text-base font-bold text-slate-100">Paytm Core Services</p>
                  </div>
                  <div className="h-14 w-14 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-950/20 text-emerald-400 font-bold text-lg glow-success">
                    79
                  </div>
                </div>

                <div className="border border-slate-850 rounded-xl p-4 bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">DPDP Notice Compliance</span>
                    <span className="text-emerald-400 font-semibold">🟢 PASS (92%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Children's Data Restrictions</span>
                    <span className="text-red-400 font-semibold">🔴 FAIL (20%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Grievance Redressal</span>
                    <span className="text-amber-400 font-semibold">🟡 WARNING (50%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>AI Legal Reasoning</span>
                    <span>96% Certainty</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full w-[96%] bg-gradient-to-r from-emerald-300 to-emerald-400" />
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-slate-400 text-[11px] leading-tight">
                    <span className="text-amber-400 font-semibold">Critical Vulnerability:</span> Missing age-gating mechanisms for users under 18. Penalties cap at ₹200 Crore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Pillars Feature Grid */}
      <section className="bg-slate-950/20 border-t border-slate-900 py-16 w-full z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Full DPDP Alignment Modules</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              AuditWeave evaluates policies against the seven structural pillars mandated by the Indian Parliament in the DPDP Act 2023.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Consent Compliance", icon: CheckCircle2, text: "Granular opt-ins, withdrawal mechanisms, and affirmative action checks under Section 6." },
              { title: "Notice Disclosures", icon: FileLock2, text: "Verification of clear descriptions of data collected, purpose mapping, and rights (Section 5)." },
              { title: "Children's Protections", icon: AlertTriangle, text: "Age verification checks, parent consent details, and bans on minor tracking (Section 9)." },
              { title: "Grievance Redressal", icon: Award, text: "Nodal Grievance Redressal Officer contact disclosure and escalation SLA verification (Section 13)." }
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="glass-card rounded-xl p-5 border border-slate-900 hover:border-slate-850">
                  <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-300 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{pillar.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer with Enterprise Documentation Links */}
      <footer className="border-t border-slate-900/60 bg-[#02050e] py-10 w-full z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-xs text-slate-400">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-emerald-300" />
              <span className="font-extrabold text-sm text-slate-200 tracking-wider">AuditWeave</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              India's Digital Personal Data Protection (DPDP) Act 2023 compliance intelligence platform. Built for compliance officers, legal practitioners, and auditing teams.
            </p>
          </div>
          
          <div className="md:col-span-3 space-y-3">
            <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Compliance Docs</p>
            <ul className="space-y-2">
              <li><Link href="/docs/security" className="hover:text-white flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Security Policy</Link></li>
              <li><Link href="/docs/privacy" className="hover:text-white flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Integration</p>
            <ul className="space-y-2">
              <li><Link href="/docs/api" className="hover:text-white flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> API Documentation</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Company</p>
            <ul className="space-y-2">
              <li><Link href="/contact" className="hover:text-white">Contact & Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-900/60 pt-6 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AuditWeave. Statutory auditing mapping under DPDP Act 2023.</p>
          <div className="flex space-x-6">
            <Link href="/docs/security" className="hover:text-slate-400">Security</Link>
            <Link href="/docs/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link href="/contact" className="hover:text-slate-400">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
