"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAuditHistory, deleteAudit } from "@/lib/api";
import { 
  History, Search, Filter, Shield, AlertTriangle, CheckCircle2, 
  ArrowUpRight, Download, Building2, Calendar, FileText, Loader2, Sparkles, Trash2, ChevronDown
} from "lucide-react";

export default function HistoryPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

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

  const handleDeleteAudit = async (id: number, companyName: string) => {
    if (!confirm(`Are you sure you want to delete the compliance audit for "${companyName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteAudit(id);
      setAudits(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete audit:", err);
      alert("Failed to delete audit scan. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const industries = Array.from(new Set(audits.map(a => a.company_industry || a.industry).filter(Boolean)));

  const filteredAudits = audits.filter(audit => {
    const name = (audit.company_name || "").toLowerCase();
    const domain = (audit.company_domain || "").toLowerCase();
    const industry = (audit.company_industry || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || domain.includes(searchTerm.toLowerCase()) || industry.includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === "ALL" || (audit.company_industry || "") === selectedIndustry;
    const matchesStatus = selectedStatus === "ALL" || (audit.status || "").toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const totalAudits = audits.length;
  const avgScore = totalAudits > 0 
    ? (audits.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / totalAudits).toFixed(1)
    : "0.0";
  const criticalHighCount = audits.filter(a => (a.status || "").toLowerCase().includes("risk")).length;
  const passedRulesSum = audits.reduce((acc, a) => acc + (a.rules_passed_count || 0), 0);

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-50 text-gray-600 border-gray-200";
    if (status.includes("Critical")) return "bg-red-50 text-red-600 border-red-200";
    if (status.includes("High")) return "bg-amber-50 text-amber-600 border-amber-200";
    if (status.includes("Moderate")) return "bg-yellow-50 text-yellow-600 border-yellow-200";
    return "bg-emerald-50 text-emerald-600 border-emerald-200";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen">
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
            Historical GRC assessment registry for all audited enterprises under India's DPDP Act 2023.
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => { setSelectedIndustry("ALL"); setIsIndustryOpen(false); }}
                >
                  All Industries
                </div>
                {industries.map((ind: string) => (
                  <div
                    key={ind}
                    className={`px-3.5 py-2 cursor-pointer text-xs transition-colors truncate ${selectedIndustry === ind ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                    onClick={() => { setSelectedIndustry(ind); setIsIndustryOpen(false); }}
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
                  onClick={() => { setSelectedStatus("ALL"); setIsStatusOpen(false); }}
                >
                  All Statuses
                </div>
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedStatus === "Risk" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedStatus("Risk"); setIsStatusOpen(false); }}
                >
                  Risk Flagged
                </div>
                <div
                  className={`px-3.5 py-2 cursor-pointer text-xs transition-colors ${selectedStatus === "Compliant" ? 'bg-brand-green/10 text-brand-green font-medium' : 'hover:bg-brand-cream/50 text-brand-deep/80'}`}
                  onClick={() => { setSelectedStatus("Compliant"); setIsStatusOpen(false); }}
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
        <div className="space-y-4">
          {filteredAudits.map((audit) => {
            const dateStr = audit.created_at 
              ? new Date(audit.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Recent";

            return (
              <div
                key={audit.id}
                className="bg-white p-5 border border-brand-green/20 rounded-xl hover:border-brand-green/40 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Company & Meta */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-brand-deep tracking-wide">
                      {audit.company_name || "Enterprise Client"}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cream text-brand-deep/70 border border-brand-green/20">
                      {audit.company_industry || audit.industry || "Enterprise"}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusColor(audit.status)}`}>
                      {audit.status || "Evaluated"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-brand-deep/60">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="h-3.5 w-3.5 text-brand-deep/40" />
                      <span>{audit.company_domain || "domain.com"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-brand-deep/40" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-brand-green/10 pt-4 md:pt-0 md:pl-6">
                  <div className="text-center">
                    <p className="text-xs text-brand-deep/50 uppercase font-semibold">Compliance Score</p>
                    <p className="text-2xl font-black text-brand-green mt-0.5">
                      {audit.compliance_score ? audit.compliance_score.toFixed(1) : "0.0"}
                      <span className="text-xs text-brand-deep/40 font-normal">/100</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-brand-deep/50 uppercase font-semibold">Rules Passed</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">
                      {audit.rules_passed_count || 0} <span className="text-xs text-brand-deep/40 font-normal">Passed</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-brand-deep/50 uppercase font-semibold">Violations</p>
                    <p className="text-sm font-bold text-red-600 mt-1">
                      {audit.rules_failed_count || 0} <span className="text-xs text-brand-deep/40 font-normal">Failed</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 border-t md:border-t-0 border-brand-green/10 pt-4 md:pt-0">
                  <Link
                    href={`/audit/${audit.id}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/20 text-xs font-semibold transition"
                  >
                    <span>View GRC Report</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <a
                    href={`http://127.0.0.1:8000/api/report/${audit.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white hover:bg-brand-cream border border-brand-green/30 text-brand-deep text-xs font-medium transition shadow-sm"
                    title="Download Executive PDF"
                  >
                    <Download className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => handleDeleteAudit(audit.id, audit.company_name || 'Enterprise Client')}
                    disabled={deletingId === audit.id}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium transition disabled:opacity-50 shadow-sm"
                    title="Delete Audit Scan"
                  >
                    {deletingId === audit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
