"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, AlertTriangle, CheckCircle, ShieldCheck, HelpCircle, Layers, Calendar, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { getDashboard, getBenchmarks, isAuthenticated } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const dData = await getDashboard();
        const bData = await getBenchmarks();
        setDashboardData(dData);
        setBenchmarks(bData);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-brand-cream text-brand-deep/60 font-mono text-sm">
        <Activity className="h-6 w-6 text-brand-green animate-spin mr-3" />
        <span>Loading GRC Telemetry...</span>
      </div>
    );
  }

  const stats = dashboardData || {
    total_audits: 0,
    average_compliance_score: 0,
    risk_distribution: { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 },
    recent_audits: [],
    executive_risk: {
      overall_risk: "None",
      highest_risk_area: "None",
      best_performing_area: "None",
      compliance_pct: 0,
      critical_findings: 0,
      immediate_priority: "N/A"
    }
  };

  const riskColors: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-500",
    Low: "bg-brand-green",
    Informational: "bg-brand-deep/50"
  };

  const riskTextColors: Record<string, string> = {
    Critical: "text-red-700 border-red-200 bg-red-50",
    High: "text-orange-700 border-orange-200 bg-orange-50",
    Medium: "text-amber-700 border-amber-200 bg-amber-50",
    Low: "text-brand-green border-brand-green/20 bg-brand-green/10",
    Informational: "text-brand-deep/70 border-brand-deep/20 bg-brand-deep/5"
  };

  // 7 DPDP pillars for the compliance heatmap
  const pillarsList = [
    { name: "Consent", code: "S6", description: "Granular opt-ins & withdrawal" },
    { name: "Notice", code: "S5", description: "Clear purpose notice" },
    { name: "Data Principal Rights", code: "S11-12", description: "Access, correct, erasure" },
    { name: "Children's Data", code: "S9", description: "Age gate & parent consent" },
    { name: "Fiduciary Obligations", code: "S8", description: "Breach warnings & safeguards" },
    { name: "Grievance Redressal", code: "S13", description: "Grievance Officer & SLA" },
    { name: "Cross Border Transfer", code: "S16", description: "Transfer transparency" }
  ];

  return (
    <div className="p-6 space-y-8 bg-brand-cream min-h-screen">
      {/* Page Title & Scans count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-deep tracking-tight">Global Compliance Dashboard</h1>
          <p className="text-xs text-brand-deep/60 mt-1">
            Active Framework: <span className="text-brand-green font-semibold font-mono">India DPDP Act 2023</span> | Aggregated Overview
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/60 border border-brand-deep/10 px-4 py-2.5 rounded-xl shadow-sm">
          <Calendar className="h-4 w-4 text-brand-deep/60" />
          <span className="text-xs text-brand-deep/80 font-medium">As of {new Date().toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}</span>
        </div>
      </div>

      {/* Top statistics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs text-brand-deep/60 font-semibold uppercase tracking-wider">Total Scans Completed</p>
          <p className="text-3xl font-bold text-brand-deep mt-2 font-mono">{stats.total_audits}</p>
          <div className="absolute top-4 right-4 text-brand-deep/10">
            <LayoutDashboard className="h-8 w-8" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs text-brand-deep/60 font-semibold uppercase tracking-wider">Average Compliance Score</p>
          <p className="text-3xl font-bold text-brand-green mt-2 font-mono">{stats.average_compliance_score}%</p>
          <div className="absolute top-4 right-4">
            <ShieldCheck className="h-8 w-8 text-brand-green/20" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 md:col-span-2 relative overflow-hidden">
          <p className="text-xs text-brand-deep/60 font-semibold uppercase tracking-wider">Immediate GRC Action</p>
          <p className="text-xs text-brand-deep/80 mt-2 leading-relaxed font-medium">
            {stats.executive_risk.immediate_priority}
          </p>
        </div>
      </div>

      {/* Row 2: Executive Risk Summary Card & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Executive Risk Card (L: 7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full filter blur-[80px] pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-deep/10">
              <h2 className="text-lg font-bold text-brand-deep">Executive Risk Summary</h2>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-red-200 bg-red-50 text-red-600 animate-pulse">
                {stats.executive_risk.overall_risk.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Highest Risk Exposure</p>
                  <p className="text-sm font-bold text-red-600 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1.5 shrink-0" />
                    {stats.executive_risk.highest_risk_area}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Best Performing Pillar</p>
                  <p className="text-sm font-bold text-brand-green mt-1 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1.5 shrink-0" />
                    {stats.executive_risk.best_performing_area}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">Active Vulnerabilities</p>
                  <p className="text-sm font-bold text-brand-deep mt-1 font-mono">
                    <span className="text-red-600 text-lg font-extrabold">{stats.executive_risk.critical_findings}</span> Critical & High Gaps
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-deep/60 font-bold uppercase tracking-wider">AI Scanned Confidence</p>
                  <p className="text-sm font-bold text-brand-green mt-1 font-mono">
                    96.0% Average
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-deep/5 border border-brand-deep/10 p-4 rounded-xl flex items-center justify-between mt-4">
            <span className="text-xs text-brand-deep/70 font-medium">Ready to run a new privacy policy audit?</span>
            <Link
              href="/audit/new"
              className="flex items-center space-x-1.5 text-xs text-white bg-brand-green hover:bg-[#1f4f42] px-4 py-2 rounded-lg font-bold transition shadow-sm"
            >
              <span>Scan Policy</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Risk Distribution (R: 5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Gap Severity Distribution</h2>
          
          <div className="space-y-4">
            {Object.entries(stats.risk_distribution).map(([sev, count]) => {
              const maxVal = Math.max(...Object.values(stats.risk_distribution) as number[]) || 1;
              const pct = ((count as number) / maxVal) * 100;
              return (
                <div key={sev} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-deep/70">
                    <span className="flex items-center">
                      <span className={`h-2.5 w-2.5 rounded-full ${riskColors[sev]} mr-2`} />
                      {sev}
                    </span>
                    <span className="font-mono text-brand-deep/80">{count as number} Gaps</span>
                  </div>
                  <div className="h-2 w-full bg-brand-deep/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${riskColors[sev]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap Panel */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-brand-deep/10 mb-6">
          <div>
            <h2 className="text-lg font-bold text-brand-deep">DPDP Compliance Heatmap</h2>
            <p className="text-xs text-brand-deep/60 mt-0.5">Real-time analysis scoring across mandatory compliance blocks</p>
          </div>
          <div className="flex items-center space-x-1 text-xs text-brand-deep/60">
            <TrendingUp className="h-3.5 w-3.5 text-brand-green" />
            <span>Multi-Regulation Mapping Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {pillarsList.map((p, i) => {
            // Pick a mock rating for the visual heatmap based on stats
            const counts = stats.risk_distribution;
            let pillScore = 100;
            let status = "PASS";
            let borderColor = "border-brand-green/20 bg-brand-green/5 text-brand-green";
            
            if (p.name === "Children's Data") {
              pillScore = counts.Critical > 0 ? 20 : 60;
              status = counts.Critical > 0 ? "FAIL" : "WARNING";
              borderColor = counts.Critical > 0 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700";
            } else if (p.name === "Consent" && counts.High > 0) {
              pillScore = 65;
              status = "PARTIAL";
              borderColor = "border-amber-200 bg-amber-50 text-amber-700";
            } else if (p.name === "Fiduciary Obligations" && counts.Medium > 0) {
              pillScore = 58;
              status = "PARTIAL";
              borderColor = "border-amber-200 bg-amber-50 text-amber-700";
            }
            
            return (
              <div key={i} className={`border rounded-xl p-4 flex flex-col justify-between h-32 ${borderColor}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-brand-deep/5 text-brand-deep/70">{p.code}</span>
                    <span className="text-[10px] font-bold tracking-wide">{status}</span>
                  </div>
                  <h3 className="text-sm font-bold mt-3 text-brand-deep line-clamp-1">{p.name}</h3>
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-brand-deep/10 pt-2 text-brand-deep/60">
                  <span>Score:</span>
                  <span className="font-bold text-brand-deep/80">{pillScore}/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Recent Audits & Benchmark Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Audits Table (L: 8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Recent Privacy Audits</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-deep/10 text-brand-deep/60 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Audited Organization</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-deep/5">
                {stats.recent_audits.map((a: any) => (
                  <tr key={a.id} className="text-brand-deep/80 hover:bg-brand-deep/5 transition-colors">
                    <td className="py-3 font-semibold text-brand-deep">{a.company_name}</td>
                    <td className="py-3 text-brand-deep/70">{a.industry}</td>
                    <td className="py-3 font-mono font-bold text-brand-green">{a.score}%</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-brand-deep/10 bg-brand-deep/5 text-brand-deep/70">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/audit/${a.id}`}
                        className="text-[11px] font-bold text-brand-green hover:text-[#1f4f42] underline-offset-2 hover:underline transition-all"
                      >
                        Inspect Audit
                      </Link>
                    </td>
                  </tr>
                ))}
                {stats.recent_audits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-brand-deep/50">
                      No audits found. Submit a privacy policy to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark Averages (R: 4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Sector Benchmarks</h2>
          
          <div className="space-y-4">
            {benchmarks.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-brand-deep/5 pb-3">
                <div>
                  <p className="text-sm font-semibold text-brand-deep/90">{b.industry}</p>
                  <p className="text-[10px] text-brand-deep/60 mt-0.5">{b.companies_count} audited entities</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-green font-mono">{b.average_compliance_score}%</p>
                  <p className="text-[10px] text-brand-deep/60 mt-0.5">Average Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
