"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, HelpCircle, AlertTriangle, ShieldCheck, Landmark } from "lucide-react";
import { searchKnowledgeBase, isAuthenticated } from "@/lib/api";

export default function HandbookPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [kbData, setKbData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const loadKb = async () => {
      setLoading(true);
      try {
        const res = await searchKnowledgeBase(query);
        setKbData(res);
      } catch (err) {
        console.error("Failed to load KB:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce/delay trigger for search
    const delay = setTimeout(() => {
      loadKb();
    }, 200);
    
    return () => clearTimeout(delay);
  }, [query, router]);

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-[#0D3A35] min-h-screen">
      
      {/* Title & search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-emerald-300" />
            <span>DPDP Handbook</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable legal reference database mapping statutory obligations under the DPDP Act 2023.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sections (e.g. Notice)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-emerald-600 text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-mono">
          <span>Searching compliance database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(kbData).map(([key, section]) => (
            <div key={key} className="glass-card rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                <h2 className="text-lg font-bold text-slate-100 flex items-center">
                  <Landmark className="h-4.5 w-4.5 text-emerald-300 mr-2 shrink-0" />
                  {section.title}
                </h2>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 font-mono">
                  {key.toUpperCase().replace("_", " ")}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Statutory Explanation</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {section.explanation}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-red-950/5 border border-red-950/20 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center text-red-400 font-bold text-[10px] uppercase">
                      <AlertTriangle className="h-4 w-4 mr-1 shrink-0" />
                      <span>Statutory Penalty Ceiling</span>
                    </div>
                    <p className="text-xs text-red-200 leading-relaxed font-mono">
                      {section.penalties}
                    </p>
                  </div>

                  <div className="bg-emerald-950/5 border border-emerald-950/20 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center text-emerald-400 font-bold text-[10px] uppercase">
                      <ShieldCheck className="h-4 w-4 mr-1 shrink-0" />
                      <span>Cyber-Security Best Practice</span>
                    </div>
                    <p className="text-xs text-emerald-200 leading-relaxed">
                      {section.best_practice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {Object.keys(kbData).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No matching statutory sections found for "{query}". Try searching "Notice", "Consent", or "Section 9".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
