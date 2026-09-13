"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, FileDown, Search, ArrowLeft, Send, AlertTriangle, Copy, BookOpen, Loader2, ChevronDown } from "lucide-react";
import { getAuditDetail, askCopilot, downloadAuditReport, getErrorMessage, rewriteClause } from "@/lib/api";

interface AuditFinding {
  id: number;
  pillar: string;
  issue: string;
  severity: string;
  reason: string;
  dpdp_section?: string;
  evidence_extract?: string;
  evidence_start_index: number;
  evidence_end_index: number;
  business_impact?: string;
  legal_impact?: string;
  legal_rec?: string;
  tech_rec?: string;
  business_rec?: string;
}

interface AuditDetail {
  company_name: string;
  compliance_score: number;
  status: string;
  rules_passed_count: number;
  rules_failed_count: number;
  rules_partial_count?: number;
  ai_confidence_score: number;
  ai_observations_count: number;
  policy_text?: string;
  findings: AuditFinding[];
}

export default function AuditDetailsPage() {
  const { id } = useParams() as { id: string };
  const auditId = id;

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [searchText, setSearchText] = useState("");
  
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [activeRewriteFinding, setActiveRewriteFinding] = useState<AuditFinding | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteOriginalText, setRewriteOriginalText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriteDisclaimer, setRewriteDisclaimer] = useState("");
  const [rewriteMode, setRewriteMode] = useState<"ai" | "template" | null>(null);
  const [rewriteError, setRewriteError] = useState("");

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotMsg, setCopilotMsg] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<Array<{ sender: "user" | "copilot", text: string }>>([
    { sender: "copilot", text: "Hello! I am your GRC Copilot. Ask me anything about this audit's findings, specific clauses, or how to resolve them." }
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const policyViewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const data = await getAuditDetail(auditId);
        setAudit(data);
      } catch (err) {
        console.error("Failed to load audit:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [auditId]);

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

  if (loading || !audit) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-cream font-mono text-xs text-brand-deep/60">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-brand-green" />
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
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-brand-cream p-6 text-center font-sans text-red-600">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold">Report Integrity Error</h2>
        <p className="max-w-md text-sm text-brand-deep/60">
          The compliance report failed integrity validations: the number of audited pillars ({passed + failed + partial}) does not match the required DPDP Act framework pillars (11). Auditing aborted.
        </p>
        <Link href="/audit/new" className="rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-deep">
          Return to Auditor
        </Link>
      </div>
    );
  }

  const handleTriggerRewrite = async (finding: AuditFinding) => {
    setActiveRewriteFinding(finding);
    setRewriteOpen(true);
    setRewriting(true);
    setRewriteOriginalText("");
    setRewrittenText("");
    setRewriteDisclaimer("");
    setRewriteMode(null);
    setRewriteError("");

    try {
      const res = await rewriteClause(finding.id);
      setRewriteOriginalText(res.original_text);
      setRewrittenText(res.rewritten_text);
      setRewriteDisclaimer(res.disclaimer);
      setRewriteMode(res.generation_mode);
    } catch (error: unknown) {
      setRewriteError(getErrorMessage(error, "Unable to generate a remediation clause."));
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
    } catch {
      setCopilotHistory(prev => [...prev, { sender: "copilot", text: "I'm having trouble connecting to the GRC server. Please verify your connection." }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const normalizePolicyText = (text: string) => {
    return text
      .replace(/\ufeff/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/^Title:\s*.*?\s+URL Source:\s*\S+\s+Markdown Content:\s*/i, "")
      .replace(/^Legal Document\s*/i, "")
      .replace(/[ \t]+(#{1,6}\s+)/g, "\n\n$1")
      .replace(/(#{1,6}\s+[^\n]{2,60}?)(?=\s+(?:We|This|Our|The|Users?|Effective Date|Last Updated)\b)/g, "$1\n\n")
      .replace(/(#{1,6}\s+[^\n]{2,60}?)(?=\s+[•*-]\s+)/g, "$1\n")
      .replace(/\s+•\s+/g, "\n• ")
      .replace(/\s+(\[Page\s+\d+\])/g, "\n\n$1\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleToggleFinding = (finding: AuditFinding) => {
    setSelectedFinding((current) => current?.id === finding.id ? null : finding);
  };

  const renderHighlightedText = (text: string, highlightTerm: string, evidenceHighlight: boolean) => {
    if (!highlightTerm || highlightTerm.length < 2) return text;
    const escaped = highlightTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlightTerm.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          className={evidenceHighlight
            ? "highlight-target rounded border border-brand-green/30 bg-brand-green/10 px-0.5 font-medium text-brand-deep"
            : "rounded border border-amber-300 bg-amber-100 px-0.5 text-amber-900"}
        >
          {part}
        </mark>
      ) : part,
    );
  };

  const renderInlinePolicyMarkdown = (text: string, highlightTerm: string, evidenceHighlight: boolean) => {
    const tokens = text.split(/(\*\*.*?\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    return tokens.map((token, index) => {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={`${token}-${index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-green underline decoration-brand-green/25 underline-offset-2 hover:decoration-brand-green"
          >
            {renderHighlightedText(linkMatch[1], highlightTerm, evidenceHighlight)}
          </a>
        );
      }
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={`${token}-${index}`} className="font-bold text-brand-deep">{renderHighlightedText(token.slice(2, -2), highlightTerm, evidenceHighlight)}</strong>;
      }
      return <span key={`${token}-${index}`}>{renderHighlightedText(token, highlightTerm, evidenceHighlight)}</span>;
    });
  };

  const formatMarkdown = (text: string) => {
    if (!text) return text;
    const tokens = text.split(/\*\*(.*?)\*\*/g);
    if (tokens.length === 1) return text;
    return tokens.map((token, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-brand-deep">{token}</strong>;
      }
      return token;
    });
  };

  const renderHighlightedPolicyText = () => {
    const policyText = normalizePolicyText(audit.policy_text || "");
    const searchHighlight = searchText.trim().length > 1 ? searchText.trim() : "";
    const evidenceHighlight = !searchHighlight ? selectedFinding?.evidence_extract?.trim() || "" : "";
    const highlightTerm = searchHighlight || evidenceHighlight;
    const isEvidenceHighlight = Boolean(evidenceHighlight);

    return (
      <div className="font-sans text-sm leading-7 text-brand-deep/75">
        {policyText.split("\n").map((rawLine, index) => {
          const line = rawLine.trim();
          if (!line) return <div key={`space-${index}`} className="h-3" aria-hidden="true" />;

          const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            return (
              <h3
                key={`heading-${index}`}
                className={level <= 2 ? "mb-2 mt-4 text-base font-extrabold text-brand-deep" : "mb-1.5 mt-3 text-sm font-bold text-brand-deep"}
              >
                {renderInlinePolicyMarkdown(headingMatch[2], highlightTerm, isEvidenceHighlight)}
              </h3>
            );
          }

          if (/^\[Page\s+\d+\]$/i.test(line)) {
            return <div key={`page-${index}`} className="my-3 inline-flex rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">{line}</div>;
          }

          const bulletMatch = line.match(/^[•*-]\s+(.+)$/);
          if (bulletMatch) {
            return (
              <div key={`bullet-${index}`} className="flex gap-2 pl-1">
                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green/65" />
                <span>{renderInlinePolicyMarkdown(bulletMatch[1], highlightTerm, isEvidenceHighlight)}</span>
              </div>
            );
          }

          return <p key={`paragraph-${index}`} className="mb-2">{renderInlinePolicyMarkdown(line, highlightTerm, isEvidenceHighlight)}</p>;
        })}
      </div>
    );
  };

  const sevColors: Record<string, string> = {
    Critical: "border-red-200 bg-red-50 text-red-700",
    High: "border-orange-200 bg-orange-50 text-orange-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Informational: "border-slate-200 bg-slate-50 text-slate-600"
  };

  return (
    <div className="min-h-screen space-y-6 bg-brand-cream p-5 sm:p-6 lg:p-8">
      
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/audit/new"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-deep/10 bg-white text-brand-deep/60 shadow-sm transition hover:border-brand-green/30 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-brand-deep">
              <span>{audit.company_name} GRC Assessment</span>
            </h1>
            <p className="mt-0.5 text-xs text-brand-deep/55">
              Score: <span className="font-bold text-brand-green">{audit.compliance_score}/100</span> <span className="mx-1 text-brand-deep/25">|</span> Status: <span className="font-semibold text-brand-deep/80">{audit.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex cursor-pointer items-center space-x-1.5 rounded-xl border border-brand-green/20 bg-white px-4 py-2.5 text-xs font-semibold text-brand-green shadow-sm transition hover:bg-brand-green/5"
          >
            <Sparkles className="h-4 w-4 text-brand-green" />
            <span>AI Copilot</span>
          </button>
          <button
            type="button"
            onClick={() => void downloadAuditReport(auditId)}
            className="flex cursor-pointer items-center space-x-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-deep hover:shadow-lg hover:shadow-brand-green/15"
          >
            <FileDown className="h-4 w-4" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Row 1: Trust & Transparency Panel with moving Conic gradient border */}
      <div className="overflow-hidden rounded-2xl border border-brand-deep/10 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-0 md:grid-cols-5">
          <div className="border-b border-r border-brand-deep/[0.07] p-5 md:border-b-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/50">AI Confidence</p>
            <p className="mt-1 font-mono text-xl font-bold text-brand-green">{Math.round(audit.ai_confidence_score * 100)}%</p>
          </div>
          <div className="border-b border-r border-brand-deep/[0.07] p-5 md:border-b-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/50">Rules Passed</p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-600">{audit.rules_passed_count}</p>
          </div>
          <div className="border-b border-r border-brand-deep/[0.07] p-5 md:border-b-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/50">Rule Violations</p>
            <p className="mt-1 font-mono text-xl font-bold text-red-600">{audit.rules_failed_count}</p>
          </div>
          <div className="border-b border-r border-brand-deep/[0.07] p-5 md:border-b-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/50">AI Observations</p>
            <p className="mt-1 font-mono text-xl font-bold text-amber-600">{audit.ai_observations_count}</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/50">Manual Rules</p>
            <p className="mt-1 font-mono text-xl font-bold text-brand-deep">29 Active</p>
          </div>
        </div>
      </div>

      {/* Row 2: Split screen Clause Navigator & Findings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Clause Navigator (6 cols) */}
        <div className="flex min-h-[500px] flex-col justify-between overflow-hidden rounded-2xl border border-brand-deep/10 bg-white shadow-sm lg:col-span-6">
          <div className="flex flex-col gap-3 border-b border-brand-deep/[0.07] bg-brand-deep/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-brand-green" />
              <span className="text-xs font-bold text-brand-deep">Policy Clause Navigator</span>
            </div>
            
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-deep/40" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search clauses..."
                className="h-9 w-full rounded-lg border border-brand-deep/10 bg-white pl-8 pr-3 text-xs text-brand-deep outline-none transition placeholder:text-brand-deep/35 focus:border-brand-green focus:ring-3 focus:ring-brand-green/10"
              />
            </div>
          </div>

          <div
            ref={policyViewerRef}
            className="max-h-[550px] flex-1 overflow-y-auto border-b border-brand-deep/[0.07] p-6"
          >
            {renderHighlightedPolicyText()}
          </div>

          <div className="flex items-center justify-between bg-brand-deep/[0.025] p-3 text-[10px] text-brand-deep/45">
            <span>Character Count: {audit.policy_text?.length || 0}</span>
            <span>Highlighting Active Target</span>
          </div>
        </div>

        {/* Right Column: Findings Breakdown (6 cols) */}
        <div className="max-h-[620px] space-y-6 overflow-y-auto rounded-2xl border border-brand-deep/10 bg-white p-6 shadow-sm lg:col-span-6">
          <div className="border-b border-brand-deep/[0.07] pb-3">
            <h2 className="text-lg font-bold text-brand-deep">Compliance Gaps</h2>
            <p className="mt-0.5 text-xs text-brand-deep/55">Click any gap to inspect policy evidence and recommended changes.</p>
          </div>

          <div className="space-y-4">
            {audit.findings.map((f) => {
              const active = selectedFinding?.id === f.id;
              return (
                <div
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  aria-expanded={active}
                  onClick={() => handleToggleFinding(f)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleToggleFinding(f);
                    }
                  }}
                  className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                    active
                      ? "border-brand-green/40 bg-brand-green/[0.06] shadow-[0_8px_25px_rgba(39,97,82,0.08)]"
                      : "border-brand-deep/10 bg-brand-cream/25 hover:border-brand-green/25 hover:bg-brand-green/[0.025]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-brand-deep/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-brand-deep/70">
                      {f.pillar}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${sevColors[f.severity]}`}>
                        {f.severity}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-brand-deep/40 transition-transform duration-200 ${active ? "rotate-180" : ""}`} />
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-brand-deep sm:text-base">{f.issue}</h3>
                  <p className="mt-1 text-xs leading-normal text-brand-deep/60 sm:text-sm">{f.reason}</p>

                  {/* Expanded Finding Telemetry */}
                  {active && (
                    <div className="mt-4 space-y-4 border-t border-brand-deep/[0.08] pt-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">Relevant DPDP Clause</p>
                        <p className="mt-1 flex items-center text-xs font-semibold text-brand-deep/80">
                          <BookOpen className="mr-1.5 h-3.5 w-3.5 shrink-0 text-brand-green" />
                          {f.dpdp_section || "General Obligation"}
                        </p>
                      </div>

                      {f.evidence_extract && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">Policy Evidence Extract</p>
                          <blockquote className="mt-1 rounded border-l-2 border-amber-400 bg-amber-50 p-3.5 font-mono text-xs italic leading-relaxed text-amber-900/80">
                            &ldquo;{f.evidence_extract}&rdquo;
                          </blockquote>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">Business Impact</p>
                          <p className="mt-1 text-xs leading-normal text-brand-deep/60">{f.business_impact || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">Legal Liability</p>
                          <p className="mt-1 text-xs leading-normal text-brand-deep/60">{f.legal_impact || "N/A"}</p>
                        </div>
                      </div>

                      {/* Recommendations Grid */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">GRC Recommended Checklist</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="rounded-lg border border-brand-green/10 bg-white p-3 shadow-sm">
                            <span className="text-[9px] font-bold uppercase text-brand-green">Legal</span>
                            <p className="mt-1 text-[10px] leading-tight text-brand-deep/60">{f.legal_rec}</p>
                          </div>
                          <div className="rounded-lg border border-brand-green/10 bg-white p-3 shadow-sm">
                            <span className="text-[9px] font-bold uppercase text-emerald-600">Technical</span>
                            <p className="mt-1 text-[10px] leading-tight text-brand-deep/60">{f.tech_rec}</p>
                          </div>
                          <div className="rounded-lg border border-brand-green/10 bg-white p-3 shadow-sm">
                            <span className="text-[9px] font-bold uppercase text-brand-deep/70">Business</span>
                            <p className="mt-1 text-[10px] leading-tight text-brand-deep/60">{f.business_rec}</p>
                          </div>
                        </div>
                      </div>

                      {!f.issue.trim().toLowerCase().startsWith("compliant:") && (
                      <div className="pt-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleTriggerRewrite(f);
                          }}
                          className="flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-brand-green/20 bg-brand-green/10 py-2.5 text-xs font-bold text-brand-green transition hover:bg-brand-green/15"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-brand-green" />
                          <span>{f.evidence_extract ? "Rewrite Clause with AI" : "Draft Remediation Clause"}</span>
                        </button>
                      </div>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-deep/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl space-y-6 rounded-2xl border border-brand-deep/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-deep/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-deep">Policy Clause Remediation</h3>
                <p className="mt-0.5 text-[11px] text-brand-deep/50">Draft based on this audit finding&apos;s stored evidence</p>
              </div>
              <button
                onClick={() => setRewriteOpen(false)}
                className="text-xs font-semibold text-brand-deep/50 hover:text-brand-deep"
              >
                Close
              </button>
            </div>

            {rewriting ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-8 font-mono text-xs text-brand-deep/55">
                <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
                <span>Re-drafting compliant legal wording...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {rewriteError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {rewriteError}
                  </div>
                ) : (
                  <>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">
                      {rewriteOriginalText ? "Stored policy evidence" : "Source evidence"}
                    </label>
                    {rewriteMode && (
                      <span className="rounded-full border border-brand-green/15 bg-brand-green/[0.06] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-green">
                        {rewriteMode === "ai" ? "AI generated" : "Safe template fallback"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 rounded-lg border border-brand-deep/[0.08] bg-brand-cream/50 p-3 font-mono text-xs italic text-brand-deep/60">
                    {rewriteOriginalText
                      ? <>&ldquo;{rewriteOriginalText}&rdquo;</>
                      : "No matching policy clause was found. The draft below addresses the finding and contains placeholders for missing organisation details."}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-deep/45">
                    Proposed remediation draft
                  </label>
                  <div className="relative mt-1 whitespace-pre-wrap rounded-lg border border-brand-green/20 bg-brand-green/[0.04] p-4 font-mono text-xs leading-relaxed text-brand-deep/75">
                    {formatMarkdown(rewrittenText)}
                    <button
                      onClick={() => navigator.clipboard.writeText(rewrittenText)}
                      className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded border border-brand-green/20 bg-white text-brand-deep/50 transition hover:bg-brand-green/10 hover:text-brand-green"
                      title="Copy to Clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-brand-green/10 bg-brand-green/[0.04] p-3 text-[10px] leading-normal text-brand-deep/55">
                  <span className="font-bold text-brand-green">Review required:</span> {rewriteDisclaimer}
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- AI COPILOT CHAT PANEL (SLIDEOVER) --- */}
      {copilotOpen && (
        <div className="fixed bottom-0 right-0 top-0 z-40 flex w-full flex-col justify-between border-l border-brand-deep/10 bg-[#FDFBF7]/95 p-6 shadow-2xl backdrop-blur-md sm:w-96">
          <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-deep/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-brand-green" />
                <h3 className="text-base font-bold text-brand-deep">AI Compliance Copilot</h3>
              </div>
              <button
                onClick={() => setCopilotOpen(false)}
                className="text-xs font-semibold text-brand-deep/50 hover:text-brand-deep"
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
                  <span className="mb-1 text-[9px] text-brand-deep/40">
                    {chat.sender === "user" ? "YOU" : "AUDITWEAVE AI"}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                      chat.sender === "user"
                        ? "rounded-tr-none bg-brand-green text-xs text-white"
                        : "rounded-tl-none border border-brand-deep/[0.08] bg-white font-mono text-[11px] text-brand-deep/75 shadow-sm"
                    }`}
                  >
                    {chat.sender === "copilot" ? formatMarkdown(chat.text) : chat.text}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex items-center space-x-2 font-mono text-[10px] text-brand-deep/45">
                  <Loader2 className="h-3 w-3 animate-spin text-brand-green" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendCopilot} className="mt-4 flex space-x-2 border-t border-brand-deep/[0.08] pt-4">
            <input
              type="text"
              value={copilotMsg}
              onChange={(e) => setCopilotMsg(e.target.value)}
              placeholder="Ask about Section 9, penalties..."
              className="min-w-0 flex-1 rounded-xl border border-brand-deep/10 bg-white px-3 py-2 text-xs text-brand-deep outline-none transition placeholder:text-brand-deep/35 focus:border-brand-green focus:ring-3 focus:ring-brand-green/10"
            />
            <button
              type="submit"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand-green text-white transition hover:bg-brand-deep"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
