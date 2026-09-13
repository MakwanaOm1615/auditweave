import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # user, admin, compliance_officer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    industry = Column(String, index=True, nullable=False) # FinTech, E-commerce, SaaS, Healthcare, EdTech, etc.
    size = Column(String, nullable=True) # Startup, SME, Enterprise
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    policies = relationship("Policy", back_populates="company", cascade="all, delete-orphan")

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    policy_text = Column(Text, nullable=False)
    policy_url = Column(String, nullable=True)
    version_label = Column(String, default="v1.0")
    previous_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    company = relationship("Company", back_populates="policies")
    audits = relationship("Audit", back_populates="policy", cascade="all, delete-orphan")

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    compliance_score = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    status = Column(String, nullable=False) # e.g. "Excellent", "Good", "Moderate Risk", "High Risk", "Critical Risk"
    overall_summary = Column(Text, nullable=False)
    ai_confidence_score = Column(Float, default=0.95)
    rules_passed_count = Column(Integer, default=0)
    rules_failed_count = Column(Integer, default=0)
    ai_observations_count = Column(Integer, default=0)
    framework = Column(String, default="DPDP_2023") # Multi-framework capability
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    policy = relationship("Policy", back_populates="audits")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False)
    pillar = Column(String, nullable=False) # e.g. "Consent", "Notice", "Rights", "Children's Data", "Fiduciary Obligations", "Grievance Redressal", "Cross-Border"
    issue = Column(String, nullable=False)
    severity = Column(String, nullable=False) # Critical, High, Medium, Low, Informational
    confidence_score = Column(Float, default=0.90)
    dpdp_section = Column(String, nullable=True)
    evidence_extract = Column(Text, nullable=True)
    reason = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=True)
    legal_impact = Column(Text, nullable=True)
    legal_rec = Column(Text, nullable=True)
    tech_rec = Column(Text, nullable=True)
    business_rec = Column(Text, nullable=True)
    evidence_start_index = Column(Integer, default=-1)
    evidence_end_index = Column(Integer, default=-1)
    
    audit = relationship("Audit", back_populates="findings")

class Benchmark(Base):
    __tablename__ = "benchmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    industry = Column(String, unique=True, index=True, nullable=False)
    average_compliance_score = Column(Float, nullable=False)
    average_risk_score = Column(Float, nullable=False)
    companies_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
