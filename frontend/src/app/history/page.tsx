"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuditHistory, deleteAudit } from "@/lib/api";
import { 
  History, Search, Filter, Shield, AlertTriangle, CheckCircle2, 
  ArrowUpRight, Download, Building2, Calendar, FileText, Loader2, Sparkles, Trash2
} from "lucide-react";

export default function HistoryPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

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
    if (!status) return "bg-slate-800 text-slate-300 border-slate-700";
    if (status.includes("Critical")) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (status.includes("High")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (status.includes("Moderate")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-300 glow-primary">
              <History className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Compliance Audit History
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Historical GRC assessment registry for all audited enterprises under India's DPDP Act 2023.
          </p>
        </div>

        <Link
          href="/audit/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-300 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 self-start md:self-auto"
        >
          <Shield className="h-4 w-4" />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Audits</span>
            <FileText className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalAudits}</p>
          <p className="text-[11px] text-slate-500">Evaluated against 11 DPDP Pillars</p>
        </div>

        <div className="glass-panel p-5 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Compliance Score</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-300">{avgScore}<span className="text-sm text-slate-500">/100</span></p>
          <p className="text-[11px] text-slate-500">Statutory Benchmark Average</p>
        </div>

        <div className="glass-panel p-5 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>High Risk Identified</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{criticalHighCount}</p>
          <p className="text-[11px] text-slate-500">Requires Urgent Remediation</p>
        </div>

        <div className="glass-panel p-5 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Rules Verified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{passedRulesSum}</p>
          <p className="text-[11px] text-slate-500">Passed Statutory Controls</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company name, domain, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-[#0B1120] border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Industries</option>
              {industries.map((ind: string) => (
                <option key={ind} value={ind} className="bg-[#0B1120] text-slate-200">{ind}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-[#0B1120] border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Risk" className="bg-[#0B1120] text-slate-200">Risk Flagged</option>
              <option value="Compliant" className="bg-[#0B1120] text-slate-200">Compliant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit History List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-emerald-300 animate-spin" />
          <p className="text-sm text-slate-400">Loading historical audit registry...</p>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-slate-800 rounded-xl space-y-4">
          <Building2 className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-200">No Audits Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No compliance audits match your filter criteria. Start a new audit to add to history.
          </p>
          <Link
            href="/audit/new"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 text-slate-950 font-semibold text-xs transition"
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
                className="glass-panel p-5 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Company & Meta */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {audit.company_name || "Enterprise Client"}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {audit.company_industry || audit.industry || "Enterprise"}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusColor(audit.status)}`}>
                      {audit.status || "Evaluated"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>{audit.company_domain || "domain.com"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Compliance Score</p>
                    <p className="text-2xl font-black text-emerald-300 mt-0.5">
                      {audit.compliance_score ? audit.compliance_score.toFixed(1) : "0.0"}
                      <span className="text-xs text-slate-500 font-normal">/100</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Rules Passed</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      {audit.rules_passed_count || 0} <span className="text-xs text-slate-500 font-normal">Passed</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Violations</p>
                    <p className="text-sm font-bold text-rose-400 mt-1">
                      {audit.rules_failed_count || 0} <span className="text-xs text-slate-500 font-normal">Failed</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                  <Link
                    href={`/audit/${audit.id}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 text-xs font-semibold transition"
                  >
                    <span>View GRC Report</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <a
                    href={`http://127.0.0.1:8000/api/report/${audit.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition"
                    title="Download Executive PDF"
                  >
                    <Download className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => handleDeleteAudit(audit.id, audit.company_name || 'Enterprise Client')}
                    disabled={deletingId === audit.id}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition disabled:opacity-50"
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
