"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompare, ShieldAlert, Award, FileText, ArrowRight, ShieldCheck, Activity, FileDown } from "lucide-react";
import { downloadComparisonReport, getAuditHistory, compareAudits, isAuthenticated } from "@/lib/api";

export default function ComparePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [auditIdA, setAuditIdA] = useState<number>(0);
  const [auditIdB, setAuditIdB] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const loadHistory = async () => {
      try {
        const hist = await getAuditHistory();
        setHistory(hist);
        if (hist.length >= 2) {
          setAuditIdA(hist[0].id);
          setAuditIdB(hist[1].id);
        } else if (hist.length === 1) {
          setAuditIdA(hist[0].id);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [router]);

  const handleCompare = async () => {
    if (!auditIdA || !auditIdB) return;
    setComparing(true);
    try {
      const data = await compareAudits(auditIdA, auditIdB);
      setCompareData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D3A35] text-slate-400 font-mono text-xs">
        <Activity className="h-5 w-5 text-emerald-300 animate-spin mr-3" />
        <span>Loading Audits Registry...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <GitCompare className="h-7 w-7 text-emerald-300" />
          <span>Policy Comparer</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Compare privacy policy versions or competitor compliance postures side-by-side.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select Organization A
          </label>
          <select
            value={auditIdA}
            onChange={(e) => setAuditIdA(parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-200"
          >
            <option value={0}>Choose an audit...</option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {h.company_name} ({h.company_industry}) - {h.score}%
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 text-center pb-2.5 font-bold text-slate-500 text-sm hidden md:block">
          VS
        </div>

        <div className="md:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select Organization B
          </label>
          <select
            value={auditIdB}
            onChange={(e) => setAuditIdB(parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-200"
          >
            <option value={0}>Choose an audit...</option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {h.company_name} ({h.company_industry}) - {h.score}%
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-12 pt-2">
          <button
            onClick={handleCompare}
            disabled={!auditIdA || !auditIdB || comparing}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-300 hover:to-indigo-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
          >
            {comparing ? "Comparing GRC metrics..." : "Compare Audit Postures"}
          </button>
        </div>
      </div>

      {compareData && (
        <div className="space-y-6">
          {/* Winner Card */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 glow-primary grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-3 text-center md:border-r border-slate-800/50">
              <Award className="h-10 w-10 text-emerald-400 mx-auto mb-2 glow-success" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance Winner</p>
              <p className="text-xl font-extrabold text-slate-200 mt-1">{compareData.winner}</p>
            </div>
            
            <div className="md:col-span-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Differential Gap Analysis</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
                {compareData.gap_analysis}
              </p>
            </div>

            {/* Export Comparative PDF Report */}
            <div className="md:col-span-3 text-center">
              <button
                type="button"
                onClick={() => void downloadComparisonReport(auditIdA, auditIdB)}
                className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-300 px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-600/15"
              >
                <FileDown className="h-4 w-4" />
                <span>Export Report PDF</span>
              </button>
            </div>
          </div>

          {/* Side-by-side Score cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Company A Card */}
            <div className="glass-card rounded-2xl border border-slate-800/60 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                <div>
                  <h3 className="text-base font-bold text-slate-200">{compareData.company_a.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">POSTURE REPORT A</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-emerald-300 font-mono">{compareData.company_a.score}%</p>
                  <span className="text-[10px] font-bold text-slate-400">{compareData.company_a.status}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Risk Findings</p>
                <div className="space-y-2">
                  {compareData.company_a.primary_gaps.map((g: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 text-red-400 bg-red-950/10 border border-red-950/40 p-2.5 rounded-lg text-xs font-mono">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                      <span>{g}</span>
                    </div>
                  ))}
                  {compareData.company_a.primary_gaps.length === 0 && (
                    <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/10 border border-emerald-950/40 p-2.5 rounded-lg text-xs">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>No critical gaps detected.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company B Card */}
            <div className="glass-card rounded-2xl border border-slate-800/60 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                <div>
                  <h3 className="text-base font-bold text-slate-200">{compareData.company_b.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">POSTURE REPORT B</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-emerald-300 font-mono">{compareData.company_b.score}%</p>
                  <span className="text-[10px] font-bold text-slate-400">{compareData.company_b.status}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Risk Findings</p>
                <div className="space-y-2">
                  {compareData.company_b.primary_gaps.map((g: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 text-red-400 bg-red-950/10 border border-red-950/40 p-2.5 rounded-lg text-xs font-mono">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                      <span>{g}</span>
                    </div>
                  ))}
                  {compareData.company_b.primary_gaps.length === 0 && (
                    <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/10 border border-emerald-950/40 p-2.5 rounded-lg text-xs">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>No critical gaps detected.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
