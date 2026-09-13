"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Sparkles, FileDown, Search, ArrowLeft, Send, CheckCircle2, AlertTriangle, Copy, BookOpen, Loader2 } from "lucide-react";
import { getAuditDetail, askCopilot, rewriteClause } from "@/lib/api";

export default function AuditDetailsPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const auditId = id;

  const [mounted, setMounted] = useState(false);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [activeRewriteFinding, setActiveRewriteFinding] = useState<any>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriteDisclaimer, setRewriteDisclaimer] = useState("");

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotMsg, setCopilotMsg] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<Array<{ sender: "user" | "copilot", text: string }>>([
    { sender: "copilot", text: "Hello! I am your GRC Copilot. Ask me anything about this audit's findings, specific clauses, or how to resolve them." }
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const policyViewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const loadAudit = async () => {
      try {
        const data = await getAuditDetail(auditId);
        setAudit(data);
        if (data.findings && data.findings.length > 0) {
          setSelectedFinding(data.findings[0]);
        }
      } catch (err) {
        console.error("Failed to load audit:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [auditId, router]);

  useEffect(() => {
    if (selectedFinding && selectedFinding.evidence_start_index !== -1 && policyViewerRef.current) {
      setTimeout(() => {
        const markElement = policyViewerRef.current?.querySelector(".highlight-target");
        if (markElement) {
          markElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [selectedFinding]);

  if (!mounted || loading || !audit) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D3A35] text-slate-400 font-mono text-xs">
        <Loader2 className="h-5 w-5 text-emerald-300 animate-spin mr-3" />
        <span>Decrypting GRC Report...</span>
      </div>
    );
  }

  // Validation assertion check: passed + partial + failed == 11
  const passed = audit.rules_passed_count || 0;
  const failed = audit.rules_failed_count || 0;
  const partial = audit.rules_partial_count || 0;
  if (passed + failed + partial !== 11) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0D3A35] text-red-400 font-sans p-6 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold">Report Integrity Error</h2>
        <p className="text-sm text-slate-400 max-w-md">
          The compliance report failed integrity validations: the number of audited pillars ({passed + failed + partial}) does not match the required DPDP Act framework pillars (11). Auditing aborted.
        </p>
        <Link href="/audit/new" className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-300 rounded-xl">
          Return to Auditor
        </Link>
      </div>
    );
  }

  const pdfUrl = `http://127.0.0.1:8000/api/report/${auditId}`;

  const handleTriggerRewrite = async (finding: any) => {
    setActiveRewriteFinding(finding);
    setRewriteOpen(true);
    setRewriting(true);
    setRewrittenText("");

    try {
      const origText = finding.evidence_extract || "implied consent controls";
      const res = await rewriteClause(finding.id, origText);
      setRewrittenText(res.rewritten_text);
      setRewriteDisclaimer(res.disclaimer);
    } catch (err) {
      setRewrittenText("Error generating compliant clause. Please check your network connection.");
    } finally {
      setRewriting(false);
    }
  };

  const handleSendCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotMsg.trim()) return;

    const userMessage = copilotMsg;
    setCopilotHistory(prev => [...prev, { sender: "user", text: userMessage }]);
    setCopilotMsg("");
    setCopilotLoading(true);

    try {
      const res = await askCopilot(auditId, userMessage);
      setCopilotHistory(prev => [...prev, { sender: "copilot", text: res.response }]);
    } catch (err) {
      setCopilotHistory(prev => [...prev, { sender: "copilot", text: "I'm having trouble connecting to the GRC server. Please verify your connection." }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const formatPolicySegment = (text: string) => {
    if (!text) return text;
    const formatted = text
      .replace(/(\s)## /g, "$1\n\n## ")
      .replace(/(\s)# /g, "$1\n\n# ")
      .replace(/(\s)\* /g, "$1\n• ")
      .replace(/\[Page /g, "\n\n[Page ");
      
    const tokens = formatted.split(/\*\*(.*?)\*\*/g);
    if (tokens.length === 1) return formatted;
    
    return tokens.map((token, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-bold">{token}</strong>;
      }
      return token;
    });
  };

  const formatMarkdown = (text: string) => {
    if (!text) return text;
    const tokens = text.split(/\*\*(.*?)\*\*/g);
    if (tokens.length === 1) return text;
    return tokens.map((token, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-bold">{token}</strong>;
      }
      return token;
    });
  };

  const renderHighlightedPolicyText = () => {
    const rawText = audit.policy_text || "";
    
    if (searchText.trim().length > 1) {
      const escaped = searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = rawText.split(regex);
      return (
        <div className="whitespace-pre-line leading-relaxed font-sans text-sm text-slate-300">
          {parts.map((part: string, idx: number) => {
            const match = part.toLowerCase() === searchText.toLowerCase();
            return match ? (
              <mark key={idx} className="bg-yellow-500/30 text-yellow-200 border border-yellow-500/20 px-0.5 rounded">
                {formatPolicySegment(part)}
              </mark>
            ) : (
              <span key={idx}>{formatPolicySegment(part)}</span>
            );
          })}
        </div>
      );
    }

    if (selectedFinding && selectedFinding.evidence_start_index !== -1 && selectedFinding.evidence_start_index < rawText.length) {
      const start = selectedFinding.evidence_start_index;
      const end = Math.min(selectedFinding.evidence_end_index, rawText.length);
      
      const before = rawText.substring(0, start);
      const target = rawText.substring(start, end);
      const after = rawText.substring(end);

      return (
        <div className="whitespace-pre-line leading-relaxed font-sans text-sm text-slate-300">
          {formatPolicySegment(before)}
          <mark className="highlight-target bg-emerald-600/10 text-emerald-300 border border-emerald-300/40 px-1 py-0.5 rounded font-medium inline-block glow-primary pulse-fast">
            {formatPolicySegment(target)}
          </mark>
          {formatPolicySegment(after)}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-line leading-relaxed font-sans text-sm text-slate-300">
        {formatPolicySegment(rawText)}
      </div>
    );
  };

  const sevColors: Record<string, string> = {
    Critical: "text-red-400 border-red-950 bg-red-950/20",
    High: "text-orange-400 border-orange-950 bg-orange-950/20",
    Medium: "text-amber-400 border-amber-950 bg-amber-950/20",
    Low: "text-emerald-300 border-emerald-950 bg-emerald-950/20",
    Informational: "text-slate-400 border-slate-900 bg-slate-900/30"
  };

  return (
    <div className="p-6 space-y-6 bg-[#0D3A35] min-h-screen">
      
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/audit/new"
            className="h-9 w-9 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{audit.company_name} GRC Assessment</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Score: <span className="font-bold text-emerald-300">{audit.compliance_score}/100</span> | Status: <span className="font-semibold text-slate-200">{audit.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>AI Copilot</span>
          </button>
          <a
            href={pdfUrl}
            className="flex items-center space-x-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-300 px-4 py-2.5 rounded-xl font-bold transition hover:shadow-lg hover:shadow-emerald-600/10 cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            <span>Export PDF Report</span>
          </a>
        </div>
      </div>

      {/* Row 1: Trust & Transparency Panel with moving Conic gradient border */}
      <div className="animated-border p-[1.5px] glow-primary">
        <div className="bg-[#0a0f1d] rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-2.5 border-r border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Confidence</p>
            <p className="text-xl font-bold text-emerald-300 mt-1 font-mono">{Math.round(audit.ai_confidence_score * 100)}%</p>
          </div>
          <div className="p-2.5 border-r border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rules Passed</p>
            <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{audit.rules_passed_count}</p>
          </div>
          <div className="p-2.5 border-r border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rule Violations</p>
            <p className="text-xl font-bold text-red-400 mt-1 font-mono">{audit.rules_failed_count}</p>
          </div>
          <div className="p-2.5 border-r border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Observations</p>
            <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{audit.ai_observations_count}</p>
          </div>
          <div className="p-2.5">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manual Rules</p>
            <p className="text-xl font-bold text-slate-300 mt-1 font-mono">29 Active</p>
          </div>
        </div>
      </div>

      {/* Row 2: Split screen Clause Navigator & Findings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Clause Navigator (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-[#0a0f1d]/90 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-800/60 overflow-hidden min-h-[500px]">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-bold text-slate-200">Policy Clause Navigator</span>
            </div>
            
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search clauses..."
                className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-600 text-slate-200"
              />
            </div>
          </div>

          <div
            ref={policyViewerRef}
            className="flex-1 p-6 overflow-y-auto max-h-[550px] border-b border-slate-900"
          >
            {renderHighlightedPolicyText()}
          </div>

          <div className="p-3 bg-slate-950/20 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Character Count: {audit.policy_text?.length || 0}</span>
            <span>Highlighting Active Target</span>
          </div>
        </div>

        {/* Right Column: Findings Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-[#0a0f1d]/90 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-800/60 p-6 overflow-y-auto max-h-[620px] space-y-6">
          <div className="pb-3 border-b border-slate-800/40">
            <h2 className="text-lg font-bold text-slate-100">Compliance Gaps</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any gap to inspect policy evidence and recommended changes.</p>
          </div>

          <div className="space-y-4">
            {audit.findings.map((f: any) => {
              const active = selectedFinding?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                    active
                      ? "border-emerald-600 bg-emerald-600/5 glow-primary"
                      : "border-slate-850 hover:border-slate-800 bg-slate-900/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-950/60 text-slate-300">
                      {f.pillar}
                    </span>
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-lg ${sevColors[f.severity]}`}>
                      {f.severity}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-100 mt-3">{f.issue}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-normal mt-1">{f.reason}</p>

                  {/* Expanded Finding Telemetry */}
                  {active && (
                    <div className="mt-4 pt-4 border-t border-slate-850 space-y-4 text-sm">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Relevant DPDP Clause</p>
                        <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center">
                          <BookOpen className="h-3.5 w-3.5 text-emerald-300 mr-1.5 shrink-0" />
                          {f.dpdp_section || "General Obligation"}
                        </p>
                      </div>

                      {f.evidence_extract && (
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Policy Evidence Extract</p>
                          <blockquote className="border-l-2 border-amber-500 bg-amber-950/5 p-3.5 rounded text-xs text-amber-200 italic font-mono leading-relaxed mt-1">
                            "{f.evidence_extract}"
                          </blockquote>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Business Impact</p>
                          <p className="text-xs text-slate-400 leading-normal mt-1">{f.business_impact || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Legal Liability</p>
                          <p className="text-xs text-slate-400 leading-normal mt-1">{f.legal_impact || "N/A"}</p>
                        </div>
                      </div>

                      {/* Recommendations Grid */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GRC Recommended Checklist</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                            <span className="text-[9px] font-bold text-emerald-300 uppercase">Legal</span>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">{f.legal_rec}</p>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase">Technical</span>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">{f.tech_rec}</p>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                            <span className="text-[9px] font-bold text-purple-400 uppercase">Business</span>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">{f.business_rec}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => handleTriggerRewrite(f)}
                          className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Rewrite Clause with AI</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* --- AI REWRITE MODAL --- */}
      {rewriteOpen && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a0f1d]/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-800 glow-primary p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
              <h3 className="text-lg font-bold text-slate-100">AI Policy Clause Rewrite</h3>
              <button
                onClick={() => setRewriteOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Close
              </button>
            </div>

            {rewriting ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-400">
                <Loader2 className="h-6 w-6 text-emerald-300 animate-spin" />
                <span>Re-drafting compliant legal wording...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Original non-compliant clause
                  </label>
                  <p className="mt-1 p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-xs text-slate-400 italic font-mono">
                    "{activeRewriteFinding?.evidence_extract || 'Consent is implied by continuation'}"
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    DPDP Compliant draft
                  </label>
                  <div className="mt-1 p-4 bg-slate-950/30 border border-emerald-900/60 rounded-lg text-xs text-emerald-200 font-mono leading-relaxed relative whitespace-pre-wrap">
                    {formatMarkdown(rewrittenText)}
                    <button
                      onClick={() => navigator.clipboard.writeText(rewrittenText)}
                      className="absolute bottom-3 right-3 h-7 w-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy to Clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-600/5 border border-emerald-600/10 p-3 rounded-lg text-[10px] text-slate-400 leading-normal">
                  <span className="text-emerald-300 font-bold">Regulatory Disclaimer:</span> {rewriteDisclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- AI COPILOT CHAT PANEL (SLIDEOVER) --- */}
      {copilotOpen && (
        <div className="fixed right-0 top-0 bottom-0 z-40 w-96 border-l border-slate-800/80 bg-[#132E2A]/95 backdrop-blur-md p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                <h3 className="text-base font-bold text-slate-100">AI Compliance Copilot</h3>
              </div>
              <button
                onClick={() => setCopilotOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Hide
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {copilotHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${chat.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] text-slate-500 mb-1">
                    {chat.sender === "user" ? "YOU" : "AUDITWEAVE AI"}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                      chat.sender === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none text-xs"
                        : "bg-slate-900/80 border border-slate-850 text-slate-200 rounded-tl-none font-mono text-[11px]"
                    }`}
                  >
                    {chat.sender === "copilot" ? formatMarkdown(chat.text) : chat.text}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-300" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendCopilot} className="border-t border-slate-900 pt-4 flex space-x-2 mt-4">
            <input
              type="text"
              value={copilotMsg}
              onChange={(e) => setCopilotMsg(e.target.value)}
              placeholder="Ask about Section 9, penalties..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              className="h-8 w-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-300 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
