"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAuditHistory, deleteAudit, downloadAuditReport } from "@/lib/api";
import { 
  History, Search, Filter, Shield, AlertTriangle, CheckCircle2, 
  ArrowUpRight, Download, Building2, Calendar, FileText, Loader2, Sparkles, Trash2, ChevronDown,
  ChevronLeft, ChevronRight
} from "lucide-react";

interface AuditHistoryItem {
  id: number;
  company_name?: string;
  company_domain?: string;
  company_industry?: string;
  industry?: string;
  status?: string;
  compliance_score?: number;
  rules_passed_count?: number;
  rules_failed_count?: number;
  created_at?: string;
}

const AUDITS_PER_PAGE = 20;

export default function HistoryPage() {
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ id: number; companyName: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (industryRef.current && !industryRef.current.contains(event.target as Node)) {
        setIsIndustryOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getAuditHistory();
        setAudits(data || []);
      } catch (err) {
        console.error("Failed to load audit history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const initiateDelete = (id: number, companyName: string) => {
    setDeleteConfirmModal({ id, companyName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal) return;
    const { id } = deleteConfirmModal;
    try {
      setDeletingId(id);
      await deleteAudit(id);
      setAudits(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete audit:", err);
      alert("Failed to delete audit scan. Please try again.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmModal(null);
    }
  };

  const industries = Array.from(new Set(
    audits
      .map((audit) => audit.company_industry || audit.industry)
      .filter((industry): industry is string => Boolean(industry)),
  ));

  const filteredAudits = audits.filter(audit => {
    const name = (audit.company_name || "").toLowerCase();
    const domain = (audit.company_domain || "").toLowerCase();
    const industry = (audit.company_industry || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || domain.includes(searchTerm.toLowerCase()) || industry.includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === "ALL" || (audit.company_industry || "") === selectedIndustry;
    const matchesStatus = selectedStatus === "ALL" || (audit.status || "").toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAudits.length / AUDITS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const firstRecordIndex = (activePage - 1) * AUDITS_PER_PAGE;
  const paginatedAudits = filteredAudits.slice(firstRecordIndex, firstRecordIndex + AUDITS_PER_PAGE);

  const totalAudits = audits.length;
  const avgScore = totalAudits > 0 
    ? (audits.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / totalAudits).toFixed(1)
    : "0.0";
  const criticalHighCount = audits.filter((audit) => {
    const status = (audit.status || "").toLowerCase();
    return status.includes("critical") || status.includes("high");
  }).length;
  const passedRulesSum = audits.reduce((acc, a) => acc + (a.rules_passed_count || 0), 0);

  const getStatusColor = (status?: string) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus.includes("critical")) return "border-red-200 bg-red-50 text-red-700";
    if (normalizedStatus.includes("high")) return "border-orange-200 bg-orange-50 text-orange-700";
    if (normalizedStatus.includes("moderate")) return "border-amber-200 bg-amber-50 text-amber-700";
    if (normalizedStatus.includes("excellent") || normalizedStatus.includes("compliant") || normalizedStatus.includes("low")) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-slate-200 bg-slate-50 text-slate-600";
  };

  const getStatusDotColor = (status?: string) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus.includes("critical")) return "bg-red-500";
    if (normalizedStatus.includes("high")) return "bg-orange-500";
    if (normalizedStatus.includes("moderate")) return "bg-amber-500";
    if (normalizedStatus.includes("excellent") || normalizedStatus.includes("compliant") || normalizedStatus.includes("low")) {
      return "bg-emerald-500";
    }
    return "bg-slate-400";
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return "text-red-600";
    if (score < 70) return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-green/20 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green shadow-sm">
              <History className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-deep">
              Compliance Audit History
            </h1>
          </div>
          <p className="text-sm text-brand-deep/70">
            Historical GRC assessment registry for all audited enterprises under India&apos;s DPDP Act 2023.
          </p>
        </div>

        <Link
          href="/audit/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-green hover:bg-brand-deep text-white font-semibold text-sm transition-all shadow-md self-start md:self-auto"
        >
          <Shield className="h-4 w-4" />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-brand-green/20 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-brand-deep/70 font-medium">
            <span>Total Audits</span>
            <FileText className="h-4 w-4 text-brand-green" />
          </div>
          <p className="text-3xl font-extrabold text-brand-deep">{totalAudits}</p>
          <p className="text-[11px] text-brand-deep/50">Evaluated against 11 DPDP Pillars</p>
        </div>

        <div className="bg-white p-5 border border-brand-green/20 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-brand-deep/70 font-medium">
            <span>Avg Compliance Score</span>
            <Sparkles className="h-4 w-4 text-brand-green" />
          </div>
          <p className="text-3xl font-extrabold text-brand-green">{avgScore}<span className="text-sm text-brand-deep/50">/100</span></p>
          <p className="text-[11px] text-brand-deep/50">Statutory Benchmark Average</p>
        </div>

        <div className="bg-white p-5 border border-brand-green/20 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-brand-deep/70 font-medium">
            <span>High Risk Identified</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-500">{criticalHighCount}</p>
          <p className="text-[11px] text-brand-deep/50">Requires Urgent Remediation</p>
        </div>

        <div className="bg-white p-5 border border-brand-green/20 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-brand-deep/70 font-medium">
            <span>Rules Verified</span>
            <CheckCircle2 className="h-4 w-4 text-brand-green" />
          </div>
          <p className="text-3xl font-extrabold text-brand-green">{passedRulesSum}</p>
          <p className="text-[11px] text-brand-deep/50">Passed Statutory Controls</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-brand-green/20 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-deep/50" />
          <input
            type="text"
            placeholder="Search by company name, domain, or industry..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-brand-cream/30 border border-brand-green/30 rounded-lg text-sm text-brand-deep placeholder-brand-deep/40 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* Industry Custom Dropdown */}
          <div className="relative w-full md:w-auto" ref={industryRef}>
            <div 
              className={`flex items-center justify-between space-x-2 bg-brand-cream/30 border px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${isIndustryOpen ? 'border-brand-green ring-1 ring-brand-green' : 'border-brand-green/30 hover:border-brand-green/60'}`}
              onClick={() => setIsIndustryOpen(!isIndustryOpen)}
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-3.5 w-3.5 text-brand-deep/60" />
                <span className="text-brand-deep whitespace-nowrap">{selectedIndustry === "ALL" ? "All Industries" : selectedIndustry}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-brand-deep/50 transition-transform duration-200 ${isIndustryOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isIndustryOpen && (
              <div className="absolute z-20 w-full min-w-[160px] right-0 mt-1.5 bg-white border border-brand-green/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1.5 overflow-hidden max-h-60 overflow-y-auto">
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedIndustry === "ALL" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedIndustry("ALL"); setCurrentPage(1); setIsIndustryOpen(false); }}
                >
                  All Industries
                </div>
                {industries.map((ind: string) => (
                  <div
                    key={ind}
                    className={`px-3.5 py-2 cursor-pointer text-xs transition-colors truncate ${selectedIndustry === ind ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                    onClick={() => { setSelectedIndustry(ind); setCurrentPage(1); setIsIndustryOpen(false); }}
                    title={ind}
                  >
                    {ind}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Custom Dropdown */}
          <div className="relative w-full md:w-auto" ref={statusRef}>
            <div 
              className={`flex items-center justify-between space-x-2 bg-brand-cream/30 border px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${isStatusOpen ? 'border-brand-green ring-1 ring-brand-green' : 'border-brand-green/30 hover:border-brand-green/60'}`}
              onClick={() => setIsStatusOpen(!isStatusOpen)}
            >
              <span className="text-brand-deep whitespace-nowrap">
                {selectedStatus === "ALL" ? "All Statuses" : selectedStatus === "Risk" ? "Risk Flagged" : "Compliant"}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-brand-deep/50 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isStatusOpen && (
              <div className="absolute z-20 w-full min-w-[140px] right-0 mt-1.5 bg-white border border-brand-green/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1.5 overflow-hidden">
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedStatus === "ALL" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedStatus("ALL"); setCurrentPage(1); setIsStatusOpen(false); }}
                >
                  All Statuses
                </div>
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedStatus === "Risk" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedStatus("Risk"); setCurrentPage(1); setIsStatusOpen(false); }}
                >
                  Risk Flagged
                </div>
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedStatus === "Compliant" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedStatus("Compliant"); setCurrentPage(1); setIsStatusOpen(false); }}
                >
                  Compliant
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit History List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-brand-green animate-spin" />
          <p className="text-sm text-brand-deep/70">Loading historical audit registry...</p>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-white p-12 text-center border border-brand-green/20 rounded-xl shadow-sm space-y-4">
          <Building2 className="h-12 w-12 text-brand-deep/40 mx-auto" />
          <h3 className="text-lg font-semibold text-brand-deep">No Audits Found</h3>
          <p className="text-sm text-brand-deep/70 max-w-md mx-auto">
            No compliance audits match your filter criteria. Start a new audit to add to history.
          </p>
          <Link
            href="/audit/new"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-green text-white font-semibold text-xs transition hover:bg-brand-deep"
          >
            <Shield className="h-4 w-4" />
            <span>Create New Audit</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-green/20 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-brand-deep/[0.035]">
                <tr className="border-b border-brand-green/15 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-deep/55">
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Risk Status</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-4 py-3.5 text-center">Rules Passed</th>
                  <th className="px-4 py-3.5 text-center">Violations</th>
                  <th className="px-4 py-3.5">Audited On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-green/10">
                {paginatedAudits.map((audit) => {
                  const dateStr = audit.created_at
                    ? new Date(audit.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <tr key={audit.id} className="group transition-colors hover:bg-brand-green/[0.035]">
                      <td className="px-5 py-3.5">
                        <div className="max-w-[250px]">
                          <p className="truncate text-sm font-bold text-brand-deep" title={audit.company_name || "Enterprise Client"}>
                            {audit.company_name || "Enterprise Client"}
                          </p>
                          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-brand-deep/50">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{audit.company_domain || "domain.com"}</span>
                            <span className="text-brand-deep/25">·</span>
                            <span className="truncate">{audit.company_industry || audit.industry || "Enterprise"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] font-bold ${getStatusColor(audit.status)}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDotColor(audit.status)}`} />
                          {audit.status || "Evaluated"}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 text-center font-mono text-sm font-extrabold ${getScoreColor(audit.compliance_score || 0)}`}>
                        {audit.compliance_score != null ? audit.compliance_score.toFixed(1) : "0.0"}
                        <span className="text-[10px] font-normal text-brand-deep/35">/100</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-bold text-emerald-600">
                        {audit.rules_passed_count || 0}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-bold text-red-600">
                        {audit.rules_failed_count || 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-brand-deep/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-brand-deep/35" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/audit/${audit.id}`}
                            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-green/20 bg-brand-green/10 px-2.5 text-[11px] font-semibold text-brand-green transition hover:bg-brand-green/20"
                          >
                            <span>View</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void downloadAuditReport(audit.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-green/20 text-brand-deep/70 transition hover:bg-brand-cream hover:text-brand-deep"
                            title="Download Executive PDF"
                            aria-label={`Download audit report for ${audit.company_name || "company"}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => initiateDelete(audit.id, audit.company_name || "Enterprise Client")}
                            disabled={deletingId === audit.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            title="Delete Audit Scan"
                            aria-label={`Delete audit for ${audit.company_name || "company"}`}
                          >
                            {deletingId === audit.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-brand-green/15 bg-brand-deep/[0.02] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-brand-deep/55">
              Showing <span className="font-bold text-brand-deep">{firstRecordIndex + 1}–{Math.min(firstRecordIndex + AUDITS_PER_PAGE, filteredAudits.length)}</span> of{" "}
              <span className="font-bold text-brand-deep">{filteredAudits.length}</span> audits
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={activePage === 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-green/20 bg-white px-3 text-xs font-semibold text-brand-deep transition hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={activePage === totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-green/20 bg-white px-3 text-xs font-semibold text-brand-deep transition hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-deep/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-brand-deep/10 bg-white p-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-brand-deep">Delete Audit Scan</h3>
              <p className="mt-2 text-sm text-brand-deep/70">
                Are you sure you want to delete the compliance audit for <strong className="text-brand-deep">"{deleteConfirmModal.companyName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-deep/70 transition hover:bg-brand-deep/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleteConfirmModal.id}
                className="flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === deleteConfirmModal.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Delete Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
