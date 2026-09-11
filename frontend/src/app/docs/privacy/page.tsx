import { Shield, BookOpen, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyDocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-emerald-300" />
            <span>Privacy Policy</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data collection disclosures, user rights, and data processing transparency in compliance with India's DPDP Act 2023.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
        >
          Return Home
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-900">1. Data We Process</h2>
        <p>
          AuditWeave acts as a **Data Fiduciary** for user accounts and a **Data Processor** for uploaded privacy policies. We collect:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
          <li>Account credentials (email address, encrypted password hash) for secure access.</li>
          <li>Temporary privacy notice texts, URLs, or documents uploaded for GRC audits.</li>
          <li>System interaction metadata stored inside secure GRC compliance logs.</li>
        </ul>

        <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-900 mt-6">2. Purpose & Notice of Collection (Section 5)</h2>
        <p>
          User details are processed exclusively to authenticate accounts and audit uploaded policy texts against statutory compliance rules. Uploaded privacy policies are parsed inside transient memory and deleted permanently from analysis workers once report compilations are completed. We do **not** sell, monetize, or utilize uploaded policy contents for training third-party models.
        </p>

        <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-900 mt-6">3. Data Principal Rights (Sections 11 & 12)</h2>
        <p>
          In accordance with the DPDP Act 2023, you have:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
          <li>The right to access a summary of your personal data processed on the platform.</li>
          <li>The right to correct inaccurate or obsolete profile information.</li>
          <li>The right to request erasure of your user credentials and past audit histories at any time.</li>
        </ul>

        <h2 className="text-base font-bold text-slate-100 pb-2 border-b border-slate-900 mt-6">4. Grievance Redressal (Section 13)</h2>
        <p>
          For complaints, rights exercise queries, or data issues, please contact our designated **Nodal Grievance Redressal Officer**:
        </p>
        <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-xl space-y-1 text-xs text-slate-400">
          <p className="font-bold text-slate-200">Mr. Ramesh Kumar</p>
          <p>Email: <code className="text-emerald-300 font-bold font-mono">grievance@auditweave.ai</code></p>
          <p>Address: AuditWeave GRC Labs, Sector 5, Salt Lake, Kolkata, India</p>
          <p className="text-[10px] text-slate-500 mt-2">Response SLA: Grievance resolutions are addressed and completed within 15 business days.</p>
        </div>
      </div>
    </div>
  );
}
