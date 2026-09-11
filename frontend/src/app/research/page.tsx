"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Sparkles, FileSpreadsheet, PlusCircle, CheckCircle2, ShieldAlert, Award, Activity } from "lucide-react";
import { runResearchReport, isAuthenticated } from "@/lib/api";

export default function ResearchPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [companiesList, setCompaniesList] = useState<string[]>([
    "Flipkart", "Meesho", "PhonePe", "Zepto", "Urban Company", "Paytm", "Zomato", "Swiggy", "Ola"
  ]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(["Flipkart", "PhonePe", "Paytm"]);
  
  // Custom organization additions
  const [customName, setCustomName] = useState("");
  const [customIndustry, setCustomIndustry] = useState("FinTech");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  const industriesList = [
    "Banking", "Financial Services", "Insurance", "Healthcare", "Pharmaceuticals",
    "Manufacturing", "Automotive", "Aviation", "Aerospace", "Government", "Defense",
    "Retail", "E-Commerce", "Telecommunications", "Information Technology", "SaaS",
    "Education", "Energy", "Oil & Gas", "Logistics", "Transportation", "Hospitality",
    "Real Estate", "Construction", "Agriculture", "Media", "Entertainment", "Legal Services",
    "Consulting", "NGOs", "Cryptocurrency", "FinTech", "HealthTech", "EdTech", "Cybersecurity",
    "Cloud Services", "Artificial Intelligence", "Data Centers"
  ].sort();

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleToggleCompany = (cname: string) => {
    if (selectedCompanies.includes(cname)) {
      setSelectedCompanies(prev => prev.filter(c => c !== cname));
    } else {
      setSelectedCompanies(prev => [...prev, cname]);
    }
  };

  const handleAddCustomCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = customName.trim();
    if (!trimmed) return;
    
    // Prevent duplicates
    if (companiesList.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("This organization is already in your research pool.");
      return;
    }
    
    // Add to list and select it by default
    setCompaniesList(prev => [...prev, trimmed]);
    setSelectedCompanies(prev => [...prev, trimmed]);
    setCustomName("");
  };

  const handleGenerateReport = async () => {
    if (selectedCompanies.length === 0) return;
    setLoading(true);
    setReport(null);
    try {
      const res = await runResearchReport(selectedCompanies);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Layers className="h-7 w-7 text-emerald-300" />
          <span>Research Portal</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Compile a batch GRC compliance report comparing custom and pre-configured market organizations.
        </p>
      </div>

      {/* Custom Company Entry Panel */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
          <PlusCircle className="h-4 w-4 text-emerald-300" />
          <span>Add Custom Organization</span>
        </h2>
        
        <form onSubmit={handleAddCustomCompany} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5 space-y-2">
            <label className="text-xs text-slate-500 font-semibold uppercase">Organization Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Razorpay"
              className="w-full px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-600 text-slate-200"
            />
          </div>
          <div className="sm:col-span-5 space-y-2">
            <label className="text-xs text-slate-500 font-semibold uppercase">Industry Sector</label>
            <select
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-600 text-slate-300"
            >
              {industriesList.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-xs font-bold text-slate-200 rounded-lg transition cursor-pointer"
            >
              Add Entity
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Selectors grid */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 space-y-6">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Select Organizations to Benchmark</h2>
        
        <div className="flex flex-wrap gap-2.5">
          {companiesList.map((c) => {
            const active = selectedCompanies.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleToggleCompany(c)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
                  active
                    ? "bg-emerald-600/10 border-emerald-600 text-emerald-300"
                    : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={selectedCompanies.length === 0 || loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-300 hover:to-indigo-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-emerald-600/10 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Activity className="h-4 w-4 animate-spin text-white" />
              <span>Compiling Batch GRC Metrics...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Compile India DPDP Compliance Report</span>
            </>
          )}
        </button>
      </div>

      {/* Research Output report */}
      {report && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-5 border border-slate-800/60 relative overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Research Framework</p>
              <p className="text-sm font-bold text-slate-200 mt-2 font-mono">India DPDP Act 2023</p>
            </div>
            
            <div className="glass-card rounded-xl p-5 border border-slate-800/60 relative overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Compliance Score</p>
              <p className="text-xl font-bold text-emerald-300 mt-2 font-mono">{report.average_market_score}%</p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/60 relative overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Compliant Entity</p>
              <p className="text-xl font-bold text-emerald-400 mt-2 flex items-center">
                <Award className="h-4.5 w-4.5 mr-1 text-emerald-400" />
                {report.winner}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800/60 p-6">
            <h2 className="text-base font-bold text-slate-200 pb-4 border-b border-slate-800/40 mb-6">Market Sector Matrix</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Industry</th>
                    <th className="pb-3">Compliance Score</th>
                    <th className="pb-3">Risk Level</th>
                    <th className="pb-3">Primary Gaps Detected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {report.industry_breakdown.map((row: any, idx: number) => {
                    const sevColor = row.compliance_score >= 80 ? "text-emerald-400" : row.compliance_score >= 65 ? "text-emerald-300" : "text-amber-400";
                    return (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="py-3.5 font-bold text-slate-100">{row.company_name}</td>
                        <td className="py-3.5 text-slate-500">{row.industry}</td>
                        <td className="py-3.5 font-mono font-bold text-emerald-300">{row.compliance_score}%</td>
                        <td className={`py-3.5 font-bold ${sevColor}`}>{row.compliance_score >= 80 ? "Low Risk" : row.compliance_score >= 65 ? "Moderate Risk" : "High Risk"}</td>
                        <td className="py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {row.critical_gaps.map((gap: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 font-mono">
                                {gap}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t border-slate-800/60 pt-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">LinkedIn / Medium Summary Block</h3>
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl text-[11px] text-slate-400 font-mono leading-relaxed relative">
                <p className="font-bold text-slate-200">📊 INDIA DPDP ACT 2023 COMPLIANCE BENCHMARK REPORT 2026</p>
                <p className="mt-2">We audited {report.audit_count} leading Indian platforms against the statutory pillars of the DPDP Act 2023. Here are the key findings:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Average Market Score: {report.average_market_score}% Compliance.</li>
                  <li>Compliance Leader: {report.winner}.</li>
                  <li>Common gaps: Children's parental consent, opt-in notice decoupling, Nodal Grievance Redressal Officer contact details.</li>
                </ul>
                <p className="mt-2">Audit generated via AuditWeave Compliance Platform.</p>
                <button
                  onClick={() => navigator.clipboard.writeText(`📊 INDIA DPDP ACT 2023 COMPLIANCE BENCHMARK REPORT 2026\n\nWe audited ${report.audit_count} leading Indian platforms against the statutory pillars of the DPDP Act 2023. Here are the key findings:\n- Average Market Score: ${report.average_market_score}% Compliance.\n- Compliance Leader: ${report.winner}.\n- Common gaps: Children's parental consent, opt-in notice decoupling, Nodal Grievance Redressal Officer contact details.\n\nAudit generated via AuditWeave Compliance Platform.`)}
                  className="absolute bottom-3 right-3 h-7 w-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Copy to Clipboard"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
