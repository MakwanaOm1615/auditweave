"use client";

import Link from "next/link";
import { Shield, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, FileLock2, Award, BookOpen, KeyRound } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-brand-cream text-brand-deep overflow-hidden flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-green/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-laurel/20 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between border-b border-brand-deep/10 z-10 relative">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/axoreon-logo.png" alt="Axoreon Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md" />
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-2xl tracking-tighter text-brand-deep leading-none font-serif">
                AuditWeave
              </span>
              <span className="text-[10px] text-brand-laurel font-bold mt-1 leading-none uppercase tracking-widest">
                POWERED BY AXOREON
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-bold text-brand-deep hover:text-brand-green uppercase tracking-wider transition px-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold text-white bg-brand-green hover:bg-[#2e745e] uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm shadow-brand-green/20 transition"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center flex-1 z-10 w-full relative">
        {/* Left text column */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-brand-green/10 border border-brand-green/20 px-4 py-2 rounded-full text-xs font-semibold text-brand-green">
            <Sparkles className="h-4 w-4" />
            <span>AI-GRC Compliance Engine for DPDP Act 2023</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-brand-deep">
            India's AI-Powered <br className="hidden sm:inline" />
            <span className="text-brand-green">
              DPDP Compliance
            </span> <br />
            Intelligence Platform.
          </h1>
          
          <p className="text-sm sm:text-base text-brand-deep/70 leading-relaxed max-w-xl font-medium">
            Audit privacy policies, identify structural compliance gaps, evaluate regulatory liabilities, and generate executive-ready GRC reports. Built on a hybrid deterministic rule engine and Gemini AI.
          </p>

          {/* Differentiated CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              href="/audit/new"
              className="flex items-center justify-center space-x-2 text-sm font-bold text-white bg-brand-green hover:bg-[#1f4f42] px-8 py-4 rounded-xl shadow-lg shadow-brand-green/20 transition-all duration-300 cursor-pointer"
            >
              <span>Initialize GRC Audit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center space-x-2 text-sm font-bold text-brand-deep hover:text-brand-green bg-white border border-brand-deep/10 hover:bg-brand-cream px-8 py-4 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>Contact & Support</span>
            </Link>
          </div>

          {/* Trust statistics row */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-brand-deep/10 max-w-lg">
            <div>
              <p className="text-3xl font-bold text-brand-deep">40+</p>
              <p className="text-[10px] text-brand-laurel font-bold uppercase tracking-wider mt-1">Rule Checks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-green">96%</p>
              <p className="text-[10px] text-brand-laurel font-bold uppercase tracking-wider mt-1">AI Confidence</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#3F9C7E]">100%</p>
              <p className="text-[10px] text-brand-laurel font-bold uppercase tracking-wider mt-1">DPDP Mapped</p>
            </div>
          </div>
        </div>

        {/* Right mockup column wrapped in Conic Glowing Border */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-brand-green/5 rounded-2xl filter blur-3xl pointer-events-none" />
          
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-brand-deep/10 to-brand-cream shadow-xl">
            <div className="bg-white rounded-2xl p-6 overflow-hidden">
              {/* Top window bar */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-deep/5 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] text-brand-laurel font-mono">console.axoreon.com/auditweave</span>
              </div>

              {/* Simulated Live Score Card */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-brand-laurel font-mono font-bold">AUDITED ENTITY</p>
                    <p className="text-base font-bold text-brand-deep">Paytm Core Services</p>
                  </div>
                  <div className="h-14 w-14 rounded-full border-[3px] border-brand-green flex items-center justify-center bg-brand-green/5 text-brand-green font-bold text-lg">
                    79
                  </div>
                </div>

                <div className="border border-brand-deep/5 rounded-xl p-4 bg-brand-cream/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-deep/70 font-medium">DPDP Notice Compliance</span>
                    <span className="text-brand-green font-bold">PASS (92%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-deep/70 font-medium">Children's Data Restrictions</span>
                    <span className="text-red-500 font-bold">FAIL (20%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-deep/70 font-medium">Grievance Redressal</span>
                    <span className="text-amber-500 font-bold">WARNING (50%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-brand-laurel font-mono font-bold">
                    <span>AI Legal Reasoning</span>
                    <span>96% Certainty</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-cream rounded-full overflow-hidden">
                    <div className="h-full w-[96%] bg-brand-green" />
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-900 text-[11px] leading-relaxed">
                    <span className="font-bold">Critical Vulnerability:</span> Missing age-gating mechanisms for users under 18. Penalties cap at ₹200 Crore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Pillars Feature Grid */}
      <section className="bg-white border-t border-brand-deep/5 py-16 w-full z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-deep">Full DPDP Alignment Modules</h2>
            <p className="text-xs sm:text-sm text-brand-deep/70 leading-relaxed font-medium">
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
                <div key={i} className="glass-card rounded-xl p-6 bg-white hover:bg-brand-cream/30 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-brand-deep mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-brand-deep/70 leading-relaxed">{pillar.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer with Enterprise Documentation Links */}
      <footer className="border-t border-brand-deep/10 bg-brand-cream py-10 w-full z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-xs text-brand-deep/70">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/axoreon-logo.png" alt="Axoreon Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-xl tracking-tighter text-brand-deep leading-none font-serif">
                  AuditWeave
                </span>
                <span className="text-[9px] text-brand-laurel font-bold mt-1 leading-none uppercase tracking-widest">
                  POWERED BY AXOREON
                </span>
              </div>
            </div>
            <p className="leading-relaxed text-[11px] text-brand-deep/60 max-w-xs font-medium">
              India's Digital Personal Data Protection (DPDP) Act 2023 compliance intelligence platform. Built for compliance officers, legal practitioners, and auditing teams.
            </p>
          </div>
          
          <div className="md:col-span-3 space-y-4">
            <p className="font-bold text-brand-deep uppercase tracking-wider text-[10px]">Compliance Docs</p>
            <ul className="space-y-3 font-medium">
              <li><Link href="/docs/security" className="hover:text-brand-green flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Security Policy</Link></li>
              <li><Link href="/docs/privacy" className="hover:text-brand-green flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-4">
            <p className="font-bold text-brand-deep uppercase tracking-wider text-[10px]">Integration</p>
            <ul className="space-y-3 font-medium">
              <li><Link href="/docs/api" className="hover:text-brand-green flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> API Documentation</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-4">
            <p className="font-bold text-brand-deep uppercase tracking-wider text-[10px]">Company</p>
            <ul className="space-y-3 font-medium">
              <li><Link href="/contact" className="hover:text-brand-green">Contact & Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-brand-deep/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-laurel font-medium">© 2026 Axoreon. Statutory auditing mapping under DPDP Act 2023.</p>
          
          <div className="flex items-center space-x-2 text-[10px] font-bold text-brand-laurel uppercase tracking-widest bg-brand-deep/5 px-4 py-2 rounded-full">
            <span>Powered by</span>
            <span className="text-brand-deep">AXOREON</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
