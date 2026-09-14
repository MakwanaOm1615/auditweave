import { clearAuthSession, getStoredEmail, getStoredRole, getValidAccessToken, saveAuthSession } from "./auth/session";
import { parseAuthTokenResponse, parseRegisteredUserResponse, parseUserProfileResponse } from "./auth/types";
import type { AuthTokenResponse, RegisteredUserResponse, UserProfileResponse } from "./auth/types";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_BASE = `${configuredApiUrl.replace(/\/api$/, "")}/api`;
const API_REQUEST_TIMEOUT_MS = 60_000;

// Helper to get headers
function getHeaders(isMultipart = false) {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = getValidAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getValidAccessToken() !== null;
}

export function getCurrentRole(): string {
  if (typeof window === "undefined") return "user";
  return getStoredRole();
}

export function isAdmin(): boolean {
  return getCurrentRole() === "admin";
}

export function getCurrentEmail(): string {
  if (typeof window === "undefined") return "";
  return getStoredEmail();
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  clearAuthSession();
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatApiError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const messages = value.flatMap((item) => {
      if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") {
        return [item.msg];
      }
      return [];
    });
    if (messages.length) return messages.join(" ");
  }
  return "Server returned an error.";
}

async function throwResponseError(res: Response): Promise<never> {
  if (res.status === 401) clearAuthSession();
  const body: unknown = await res.json().catch(() => null);
  const detail = typeof body === "object" && body !== null && "detail" in body ? body.detail : body;
  throw new Error(formatApiError(detail));
}

// Low-level request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(isMultipart);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  
  const mergedOptions = {
    ...options,
    signal: options.signal ?? controller.signal,
    headers: {
      ...headers,
      ...(options.headers || {}),
    }
  };

  let res: Response;
  try {
    res = await fetch(url, mergedOptions);
  } catch (error: any) {
    if (error.name === "AbortError" || (error instanceof DOMException && error.name === "TimeoutError")) {
      throw new Error("The API service did not respond in time. Verify that the backend is running and try again.");
    }
    if (error instanceof TypeError) {
      console.error("Fetch TypeError:", error);
      throw new Error("Unable to connect to the API service. Verify that the backend is running.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    await throwResponseError(res);
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
    headers: getHeaders(true),
    body: formData
  });
  if (!res.ok) {
    await throwResponseError(res);
  }
  return await res.json();
}

export async function askCopilot(auditId: string | number, message: string): Promise<any> {
  return request<any>("/audit/copilot", {
    method: "POST",
    body: JSON.stringify({ audit_id: String(auditId), message })
  });
}

export interface RewriteClauseResponse {
  finding_id: number;
  original_text: string;
  rewritten_text: string;
  disclaimer: string;
  generation_mode: "ai" | "template";
}

export async function rewriteClause(findingId: number): Promise<RewriteClauseResponse> {
  return request<RewriteClauseResponse>("/audit/rewrite", {
    method: "POST",
    body: JSON.stringify({ finding_id: findingId })
  });
}

// --- AUTH ---

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const raw = await request<unknown>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = parseAuthTokenResponse(raw);
  saveAuthSession(data);
  return data;
}

export async function register(firstName: string, email: string, password: string): Promise<RegisteredUserResponse> {
  const raw = await request<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ first_name: firstName, email, password }),
  });
  return parseRegisteredUserResponse(raw);
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  const raw = await request<unknown>("/auth/me");
  return parseUserProfileResponse(raw);
}

async function requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const headers = getHeaders();
  const mergedOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    }
  };
  const res = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
  if (!res.ok) await throwResponseError(res);
  return res.blob();
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAuditReport(auditId: string | number): Promise<void> {
  saveBlob(await requestBlob(`/report/${auditId}`), `audit-report-${auditId}.pdf`);
}

export async function downloadRemediatedPolicy(auditId: string | number, format: "pdf" | "docx" = "pdf"): Promise<void> {
  const ext = format === "docx" ? "docx" : "pdf";
  saveBlob(
    await requestBlob(`/audit/${auditId}/remediated-policy?format=${format}`),
    `remediated-policy-${auditId}.${ext}`,
  );
}

export async function getRemediatedPolicyText(auditId: string | number): Promise<string> {
  const res = await request<any>(`/audit/${auditId}/remediated-policy?format=text`);
  return res.text;
}

export async function downloadFilledPolicy(auditId: string | number, text: string, format: "pdf" | "docx" = "pdf"): Promise<void> {
  const ext = format === "docx" ? "docx" : "pdf";
  const blob = await requestBlob(`/audit/${auditId}/remediated-policy/fill`, {
    method: "POST",
    body: JSON.stringify({ text, format })
  });
  saveBlob(blob, `remediated-policy-edited-${auditId}.${ext}`);
}

export async function downloadComparisonReport(auditIdA: string | number, auditIdB: string | number): Promise<void> {
  saveBlob(
    await requestBlob(`/compare/${auditIdA}/${auditIdB}/report`),
    `audit-comparison-${auditIdA}-${auditIdB}.pdf`,
  );
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

// --- PAYMENTS ---

export async function createPaymentOrder(credits: number): Promise<any> {
  return request<any>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ credits }),
  });
}

export async function verifyPaymentSignature(
  razorpay_order_id: string, 
  razorpay_payment_id: string, 
  razorpay_signature: string
): Promise<any> {
  return request<any>("/payments/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });
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

export async function submitContactForm(data: { name: string; email: string; topic: string; message: string }): Promise<any> {
  return request<any>("/contact", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
