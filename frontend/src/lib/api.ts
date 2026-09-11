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

// Client-side High-Fidelity Mock Generator Fallback
function handleClientSideMockFallback<T>(endpoint: string, options: RequestInit): T {
  const method = options.method || "GET";
  
  if (endpoint.includes("/auth/login")) {
    const body = JSON.parse(options.body as string);
    return {
      access_token: "mock_jwt_token_for_preview",
      token_type: "bearer",
      role: body.email === "admin@AuditWeave.ai" ? "admin" : "user",
      email: body.email
    } as unknown as T;
  }
  
  if (endpoint.includes("/auth/register")) {
    const body = JSON.parse(options.body as string);
    return {
      id: 999,
      email: body.email,
      role: "user",
      created_at: new Date().toISOString()
    } as unknown as T;
  }
  
  if (endpoint.includes("/dashboard")) {
    return {
      total_audits: 4,
      average_compliance_score: 72.8,
      risk_distribution: { Critical: 1, High: 2, Medium: 3, Low: 4, Informational: 2 },
      recent_audits: [
        { id: 1, company_name: "PhonePe", industry: "FinTech", score: 82.0, status: "Good", created_at: new Date().toISOString() },
        { id: 2, company_name: "Paytm", industry: "FinTech", score: 79.4, status: "Good", created_at: new Date().toISOString() },
        { id: 3, company_name: "Flipkart", industry: "E-commerce", score: 68.5, status: "Moderate Risk", created_at: new Date().toISOString() },
        { id: 4, company_name: "Zepto", industry: "E-commerce", score: 61.2, status: "Moderate Risk", created_at: new Date().toISOString() }
      ],
      executive_risk: {
        overall_risk: "Moderate Risk",
        highest_risk_area: "Children's Data Protection",
        best_performing_area: "Grievance Redressal",
        compliance_pct: 72.8,
        critical_findings: 3,
        immediate_priority: "Establish verifiable parental consent controls and remove target ads flags for minor users."
      }
    } as unknown as T;
  }
  
  if (endpoint.includes("/benchmark")) {
    return [
      { id: 1, industry: "SaaS", average_compliance_score: 74.8, average_risk_score: 25.2, companies_count: 18, updated_at: new Date().toISOString() },
      { id: 2, industry: "FinTech", average_compliance_score: 71.2, average_risk_score: 28.8, companies_count: 21, updated_at: new Date().toISOString() },
      { id: 3, industry: "EdTech", average_compliance_score: 65.4, average_risk_score: 34.6, companies_count: 11, updated_at: new Date().toISOString() },
      { id: 4, industry: "E-commerce", average_compliance_score: 62.5, average_risk_score: 37.5, companies_count: 14, updated_at: new Date().toISOString() },
      { id: 5, industry: "Healthcare", average_compliance_score: 58.0, average_risk_score: 42.0, companies_count: 8, updated_at: new Date().toISOString() }
    ] as unknown as T;
  }
  
  if (endpoint.includes("/leaderboard")) {
    return [
      { rank: 1, company_name: "PhonePe", score: 82.0, industry: "FinTech", last_audited: new Date().toISOString() },
      { rank: 2, company_name: "Paytm", score: 79.4, industry: "FinTech", last_audited: new Date().toISOString() },
      { rank: 3, company_name: "Urban Company", score: 76.5, industry: "SaaS", last_audited: new Date().toISOString() },
      { rank: 4, company_name: "Zomato", score: 71.8, industry: "E-commerce", last_audited: new Date().toISOString() },
      { rank: 5, company_name: "Swiggy", score: 70.5, industry: "E-commerce", last_audited: new Date().toISOString() }
    ] as unknown as T;
  }
  
  if (endpoint.includes("/compare")) {
    return {
      company_a: { name: "PhonePe", score: 82.0, status: "Good", findings_count: 4, primary_gaps: ["Data Retention Period"] },
      company_b: { name: "Paytm", score: 79.4, status: "Good", findings_count: 5, primary_gaps: ["Cross-Border disclosures", "Notice Details"] },
      winner: "PhonePe",
      gap_analysis: "PhonePe scores 82/100 compared to Paytm's 79.4/100. PhonePe is stronger in Notice compliance, while Paytm exhibits minor gaps in cross-border disclosures."
    } as unknown as T;
  }
  
  if (endpoint.includes("/kb")) {
    return {
      section_5: {
        title: "Section 5 - Notice",
        explanation: "Before or at the time of seeking consent, data fiduciaries must present a clear notice in plain language. The notice must specify the personal data collected, its purpose, and Data Principal rights.",
        penalties: "Up to ₹150 Crore for failing to present appropriate notice.",
        best_practice: "Use a tabular layout listing each permission requested paired with a corresponding purpose."
      },
      section_6: {
        title: "Section 6 - Consent",
        explanation: "Consent must be free, specific, informed, unconditional, unambiguous, granular, and withdrawable.",
        penalties: "Up to ₹50 Crore for failing to provide granular consent mechanisms.",
        best_practice: "Implement explicit opt-in checkboxes on signup sheets instead of implicit consent."
      },
      section_9: {
        title: "Section 9 - Children's Data Protection",
        explanation: "Fiduciaries must obtain verifiable parental consent and are prohibited from tracking, behavioral monitoring, or targeted advertising directed at children.",
        penalties: "Up to ₹200 Crore for breaching children's data obligations.",
        best_practice: "Implement age gates and flag minor accounts to exclude from tracking pixels."
      }
    } as unknown as T;
  }

  if (endpoint.includes("/audit/copilot")) {
    return {
      response: "Hello! I am your AuditWeave AI Compliance Copilot. Based on this audit, the company's highest risk area is Children's Data Protection, due to a missing age-verification control. Under Section 9, fiduciaries must establish verifiable consent and block tracking. You can fix this finding by implementing front-end age gating and adding a clear child restriction clause.",
      suggested_actions: ["Explain Section 9 Penalties", "Draft a child restriction clause", "View technical steps for age gating"]
    } as unknown as T;
  }

  if (endpoint.includes("/audit/rewrite")) {
    return {
      finding_id: 123,
      original_text: "By continuing to use our services you consent to our privacy policy.",
      rewritten_text: "We process your personal data only on the basis of your explicit, specific, granular, and informed opt-in consent. You have the right to withdraw your consent at any time as easily as it was granted by accessing your account settings.",
      disclaimer: "AI-generated compliance draft only. This draft does not constitute formal legal advice. Please verify with a qualified attorney before publishing."
    } as unknown as T;
  }
  
  if (endpoint.includes("/research")) {
    return {
      report_title: "India DPDP Compliance Research Report 2026",
      audit_count: 5,
      average_market_score: 71.3,
      winner: "PhonePe",
      industry_breakdown: [
        { company_name: "Flipkart", industry: "E-commerce", compliance_score: 68.5, risk_score: 31.5, passed_rules: 6, failed_rules: 3, critical_gaps: ["Children's Data", "Granular Consent"] },
        { company_name: "PhonePe", industry: "FinTech", compliance_score: 82.0, risk_score: 18.0, passed_rules: 8, failed_rules: 1, critical_gaps: ["Data Retention Period"] },
        { company_name: "Zepto", industry: "E-commerce", compliance_score: 64.0, risk_score: 36.0, passed_rules: 6, failed_rules: 3, critical_gaps: ["Grievance Redressal Details"] },
        { company_name: "Swiggy", industry: "E-commerce", compliance_score: 70.5, risk_score: 29.5, passed_rules: 7, failed_rules: 2, critical_gaps: ["Granular marketing consent"] },
        { company_name: "Paytm", industry: "FinTech", compliance_score: 79.4, risk_score: 20.6, passed_rules: 7, failed_rules: 2, critical_gaps: ["Cross-Border disclosures"] }
      ]
    } as unknown as T;
  }

  // Fallback for single audit details
  if (endpoint.startsWith("/audit/")) {
    const id = parseInt(endpoint.split("/")[2]) || 1;
    return generateMockAuditDetails(id) as unknown as T;
  }

  // Default empty fallback
  return {} as T;
}

// Generate static single audit details for offline frontend mockup
function generateMockAuditDetails(id: number) {
  const companies = ["PhonePe", "Paytm", "Flipkart", "Zepto"];
  const name = companies[(id - 1) % companies.length];
  const industry = name === "PhonePe" || name === "Paytm" ? "FinTech" : "E-commerce";
  const score = name === "PhonePe" ? 82.0 : (name === "Paytm" ? 79.4 : (name === "Flipkart" ? 68.5 : 61.2));
  
  return {
    id: id,
    policy_id: 100 + id,
    compliance_score: score,
    risk_score: roundVal(100.0 - score),
    status: score >= 80 ? "Excellent" : (score >= 70 ? "Good" : "Moderate Risk"),
    overall_summary: `AuditWeave AI completed a comprehensive GRC compliance audit for ${name}. The privacy policy was parsed against India's DPDP Act 2023. Gaps in Consent granularity and Grievance Officer contacts require immediate remediation.`,
    ai_confidence_score: 0.96,
    rules_passed_count: score >= 80 ? 8 : (score >= 70 ? 7 : 6),
    rules_failed_count: score >= 80 ? 1 : (score >= 70 ? 2 : 3),
    ai_observations_count: 3,
    framework: "DPDP_2023",
    created_at: new Date().toISOString(),
    company_name: name,
    company_domain: `${name.toLowerCase().replace(" ", "")}.com`,
    company_industry: industry,
    policy_text: `PRIVACY NOTICE\n\nWelcome to ${name}. We respect your privacy and process personal data in accordance with the law. By using our website or continuing to access our platform, you agree to our terms and consent to our collection of tracking information, device identity, location, and contact information. We use this data to provide our services, target advertisements, and send promotional newsletters. We store this data indefinitely to improve user experiences.\n\nFor grievances or issues, you can reach out to our generic contact support team at support@${name.toLowerCase()}.com.\n\nWe may transfer personal data internationally to various countries including USA and Singapore.`,
    findings: [
      {
        id: 1,
        audit_id: id,
        pillar: "Consent",
        issue: "Bundled & Implied Consent",
        severity: "High",
        confidence_score: 0.94,
        dpdp_section: "Section 6(1)",
        evidence_extract: "By using our website or continuing to access our platform, you agree to our terms and consent to our collection",
        reason: "The policy bundles consent with generic terms of service acceptance, whereas Section 6 requires consent to be explicit, granular, and opt-in.",
        business_impact: "Damages user trust and prevents compliance clearance in corporate GRC procurement.",
        legal_impact: "Direct breach of Section 6(1) regarding specific and granular consent. Penalty cap up to ₹50 Crore.",
        legal_rec: "De-couple consent from terms of service. Create an active opt-in checkbox during registration.",
        tech_rec: "Implement dynamic front-end consent flags in user profiles.",
        business_rec: "Establish clear internal audits on digital consent triggers.",
        evidence_start_index: 97,
        evidence_end_index: 205
      },
      {
        id: 2,
        audit_id: id,
        pillar: "Children's Data",
        issue: "Missing age verification & parental consent controls",
        severity: "Critical",
        confidence_score: 0.97,
        dpdp_section: "Section 9(1)",
        evidence_extract: null,
        reason: "No references to minor age gating, parental approval, or restrictions on tracking child profiles.",
        business_impact: "Exposes the brand to severe public backlash and GRC non-compliance rankings.",
        legal_impact: "Breach of Section 9 child processing rules. DPDP Act statutory penalty cap up to ₹200 Crore.",
        legal_rec: "Formulate a kids data section restricting use of services to above 18 without guardian consent.",
        tech_rec: "Develop front-end age gates and turn off advertisement SDK scripts for minor account flags.",
        business_rec: "Adopt privacy-by-design marketing campaigns.",
        evidence_start_index: -1,
        evidence_end_index: -1
      },
      {
        id: 3,
        audit_id: id,
        pillar: "Grievance Redressal",
        issue: "Missing Grievance Officer Designation",
        severity: "High",
        confidence_score: 0.98,
        dpdp_section: "Section 13",
        evidence_extract: "you can reach out to our generic contact support team at support@company.com",
        reason: "The policy points to a generic support mailbox rather than naming a designated Grievance Redressal Officer.",
        business_impact: "Increases support ticket backlogs and blocks fast escalation channels.",
        legal_impact: "Breach of Section 13 contact publication requirements. Penalty cap up to ₹10 Crore.",
        legal_rec: "Explicitly name and detail the Grievance Officer contact details in the footer.",
        tech_rec: "Configure a separate, monitored support mailbox (e.g. grievance@company.com).",
        business_rec: "Train the customer service team on statutory complaint escalation SLAs.",
        evidence_start_index: 432,
        evidence_end_index: 512
      }
    ]
  };
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
  return [];
}

export async function getLeaderboard(): Promise<any[]> {
  return [];
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
  return { gap_analysis: "Comparison disabled in this version.", winner: "N/A" };
}

export async function searchKnowledgeBase(query?: string): Promise<any> {
  return {};
}

export async function runResearchReport(companies: string[]): Promise<any> {
  return { report_title: "Offline Report", industry_breakdown: [] };
}
