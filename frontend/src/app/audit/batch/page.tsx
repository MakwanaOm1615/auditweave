"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBatchAudit, createAuditWithFile, downloadAuditReport } from "@/lib/api";
import { 
  Layers, Plus, Trash2, Shield, Globe, FileText, Upload, Sparkles, 
  CheckCircle2, XCircle, Trophy, ArrowUpRight, Download, Loader2, AlertCircle, Building2, ChevronDown
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.industry-dropdown')) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="w-full max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-green/20 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green shadow-sm">
              <Layers className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-deep">
              Multi-Company Batch Audit
            </h1>
          </div>
          <p className="text-sm text-brand-deep/70">
            Audit multiple enterprise privacy policies simultaneously under DPDP Act 2023 and compare GRC posture side-by-side.
          </p>
        </div>

        {batchResults && (
          <button
            onClick={() => setBatchResults(null)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-green/10 hover:bg-brand-green/20 text-brand-green font-semibold text-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Batch Scan</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-600 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Multi-Company Input Builder */}
      {!batchResults && !loading && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-brand-green/20 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-deep">Batch Companies Input Setup</h2>
                <p className="text-xs text-brand-deep/70">Add URLs, raw text, or document files for all target companies.</p>
              </div>

              <button
                onClick={addCompany}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/20 text-brand-green font-semibold text-xs transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Company</span>
              </button>
            </div>

            <div className="space-y-4">
              {companies.map((company, index) => (
                <div key={company.id} className="p-5 bg-brand-cream/50 border border-brand-green/20 rounded-xl space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-brand-green/10 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="h-6 w-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-brand-deep">Target Enterprise #{index + 1}</span>
                    </div>

                    {companies.length > 2 && (
                      <button
                        onClick={() => removeCompany(company.id)}
                        className="text-brand-deep/50 hover:text-red-500 transition"
                        title="Remove Company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-deep/80 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Swiggy, Paytm, PhonePe"
                        value={company.name}
                        onChange={(e) => updateCompany(company.id, "name", e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-brand-green/30 rounded-lg text-sm text-brand-deep placeholder-brand-deep/40 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-deep/80 mb-1.5">Industry Sector</label>
                      <div className="relative industry-dropdown">
                        <div 
                          className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm cursor-pointer flex justify-between items-center transition-all ${openDropdownId === company.id ? 'border-brand-green ring-1 ring-brand-green text-brand-deep' : 'border-brand-green/30 text-brand-deep hover:border-brand-green/60'}`}
                          onClick={() => setOpenDropdownId(openDropdownId === company.id ? null : company.id)}
                        >
                          <span className="truncate">{company.industry}</span>
                          <ChevronDown className={`h-4 w-4 text-brand-deep/60 transition-transform duration-200 shrink-0 ${openDropdownId === company.id ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {openDropdownId === company.id && (
                          <div className="absolute z-20 w-full mt-1.5 bg-white border border-brand-green/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-1.5 overflow-hidden max-h-60 overflow-y-auto">
                            {INDUSTRIES.map(ind => (
                              <div
                                key={ind}
                                className={`px-3.5 py-2 cursor-pointer text-sm transition-colors truncate ${company.industry === ind ? 'bg-brand-green/10 text-brand-green font-bold' : 'hover:bg-brand-cream text-brand-deep/90 font-medium'}`}
                                onClick={() => { 
                                  updateCompany(company.id, "industry", ind);
                                  setOpenDropdownId(null);
                                }}
                                title={ind}
                              >
                                {ind}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2 border-b border-brand-green/20 pb-2">
                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "url")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "url" ? "bg-brand-green/10 text-brand-green border border-brand-green/30" : "text-brand-deep/60 hover:text-brand-deep"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Policy URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "text")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "text" ? "bg-brand-green/10 text-brand-green border border-brand-green/30" : "text-brand-deep/60 hover:text-brand-deep"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Paste Text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCompany(company.id, "mode", "file")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          company.mode === "file" ? "bg-brand-green/10 text-brand-green border border-brand-green/30" : "text-brand-deep/60 hover:text-brand-deep"
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
                        className="w-full px-3.5 py-2 bg-white border border-brand-green/30 rounded-lg text-sm text-brand-deep placeholder-brand-deep/40 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                      />
                    )}

                    {company.mode === "text" && (
                      <textarea
                        rows={3}
                        placeholder="Paste privacy policy clauses here..."
                        value={company.text}
                        onChange={(e) => updateCompany(company.id, "text", e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-brand-green/30 rounded-lg text-xs text-brand-deep placeholder-brand-deep/40 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green font-mono"
                      />
                    )}

                    {company.mode === "file" && (
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => updateCompany(company.id, "file", e.target.files?.[0] || null)}
                        className="w-full text-xs text-brand-deep/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runBatchAudit}
            className="w-full py-4 rounded-xl bg-brand-green hover:bg-brand-deep text-white font-bold text-base transition-all shadow-lg flex items-center justify-center space-x-3"
          >
            <Sparkles className="h-5 w-5" />
            <span>Run Multi-Company Batch Audit ({companies.length} Companies)</span>
          </button>
        </div>
      )}

      {/* LOADING STATE OVERLAY */}
      {loading && (
        <div className="bg-white p-16 border border-brand-green/20 rounded-2xl shadow-sm text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-brand-green/20 border-t-brand-green animate-spin"></div>
            <Shield className="h-7 w-7 text-brand-green" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brand-deep">Auditing Batch Companies</h3>
            <p className="text-sm text-brand-deep/70">
              {scanStep === 1 && "Scraping web policies and extracting statutory text..."}
              {scanStep === 2 && "Executing DPDP Act 2023 11-pillar rule engine matrix..."}
              {scanStep === 3 && "Synthesizing side-by-side comparative GRC report..."}
            </p>
          </div>

          <div className="max-w-md mx-auto bg-brand-cream/50 rounded-full h-2 overflow-hidden border border-brand-green/20">
            <div
              className="bg-brand-green h-full transition-all duration-500"
              style={{ width: `${(scanStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* STEP 2: BATCH COMPARATIVE DASHBOARD */}
      {batchResults && !loading && (
        <div className="space-y-8">
          {/* Winner Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Batch Highest Compliance Winner</p>
                <h2 className="text-2xl font-black text-brand-deep">{batchResults.winner_company}</h2>
                <p className="text-xs text-brand-deep/70 mt-0.5">Leading DPDP Act statutory compliance posture in this benchmark set.</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 bg-white p-4 rounded-xl border border-brand-green/20 shadow-sm">
              <div className="text-center px-2">
                <p className="text-[10px] text-brand-deep/50 uppercase font-bold">Total Companies</p>
                <p className="text-xl font-extrabold text-brand-deep">{batchResults.total_companies}</p>
              </div>
              <div className="h-8 w-[1px] bg-brand-green/20"></div>
              <div className="text-center px-2">
                <p className="text-[10px] text-brand-deep/50 uppercase font-bold">Avg Batch Score</p>
                <p className="text-xl font-extrabold text-brand-green">{batchResults.average_compliance_score}/100</p>
              </div>
            </div>
          </div>

          {/* 11-Pillar Side-by-Side Comparison Matrix */}
          <div className="bg-white p-6 border border-brand-green/20 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-deep">DPDP Act 2023 Statutory Matrix</h3>
              <p className="text-xs text-brand-deep/70">Pillar-by-pillar comparative compliance across audited enterprises.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-green/20 text-brand-deep/70">
                    <th className="py-3 px-4 font-semibold uppercase">DPDP Statutory Pillar</th>
                    {batchResults.audits.map((a: any) => (
                      <th key={a.id} className="py-3 px-4 font-bold text-brand-deep text-center">
                        <div>{a.company_name}</div>
                        <div className="text-[10px] text-brand-green font-medium">{a.compliance_score?.toFixed(1)}/100</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-green/10">
                  {DPDP_PILLARS.map((pillar) => (
                    <tr key={pillar} className="hover:bg-brand-cream/30 transition">
                      <td className="py-3.5 px-4 font-medium text-brand-deep/90">{pillar}</td>
                      {batchResults.audits.map((audit: any) => {
                        const passed = getPillarStatus(audit, pillar);
                        return (
                          <td key={audit.id} className="py-3.5 px-4 text-center">
                            {passed ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px]">
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
              <div key={audit.id} className="bg-white p-6 border border-brand-green/20 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-brand-deep">{audit.company_name}</h3>
                      <p className="text-xs text-brand-deep/70">{audit.company_industry || "Enterprise"}</p>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      audit.status?.includes("Critical") ? "bg-red-50 text-red-600 border-red-200" :
                      audit.status?.includes("High") ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {audit.status || "Evaluated"}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-cream/50 border border-brand-green/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-brand-deep/50 uppercase font-semibold">Compliance Score</p>
                      <p className="text-3xl font-black text-brand-green mt-0.5">
                        {audit.compliance_score?.toFixed(1)}
                        <span className="text-xs text-brand-deep/40 font-normal">/100</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-xs font-semibold text-emerald-600">
                        {audit.rules_passed_count || 0} Passed
                      </p>
                      <p className="text-xs font-semibold text-red-600">
                        {audit.rules_failed_count || 0} Violations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-brand-green/10">
                  <Link
                    href={`/audit/${audit.id}`}
                    className="flex-1 py-2.5 rounded-lg bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/30 text-xs font-semibold text-center transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Full GRC Report</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => void downloadAuditReport(audit.id)}
                    className="p-2.5 rounded-lg bg-white hover:bg-brand-cream text-brand-deep border border-brand-green/20 text-xs transition shadow-sm"
                    title="Download PDF Report"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
