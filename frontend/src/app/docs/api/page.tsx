import { BookOpen, Terminal, Code, Cpu, ShieldAlert, KeyRound } from "lucide-react";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Code className="h-7 w-7 text-emerald-300" />
            <span>API Documentation</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Integration guide, REST API endpoints, request/response models, and rate limits.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
        >
          Return Home
        </Link>
      </div>

      {/* Overview */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-4">
        <h2 className="text-base font-bold text-slate-200">REST API Integration</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          AuditWeave provides REST APIs to automate privacy policy scans inside your development pipelines or vendor risk dashboards. Base Endpoint URL: <code className="text-emerald-300 font-bold font-mono">http://localhost:8000/api</code>.
        </p>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
          <KeyRound className="h-4 w-4 text-emerald-300" />
          <span>Requires Bearer Authentication (JWT Token)</span>
        </div>
      </div>

      {/* Endpoint 1: Audit */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-900">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-950 font-bold px-2 py-0.5 rounded text-[10px]">POST</span>
            <span>/audit</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Rate Limit: 100/Hour</span>
        </div>

        <p className="text-xs text-slate-400 leading-normal">
          Submits a privacy policy text or scraper URL to execute the hybrid compliance audit.
        </p>

        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">cURL Example</p>
          <pre className="p-4 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:8000/api/audit \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_name": "MyCompany",
    "industry": "SaaS",
    "policy_url": "https://mycompany.com/privacy"
  }'`}
          </pre>
        </div>

        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Response Example (JSON)</p>
          <pre className="p-4 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
{`{
  "id": 482,
  "compliance_score": 85.0,
  "risk_score": 15.0,
  "status": "Excellent",
  "overall_summary": "AuditWeave audited MyCompany...",
  "findings": [
    {
      "pillar": "Grievance Redressal",
      "issue": "Compliant Contacts",
      "severity": "Informational",
      "dpdp_section": "Section 13",
      "evidence_extract": "Contact our Grievance Officer at...",
      "reason": "Correct officer details provided.",
      "legal_rec": "Maintain details.",
      "tech_rec": "Verify mailbox SLA.",
      "business_rec": "Audit quarterly."
    }
  ]
}`}
          </pre>
        </div>
      </div>

      {/* Endpoint 2: Compare */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-900">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-950 font-bold px-2 py-0.5 rounded text-[10px]">POST</span>
            <span>/compare</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Rate Limit: 200/Hour</span>
        </div>

        <p className="text-xs text-slate-400 leading-normal">
          Generates side-by-side posture metrics and compliance winner calculations for two past audits.
        </p>

        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">cURL Example</p>
          <pre className="p-4 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:8000/api/compare \\
  -H "Content-Type: application/json" \\
  -d '{
    "audit_id_a": 12,
    "audit_id_b": 15
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
