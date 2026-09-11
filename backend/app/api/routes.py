import os
import uuid
import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from ..services.parser import extract_text_from_url, extract_text_from_pdf, extract_text_from_docx
from ..services.compliance_engine import HybridComplianceEngine
from ..services.scoring import score_and_validate_audit
from ..services.report_generator import generate_report_pdf

# Initialize FastAPI
app = FastAPI(
    title="AuditWeave AI - Legal Compliance Engine",
    description="Zero-database compliance engine for India's DPDP Act 2023",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for session-based audits
AUDIT_STORE = {}
api_key = os.getenv("GEMINI_API_KEY", "")

class AuditRequest(BaseModel):
    company_name: str
    industry: str
    policy_url: Optional[str] = None
    policy_text: Optional[str] = None

# --- CORE AUDIT ENDPOINTS ---

@app.post("/api/audit")
async def audit_policy(request: AuditRequest):
    policy_text = ""
    policy_name = "Uploaded Text"
    
    if request.policy_url:
        try:
            policy_text = extract_text_from_url(request.policy_url)
            policy_name = request.policy_url
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif request.policy_text:
        policy_text = request.policy_text
    else:
        raise HTTPException(
            status_code=400,
            detail="Either a privacy policy URL or full-text must be provided."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=400,
            detail="The privacy policy text is too short to audit. Minimum 150 characters."
        )
        
    try:
        # Run compliance audit (RAG + deterministic keyword pre-scan)
        engine = HybridComplianceEngine()
        findings = engine.run_audit(policy_text)
        
        # Calculate scores and validate assertions
        audit_report = score_and_validate_audit(
            company_name=request.company_name,
            industry=request.industry,
            policy_name=policy_name,
            findings=findings
        )
        
        # Inject policy text for UI viewing
        audit_report["policy_text"] = policy_text
        
        # Save in-memory
        audit_id = str(uuid.uuid4().hex[:8])
        audit_report["id"] = audit_id
        AUDIT_STORE[audit_id] = audit_report
        
        return audit_report
    except Exception as e:
        logger_error = str(e)
        import logging
        logging.getLogger(__name__).error(f"Audit generation failed: {logger_error}")
        raise HTTPException(status_code=500, detail=f"Compliance Audit failed: {logger_error}")

@app.post("/api/audit/file")
async def audit_policy_file(
    company_name: str = Form(...),
    industry: str = Form(...),
    file: UploadFile = File(...)
):
    filename = file.filename.lower()
    file_bytes = await file.read()
    
    if filename.endswith(".pdf"):
        try:
            policy_text = extract_text_from_pdf(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif filename.endswith(".docx"):
        try:
            policy_text = extract_text_from_docx(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only PDF and DOCX files are supported."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=400,
            detail="Extracted text from file was too short to audit. Minimum 150 characters."
        )
        
    try:
        engine = HybridComplianceEngine()
        findings = engine.run_audit(policy_text)
        
        audit_report = score_and_validate_audit(
            company_name=company_name,
            industry=industry,
            policy_name=file.filename,
            findings=findings
        )
        
        audit_report["policy_text"] = policy_text
        
        # Save in-memory
        audit_id = str(uuid.uuid4().hex[:8])
        audit_report["id"] = audit_id
        AUDIT_STORE[audit_id] = audit_report
        
        return audit_report
    except Exception as e:
        logger_error = str(e)
        import logging
        logging.getLogger(__name__).error(f"Audit generation failed: {logger_error}")
        raise HTTPException(status_code=500, detail=f"Compliance Audit failed: {logger_error}")

@app.get("/api/audit/{audit_id}")
async def get_audit_detail(audit_id: str):
    if audit_id not in AUDIT_STORE:
        raise HTTPException(status_code=404, detail="Audit report not found.")
    return AUDIT_STORE[audit_id]

@app.get("/api/report/{audit_id}")
async def download_pdf_report(audit_id: str):
    if audit_id not in AUDIT_STORE:
        raise HTTPException(status_code=404, detail="Audit report not found.")
        
    audit_data = AUDIT_STORE[audit_id]
    
    # Validation assertion before PDF generation
    passed = audit_data["rules_passed_count"]
    failed = audit_data["rules_failed_count"]
    partial = audit_data.get("rules_partial_count", 0)
    
    if passed + failed + partial != 11:
        raise HTTPException(status_code=400, detail="Report validation failed: Audit findings count is inconsistent.")
        
    try:
        pdf_bytes = generate_report_pdf(audit_data)
        
        filename = f"DPDP_Audit_{audit_data['company_name'].replace(' ', '_')}_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

# --- FRONTEND COMPATIBILITY STUBS ---

@app.get("/api/dashboard")
async def get_dashboard_summary():
    return {
        "total_audits": len(AUDIT_STORE),
        "average_compliance_score": round(sum(a["compliance_score"] for a in AUDIT_STORE.values()) / len(AUDIT_STORE), 1) if AUDIT_STORE else 0.0,
        "risk_distribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0},
        "recent_audits": list(AUDIT_STORE.values())[:5],
        "executive_risk": {
            "overall_risk": "Moderate Risk",
            "highest_risk_area": "Children's Data Protection",
            "best_performing_area": "Grievance Redressal",
            "compliance_pct": 72.8,
            "critical_findings": 0,
            "immediate_priority": "No data persisted. Use auditor page."
        }
    }

@app.get("/api/benchmark")
async def get_benchmarks():
    return []

@app.get("/api/leaderboard")
async def get_leaderboard():
    return []

@app.get("/api/audit/history")
async def get_audit_history():
    return list(AUDIT_STORE.values())

class CopilotRequest(BaseModel):
    audit_id: str
    message: str

class RewriteRequest(BaseModel):
    finding_id: int
    clause_text: str

@app.post("/api/audit/copilot")
async def copilot_chat(request: CopilotRequest):
    audit_id = request.audit_id
    response_text = (
        f"Based on the audit of your privacy policy under India's DPDP Act 2023, "
        f"here is GRC guidance on your query. If you're asking about resolving a specific gap, "
        f"ensure that you implement explicit notice templates (Section 5) and separate opt-in consent controls (Section 6). "
        f"For Children's Data (Section 9), avoid behavioral tracking or targeted ads for minors."
    )
    
    if api_key:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            audit_ctx = ""
            if audit_id in AUDIT_STORE:
                audit_ctx = f"Audit Context: Company: {AUDIT_STORE[audit_id]['company_name']}, Score: {AUDIT_STORE[audit_id]['compliance_score']}/100\n"
            
            prompt = (
                f"You are a GRC legal compliance copilot for the India DPDP Act 2023.\n"
                f"{audit_ctx}"
                f"User asks: {request.message}\n"
                f"Provide a brief, professional answer helping them understand or fix their compliance issues."
            )
            res = model.generate_content(prompt)
            response_text = res.text.strip()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Copilot Gemini call failed: {e}")
            
    return {
        "response": response_text,
        "suggested_actions": ["How to fix Section 9?", "Show Grievance SLA requirements", "What are the penalties?"]
    }

@app.post("/api/audit/rewrite")
async def rewrite_clause_route(request: RewriteRequest):
    orig_text = request.clause_text
    rewritten_text = (
        f"We process your personal data only on the basis of your explicit, specific, granular, and informed opt-in consent. "
        f"You have the right to withdraw your consent at any time as easily as it was granted by contacting our Grievance Officer."
    )
    
    if api_key:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                f"You are a legal redrafting assistant under India's DPDP Act 2023.\n"
                f"Rewrite the following non-compliant clause to be fully compliant with DPDP rules (e.g. granular consent, clear notice, or explicit rights):\n"
                f"'{orig_text}'\n"
                f"Provide ONLY the rewritten text, keeping it professional and legally compliant."
            )
            res = model.generate_content(prompt)
            rewritten_text = res.text.strip()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Clause rewrite Gemini call failed: {e}")
            
    return {
        "finding_id": request.finding_id,
        "original_text": orig_text,
        "rewritten_text": rewritten_text,
        "disclaimer": "AI-generated compliance draft only. This draft does not constitute formal legal advice. Please verify with a qualified attorney before publishing."
    }
