from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import cast
from typing import List, Literal, Optional, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return cast(EmailStr, str(value).strip().lower())

class UserCreate(UserBase):
    first_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("first_name")
    @classmethod
    def normalize_first_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("First name is required.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value.strip() or len(set(value)) < 3:
            raise ValueError("Password is too weak.")
        return value

class UserLogin(UserBase):
    password: str = Field(min_length=1, max_length=128)

class UserResponse(UserBase):
    id: int
    first_name: Optional[str] = None
    role: str
    credits_balance: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    credits_balance: int = 0

class TokenData(BaseModel):
    email: Optional[str] = None

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    domain: str
    industry: str
    size: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Policy Schemas
class PolicyBase(BaseModel):
    policy_url: Optional[str] = None
    version_label: Optional[str] = "v1.0"
    previous_policy_id: Optional[int] = None

class PolicyCreate(PolicyBase):
    company_name: str
    industry: str
    policy_text: str

class PolicyResponse(PolicyBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Finding Schemas
class FindingBase(BaseModel):
    pillar: str
    issue: str
    severity: str
    confidence_score: float
    dpdp_section: Optional[str] = None
    evidence_extract: Optional[str] = None
    reason: str
    business_impact: Optional[str] = None
    legal_impact: Optional[str] = None
    legal_rec: Optional[str] = None
    tech_rec: Optional[str] = None
    business_rec: Optional[str] = None
    evidence_start_index: Optional[int] = -1
    evidence_end_index: Optional[int] = -1

class FindingResponse(FindingBase):
    id: int
    audit_id: int
    
    class Config:
        from_attributes = True

# Audit Schemas
class AuditBase(BaseModel):
    compliance_score: float
    risk_score: float
    status: str
    overall_summary: str
    ai_confidence_score: float
    rules_passed_count: int
    rules_failed_count: int
    ai_observations_count: int
    framework: str = "DPDP_2023"

class AuditResponse(AuditBase):
    id: int
    policy_id: int
    created_at: datetime
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    company_industry: Optional[str] = None
    
    class Config:
        from_attributes = True

class AuditDetailResponse(AuditResponse):
    findings: List[FindingResponse] = []
    policy_text: Optional[str] = None
    
    class Config:
        from_attributes = True

# Benchmark Schema
class BenchmarkResponse(BaseModel):
    id: int
    industry: str
    average_compliance_score: float
    average_risk_score: float
    companies_count: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Request Payloads
class AuditRequest(BaseModel):
    company_name: str
    industry: str
    policy_url: Optional[str] = None
    policy_text: Optional[str] = None

class CompareRequest(BaseModel):
    audit_id_a: int
    audit_id_b: int

class RewriteRequest(BaseModel):
    finding_id: int
    # clause_text has been removed: the server reloads evidence from the DB.
    # The frontend must never supply policy wording as source-of-truth.

class RewriteResponse(BaseModel):
    finding_id: int
    original_text: str
    rewritten_text: str
    disclaimer: str
    generation_mode: Literal["ai", "template"]

class CopilotRequest(BaseModel):
    audit_id: int
    message: str

class CopilotResponse(BaseModel):
    response: str
    suggested_actions: List[str] = []

class ResearchRequest(BaseModel):
    company_names: List[str]

class BatchAuditItem(BaseModel):
    company_name: str
    industry: str
    policy_url: Optional[str] = None
    policy_text: Optional[str] = None

class BatchAuditRequest(BaseModel):
    items: List[BatchAuditItem]

class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    topic: str = "feedback"
    message: str = Field(min_length=10, max_length=5000)

class ContactResponse(BaseModel):
    success: bool
    message: str
