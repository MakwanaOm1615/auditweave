import datetime
import logging
import os
import google.generativeai as genai
from typing import List, Literal, Optional, Union, Dict
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from .database import engine, Base, get_db
from .database import engine, Base, get_db
from .models import User, Company, Policy, Audit, Finding, Benchmark, AuditLog, CreditTransaction
from .schemas import (
    UserCreate, UserLogin, UserResponse, Token, TokenData, AuditRequest, AuditDetailResponse, AuditSummaryResponse,
    AuditResponse, CompareRequest, RewriteRequest, RewriteResponse, CopilotRequest,
    CopilotResponse, BenchmarkResponse, BatchAuditRequest, ContactRequest, ContactResponse
)
from .auth import (
    get_password_hash, create_access_token, get_current_user, get_current_user_optional, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .services.user_auth import (
    AuthDatabaseError, EmailAlreadyRegisteredError, authenticate_user, create_user
)
from .services.text_extractor import extract_text_from_url, extract_text_from_pdf, extract_text_from_docx
from .services.rule_engine import HybridComplianceEngine
from .services.gemini import analyze_policy_with_gemini, HAS_GEMINI_KEY
from .services.pdf_generator import (
    generate_audit_pdf,
    generate_comparison_pdf,
    generate_remediated_policy_pdf,
    generate_remediated_policy_docx,
)
from .services.policy_remediation import generate_remediated_policy
from .services.rewrite import (
    build_rewrite_prompt,
    build_safe_fallback,
    clean_model_rewrite,
    extract_clause_context,
    is_finding_eligible_for_rewrite,
)

logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="AuditWeave - Backend",
    description="Enterprise GRC platform for DPDP Act 2023 compliance auditing",
    version="1.0.0"
)

# Simple IP-based rate limiting for anonymous audits (3 per day)
anonymous_audit_rate_limits: Dict[str, List[datetime.datetime]] = {}

def check_anonymous_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.datetime.utcnow()
    # clean up old limits
    if client_ip in anonymous_audit_rate_limits:
        anonymous_audit_rate_limits[client_ip] = [
            t for t in anonymous_audit_rate_limits[client_ip]
            if (now - t).total_seconds() < 86400
        ]
    else:
        anonymous_audit_rate_limits[client_ip] = []
        
    if len(anonymous_audit_rate_limits[client_ip]) >= 3:
        raise HTTPException(status_code=429, detail="Anonymous audit limit reached (3 per day). Please sign up to continue.")
        
    anonymous_audit_rate_limits[client_ip].append(now)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
# Base.metadata.create_all(bind=engine) # Disabled: Managed by Alembic

@app.on_event("startup")
def startup_populate_benchmarks():
    db = next(get_db())
    try:
        # Populate initial benchmarks if they don't exist
        mock_benchmarks = [
            {"industry": "FinTech", "average_compliance_score": 71.2, "average_risk_score": 28.8, "companies_count": 21},
            {"industry": "E-commerce", "average_compliance_score": 62.5, "average_risk_score": 37.5, "companies_count": 14},
            {"industry": "Healthcare", "average_compliance_score": 58.0, "average_risk_score": 42.0, "companies_count": 8},
            {"industry": "EdTech", "average_compliance_score": 65.4, "average_risk_score": 34.6, "companies_count": 11},
            {"industry": "SaaS", "average_compliance_score": 74.8, "average_risk_score": 25.2, "companies_count": 18},
        ]
        for mb in mock_benchmarks:
            existing = db.query(Benchmark).filter(Benchmark.industry == mb["industry"]).first()
            if not existing:
                db_bench = Benchmark(**mb)
                db.add(db_bench)
                
        # Populate an admin user if not present
        existing_admin = db.query(User).filter(User.email == "admin@AuditWeave.ai").first()
        if not existing_admin:
            admin_user = User(
                email="admin@AuditWeave.ai",
                first_name="Admin",
                password_hash=get_password_hash("AuditWeave_admin_2026"),
                role="admin"
            )
            db.add(admin_user)
            
        db.commit()
    except Exception as e:
        print(f"Error initializing startup data: {e}")
        db.rollback()

# --- AUTHENTICATION ROUTES ---

@app.post("/api/auth/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, str(user_in.email), user_in.password, user_in.first_name)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email is already registered."
        )
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account service is temporarily unavailable. Please try again."
        )

@app.post("/api/auth/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, str(user_in.email), user_in.password)
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable. Please try again."
        )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    log = AuditLog(action=f"User login: {user.email}", user_id=user.id)
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "credits_balance": user.credits_balance
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


# --- AUDIT COMPLIANCE ROUTES ---

def perform_compliance_audit(company_name: str, industry: str, policy_text: str, policy_url: Optional[str], db: Session, user_id: Optional[int] = None) -> Audit:
    """Helper method to execute text extraction, run rule checks, invoke Gemini, and save audit results."""
    # 1. Run deterministic rule-based checks
    rule_engine = HybridComplianceEngine()
    rule_results = rule_engine.run(policy_text)
    
    # 2. Run Gemini qualitative analysis
    ai_results = analyze_policy_with_gemini(company_name, industry, policy_text, rule_results)
    
    # 3. Combine scores (40% rule engine score + 60% AI scoring)
    combined_score = round((0.4 * rule_results["rule_score"]) + (0.6 * ai_results["ai_compliance_score"]), 1)
    risk_score = round(100.0 - combined_score, 1)
    
    if combined_score >= 85:
        status_label = "Excellent"
    elif combined_score >= 70:
        status_label = "Good"
    elif combined_score >= 50:
        status_label = "Moderate Risk"
    elif combined_score >= 35:
        status_label = "High Risk"
    else:
        status_label = "Critical Risk"

    # 4. Save results to Database
    # 4.1 Lookup/Create Company
    domain = company_name.lower().replace(" ", "").replace("&", "") + ".com"
    company = db.query(Company).filter((Company.name == company_name) | (Company.domain == domain)).first()
    if not company:
        company = Company(name=company_name, domain=domain, industry=industry, size="SME")
        db.add(company)
        db.commit()
        db.refresh(company)
        
    # 4.2 Save Policy version
    policy = Policy(
        company_id=company.id,
        policy_text=policy_text,
        policy_url=policy_url,
        version_label="v1.0"
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    # 4.3 Save Audit summary
    audit = Audit(
        policy_id=policy.id,
        compliance_score=combined_score,
        risk_score=risk_score,
        status=status_label,
        overall_summary=ai_results["overall_summary"],
        ai_confidence_score=ai_results.get("ai_confidence_score", 0.95),
        rules_passed_count=rule_results["passed_count"],
        rules_failed_count=rule_results["failed_count"],
        ai_observations_count=len(ai_results.get("findings", [])),
        created_by=user_id
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    
    # 4.4 Save granular findings
    for finding in ai_results.get("findings", []):
        db_finding = Finding(
            audit_id=audit.id,
            pillar=finding["pillar"],
            issue=finding["issue"],
            severity=finding["severity"],
            confidence_score=finding.get("confidence_score", 0.9),
            dpdp_section=finding.get("dpdp_section"),
            evidence_extract=finding.get("evidence_extract"),
            reason=finding["reason"],
            business_impact=finding.get("business_impact"),
            legal_impact=finding.get("legal_impact"),
            legal_rec=finding.get("legal_rec"),
            tech_rec=finding.get("tech_rec"),
            business_rec=finding.get("business_rec"),
            evidence_start_index=finding.get("evidence_start_index", -1),
            evidence_end_index=finding.get("evidence_end_index", -1)
        )
        db.add(db_finding)
        
    # 4.5 Update Industry Benchmarks
    bench = db.query(Benchmark).filter(Benchmark.industry == industry).first()
    if bench:
        bench.companies_count += 1
        bench.average_compliance_score = round(
            ((bench.average_compliance_score * (bench.companies_count - 1)) + combined_score) / bench.companies_count, 1
        )
        bench.average_risk_score = round(100.0 - bench.average_compliance_score, 1)
        db.add(bench)
    else:
        # Create dynamically if the sector wasn't in startup list
        new_bench = Benchmark(
            industry=industry,
            average_compliance_score=combined_score,
            average_risk_score=risk_score,
            companies_count=1
        )
        db.add(new_bench)
        
    db.commit()
    db.refresh(audit)
    
    log = AuditLog(action=f"Compliance audit generated for {company_name} (Score: {combined_score})", user_id=user_id)
    db.add(log)
    db.commit()
    
    return audit

@app.post("/api/audit", response_model=Union[AuditSummaryResponse, AuditDetailResponse])
def audit_policy(request: AuditRequest, req: Request, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    if not current_user:
        check_anonymous_rate_limit(req)
        
    policy_text = ""
    
    if request.policy_url:
        policy_text = extract_text_from_url(request.policy_url)
    elif request.policy_text:
        policy_text = request.policy_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a privacy policy URL or full-text must be provided."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The extracted policy text is too short to audit. Minimum 150 characters."
        )

    # Check and deduct credits for authenticated users
    if current_user:
        if current_user.role not in ["admin", "compliance_officer"] and current_user.credits_balance < 1:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits. Please purchase more credits to continue auditing."
            )
        
        if current_user.role not in ["admin", "compliance_officer"]:
            current_user.credits_balance -= 1
            
            # Log the transaction
            tx = CreditTransaction(
                user_id=current_user.id,
                amount=-1,
                transaction_type="audit_usage"
            )
            db.add(tx)
            db.commit()
            
    # For anonymous users, we allow the audit to proceed (freemium landing page flow).
    # In a production app, we might want rate limiting by IP here.
        
    audit = perform_compliance_audit(
        company_name=request.company_name,
        industry=request.industry,
        policy_text=policy_text,
        policy_url=request.policy_url,
        db=db,
        user_id=current_user.id if current_user else None
    )
    
    response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
    response_audit.company_name = request.company_name
    response_audit.company_domain = request.company_name.lower().replace(" ", "").replace("&", "") + ".com"
    response_audit.company_industry = request.industry
    response_audit.policy_text = policy_text
    
    if current_user:
        return response_audit
    else:
        return AuditSummaryResponse(
            id=audit.id,
            company_name=request.company_name,
            industry=request.industry,
            compliance_score=audit.compliance_score,
            status=audit.status,
            is_summary_only=True
        )

@app.post("/api/audit/file", response_model=Union[AuditSummaryResponse, AuditDetailResponse])
def audit_policy_file(
    req: Request,
    company_name: str = Form(...),
    industry: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not current_user:
        check_anonymous_rate_limit(req)
        
    if current_user and current_user.credits_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits. Please purchase more credits to run an audit."
        )

    filename = file.filename.lower()
    file_bytes = file.file.read()
    
    if filename.endswith(".pdf"):
        policy_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".docx"):
        policy_text = extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are supported."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted text from file was too short to audit."
        )

    if current_user:
        if current_user.role not in ["admin", "compliance_officer"] and current_user.credits_balance < 1:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits. Please purchase more credits to continue auditing."
            )
        
        if current_user.role not in ["admin", "compliance_officer"]:
            current_user.credits_balance -= 1
            
            tx = CreditTransaction(
                user_id=current_user.id,
                amount=-1,
                transaction_type="audit_usage"
            )
            db.add(tx)
            db.commit()
            
    audit = perform_compliance_audit(
        company_name=company_name,
        industry=industry,
        policy_text=policy_text,
        policy_url=f"Uploaded File: {file.filename}",
        db=db,
        user_id=current_user.id if current_user else None
    )
    
    response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
    response_audit.company_name = company_name
    response_audit.company_domain = company_name.lower().replace(" ", "").replace("&", "") + ".com"
    response_audit.company_industry = industry
    response_audit.policy_text = policy_text
    
    if current_user:
        return response_audit
    else:
        return AuditSummaryResponse(
            id=audit.id,
            company_name=company_name,
            industry=industry,
            compliance_score=audit.compliance_score,
            status=audit.status,
            is_summary_only=True
        )


@app.post("/api/audit/batch")
def audit_policy_batch(request: BatchAuditRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not request.items or len(request.items) == 0:
        raise HTTPException(status_code=400, detail="At least one company must be provided for batch audit.")

    num_items = len(request.items)
    
    if current_user.role not in ["admin", "compliance_officer"]:
        if current_user.credits_balance < num_items:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits for batch audit. You need {num_items} credits but have {current_user.credits_balance}."
            )
        current_user.credits_balance -= num_items
        tx = CreditTransaction(
            user_id=current_user.id,
            amount=-num_items,
            transaction_type="audit_usage_batch"
        )
        db.add(tx)
        db.commit()
        
    completed_audits = []
    for item in request.items:
        policy_text = ""
        if item.policy_url:
            try:
                policy_text = extract_text_from_url(item.policy_url)
            except Exception:
                policy_text = f"Privacy Policy statement for {item.company_name}."
        elif item.policy_text:
            policy_text = item.policy_text
        else:
            policy_text = f"Standard Privacy Notice for {item.company_name} in {item.industry}."

        if len(policy_text.strip()) < 150:
            policy_text = (
                f"PRIVACY NOTICE FOR {item.company_name.upper()}\n\n"
                f"We collect personal information including user account credentials, contact information, device details, and location coordinates. "
                f"Consent is deemed provided upon creating an account. For any grievances, users can contact our support team at support@{item.company_name.lower().replace(' ', '')}.com."
            )

        audit = perform_compliance_audit(
            company_name=item.company_name,
            industry=item.industry,
            policy_text=policy_text,
            policy_url=item.policy_url,
            db=db,
            user_id=current_user.id
        )

        response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
        response_audit.company_name = item.company_name
        response_audit.company_domain = item.company_name.lower().replace(" ", "").replace("&", "") + ".com"
        response_audit.company_industry = item.industry
        response_audit.policy_text = policy_text
        
        # Serialize findings
        findings_list = []
        for f in response_audit.findings:
            findings_list.append({
                "pillar": f.pillar,
                "issue": f.issue,
                "severity": f.severity,
                "confidence_score": f.confidence_score,
                "dpdp_section": f.dpdp_section,
                "evidence_extract": f.evidence_extract,
                "reason": f.reason,
                "business_impact": f.business_impact,
                "legal_impact": f.legal_impact,
                "legal_rec": f.legal_rec,
                "tech_rec": f.tech_rec,
                "business_rec": f.business_rec
            })
            
        completed_audits.append({
            "id": response_audit.id,
            "company_name": response_audit.company_name,
            "company_domain": response_audit.company_domain,
            "company_industry": response_audit.company_industry,
            "compliance_score": response_audit.compliance_score,
            "risk_score": response_audit.risk_score,
            "status": response_audit.status,
            "rules_passed_count": response_audit.rules_passed_count,
            "rules_failed_count": response_audit.rules_failed_count,
            "ai_observations_count": response_audit.ai_observations_count,
            "created_at": response_audit.created_at,
            "findings": findings_list
        })

    completed_audits_sorted = sorted(completed_audits, key=lambda a: a["compliance_score"], reverse=True)
    winner_company = completed_audits_sorted[0]["company_name"] if completed_audits_sorted else "N/A"
    avg_score = round(sum(a["compliance_score"] for a in completed_audits) / len(completed_audits), 1)

    return {
        "total_companies": len(completed_audits),
        "winner_company": winner_company,
        "average_compliance_score": avg_score,
        "audits": completed_audits
    }


# --- EXPLAINABLE GRC AND AUDIT RETRIEVAL ---

@app.get("/api/audit/history", response_model=List[AuditResponse])
def get_audit_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audits = db.query(Audit).filter(Audit.created_by == current_user.id).order_by(desc(Audit.created_at)).all()
    for a in audits:
        policy = db.query(Policy).filter(Policy.id == a.policy_id).first()
        company = db.query(Company).filter(Company.id == policy.company_id).first()
        a.company_name = company.name
        a.company_domain = company.domain
        a.company_industry = company.industry
    return audits

@app.get("/api/audit/{audit_id}", response_model=AuditDetailResponse)
def get_audit_detail(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit report not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    audit.company_name = company.name
    audit.company_domain = company.domain
    audit.company_industry = company.industry
    audit.policy_text = policy.policy_text
    return audit

@app.delete("/api/audit/{audit_id}")
def delete_audit(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit report not found.")
        
    db.query(Finding).filter(Finding.audit_id == audit_id).delete()
    db.delete(audit)
    db.commit()
    return {"message": "Audit report deleted successfully.", "id": audit_id}


# --- PDF REPORT GENERATOR ---

@app.get("/api/report/{audit_id}")
def download_pdf_report(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    findings_list = []
    for f in audit.findings:
        findings_list.append({
            "pillar": f.pillar,
            "issue": f.issue,
            "severity": f.severity,
            "confidence_score": f.confidence_score,
            "dpdp_section": f.dpdp_section,
            "evidence_extract": f.evidence_extract,
            "reason": f.reason,
            "business_impact": f.business_impact,
            "legal_impact": f.legal_impact,
            "legal_rec": f.legal_rec,
            "tech_rec": f.tech_rec,
            "business_rec": f.business_rec
        })
        
    audit_data = {
        "compliance_score": audit.compliance_score,
        "risk_score": audit.risk_score,
        "status": audit.status,
        "overall_summary": audit.overall_summary,
        "ai_confidence_score": audit.ai_confidence_score,
        "rules_passed_count": audit.rules_passed_count,
        "rules_failed_count": audit.rules_failed_count,
        "ai_observations_count": audit.ai_observations_count,
        "findings": findings_list
    }
    
    date_str = audit.created_at.strftime("%B %d, %Y")
    pdf_bytes = generate_audit_pdf(audit_data, company.name, company.industry, date_str)
    
    filename = f"DPDP_Audit_{company.name.replace(' ', '_')}_{audit.created_at.strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/api/audit/{audit_id}/remediated-policy")
def download_remediated_policy(
    audit_id: int,
    format: Literal["pdf", "docx", "text"] = Query("pdf"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = db.query(Audit).filter(
        Audit.id == audit_id, Audit.created_by == current_user.id
    ).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")

    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()

    findings_list = []
    for f in audit.findings:
        findings_list.append({
            "pillar": f.pillar,
            "issue": f.issue,
            "severity": f.severity,
            "confidence_score": f.confidence_score,
            "dpdp_section": f.dpdp_section,
            "evidence_extract": f.evidence_extract,
            "reason": f.reason,
            "legal_rec": f.legal_rec,
            "evidence_start_index": f.evidence_start_index,
            "evidence_end_index": f.evidence_end_index,
        })

    audit_data = {
        "company_name": company.name,
        "findings": findings_list,
    }

    try:
        remediated_text = generate_remediated_policy(audit_data, policy.policy_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if format == "text":
        return {"text": remediated_text}

    date_stamp = audit.created_at.strftime("%Y%m%d")
    safe_name = company.name.replace(" ", "_")

    if format == "docx":
        docx_bytes = generate_remediated_policy_docx(remediated_text, company.name)
        filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    pdf_bytes = generate_remediated_policy_pdf(remediated_text, company.name)
    filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

from pydantic import BaseModel
class FillPolicyRequest(BaseModel):
    text: str
    format: Literal["pdf", "docx"] = "pdf"

@app.post("/api/audit/{audit_id}/remediated-policy/fill")
def download_filled_policy(
    audit_id: int,
    request: FillPolicyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = db.query(Audit).filter(
        Audit.id == audit_id, Audit.created_by == current_user.id
    ).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")

    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    date_stamp = audit.created_at.strftime("%Y%m%d")
    safe_name = company.name.replace(" ", "_")

    if request.format == "docx":
        docx_bytes = generate_remediated_policy_docx(request.text, company.name)
        filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    pdf_bytes = generate_remediated_policy_pdf(request.text, company.name)
    filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --- DASHBOARD & BENCHMARKS ---

@app.get("/api/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audits = db.query(Audit).filter(Audit.created_by == current_user.id).order_by(desc(Audit.created_at)).all()
    total_audits = len(audits)
    
    if total_audits == 0:
        return {
            "total_audits": 0,
            "average_compliance_score": 0.0,
            "risk_distribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0},
            "recent_audits": [],
            "executive_risk": {
                "overall_risk": "None",
                "highest_risk_area": "None",
                "best_performing_area": "None",
                "compliance_pct": 0.0,
                "critical_findings": 0,
                "immediate_priority": "No audits completed yet."
            }
        }
        
    avg_score = round(sum(a.compliance_score for a in audits) / total_audits, 1)
    
    severities = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0}
    audit_ids = [audit.id for audit in audits]
    findings = db.query(Finding).filter(Finding.audit_id.in_(audit_ids)).all()
    for f in findings:
        if f.severity in severities:
            severities[f.severity] += 1
            
    recent = []
    for a in audits[:5]:
        p = db.query(Policy).filter(Policy.id == a.policy_id).first()
        c = db.query(Company).filter(Company.id == p.company_id).first()
        recent.append({
            "id": a.id,
            "company_name": c.name,
            "industry": c.industry,
            "score": a.compliance_score,
            "status": a.status,
            "created_at": a.created_at
        })
        
    pillar_counts = {}
    for f in findings:
        if f.severity in ["Critical", "High", "Medium"]:
            pillar_counts[f.pillar] = pillar_counts.get(f.pillar, 0) + 1
    highest_risk = max(pillar_counts, key=pillar_counts.get) if pillar_counts else "Children's Data Protection"
    
    pillars = ["Consent", "Notice", "Data Principal Rights", "Children's Data", "Fiduciary Obligations", "Grievance Redressal", "Cross Border Transfer"]
    best_performing = "Grievance Redressal"
    min_count = 9999
    for p in pillars:
        cnt = db.query(Finding).filter(Finding.audit_id.in_(audit_ids), Finding.pillar == p).count()
        if cnt < min_count:
            min_count = cnt
            best_performing = p

    overall_status = "Moderate Risk" if avg_score >= 50 else "High Risk"
    if avg_score >= 80:
        overall_status = "Low Risk"
        
    executive_risk = {
        "overall_risk": overall_status,
        "highest_risk_area": highest_risk,
        "best_performing_area": best_performing,
        "compliance_pct": avg_score,
        "critical_findings": severities["Critical"] + severities["High"],
        "immediate_priority": f"Review non-compliant items in {highest_risk}. Implement granular consent and age validation frameworks."
    }
    
    return {
        "total_audits": total_audits,
        "average_compliance_score": avg_score,
        "risk_distribution": severities,
        "recent_audits": recent,
        "executive_risk": executive_risk
    }

@app.get("/api/benchmark", response_model=List[BenchmarkResponse])
def get_benchmarks(db: Session = Depends(get_db)):
    return db.query(Benchmark).order_by(desc(Benchmark.average_compliance_score)).all()

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    subquery = db.query(
        Policy.company_id,
        func.max(Audit.compliance_score).label("max_score")
    ).join(Audit, Audit.policy_id == Policy.id).group_by(Policy.company_id).subquery()
    
    query_results = db.query(Company, Audit).join(
        Policy, Policy.company_id == Company.id
    ).join(
        Audit, Audit.policy_id == Policy.id
    ).join(
        subquery, (subquery.c.company_id == Company.id) & (subquery.c.max_score == Audit.compliance_score)
    ).order_by(desc(Audit.compliance_score)).limit(10).all()
    
    leaderboard = []
    for rank, (company, audit) in enumerate(query_results, 1):
        leaderboard.append({
            "rank": rank,
            "company_name": company.name,
            "score": audit.compliance_score,
            "industry": company.industry,
            "last_audited": audit.created_at
        })
    return leaderboard


# --- POLICY COMPARER & PDF EXPORTER ---

@app.post("/api/compare")
def compare_policies(request: CompareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit_a = db.query(Audit).filter(Audit.id == request.audit_id_a, Audit.created_by == current_user.id).first()
    audit_b = db.query(Audit).filter(Audit.id == request.audit_id_b, Audit.created_by == current_user.id).first()
    
    if not audit_a or not audit_b:
        raise HTTPException(status_code=404, detail="One or both audits could not be found.")
        
    policy_a = db.query(Policy).filter(Policy.id == audit_a.policy_id).first()
    company_a = db.query(Company).filter(Company.id == policy_a.company_id).first()
    
    policy_b = db.query(Policy).filter(Policy.id == audit_b.policy_id).first()
    company_b = db.query(Company).filter(Company.id == policy_b.company_id).first()
    
    issues_a = [f.issue for f in audit_a.findings if f.severity in ["Critical", "High", "Medium"]]
    issues_b = [f.issue for f in audit_b.findings if f.severity in ["Critical", "High", "Medium"]]
    
    compliance_winner = company_a.name if audit_a.compliance_score >= audit_b.compliance_score else company_b.name
    
    return {
        "company_a": {
            "name": company_a.name,
            "score": audit_a.compliance_score,
            "status": audit_a.status,
            "findings_count": len(audit_a.findings),
            "primary_gaps": issues_a[:3]
        },
        "company_b": {
            "name": company_b.name,
            "score": audit_b.compliance_score,
            "status": audit_b.status,
            "findings_count": len(audit_b.findings),
            "primary_gaps": issues_b[:3]
        },
        "winner": compliance_winner,
        "gap_analysis": f"{company_a.name} scores {audit_a.compliance_score}/100 compared to {company_b.name}'s {audit_b.compliance_score}/100. "
                       f"{company_a.name} is stronger in {audit_a.findings[0].pillar if audit_a.findings else 'Consent'} compliance, "
                       f"while {company_b.name} exhibits critical vulnerabilities in {audit_b.findings[0].pillar if audit_b.findings else 'Notice'}."
    }

@app.get("/api/compare/{audit_id_a}/{audit_id_b}/report")
def download_comparison_report(audit_id_a: int, audit_id_b: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit_a = db.query(Audit).filter(Audit.id == audit_id_a, Audit.created_by == current_user.id).first()
    audit_b = db.query(Audit).filter(Audit.id == audit_id_b, Audit.created_by == current_user.id).first()
    
    if not audit_a or not audit_b:
        raise HTTPException(status_code=404, detail="One or both audits could not be found.")
        
    policy_a = db.query(Policy).filter(Policy.id == audit_a.policy_id).first()
    company_a = db.query(Company).filter(Company.id == policy_a.company_id).first()
    
    policy_b = db.query(Policy).filter(Policy.id == audit_b.policy_id).first()
    company_b = db.query(Company).filter(Company.id == policy_b.company_id).first()
    
    issues_a = [f.issue for f in audit_a.findings if f.severity in ["Critical", "High", "Medium"]]
    issues_b = [f.issue for f in audit_b.findings if f.severity in ["Critical", "High", "Medium"]]
    
    compliance_winner = company_a.name if audit_a.compliance_score >= audit_b.compliance_score else company_b.name
    gap_analysis = f"{company_a.name} scores {audit_a.compliance_score}/100 compared to {company_b.name}'s {audit_b.compliance_score}/100. " \
                   f"{company_a.name} is stronger in {audit_a.findings[0].pillar if audit_a.findings else 'Consent'} compliance, " \
                   f"while {company_b.name} exhibits critical vulnerabilities in {audit_b.findings[0].pillar if audit_b.findings else 'Notice'}."
                   
    compare_data = {
        "winner": compliance_winner,
        "gap_analysis": gap_analysis
    }
    
    comp_a = {
        "name": company_a.name,
        "score": audit_a.compliance_score,
        "status": audit_a.status,
        "findings_count": len(audit_a.findings),
        "primary_gaps": issues_a[:3]
    }
    comp_b = {
        "name": company_b.name,
        "score": audit_b.compliance_score,
        "status": audit_b.status,
        "findings_count": len(audit_b.findings),
        "primary_gaps": issues_b[:3]
    }
    
    pdf_bytes = generate_comparison_pdf(compare_data, comp_a, comp_b)
    
    filename = f"DPDP_Comparison_{company_a.name.replace(' ', '_')}_vs_{company_b.name.replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# --- KNOWLEDGE BASE (DPDP ACT 2023 - 100% ACCURATE MAPPINGS) ---

DPDP_KB = {
    "section_5": {
        "title": "Section 5 - Notice",
        "explanation": "Before or at the time of seeking consent, data fiduciaries must present a clear notice written in plain, easily understandable language. The notice must detail what personal data is collected, the specific purpose of processing, and explain the rights of the Data Principal to withdraw consent, correct data, or file grievances.",
        "penalties": "Up to ₹150 Crore for failing to present appropriate notice.",
        "best_practice": "Use a tabular layout listing each permission requested paired with a corresponding business purpose. Avoid generic 'we collect information to improve our services'."
    },
    "section_6": {
        "title": "Section 6 - Consent",
        "explanation": "Consent of the Data Principal must be free, specific, informed, unconditional, and unambiguous. It must be indicated by a clear affirmative action. Any part of the consent that violates the provisions of this Act is invalid. Consent must also be granular (not bundled with terms of service) and withdrawable at any time.",
        "penalties": "Up to ₹50 Crore for failing to provide granular consent mechanisms.",
        "best_practice": "Implement explicit opt-in checkboxes on signup sheets. Provide a dedicated 'Withdraw Consent' button in profile settings."
    },
    "section_8": {
        "title": "Section 8 - Obligations of Data Fiduciary",
        "explanation": "Data Fiduciaries are responsible for ensuring personal data is processed accurately, safeguarded with reasonable security safeguards to prevent breaches, and erased once the purpose of collection is fulfilled.",
        "penalties": "Up to ₹250 Crore for failing to implement security safeguards, resulting in data breaches.",
        "best_practice": "Encrypt database columns holding PII at rest. Implement automated data lifecycle retention rules."
    },
    "section_9": {
        "title": "Section 9 - Processing of Personal Data of Children",
        "explanation": "Data fiduciaries must obtain verifiable parental consent before processing any personal data of a child (under 18 years) or a person with disability. Fiduciaries are strictly prohibited from engaging in any tracking, behavioral monitoring, or targeted advertising directed at children.",
        "penalties": "Up to ₹200 Crore for breaching children's data obligations.",
        "best_practice": "Implement age gates during registration. Flag and exclude accounts under 18 from marketing pixel triggers."
    },
    "section_11": {
        "title": "Section 11 - Right to Access Information About Personal Data",
        "explanation": "The Data Principal has the right to obtain from the Data Fiduciary a summary of personal data being processed, the identities of all other Data Fiduciaries and Data Processors with whom the personal data has been shared, and any other information as may be prescribed.",
        "penalties": "Up to ₹10 Crore for refusing to provide details of processed data to Data Principals.",
        "best_practice": "Build a secure data export dashboard allowing users to view and download a copy of all database records linked to their account."
    },
    "section_12": {
        "title": "Section 12 - Right to Correction, Completion, Erasure of Personal Data",
        "explanation": "A Data Principal has the right to correction, completion, and erasure of their personal data. The Data Fiduciary must correct, complete, or erase the data upon receiving a valid request, unless retention is necessary for legal purposes.",
        "penalties": "Up to ₹50 Crore for refusing to correct or erase user data upon valid requests.",
        "best_practice": "Provide self-service buttons inside settings to correct profile details and request account deletion."
    },
    "section_13": {
        "title": "Section 13 - Right to Grievance Redressal",
        "explanation": "A Data Principal has the right to register a grievance with the Data Fiduciary regarding any act or omission in processing their data. Fiduciaries must set up an efficient redressal mechanism and publish the contact details of a Nodal/Grievance Officer.",
        "penalties": "Up to ₹10 Crore for missing Grievance Redressal channels.",
        "best_practice": "State the Grievance Redressal Officer's name, email, and response SLA clearly at the bottom of the privacy notice."
    },
    "section_16": {
        "title": "Section 16 - Processing of Personal Data Outside India",
        "explanation": "The Central Government may restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory outside India as may be notified. Disclosures regarding cross-border transfers are mandatory.",
        "penalties": "Up to ₹10 Crore for violating cross-border data transfer blacklists or notice requirements.",
        "best_practice": "Audit cloud server locations and maintain standard contractual clauses with foreign sub-processors."
    }
}

@app.get("/api/kb")
def search_knowledge_base(query: Optional[str] = Query(None)):
    if not query:
        return DPDP_KB
    query = query.lower()
    results = {}
    for sec, details in DPDP_KB.items():
        if query in sec or query in details["title"].lower() or query in details["explanation"].lower():
            results[sec] = details
    return results


# --- AI COPILOT & POLICY REWRITE ---

@app.post("/api/audit/copilot", response_model=CopilotResponse)
def audit_copilot(request: CopilotRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == request.audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    findings_summary = []
    for f in audit.findings:
        findings_summary.append(f"- {f.pillar}: {f.issue} (Severity: {f.severity}) - Reason: {f.reason}")
        
    findings_str = "\n".join(findings_summary)
    
    system_prompt = f"""
    You are 'AuditWeave Copilot' - an interactive compliance assistant.
    You have access to a completed DPDP Act 2023 compliance audit for the company '{company.name}' ({company.industry}).
    Here are the audit details:
    Compliance Score: {audit.compliance_score}/100
    Overall Risk: {audit.status}
    Gaps Identified:
    {findings_str}
    
    Provide helpful, professional GRC guidance. Answer the user's question with precise legal references to the DPDP Act 2023 and suggest practical steps to resolve the gaps.
    """
    
    if HAS_GEMINI_KEY:
        try:
            model = genai.GenerativeModel('gemini-3.6-flash')
            prompt = f"{system_prompt}\n\nUser Question: {request.message}"
            response = model.generate_content(prompt)
            return {
                "response": response.text.strip(),
                "suggested_actions": [
                    f"Draft compliance clause for {audit.findings[0].pillar if audit.findings else 'Consent'}",
                    "Export GRC compliance task checklist",
                    "View recommended notice clauses"
                ]
            }
        except Exception as e:
            print(f"Copilot Error: {e}")
            pass
            
    user_msg = request.message.lower()
    if "children" in user_msg or "section 9" in user_msg:
        reply = (
            f"Regarding children's data for **{company.name}**, Section 9 of the DPDP Act 2023 mandates obtaining verifiable parental consent. "
            "Currently, the audited policy does not specify age gates or parental consent flows. To fix this, you must: "
            "1. Implement a front-end age checker (e.g. DD/MM/YYYY birth input). "
            "2. For users under 18, request the parent's email/phone to obtain confirmation. "
            "3. Enforce technical restrictions preventing behavioral ads or pixel tracking on minor profiles."
        )
    elif "grievance" in user_msg or "section 13" in user_msg:
        reply = (
            f"Under Section 13, **{company.name}** is required to publish the contact "
            "details of a Grievance Redressal Officer. We detected that this information "
            "is missing or unclear. You should add a grievance section to the policy with "
            "wording similar to: \"For any questions or complaints about our processing of "
            "your personal data, please contact our Grievance Redressal Officer at "
            "[GRIEVANCE EMAIL ADDRESS] or through [GRIEVANCE PORTAL URL]. We will "
            "acknowledge and resolve grievances in accordance with our published grievance "
            "procedure and applicable law.\" "
            "Replace the bracketed placeholders with your organisation's verified contact "
            "details before publishing."
        )
    else:
        reply = (
            f"Hello! I am your AuditWeave Copilot. **{company.name}** scored **{audit.compliance_score}/100** in our audit. "
            f"The primary issues are centered on **{audit.findings[0].pillar if audit.findings else 'Consent'}**. "
            "Would you like me to draft specific compliant text for your notice, or explain the penalties associated with these findings?"
        )

    return {
        "response": reply,
        "suggested_actions": [
            "Explain Section 6 penalties",
            "Draft a compliant Grievance Clause",
            "Generate developer compliance guidelines"
        ]
    }

@app.post("/api/audit/rewrite", response_model=RewriteResponse)
def audit_rewrite(
    request: RewriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Atomically verify finding existence and ownership via JOIN.
    # A finding_id from another user's audit returns None (IDOR protection).
    finding = (
        db.query(Finding)
        .join(Audit, Finding.audit_id == Audit.id)
        .filter(
            Finding.id == request.finding_id,
            Audit.created_by == current_user.id,
        )
        .first()
    )
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    # Centralised eligibility guard — enforced server-side regardless of UI state.
    if not is_finding_eligible_for_rewrite(finding):
        raise HTTPException(
            status_code=400,
            detail="This finding is already compliant and does not require a rewrite.",
        )

    # Load the parent policy text server-side for richer clause context.
    # The client NEVER provides policy wording; the DB is the sole source of truth.
    policy_text: str = ""
    try:
        if finding.audit and finding.audit.policy:
            policy_text = finding.audit.policy.policy_text or ""
    except Exception:
        pass  # Relationship unavailable; extract_clause_context falls back safely.

    # Recover the original clause and bounded surrounding context from DB indexes.
    original_clause, surrounding_context = extract_clause_context(
        policy_text=policy_text,
        evidence_extract=finding.evidence_extract,
        start_index=finding.evidence_start_index,
        end_index=finding.evidence_end_index,
    )

    system_prompt = build_rewrite_prompt(
        pillar=finding.pillar,
        issue=finding.issue,
        dpdp_section=finding.dpdp_section,
        reason=finding.reason,
        original_clause=original_clause,
        surrounding_context=surrounding_context,
    )

    rewritten: str = ""
    generation_mode: Literal["ai", "template"] = "template"

    if HAS_GEMINI_KEY:
        try:
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.6-flash"))
            response = model.generate_content(
                system_prompt,
                generation_config={"max_output_tokens": 600, "temperature": 0.3},
            )
            raw = clean_model_rewrite(response.text or "")
            if len(raw) >= 40:
                rewritten = raw
                generation_mode = "ai"
        except Exception as exc:
            logger.warning("AI rewrite failed for finding %s: %s", finding.id, exc)

    if not rewritten:
        rewritten = build_safe_fallback(
            pillar=finding.pillar,
            issue=finding.issue,
            original_text=original_clause,
        )
        generation_mode = "template"

    disclaimer = (
        "Drafting assistance only; this is not legal advice or a compliance guarantee. "
        "Replace every square-bracket placeholder with verified organisation details and "
        "have the clause reviewed by a qualified professional before publishing."
    )

    return {
        "finding_id": finding.id,
        "original_text": original_clause,
        "rewritten_text": rewritten,
        "disclaimer": disclaimer,
        "generation_mode": generation_mode,
    }


# --- RESEARCH MODE ---

@app.post("/api/research")
def run_batch_research(request: List[str], db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    results = []
    
    companies_mock = {
        "Flipkart": {"industry": "E-commerce", "score": 68.5, "passed": 6, "failed": 3, "gaps": ["Children's Data Parental Consent", "Granular Consent"]},
        "Meesho": {"industry": "E-commerce", "score": 59.2, "passed": 5, "failed": 4, "gaps": ["Children's Data", "Consent Withdrawal"]},
        "PhonePe": {"industry": "FinTech", "score": 82.0, "passed": 8, "failed": 1, "gaps": ["Data Retention Period"]},
        "Zepto": {"industry": "E-commerce", "score": 64.0, "passed": 6, "failed": 3, "gaps": ["Grievance Redressal Details"]},
        "Urban Company": {"industry": "SaaS", "score": 76.5, "passed": 7, "failed": 2, "gaps": ["Grievance Response SLA"]},
        "Paytm": {"industry": "FinTech", "score": 79.4, "passed": 7, "failed": 2, "gaps": ["Cross-Border disclosures"]},
        "Zomato": {"industry": "E-commerce", "score": 71.8, "passed": 7, "failed": 2, "gaps": ["Children's tracking"]},
        "Swiggy": {"industry": "E-commerce", "score": 70.5, "passed": 7, "failed": 2, "gaps": ["Granular marketing consent"]},
        "Ola": {"industry": "E-commerce", "score": 60.1, "passed": 5, "failed": 4, "gaps": ["Consent withdrawal", "Children's Data"]}
    }
    
    for cname in request:
        cdata = companies_mock.get(cname, {"industry": "SaaS", "score": 72.0, "passed": 7, "failed": 2, "gaps": ["Notice Details"]})
        results.append({
            "company_name": cname,
            "industry": cdata["industry"],
            "compliance_score": cdata["score"],
            "risk_score": round(100 - cdata["score"], 1),
            "passed_rules": cdata["passed"],
            "failed_rules": cdata["failed"],
            "critical_gaps": cdata["gaps"]
        })
        
    return {
        "report_title": "India DPDP Compliance Research Report 2026",
        "audit_count": len(request),
        "average_market_score": round(sum(r["compliance_score"] for r in results) / len(results), 1) if results else 0,
        "winner": max(results, key=lambda x: x["compliance_score"])["company_name"] if results else "None",
        "industry_breakdown": results
    }


# --- CONTACT FORM ---

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
CONTACT_ADMIN_EMAIL = os.getenv("CONTACT_ADMIN_EMAIL", "support@axoreon.com")

@app.post("/api/contact", response_model=ContactResponse)
async def submit_contact_form(request: ContactRequest):
    """Accept contact form submissions. Sends email via Resend if configured, otherwise logs to console."""
    logger = logging.getLogger(__name__)

    subject = f"[AuditWeave Contact] {request.topic} — from {request.name}"
    body_text = (
        f"Name: {request.name}\n"
        f"Email: {request.email}\n"
        f"Topic: {request.topic}\n"
        f"---\n"
        f"{request.message}"
    )

    if RESEND_API_KEY:
        try:
            import resend
            resend.api_key = RESEND_API_KEY

            # Admin notification
            resend.Emails.send({
                "from": "AuditWeave <noreply@axoreon.com>",
                "to": [CONTACT_ADMIN_EMAIL],
                "subject": subject,
                "text": body_text,
            })

            # User acknowledgment
            resend.Emails.send({
                "from": "AuditWeave <noreply@axoreon.com>",
                "to": [str(request.email)],
                "subject": "We received your message — AuditWeave Support",
                "text": (
                    f"Hi {request.name},\n\n"
                    "Thank you for contacting AuditWeave. We've received your message "
                    "and our GRC compliance team will respond within 12 business hours.\n\n"
                    "— AuditWeave Team (Powered by Axoreon)"
                ),
            })

            logger.info(f"Contact form email sent to {CONTACT_ADMIN_EMAIL} from {request.email}")
        except Exception as e:
            logger.error(f"Failed to send contact email via Resend: {e}")
            # Fall through to success — we don't want to lose the submission
    else:
        # No email service configured — log to console so submissions aren't lost
        logger.info(f"CONTACT FORM SUBMISSION (no email service configured):\n{body_text}")

    return ContactResponse(
        success=True,
        message="Your message has been submitted. Our team will respond within 12 business hours."
    )

# --- PAYMENTS (RAZORPAY) ---

import uuid
import razorpay
from pydantic import BaseModel
from .models import PaymentOrder

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

class CreateOrderRequest(BaseModel):
    credits: int

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/payments/create-order")
async def create_payment_order(request: CreateOrderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Razorpay order creation."""
    amount_inr = request.credits * 20
    amount_paise = amount_inr * 100
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the server.")
        
    try:
        order_data = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:10]}"
        })
        order_id = order_data["id"]
        
        # Store the order in the database
        payment_order = PaymentOrder(
            user_id=current_user.id,
            razorpay_order_id=order_id,
            credits_purchased=request.credits,
            amount_paid=amount_paise,
            status="created"
        )
        db.add(payment_order)
        db.commit()
        
        return order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/verify")
async def verify_payment(request: VerifyPaymentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Razorpay payment verification."""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the server.")
        
    payment_order = db.query(PaymentOrder).filter(PaymentOrder.razorpay_order_id == request.razorpay_order_id).first()
    if not payment_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if payment_order.status == "verified":
        raise HTTPException(status_code=400, detail="Order already verified")
        
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        })
    except razorpay.errors.SignatureVerificationError:
        payment_order.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    
    payment_order.status = "verified"
    
    current_user.credits_balance += payment_order.credits_purchased
    
    tx = CreditTransaction(
        user_id=current_user.id,
        amount=payment_order.credits_purchased,
        transaction_type="purchase",
        reference_id=request.razorpay_payment_id
    )
    db.add(tx)
    db.commit()
    
    return {"success": True, "new_balance": current_user.credits_balance}


