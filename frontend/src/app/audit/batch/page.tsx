"use client";

import { useState } from "react";
import Link from "next/link";
import { createBatchAudit, createAuditWithFile } from "@/lib/api";
import { 
  Layers, Plus, Trash2, Shield, Globe, FileText, Upload, Sparkles, 
  CheckCircle2, XCircle, Trophy, ArrowUpRight, Download, Loader2, AlertCircle, Building2
} from "lucide-react";

interface CompanyEntry {
  id: string;
  name: string;
  industry: string;
  mode: "url" | "text" | "file";
  url: string;
  text: string;
  file: File | null;
}

const INDUSTRIES = [
  "E-Commerce", "FinTech", "HealthTech", "EdTech", "SaaS",
  "Logistics", "Retail", "Cybersecurity", "Artificial Intelligence",
  "Banking", "Insurance", "Telecommunications", "Media", "Travel & Hospitality"
];

const DPDP_PILLARS = [
  "Notice & Transparency",
  "Explicit Consent",
  "Purpose Limitation",
  "Data Retention & Erasure",
  "Protection of Minors",
  "Grievance Officer Contact",
  "Withdrawal of Consent",
  "Data Principal Rights",
  "Security Safeguards",
  "Breach Notification",
  "Cross-Border Transfers"
];

export default function BatchAuditPage() {
  const [companies, setCompanies] = useState<CompanyEntry[]>([
    { id: "1", name: "Swiggy", industry: "E-Commerce", mode: "url", url: "https://www.swiggy.com/privacy-policy", text: "", file: null },
    { id: "2", name: "Paytm", industry: "FinTech", mode: "url", url: "https://paytm.com/privacy-policy", text: "", file: null }
  ]);

  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [batchResults, setBatchResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addCompany = () => {
    const newId = String(companies.length + 1);
    setCompanies([
      ...companies,
      { id: newId, name: `Company ${newId}`, industry: "FinTech", mode: "url", url: "", text: "", file: null }
    ]);
  };

  const removeCompany = (id: string) => {
    if (companies.length <= 2) return;
    setCompanies(companies.filter(c => c.id !== id));
  };

  const updateCompany = (id: string, key: keyof CompanyEntry, value: any) => {
    setCompanies(companies.map(c => c.id === id ? { ...c, [key]: value } : c));
  };

  const runBatchAudit = async () => {
    setError(null);
    if (companies.some(c => !c.name || !c.name.trim())) {
      setError("Please provide a company name for all batch items.");
      return;
    }

    setLoading(true);
    setScanStep(1);

    try {
      // Handle file uploads first if any company uses 'file' mode
      const processedItems = await Promise.all(
        companies.map(async (c) => {
          if (c.mode === "file" && c.file) {
            const fileRes = await createAuditWithFile(c.name, c.industry, c.file);
            return { company_name: c.name, industry: c.industry, policy_text: fileRes.policy_text || "Uploaded Document Policy Text" };
          } else if (c.mode === "url" && c.url) {
            return { company_name: c.name, industry: c.industry, policy_url: c.url };
          } else {
            return { company_name: c.name, industry: c.industry, policy_text: c.text || `Standard Privacy Policy for ${c.name}` };
          }
        })
      );

      setScanStep(2);
      const batchRes = await createBatchAudit(processedItems);
      setScanStep(3);
      await new Promise(r => setTimeout(r, 600));
      setBatchResults(batchRes);
    } catch (err: any) {
      console.error("Batch audit failed:", err);
      setError(err.message || "Failed to execute batch audit. Please check your URLs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPillarStatus = (audit: any, pillarName: string) => {
    if (!audit || !audit.findings) return true;
    const lowerPillar = pillarName.toLowerCase();
    const violation = audit.findings.find((f: any) => 
      (f.pillar || "").toLowerCase().includes(lowerPillar) || 
      (f.issue || "").toLowerCase().includes(lowerPillar) ||
      (f.dpdp_section || "").toLowerCase().includes(lowerPillar)
    );
    return !violation;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-300 glow-primary">
              <Layers className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Multi-Company Batch Audit
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Audit multiple enterprise privacy policies simultaneously under DPDP Act 2023 and compare GRC posture side-by-side.
          </p>
        </div>

        {batchResults && (
          <button
            onClick={() => setBatchResults(null)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Batch Scan</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Multi-Company Input Builder */}
      {!batchResults && !loading && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-slate-800 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Batch Companies Input Setup</h2>
                <p className="text-xs text-slate-400">Add URLs, raw text, or document files for all target companies.</p>
              </div>

              <button
                onClick={addCompany}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 font-semibold text-xs transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Company</span>
              </button>
            </div>

            <div className="space-y-4">
              {companies.map((company, index) => (
                <div key={company.id} className="p-5 bg-[#0B1120] border border-slate-800 rounded-xl space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-600/20 text-emerald-300 text-xs font-bold flex items-center justify-center border border-emerald-600/30">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">Target Enterprise #{index + 1}</span>
                    </div>

                    {companies.length > 2 && (
                      <button
                        onClick={() => removeCompany(company.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Remove Company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Swiggy, Paytm, PhonePe"
                        value={company.name}
                        onChange={(e) => updateCompany(company.id, "name", e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0D3A35] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry Sector</label>
                      <select
                        value={company.industry}
                        onChange={(e) => updateCompany(company.id, "industry", e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0D3A35] border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        {INDUSTRIES.map(ind => (
                          <option key={ind} value={ind} className="bg-[#0D3A35] text-slate-200">{ind}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-2">
                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "url")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "url" ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/40" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Policy URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "text")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "text" ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/40" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Paste Text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "file")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "file" ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/40" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>

                    {company.mode === "url" && (
                      <input
                        type="url"
                        placeholder="https://example.com/privacy-policy"
                        value={company.url}
                        onChange={(e) => updateCompany(company.id, "url", e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0D3A35] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600"
                      />
                    )}

                    {company.mode === "text" && (
                      <textarea
                        rows={3}
                        placeholder="Paste privacy policy clauses here..."
                        value={company.text}
                        onChange={(e) => updateCompany(company.id, "text", e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0D3A35] border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    )}

                    {company.mode === "file" && (
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => updateCompany(company.id, "file", e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runBatchAudit}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-300 hover:to-blue-500 text-slate-950 font-bold text-base transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-3"
          >
            <Sparkles className="h-5 w-5" />
            <span>Run Multi-Company Batch Audit ({companies.length} Companies)</span>
          </button>
        </div>
      )}

      {/* LOADING STATE OVERLAY */}
      {loading && (
        <div className="glass-panel p-16 border border-slate-800 rounded-2xl text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600/20 border-t-emerald-300 animate-spin"></div>
            <Shield className="h-7 w-7 text-emerald-300" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Auditing Batch Companies</h3>
            <p className="text-sm text-slate-400">
              {scanStep === 1 && "Scraping web policies and extracting statutory text..."}
              {scanStep === 2 && "Executing DPDP Act 2023 11-pillar rule engine matrix..."}
              {scanStep === 3 && "Synthesizing side-by-side comparative GRC report..."}
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-600 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${(scanStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* STEP 2: BATCH COMPARATIVE DASHBOARD */}
      {batchResults && !loading && (
        <div className="space-y-8">
          {/* Winner Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 glow-warning">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs text-amber-400 uppercase font-bold tracking-wider">Batch Highest Compliance Winner</p>
                <h2 className="text-2xl font-black text-white">{batchResults.winner_company}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Leading DPDP Act statutory compliance posture in this benchmark set.</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 bg-[#0B1120]/80 p-4 rounded-xl border border-slate-800">
              <div className="text-center px-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Companies</p>
                <p className="text-xl font-extrabold text-white">{batchResults.total_companies}</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-800"></div>
              <div className="text-center px-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Batch Score</p>
                <p className="text-xl font-extrabold text-emerald-300">{batchResults.average_compliance_score}/100</p>
              </div>
            </div>
          </div>

          {/* 11-Pillar Side-by-Side Comparison Matrix */}
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">DPDP Act 2023 Statutory Matrix</h3>
              <p className="text-xs text-slate-400">Pillar-by-pillar comparative compliance across audited enterprises.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold uppercase">DPDP Statutory Pillar</th>
                    {batchResults.audits.map((a: any) => (
                      <th key={a.id} className="py-3 px-4 font-bold text-slate-200 text-center">
                        <div>{a.company_name}</div>
                        <div className="text-[10px] text-emerald-300 font-medium">{a.compliance_score?.toFixed(1)}/100</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DPDP_PILLARS.map((pillar) => (
                    <tr key={pillar} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-300">{pillar}</td>
                      {batchResults.audits.map((audit: any) => {
                        const passed = getPillarStatus(audit, pillar);
                        return (
                          <td key={audit.id} className="py-3.5 px-4 text-center">
                            {passed ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px]">
                                <XCircle className="h-3 w-3" />
                                <span>Violation</span>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Enterprise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batchResults.audits.map((audit: any) => (
              <div key={audit.id} className="glass-panel p-6 border border-slate-800 rounded-2xl space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{audit.company_name}</h3>
                      <p className="text-xs text-slate-400">{audit.company_industry || "Enterprise"}</p>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      audit.status?.includes("Critical") ? "bg-red-500/10 text-red-400 border-red-500/30" :
                      audit.status?.includes("High") ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {audit.status || "Evaluated"}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Compliance Score</p>
                      <p className="text-3xl font-black text-emerald-300 mt-0.5">
                        {audit.compliance_score?.toFixed(1)}
                        <span className="text-xs text-slate-500 font-normal">/100</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-xs font-semibold text-emerald-400">
                        {audit.rules_passed_count || 0} Passed
                      </p>
                      <p className="text-xs font-semibold text-rose-400">
                        {audit.rules_failed_count || 0} Violations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <Link
                    href={`/audit/${audit.id}`}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 text-xs font-semibold text-center transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Full GRC Report</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <a
                    href={`http://127.0.0.1:8000/api/report/${audit.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                    title="Download PDF Report"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
