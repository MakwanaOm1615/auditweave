import logging
from statistics import mean

logger = logging.getLogger(__name__)

def calculate_overall_status(score: float) -> str:
    """Returns the legal compliance rating description based on score."""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Moderate Risk"
    elif score >= 35:
        return "High Risk"
    else:
        return "Critical Risk"

def score_and_validate_audit(company_name: str, industry: str, policy_name: str, findings: list) -> dict:
    """Computes overall score from individual pillar scores and validates assertions."""
    if len(findings) != 11:
        raise ValueError(f"Validation failed: Expected 11 compliance pillars, got {len(findings)}.")
        
    pillar_scores = []
    passed = 0
    partial = 0
    failed = 0
    
    for f in findings:
        score = f.get("score", 0)
        status = f.get("status", "Fail")
        
        pillar_scores.append(score)
        if status == "Pass":
            passed += 1
        elif status == "Partial":
            partial += 1
        else:
            failed += 1
            
    # Assertions
    # 1. passed + partial + failed == 11
    total_pillars = passed + partial + failed
    if total_pillars != 11:
        raise ValueError(f"Assertion failed: passed ({passed}) + partial ({partial}) + failed ({failed}) == {total_pillars}, expected 11.")
        
    # Calculate overall score
    overall_score = round(mean(pillar_scores), 1)
    
    # 2. Verify Overall Score matches mean(pillar_scores)
    expected_score = round(sum(pillar_scores) / len(pillar_scores), 1)
    if abs(overall_score - expected_score) > 0.01:
        raise ValueError(f"Assertion failed: calculated overall score ({overall_score}) does not match mean ({expected_score}).")
        
    # Overall risk level
    overall_status = calculate_overall_status(overall_score)
    
    # Calculate average confidence score
    avg_confidence = round(mean([f.get("confidence_score", 0.8) for f in findings]), 2)
    
    # Construct complete audit JSON
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    audit_report = {
        "company_name": company_name,
        "industry": industry,
        "policy_name": policy_name,
        "timestamp": timestamp,
        "version": "v1.0",
        "compliance_score": overall_score,
        "risk_score": round(100.0 - overall_score, 1),
        "status": overall_status,
        "ai_confidence_score": avg_confidence,
        "rules_passed_count": passed,
        "rules_failed_count": failed,
        "rules_partial_count": partial,
        "ai_observations_count": len(findings),
        "findings": findings
    }
    
    return audit_report
