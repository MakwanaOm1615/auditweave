"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Globe, FileText, Upload, Sparkles, Terminal, CheckCircle2, Loader2, Play } from "lucide-react";
import { createAudit, createAuditWithFile } from "@/lib/api";

export default function NewAuditPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"url" | "text" | "file">("url");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("FinTech");
  
  const [policyUrl, setPolicyUrl] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // 40+ Enterprise industry sectors
  const industriesList = [
    "Banking", "Financial Services", "Insurance", "Healthcare", "Pharmaceuticals",
    "Manufacturing", "Automotive", "Aviation", "Aerospace", "Government", "Defense",
    "Retail", "E-Commerce", "Telecommunications", "Information Technology", "SaaS",
    "Education", "Energy", "Oil & Gas", "Logistics", "Transportation", "Hospitality",
    "Real Estate", "Construction", "Agriculture", "Media", "Entertainment", "Legal Services",
    "Consulting", "NGOs", "Cryptocurrency", "FinTech", "HealthTech", "EdTech", "Cybersecurity",
    "Cloud Services", "Artificial Intelligence", "Data Centers"
  ].sort();

  const steps = [
    { label: "Extracting Policy Text", desc: "Loading text and stripping HTML scripts" },
    { label: "Cleaning Document Layout", desc: "Removing headers, footers, and menu links" },
    { label: "Detecting Legal Clauses", desc: "Splitting sections and identifying paragraphs" },
    { label: "Running Deterministic Rule Engine", desc: "Evaluating mandatory contact and officer rules" },
    { label: "Invoking Gemini AI Analysis", desc: "Interpreting qualitative legal language and liability" },
    { label: "Risk Severity Scoring", desc: "Generating vulnerability ratings and penalty estimates" },
    { label: "Compiling Report Registry", desc: "Rendering professional ReportLab GRC PDF" }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!companyName.trim()) {
      setError("Please specify the company name.");
      return;
    }
    if (activeTab === "url" && !policyUrl.trim()) {
      setError("Please provide a valid Privacy Policy URL.");
      return;
    }
    if (activeTab === "text" && !policyText.trim()) {
      setError("Please paste the privacy policy text.");
      return;
    }
    if (activeTab === "file" && !selectedFile) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setAuditing(true);
    setCurrentStep(0);

    const runSimulation = () => {
      let step = 0;
      const interval = setInterval(() => {
        if (step < steps.length - 1) {
          step++;
          setCurrentStep(step);
        } else {
          clearInterval(interval);
        }
      }, 950);
      return interval;
    };

    const timer = runSimulation();

    try {
      let auditResult: any;

      if (activeTab === "url") {
        auditResult = await createAudit(companyName, industry, policyUrl, undefined);
      } else if (activeTab === "text") {
        auditResult = await createAudit(companyName, industry, undefined, policyText);
      } else {
        auditResult = await createAuditWithFile(companyName, industry, selectedFile!);
      }

      setTimeout(() => {
        clearInterval(timer);
        router.push(`/audit/${auditResult.id}`);
      }, 6800);

    } catch (err: any) {
      clearInterval(timer);
      setAuditing(false);
      setError(err.message || "An error occurred during the policy audit execution.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Audit New Policy</h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform a hybrid compliance audit against India's DPDP Act 2023.
        </p>
      </div>

      {!auditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swiggy"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-100 placeholder-slate-600 transition"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Industry Sector
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-300 transition"
              >
                {industriesList.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800/60 overflow-hidden">
            <div className="flex border-b border-slate-800/60 bg-slate-950/30">
              {[
                { id: "url", label: "Policy URL", icon: Globe },
                { id: "text", label: "Paste Text", icon: FileText },
                { id: "file", label: "Upload File", icon: Upload }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                      active
                        ? "border-emerald-600 text-emerald-300 bg-emerald-600/5"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === "url" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Privacy Policy Web URL
                  </label>
                  <input
                    type="url"
                    value={policyUrl}
                    onChange={(e) => setPolicyUrl(e.target.value)}
                    placeholder="https://company.com/privacy"
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-200 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    The platform automatically cleans navigation headers, menus, cookie overlays, and web footer content before auditing.
                  </p>
                </div>
              )}

              {activeTab === "text" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Privacy Policy Text
                  </label>
                  <textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    rows={10}
                    placeholder="Paste the full-text content of the privacy policy..."
                    className="w-full p-4 bg-slate-950/40 border border-slate-900 rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-slate-300 font-mono transition resize-y"
                  />
                </div>
              )}

              {activeTab === "file" && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Upload Privacy Policy Document (PDF / DOCX)
                  </label>
                  <div className="border border-dashed border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-950/20 text-center hover:bg-slate-950/40 transition relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 text-slate-600 mb-4" />
                    <p className="text-sm font-semibold text-slate-300">
                      {selectedFile ? selectedFile.name : "Select a document file"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Drag and drop your PDF or Word document here"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-300 hover:to-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="h-4 w-4" />
            <span>Generate Compliance Report</span>
          </button>
        </form>
      ) : (
        /* Animated Audit Timeline Console */
        <div className="glass-card rounded-2xl border border-slate-800/60 p-6 glow-primary space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/40">
            <div className="flex items-center space-x-3">
              <Terminal className="h-5 w-5 text-emerald-300 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-100">DPDP Auditing Pipeline</h2>
            </div>
            <span className="text-xs text-emerald-300 font-mono font-bold animate-pulse">RUNNING SCAN</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {steps.map((step, idx) => {
              const active = currentStep === idx;
              const completed = currentStep > idx;
              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition ${
                    active
                      ? "border-emerald-850 bg-emerald-950/10 text-slate-200"
                      : completed
                      ? "border-slate-900 bg-slate-950/20 text-slate-500"
                      : "border-transparent text-slate-700"
                  }`}
                >
                  <div className="mt-0.5">
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 glow-success shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 text-emerald-300 animate-spin shrink-0" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${active ? "text-slate-100" : ""}`}>{step.label}</p>
                    {active && <p className="text-[10px] text-slate-400 mt-1">{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-slate-900 pt-4">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>SCANNER PROGRESS</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
              <div className="scanner-line" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
