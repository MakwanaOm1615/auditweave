const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/api";

// Helper to get headers
function getHeaders(isMultipart = false) {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auditweave_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("auditweave_token");
}

export function getCurrentRole(): string {
  if (typeof window === "undefined") return "user";
  return localStorage.getItem("auditweave_role") || "user";
}

export function isAdmin(): boolean {
  return getCurrentRole() === "admin";
}

export function getCurrentEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auditweave_email") || "";
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auditweave_token");
  localStorage.removeItem("auditweave_role");
  localStorage.removeItem("auditweave_email");
}

// Low-level request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(isMultipart);
  
  const mergedOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    }
  };

  const res = await fetch(url, mergedOptions);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Unknown error occurred" }));
    throw new Error(errData.detail || "Server returned error status");
  }
  return await res.json() as T;
}


function roundVal(num: number): number {
  return Math.round(num * 10) / 10;
}

// --- API ACTIONS ---

export async function getAuditDetail(id: string | number): Promise<any> {
  return request<any>(`/audit/${id}`);
}

export async function deleteAudit(id: string | number): Promise<any> {
  return request<any>(`/audit/${id}`, {
    method: "DELETE"
  });
}

export async function createAudit(companyName: string, industry: string, policyUrl?: string, policyText?: string): Promise<any> {
  return request<any>("/audit", {
    method: "POST",
    body: JSON.stringify({
      company_name: companyName,
      industry: industry,
      policy_url: policyUrl || null,
      policy_text: policyText || null
    })
  });
}

export async function createAuditWithFile(companyName: string, industry: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("company_name", companyName);
  formData.append("industry", industry);
  formData.append("file", file);
  
  const res = await fetch(`${API_BASE}/audit/file`, {
  method: "POST",
  body: formData
});
  if (!res.ok) {
    const errText = await res.text().catch(() => "File upload failed");
    throw new Error(errText || "File upload failed");
  }
  return await res.json();
}

export async function askCopilot(auditId: string | number, message: string): Promise<any> {
  return request<any>("/audit/copilot", {
    method: "POST",
    body: JSON.stringify({ audit_id: String(auditId), message })
  });
}

export async function rewriteClause(findingId: number, clauseText: string): Promise<any> {
  return request<any>("/audit/rewrite", {
    method: "POST",
    body: JSON.stringify({ finding_id: findingId, clause_text: clauseText })
  });
}

// --- AUTH ---

export async function login(email: string, password: string): Promise<any> {
  const data = await request<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== "undefined" && data?.access_token) {
    localStorage.setItem("auditweave_token", data.access_token);
    localStorage.setItem("auditweave_role", data.role || "user");
    localStorage.setItem("auditweave_email", email);
  }
  return data;
}

export async function register(email: string, password: string): Promise<any> {
  return request<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getDashboard(): Promise<any> {
  return request<any>("/dashboard");
}

// --- ADMIN PANEL ---

export async function getAdminStats(): Promise<any> {
  return request<any>("/admin/stats");
}

export async function getAdminUsers(): Promise<any[]> {
  return request<any[]>("/admin/users");
}

export async function updateUserRole(userId: number, role: string): Promise<any> {
  return request<any>(`/admin/users/${userId}/role?role=${encodeURIComponent(role)}`, {
    method: "PATCH",
  });
}

export async function deleteUser(userId: number): Promise<any> {
  return request<any>(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function getAdminCompanies(): Promise<any[]> {
  return request<any[]>("/admin/companies");
}

export async function getAdminAudits(): Promise<any[]> {
  return request<any[]>("/admin/audits");
}

export async function deleteAdminAudit(auditId: number): Promise<any> {
  return request<any>(`/admin/audits/${auditId}`, { method: "DELETE" });
}

export async function getAdminLogs(): Promise<any[]> {
  return request<any[]>("/admin/logs");
}

export async function getBenchmarks(): Promise<any[]> {
  return request<any[]>("/benchmark");
}

export async function getLeaderboard(): Promise<any[]> {
  return request<any[]>("/leaderboard");
}

export async function createBatchAudit(items: Array<{ company_name: string; industry: string; policy_url?: string; policy_text?: string }>): Promise<any> {
  return request<any>("/audit/batch", {
    method: "POST",
    body: JSON.stringify({ items })
  });
}

export async function getAuditHistory(): Promise<any[]> {
  return request<any[]>("/audit/history");
}

export async function compareAudits(idA: string | number, idB: string | number): Promise<any> {
  return request<any>(`/compare/${idA}/${idB}/report`);
}

export async function searchKnowledgeBase(query?: string): Promise<any> {
  return request<any>("/kb" + (query ? `?query=${encodeURIComponent(query)}` : ""));
}

export async function runResearchReport(companies: string[]): Promise<any> {
  return request<any>("/research", {
    method: "POST",
    body: JSON.stringify(companies)
  });
}
