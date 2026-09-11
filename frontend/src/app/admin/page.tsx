"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, Users, Building2, FileBarChart, AlertTriangle,
  Trash2, RefreshCcw, Activity, Crown,
} from "lucide-react";
import {
  isAuthenticated, isAdmin, getCurrentEmail,
  getAdminStats, getAdminUsers, getAdminCompanies, getAdminAudits,
  updateUserRole, deleteUser, deleteAdminAudit,
} from "@/lib/api";

type Tab = "overview" | "users" | "companies" | "audits";

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (!isAdmin()) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, u, c, a] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminCompanies(),
        getAdminAudits(),
      ]);
      setStats(s);
      setUsers(u);
      setCompanies(c);
      setAudits(a);
    } catch (e: any) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(id: number, role: string) {
    try {
      await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    }
  }

  async function handleDeleteAudit(id: number) {
    if (!confirm("Delete this audit? This cannot be undone.")) return;
    try {
      await deleteAdminAudit(id);
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete audit");
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center text-[#B1B7AB] font-mono text-sm">
        Loading admin console...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-3 text-center px-6">
        <ShieldAlert className="h-10 w-10 text-[#C1503F]" />
        <h1 className="text-xl font-semibold text-[#FBF6F0]">Admin access required</h1>
        <p className="text-sm text-[#B1B7AB] max-w-md">
          Signed in as <span className="text-[#FBF6F0]">{getCurrentEmail() || "guest"}</span>.
          This console is restricted to AuditWeave admin accounts.
        </p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "audits", label: "Audits", icon: FileBarChart },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-[#3F9C7E]" />
          <div>
            <h1 className="text-2xl font-bold text-[#FBF6F0] font-sans">Admin Console</h1>
            <p className="text-xs text-[#B1B7AB]">Platform-wide oversight for AuditWeave</p>
          </div>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-[#276152]/50 text-[#B1B7AB] hover:text-[#FBF6F0] hover:border-[#276152] transition-all"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#C1503F]/40 bg-[#C1503F]/10 px-4 py-3 text-sm text-[#e0a89f]">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-[#276152]/30 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                tab === t.id
                  ? "bg-[#276152]/20 text-[#3F9C7E] font-medium"
                  : "text-[#B1B7AB] hover:text-[#FBF6F0]"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.total_users} />
          <StatCard label="Companies Audited" value={stats.total_companies} />
          <StatCard label="Total Audits" value={stats.total_audits} />
          <StatCard label="Critical Findings" value={stats.critical_findings} danger />
          <StatCard label="Avg Compliance Score" value={`${stats.average_compliance_score}%`} span2 />
          <div className="col-span-2 md:col-span-2 glass-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-[#B1B7AB] mb-3">Recent Audits</p>
            <div className="space-y-2">
              {stats.recent_audits?.length ? stats.recent_audits.map((a: any) => (
                <div key={a.id} className="flex justify-between text-sm text-[#FBF6F0]">
                  <span>{a.company}</span>
                  <span className="text-[#3F9C7E]">{a.compliance_score}%</span>
                </div>
              )) : <p className="text-xs text-[#B1B7AB]">No audits yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#132E2A] text-[#B1B7AB] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Audits</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#276152]/20">
                  <td className="px-4 py-3 text-[#FBF6F0]">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-[#0D3A35] border border-[#276152]/50 rounded px-2 py-1 text-xs text-[#FBF6F0]"
                    >
                      <option value="user">user</option>
                      <option value="compliance_officer">compliance_officer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{u.audit_count}</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="text-[#C1503F] hover:text-[#e0a89f]">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "companies" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#132E2A] text-[#B1B7AB] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Domain</th>
                <th className="text-left px-4 py-3">Industry</th>
                <th className="text-left px-4 py-3">Policies</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-[#276152]/20">
                  <td className="px-4 py-3 text-[#FBF6F0]">{c.name}</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{c.domain}</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{c.industry}</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{c.policy_count}</td>
                </tr>
              ))}
              {!companies.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[#B1B7AB]">No companies audited yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "audits" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#132E2A] text-[#B1B7AB] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-t border-[#276152]/20">
                  <td className="px-4 py-3 text-[#FBF6F0]">{a.company}</td>
                  <td className="px-4 py-3 text-[#3F9C7E]">{a.compliance_score}%</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{a.status}</td>
                  <td className="px-4 py-3 text-[#B1B7AB]">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteAudit(a.id)} className="text-[#C1503F] hover:text-[#e0a89f]">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {!audits.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#B1B7AB]">No audits yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, danger, span2 }: { label: string; value: any; danger?: boolean; span2?: boolean }) {
  return (
    <div className={`glass-card rounded-xl p-4 ${span2 ? "col-span-2 md:col-span-1" : ""}`}>
      <p className="text-xs uppercase tracking-wider text-[#B1B7AB] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${danger ? "text-[#C1503F]" : "text-[#FBF6F0]"}`}>{value}</p>
    </div>
  );
}
