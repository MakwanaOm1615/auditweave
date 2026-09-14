import os
import re
import json
import logging
import google.generativeai as genai
from .retrieval import retrieve_relevant_sections, build_knowledge_base_if_needed

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

PROMPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "compliance_prompt.txt")

# Define the 11 pillars, their keywords, and their search queries
PILLARS_CONFIG = {
    "Notice": {
        "keywords": [r"notice", r"purpose\s+of\s+collection", r"why\s+we\s+collect", r"reasons\s+for\s+processing", r"collect\s+personal\s+data\s+to", r"processing\s+reason", r"inform\s+you"],
        "query": "notice, details of personal data, purpose of processing, right to withdraw consent, grievance redressal",
        "dpdp_section": "Section 5"
    },
    "Consent": {
        "keywords": [r"consent", r"agree", r"permission", r"opt-in", r"affirmative\s+action", r"unambiguous", r"unconditional"],
        "query": "consent requirements, free specific informed unconditional unambiguous consent, clear affirmative action",
        "dpdp_section": "Section 6"
    },
    "Purpose Limitation": {
        "keywords": [r"purpose", r"limited\s+to", r"necessary\s+for", r"specified\s+purpose", r"compatible", r"only\s+for", r"not\s+process\s+further"],
        "query": "purpose limitation, processing personal data only for specified purpose, necessary data",
        "dpdp_section": "Section 6(1)"
    },
    "Data Retention": {
        "keywords": [r"retain", r"retention", r"delete", r"erase", r"storage", r"archive", r"dispose", r"keep\s+for", r"how\s+long"],
        "query": "data retention limits, erasing personal data, purpose served, delete data, storage duration",
        "dpdp_section": "Section 8(7)"
    },
    "Children's Data": {
        "keywords": [r"child", r"minor", r"guardian", r"parent", r"age\s+verification", r"parental\s+consent", r"under\s+18", r"targeted\s+advertisement", r"behavioral\s+monitoring", r"tracking"],
        "query": "processing children data, verifiable parental consent, tracking or behavioral monitoring of children, age gate",
        "dpdp_section": "Section 9"
    },
    "Grievance Officer": {
        "keywords": [r"grievance\s+officer", r"redressal\s+officer", r"nodal\s+officer", r"grievance\s+contact", r"grievance\s+desk", r"complain\s+to"],
        "query": "grievance officer contact details, grievance redressal mechanism, resolving complaints",
        "dpdp_section": "Section 13"
    },
    "Withdrawal of Consent": {
        "keywords": [r"withdraw\s+consent", r"withdrawal\s+of\s+consent", r"revoke\s+consent", r"opt-out", r"ease\s+of\s+withdrawal", r"withdraw\s+your\s+consent"],
        "query": "withdraw consent, ease of withdrawing consent, consequences of withdrawal",
        "dpdp_section": "Section 6(4)"
    },
    "Data Principal Rights": {
        "keywords": [r"delete", r"erasure", r"correction", r"access", r"summary\s+of\s+data", r"nominee", r"grievance", r"rectify", r"update"],
        "query": "rights of data principal, access information, correction of personal data, completion, erasure, nominate another person",
        "dpdp_section": "Section 11"
    },
    "Security Safeguards": {
        "keywords": [r"security", r"protect", r"safeguard", r"encryption", r"technical\s+measures", r"organizational\s+measures", r"unauthorized\s+access", r"breach\s+prevention"],
        "query": "security safeguards, reasonable security safeguards to prevent personal data breach",
        "dpdp_section": "Section 8(5)"
    },
    "Cross-border Transfers": {
        "keywords": [r"cross-border", r"international\s+transfer", r"outside\s+india", r"transfer\s+abroad", r"global\s+transfer", r"restrict\s+transfer"],
        "query": "transfer of personal data outside India, cross-border data transfer restrictions",
        "dpdp_section": "Section 16"
    },
    "Data Breach Notification": {
        "keywords": [r"breach", r"leak", r"notification", r"data\s+breach", r"compromise", r"incident", r"report\s+to\s+board", r"notify\s+principal"],
        "query": "personal data breach notification, notifying board and affected data principals",
        "dpdp_section": "Section 8(6)"
    }
}

def expand_to_full_sentences(text: str, start_idx: int, end_idx: int) -> str:
    """Expands match indices backwards and forwards to capture complete sentences, avoiding truncated words."""
    if start_idx < 0 or end_idx < 0 or start_idx >= len(text) or end_idx > len(text):
        return ""
        
    abbreviations = ["mr", "ms", "dr", "co", "ltd", "inc", "e.g", "i.e", "vs", "sec", "sect", "art"]
    
    sentence_start = 0
    for i in range(start_idx - 1, -1, -1):
        if text[i] in ['.', '?', '!', '\n']:
            is_abbrev = False
            for abbr in abbreviations:
                abbr_len = len(abbr)
                if i >= abbr_len:
                    word = text[i - abbr_len:i].lower()
                    if word == abbr and (i - abbr_len == 0 or text[i - abbr_len - 1].isspace() or text[i - abbr_len - 1] in ['.', ',', ';', '\n']):
                        is_abbrev = True
                        break
            if is_abbrev:
                continue
            sentence_start = i + 1
            while sentence_start < start_idx and text[sentence_start].isspace():
                sentence_start += 1
            break
            
    sentence_end = len(text)
    for i in range(end_idx, len(text)):
        if text[i] in ['.', '?', '!']:
            is_abbrev = False
            for abbr in abbreviations:
                abbr_len = len(abbr)
                if i >= abbr_len:
                    word = text[i - abbr_len:i].lower()
                    if word == abbr and (i - abbr_len == 0 or text[i - abbr_len - 1].isspace() or text[i - abbr_len - 1] in ['.', ',', ';', '\n']):
                        is_abbrev = True
                        break
            if is_abbrev:
                continue
            sentence_end = i + 1
            break
        elif text[i] == '\n':
            sentence_end = i
            break
            
    return text[sentence_start:sentence_end].strip()

def get_high_fidelity_fallback(pillar: str, keyword_matched: bool, keyword_snippet: str) -> dict:
    """Produces a deterministic, zero-hallucination compliance assessment based on pre-scan matches."""
    config = PILLARS_CONFIG[pillar]
    
    details = {
        "Notice": {
            "pass_desc": "The policy presents a clear notice in plain language describing the categories of personal data collected and purposes of processing.",
            "fail_desc": "Clause Missing. No supporting evidence found. Under Section 5 of the DPDP Act, every request for consent must be accompanied or preceded by a notice describing the personal data and purpose.",
            "rec": "Ensure notice is clear, concise, and available in English and 8th Schedule languages.",
            "impact": "Failing to present appropriate notice leads to regulatory warnings and audit triggers by the Data Protection Board.",
            "fix": "Add a dedicated notice section matching data types to processing purposes.",
            "sec": "Section 5"
        },
        "Consent": {
            "pass_desc": "Consent is requested in a specific, informed, and unambiguous manner with a clear affirmative action.",
            "fail_desc": "Clause Missing. No supporting evidence found. No granular or explicit opt-in consent controls were detected.",
            "rec": "Implement granular opt-in checkboxes for distinct processing purposes, avoiding pre-ticked checkmarks or bundled terms acceptance.",
            "impact": "Subject to penalties up to ₹50 Crore for bundled or non-consensual processing.",
            "fix": "Decouple terms acceptance from data processing consent checkboxes.",
            "sec": "Section 6"
        },
        "Purpose Limitation": {
            "pass_desc": "The policy explicitly limits personal data processing to the specified, lawful purposes necessary for services.",
            "fail_desc": "Clause Missing. No supporting evidence found. The policy permits broad, open-ended processing of personal data beyond what is strictly necessary.",
            "rec": "Declare that processing is restricted strictly to the reasons declared at collection.",
            "impact": "Processing data for unauthorized or incompatible purposes violates Section 6(1) principles.",
            "fix": "Limit backend processing to specified purposes and update public declarations.",
            "sec": "Section 6(1)"
        },
        "Data Retention": {
            "pass_desc": "The policy defines explicit timelines or triggers to erase personal data once the purpose is served.",
            "fail_desc": "Clause Missing. No supporting evidence found. The policy declares indefinite retention or lacks deletion triggers when purposes are met.",
            "rec": "Formulate a retention policy to delete personal data once the original purpose is completed.",
            "impact": "Violation of Section 8(7) retention limits. Risk of penalties and high storage costs.",
            "fix": "Implement database deletion script lifecycles and declare them.",
            "sec": "Section 8(7)"
        },
        "Children's Data": {
            "pass_desc": "The policy restricts services to adults or declares verifiable parental/guardian consent controls.",
            "fail_desc": "Clause Missing. No supporting evidence found. No restrictions on processing minor data or age gating are specified.",
            "rec": "Obtain verifiable parental consent and block tracking/behavioral ads on minor profiles.",
            "impact": "Subject to penalty caps up to ₹200 Crore for children's data breaches.",
            "fix": "Implement age gates and flag minor profiles to disable trackers.",
            "sec": "Section 9"
        },
        "Grievance Officer": {
            "pass_desc": "A designated Grievance Officer and contact address are published in the privacy policy.",
            "fail_desc": "Clause Missing. No supporting evidence found. No designated Grievance Officer or nodal contact is published in the text.",
            "rec": "Publish the name, designation, and email address of the Grievance Redressal Officer.",
            "impact": "Direct breach of Section 13 contact publication requirements. Subject to penalties up to ₹10 Crore.",
            "fix": "Appoint a Grievance Officer and publish contact email (e.g. grievance@company.com).",
            "sec": "Section 13"
        },
        "Withdrawal of Consent": {
            "pass_desc": "The policy grants Data Principals the right to withdraw consent easily at any time.",
            "fail_desc": "Clause Missing. No supporting evidence found. The policy does not provide a mechanism to revoke or withdraw consent.",
            "rec": "Ensure users can withdraw consent as easily as they gave it.",
            "impact": "Non-compliant with Section 6(4). Subject to regulatory warnings and user churn.",
            "fix": "Create a 'withdraw consent' setting in the user dashboard.",
            "sec": "Section 6(4)"
        },
        "Data Principal Rights": {
            "pass_desc": "Discloses rights of access, summary of data, correction, and erasure.",
            "fail_desc": "Clause Missing. No supporting evidence found. The policy fails to describe access, correction, or erasure rights.",
            "rec": "Provide details on how users can request corrections or erasure of data.",
            "impact": "Direct violation of Sections 11 and 12 rights of data principals.",
            "fix": "Establish an internal SLA and portal to handle user correction/deletion requests.",
            "sec": "Section 11 & 12"
        },
        "Security Safeguards": {
            "pass_desc": "Reasonable technical and organizational security safeguards are described.",
            "fail_desc": "Clause Missing. No supporting evidence found. Lacks explicit disclosure of security measures and safeguards.",
            "rec": "Document and declare standard security safeguards like SSL encryption, access controls, and logs.",
            "impact": "Non-compliance with Section 8(5) safeguarding rules.",
            "fix": "Implement industry-standard security safeguards and perform annual GRC audits.",
            "sec": "Section 8(5)"
        },
        "Cross-border Transfers": {
            "pass_desc": "Cross-border transfers are declared in compliance with regulatory blacklists and notifications.",
            "fail_desc": "Clause Missing. No supporting evidence found. The policy lacks international data transfer declarations.",
            "rec": "Identify regions where data is processed internationally and align with government rules.",
            "impact": "Violates transparency requirements regarding foreign data processing.",
            "fix": "Disclose server regions and ensure standard data transfer agreements are executed.",
            "sec": "Section 16"
        },
        "Data Breach Notification": {
            "pass_desc": "Procedures to notify the Data Protection Board and users of security breaches are defined.",
            "fail_desc": "Clause Missing. No supporting evidence found. Lacks breach notification timelines or mechanisms.",
            "rec": "Declare commitment to report breaches to the Data Protection Board and affected users.",
            "impact": "Failing to notify breaches violates Section 8(6), resulting in severe penalties.",
            "fix": "Adopt a 72-hour security incident response and notification protocol.",
            "sec": "Section 8(6)"
        }
    }
    
    p_data = details[pillar]
    status = "Pass" if keyword_matched else "Fail"
    score = 85 if keyword_matched else 15
    evidence = keyword_snippet if keyword_matched else "Clause Missing. No supporting evidence found."
    
    why = p_data["pass_desc"] if keyword_matched else p_data["fail_desc"]
    rec = "Maintain compliance standards and conduct periodic audits." if keyword_matched else p_data["rec"]
    
    return {
        "pillar": pillar,
        "status": status,
        "score": score,
        "policy_evidence": evidence,
        "dpdp_section": p_data["sec"],
        "missing_requirements": [] if keyword_matched else [p_data["fail_desc"]],
        "recommendation": rec,
        "why_it_passed_or_failed": why,
        "business_impact": p_data["impact"] if not keyword_matched else "Maintains consumer trust and GRC security clearance.",
        "risk_level": "Low" if keyword_matched else "High",
        "recommended_fix": p_data["fix"] if not keyword_matched else "None required. Maintain current operations.",
        "confidence_score": 0.9
    }

class HybridComplianceEngine:
    def __init__(self):
        # Load prompt template
        if os.path.exists(PROMPT_PATH):
            with open(PROMPT_PATH, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        else:
            logger.error(f"Prompt template not found at {PROMPT_PATH}")
            self.prompt_template = ""

    def run_pre_scan(self, text: str, keywords: list) -> tuple:
        """Determines if any of the keywords are present in the text and returns the matching sentence."""
        normalized_text = text.lower()
        for pattern in keywords:
            match = re.search(pattern, normalized_text)
            if match:
                snippet = expand_to_full_sentences(text, match.start(), match.end())
                return True, snippet
        return False, ""

    def analyze_pillar(self, pillar: str, policy_text: str) -> dict:
        """Performs RAG retrieval, keyword pre-scan, calls Gemini, and validates outputs."""
        config = PILLARS_CONFIG[pillar]
        
        # 1. Run deterministic pre-scan
        keyword_matched, keyword_snippet = self.run_pre_scan(policy_text, config["keywords"])
        
        # 2. Retrieve relevant DPDP sections
        retrieved_chunks = retrieve_relevant_sections(config["query"], top_k=3)
        dpdp_sections_text = "\n\n".join([f"--- Chunk from {c['section']} ---\n{c['text']}" for c in retrieved_chunks])
        
        # Determine average similarity score for confidence metadata
        avg_similarity = sum([c.get("similarity", 0.0) for c in retrieved_chunks]) / len(retrieved_chunks) if retrieved_chunks else 0.0
        
        # Prepare local fallback result
        fallback_result = get_high_fidelity_fallback(pillar, keyword_matched, keyword_snippet)

        # 3. Call Gemini if API key is configured
        if not api_key:
            logger.warning("No Gemini API Key configured. Returning local fallback results.")
            return fallback_result

        try:
            prompt = self.prompt_template.format(
                pillar=pillar,
                dpdp_sections=dpdp_sections_text,
                policy_text=policy_text[:12000],  # avoid overflow
                keyword_matched="Yes" if keyword_matched else "No",
                keyword_snippet=keyword_snippet if keyword_matched else "None"
            )
            
            # Request Gemini model
            model = genai.GenerativeModel("gemini-3.6-flash")
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            # Parse JSON
            raw_text = response.text.strip()
            # Clean possible markdown wrapping if any
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()
            
            result = json.loads(raw_text)
            
            # Enforce deterministic rules
            # If no keyword matched, status must NEVER be "Pass".
            if not keyword_matched:
                result["policy_evidence"] = "Clause Missing. No supporting evidence found."
                if result.get("status") == "Pass":
                    result["status"] = "Fail"
                    result["score"] = min(result.get("score", 20), 20)
                    result["why_it_passed_or_failed"] = "Deterministic override: Missing explicit keyword/structural indicators of compliance in the policy. Downclassed from PASS to FAIL."
                    result["missing_requirements"].append("Missing required statutory keywords and policy clauses.")
                    result["recommendation"] = "Clause Missing. No supporting evidence found. " + result.get("recommendation", "")
            else:
                # If keyword matched, but LLM still says no evidence found, enforce consistency
                if not result.get("policy_evidence") or result.get("policy_evidence") == "None" or "missing" in result.get("policy_evidence", "").lower():
                    result["policy_evidence"] = keyword_snippet
                    
            # Double check score constraints
            if (result.get("status") == "Pass" and 
                (not result.get("policy_evidence") or result.get("policy_evidence") == "Clause Missing. No supporting evidence found.")):
                result["status"] = "Fail"
                result["score"] = 0
                result["why_it_passed_or_failed"] = "Deterministic override: PASS is forbidden when policy evidence is missing. Downclassed to FAIL."
            
            # Ensure status matches score range
            if result.get("status") == "Pass":
                result["score"] = max(result.get("score", 80), 80)
            elif result.get("status") == "Partial":
                result["score"] = min(max(result.get("score", 50), 31), 79)
            else:
                result["score"] = min(result.get("score", 30), 30)
                
            # If confidence_score is missing or low, adjust it based on similarity search
            result["confidence_score"] = round(0.4 * avg_similarity + 0.6 * result.get("confidence_score", 0.8), 2)
            
            return result

        except Exception as e:
            logger.error(f"Gemini analysis failed for pillar {pillar}: {e}. Falling back to rule-based engine.")
            return fallback_result

    def run_audit(self, policy_text: str) -> list:
        """Runs the hybrid compliance engine across all 11 pillars sequentially."""
        # Ensure KB is initialized
        build_knowledge_base_if_needed()
        
        findings = []
        for pillar in PILLARS_CONFIG.keys():
            logger.info(f"Auditing compliance pillar: {pillar}")
            pillar_result = self.analyze_pillar(pillar, policy_text)
            # Assign id to each finding
            pillar_result["id"] = len(findings) + 1
            findings.append(pillar_result)
            
        return findings
