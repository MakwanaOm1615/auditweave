"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BarChart3, ShieldCheck, Trophy, Layers, Activity } from "lucide-react";
import { getBenchmarks, getLeaderboard, isAuthenticated } from "@/lib/api";

export default function BenchmarkPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const bData = await getBenchmarks();
        const lData = await getLeaderboard();
        setBenchmarks(bData);
        setLeaderboard(lData);
      } catch (err) {
        console.error("Failed to load benchmarks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D3A35] text-slate-400 font-mono text-xs">
        <Activity className="h-5 w-5 text-emerald-300 animate-spin mr-3" />
        <span>Syncing GRC Baselines...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-[1600px] mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-emerald-300" />
          <span>Leaderboard & Benchmarks</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Market-wide compliance statistics and rankings of audited data fiduciaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Public Leaderboard (L: 7 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-800/60">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-800/40 mb-6">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-slate-100">Top Audited Companies</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Organization</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {leaderboard.map((comp) => (
                  <tr key={comp.rank} className="text-slate-300 hover:bg-slate-800/10">
                    <td className="py-3.5 font-bold font-mono">
                      {comp.rank === 1 ? "1" : comp.rank === 2 ? "2" : comp.rank === 3 ? "3" : comp.rank}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-100">{comp.company_name}</td>
                    <td className="py-3.5 text-slate-400">{comp.industry}</td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-300">{comp.score}%</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No leaderboard data populated. Run some audits first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Averages (R: 4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-slate-800/60 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-800/40">
            <BarChart3 className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-bold text-slate-100">Sector Compliance Averages</h2>
          </div>

          <div className="space-y-5">
            {benchmarks.map((bench) => {
              // Color map by score range
              const score = bench.average_compliance_score;
              const colorClass = score >= 70 ? "text-emerald-400" : score >= 60 ? "text-emerald-300" : "text-amber-400";
              
              return (
                <div key={bench.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{bench.industry}</span>
                    <span className={`font-mono font-bold ${colorClass}`}>{score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-indigo-600"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono text-right">{bench.companies_count} Companies Audited</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
