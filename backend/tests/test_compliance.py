import pytest
import os
import sys

# Ensure backend directory is in the path for tests
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.parser import clean_extracted_text
from app.services.retrieval import chunk_section, retrieve_relevant_sections
from app.services.compliance_engine import HybridComplianceEngine
from app.services.scoring import score_and_validate_audit

def test_clean_extracted_text():
    raw = "   Privacy   Policy   \n\n   Acceptable   "
    cleaned = clean_extracted_text(raw)
    assert "Privacy Policy" in cleaned
    assert "Acceptable" in cleaned
    assert "Policy\n\nAcceptable" in cleaned


def test_clean_extracted_text_removes_reader_metadata():
    raw = "Title: Example Policy\nURL Source: https://example.com/privacy\nMarkdown Content:\n## Privacy Policy\n\nWe protect your data."
    cleaned = clean_extracted_text(raw)
    assert "Title:" not in cleaned
    assert "URL Source:" not in cleaned
    assert cleaned.startswith("## Privacy Policy")
    assert "Policy\n\nWe protect" in cleaned

def test_chunk_section():
    # Test text chunker
    long_text = "word " * 800
    chunks = chunk_section(long_text, 1)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert chunk["word_count"] >= 100
        assert chunk["section"] == "Section 1"

def test_rule_engine_pre_scan_and_fallback():
    engine = HybridComplianceEngine()
    policy = """
    Notice of Purpose of Collection: We gather information for specified business operations.
    Consent: You can withdraw consent or opt-out mechanism at any time.
    Children's Data: We require parental consent for children under 18 years of age.
    """
    
    # Notice check pre-scan
    matched, snippet = engine.run_pre_scan(policy, [r"notice", r"purpose\s+of\s+collection"])
    assert matched is True
    assert "Notice of Purpose" in snippet
    
    # Run audit on a single pillar (Notice)
    result = engine.analyze_pillar("Notice", policy)
    assert result["status"] == "Pass"
    assert result["score"] >= 80
    assert "Notice of Purpose" in result["policy_evidence"]
    
    # Run audit on Grievance Officer (keywords absent)
    result_go = engine.analyze_pillar("Grievance Officer", policy)
    assert result_go["status"] == "Fail"
    assert result_go["score"] <= 30
    assert result_go["policy_evidence"] == "Clause Missing. No supporting evidence found."

def test_scoring_and_validations():
    company = "TestCorp"
    industry = "SaaS"
    policy_name = "test_policy.pdf"
    
    # 11 findings (Notice, Consent, Purpose Limitation, Data Retention, Children's Data, Grievance Officer, Withdrawal of Consent, Data Principal Rights, Security Safeguards, Cross-border Transfers, Data Breach Notification)
    mock_findings = []
    
    # Add 6 passes
    pillars = [
        "Notice", "Consent", "Purpose Limitation", "Data Retention",
        "Children's Data", "Grievance Officer", "Withdrawal of Consent",
        "Data Principal Rights", "Security Safeguards", "Cross-border Transfers",
        "Data Breach Notification"
    ]
    
    for idx, p in enumerate(pillars):
        # 6 passes, 3 partials, 2 fails
        if idx < 6:
            status = "Pass"
            score = 90
        elif idx < 9:
            status = "Partial"
            score = 60
        else:
            status = "Fail"
            score = 10
            
        mock_findings.append({
            "pillar": p,
            "status": status,
            "score": score,
            "policy_evidence": "Evidence" if status != "Fail" else "Clause Missing. No supporting evidence found.",
            "dpdp_section": "Section X",
            "missing_requirements": [],
            "recommendation": "Rec",
            "why_it_passed_or_failed": "Why",
            "business_impact": "Impact",
            "risk_level": "Low",
            "recommended_fix": "Fix",
            "confidence_score": 0.95
        })
        
    report = score_and_validate_audit(company, industry, policy_name, mock_findings)
    
    assert report["company_name"] == company
    assert report["industry"] == industry
    # Score mean: (90*6 + 60*3 + 10*2) / 11 = 740 / 11 = 67.27 -> 67.3
    assert report["compliance_score"] == 67.3
    assert report["status"] == "Moderate Risk"
    assert report["rules_passed_count"] == 6
    assert report["rules_partial_count"] == 3
    assert report["rules_failed_count"] == 2
    assert len(report["findings"]) == 11
    
    # Test assertion error for non-11 findings
    with pytest.raises(ValueError):
        score_and_validate_audit(company, industry, policy_name, mock_findings[:-1])
