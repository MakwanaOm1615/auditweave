import { Shield, Lock, Eye, KeyRound, Key, RefreshCw, Terminal } from "lucide-react";
import Link from "next/link";

export default function SecurityDocsPage() {
  const securitySections = [
    {
      title: "Data Encryption & Transport Security",
      icon: Lock,
      desc: "All client data is encrypted in transit using TLS 1.3 and at rest inside databases using AES-256 block ciphers. Backup volumes are secured with separate key hierarchies."
    },
    {
      title: "Sandboxed Text Processing",
      icon: Shield,
      desc: "Policy text extractions are processed inside transient memory sandboxes. Scraping routines utilize isolated network sockets and remove headers, scripts, and trackers."
    },
    {
      title: "GRC Audit Logging",
      icon: Terminal,
      desc: "Every administrative operation, user authentication session, and audit calculation is registered in GRC-compliant audit logs, capturing timestamp offsets and execution logs."
    },
    {
      title: "Role-Based Access Control",
      icon: KeyRound,
      desc: "Platform endpoints enforce JWT-based authorization tokens. Read/write operations are isolated dynamically based on roles (User vs. Compliance Officer/Admin)."
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Lock className="h-7 w-7 text-emerald-300" />
            <span>Security Policy</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise security protocols, encryption benchmarks, and access control policies of AuditWeave.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
        >
          Return Home
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-6">
        <h2 className="text-base font-bold text-slate-200">Security Architecture & Standards</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          AuditWeave is designed to protect sensitive organizational compliance records. Our platform adheres to cyber-security frameworks mapping to standard GRC expectations (ISO 27001 / SOC 2 Type II baseline controls).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {securitySections.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <div key={i} className="bg-slate-950/40 p-5 rounded-xl border border-slate-900 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-300">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">{sec.title}</h3>
                <p className="text-xs text-slate-400 leading-normal">{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Compliance Disclaimer */}
      <div className="bg-emerald-600/5 border border-emerald-600/10 p-4 rounded-xl text-xs text-slate-400 leading-relaxed">
        <span className="text-emerald-300 font-bold block mb-1">Vulnerability Disclosure Program</span>
        If you discover a security vulnerability in our platform or auditing routines, please file an immediate report via the support form on our <Link href="/contact" className="text-emerald-300 font-semibold hover:underline">Contact page</Link> under the 'Security Vulnerability Report' category. We prioritize response coordination.
      </div>
    </div>
  );
}
