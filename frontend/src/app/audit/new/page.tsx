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
    <div className="p-6 max-w-4xl mx-auto space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-deep tracking-tight">Audit New Policy</h1>
        <p className="text-sm text-brand-deep/70 mt-1 font-medium">
          Perform a hybrid compliance audit against India's DPDP Act 2023.
        </p>
      </div>

      {!auditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-deep/70 uppercase tracking-wider block">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swiggy"
                className="w-full px-4 py-3 bg-white border border-brand-deep/20 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-brand-deep placeholder-brand-deep/40 transition-all font-medium shadow-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-deep/70 uppercase tracking-wider block">
                Industry Sector
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-brand-deep/20 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-brand-deep transition-all font-medium shadow-sm"
              >
                {industriesList.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-deep/10 shadow-sm overflow-hidden">
            <div className="flex border-b border-brand-deep/10 bg-brand-cream/50">
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
                    className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      active
                        ? "border-brand-green text-brand-green bg-white"
                        : "border-transparent text-brand-deep/60 hover:text-brand-deep hover:bg-brand-deep/5"
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
                  <label className="text-xs font-bold text-brand-deep/70 block">
                    Privacy Policy Web URL
                  </label>
                  <input
                    type="url"
                    value={policyUrl}
                    onChange={(e) => setPolicyUrl(e.target.value)}
                    placeholder="https://company.com/privacy"
                    className="w-full px-4 py-3 bg-white border border-brand-deep/20 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-brand-deep transition-all font-medium shadow-sm"
                  />
                  <p className="text-[10px] font-medium text-brand-deep/50 mt-1">
                    The platform automatically cleans navigation headers, menus, cookie overlays, and web footer content before auditing.
                  </p>
                </div>
              )}

              {activeTab === "text" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-deep/70 block">
                    Privacy Policy Text
                  </label>
                  <textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    rows={10}
                    placeholder="Paste the full-text content of the privacy policy..."
                    className="w-full p-4 bg-white border border-brand-deep/20 rounded-xl text-xs focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-brand-deep font-mono transition-all resize-y shadow-sm"
                  />
                </div>
              )}

              {activeTab === "file" && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-brand-deep/70 block">
                    Upload Privacy Policy Document (PDF / DOCX)
                  </label>
                  <div className="border-2 border-dashed border-brand-deep/20 rounded-2xl p-8 flex flex-col items-center justify-center bg-brand-cream/50 text-center hover:bg-brand-green/5 hover:border-brand-green/40 transition-all relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 text-brand-deep/40 group-hover:text-brand-green mb-4 transition-colors" />
                    <p className="text-sm font-bold text-brand-deep">
                      {selectedFile ? selectedFile.name : "Select a document file"}
                    </p>
                    <p className="text-xs font-medium text-brand-deep/60 mt-1">
                      {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Drag and drop your PDF or Word document here"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-brand-green hover:bg-[#2e745e] rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Generate Compliance Report</span>
          </button>
        </form>
      ) : (
        /* Animated Audit Timeline Console */
        <div className="bg-white rounded-2xl border border-brand-deep/10 shadow-lg p-8 space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-brand-deep/10">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-brand-green animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-brand-deep">DPDP Auditing Pipeline</h2>
                <p className="text-xs font-medium text-brand-deep/60 mt-1">Executing hybrid compliance scan...</p>
              </div>
            </div>
            <span className="text-[10px] px-3 py-1.5 rounded-full bg-brand-green/10 text-brand-green font-mono font-bold animate-pulse tracking-widest">RUNNING SCAN</span>
          </div>

          <div className="space-y-4 font-mono text-sm">
            {steps.map((step, idx) => {
              const active = currentStep === idx;
              const completed = currentStep > idx;
              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-500 ${
                    active
                      ? "border-brand-green bg-brand-green/5 text-brand-deep shadow-sm scale-[1.02]"
                      : completed
                      ? "border-brand-deep/10 bg-brand-cream/50 text-brand-deep/60"
                      : "border-transparent text-brand-deep/40"
                  }`}
                >
                  <div className="mt-0.5">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-5 w-5 text-brand-green animate-spin shrink-0" />
                    ) : (
                      <span className="h-5 w-5 rounded-full border-2 border-brand-deep/20 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={`font-bold tracking-tight ${active ? "text-brand-deep" : ""}`}>{step.label}</p>
                    {active && <p className="text-[11px] text-brand-deep/60 mt-1.5 font-sans font-medium">{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-6">
            <div className="flex justify-between text-[11px] text-brand-deep/60 font-bold tracking-wider uppercase">
              <span>Scanner Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-3 w-full bg-brand-cream rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-brand-green transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
