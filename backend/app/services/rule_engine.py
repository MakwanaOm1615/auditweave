import re
from typing import Dict, Any, List

def expand_to_full_sentences(text: str, start_idx: int, end_idx: int) -> tuple[int, int, str]:
    """Expands match indices backwards and forwards to capture complete sentences, avoiding truncated words."""
    if start_idx < 0 or end_idx < 0 or start_idx >= len(text) or end_idx > len(text):
        return start_idx, end_idx, ""
        
    abbreviations = ["mr", "ms", "dr", "co", "ltd", "inc", "e.g", "i.e", "vs", "sec", "sect", "art"]
    
    # Scan backward for sentence beginning
    sentence_start = 0
    for i in range(start_idx - 1, -1, -1):
        if text[i] in ['.', '?', '!', '\n']:
            # Verify if this period is part of a common abbreviation
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
                
            # Boundary found. Sentence starts at the next character
            sentence_start = i + 1
            # Strip leading spaces/newlines
            while sentence_start < start_idx and text[sentence_start].isspace():
                sentence_start += 1
            break
            
    # Scan forward for sentence end
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
            
    # Extract the full sentence evidence
    evidence = text[sentence_start:sentence_end].strip()
    return sentence_start, sentence_end, evidence

class HybridComplianceEngine:
    def __init__(self):
        # Define rule patterns for DPDP pillars
        self.rules = [
            {
                "id": "RULE_GO_PRESENT",
                "pillar": "Grievance Redressal",
                "name": "Grievance Officer Designation",
                "description": "Checks for the explicit mention of a 'Grievance Officer' or 'Grievance Redressal Officer' in accordance with DPDP Section 13.",
                "patterns": [
                    r"(grievance\s+(officer|redressal|contact|desk|mechanism))",
                    r"(nodal\s+officer)"
                ],
                "failure_reason": "No designated Grievance Officer or Nodal Officer was found in the text. Under Section 13 of the DPDP Act 2023, data fiduciaries must publish contact details of a Grievance Officer."
            },
            {
                "id": "RULE_EMAIL_PRESENT",
                "pillar": "Grievance Redressal",
                "name": "Contact Email Disclosure",
                "description": "Checks for a valid contact email address within the privacy policy for handling complaints or inquiries.",
                "patterns": [
                    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                ],
                "failure_reason": "No contact email address was found. Data fiduciaries are required to provide a clear channel of contact for complaints."
            },
            {
                "id": "RULE_CONSENT_WITHDRAWAL",
                "pillar": "Consent",
                "name": "Consent Withdrawal Mechanism",
                "description": "Checks for a mechanism allowing users to withdraw or revoke consent at any time (Section 6(4)).",
                "patterns": [
                    r"(withdraw\s+consent|withdrawal\s+of\s+consent|revoke\s+consent|opt-out\s+mechanism|stop\s+processing|cancel\s+subscription)",
                    r"(delete\s+your\s+account|deactivate\s+account)"
                ],
                "failure_reason": "No explicit consent withdrawal mechanism was detected. Under DPDP Section 6(4), the Data Principal has the right to withdraw consent as easily as it was given."
            },
            {
                "id": "RULE_CHILDREN_RESTRICTIONS",
                "pillar": "Children's Data",
                "name": "Children's Data Protections",
                "description": "Scans for restrictions on processing children's data, parental consent, or age verification (Section 9).",
                "patterns": [
                    r"(parental\s+consent|children\s+under\s+18|minor|guardian\s+consent|child|age\s+verification|verify\s+age)"
                ],
                "failure_reason": "Missing clear disclosures regarding children's data or parental consent. Section 9 of the DPDP Act requires parental/guardian consent and forbids tracking or targeted ads for children."
            },
            {
                "id": "RULE_DATA_RETENTION",
                "pillar": "Data Fiduciary Obligations",
                "name": "Data Retention Disclosures",
                "description": "Scans for disclosures specifying the duration or criteria for retaining personal data (Section 8(7)).",
                "patterns": [
                    r"(retention\s+period|retain\s+data|retention\s+policy|store\s+data\s+for|delete\s+after|retained\s+as\s+long\s+as)"
                ],
                "failure_reason": "No clear data retention timelines or deletion triggers were found. Section 8(7) mandates that personal data must be erased once the purpose of collection is completed."
            },
            {
                "id": "RULE_CROSS_BORDER",
                "pillar": "Cross Border Transfer",
                "name": "Cross-Border Transfer Disclosures",
                "description": "Scans for disclosures regarding international data transfers or processing outside India (Section 16).",
                "patterns": [
                    r"(cross-border|international\s+transfer|outside\s+india|transfer\s+abroad|transfer\s+data\s+internationally|global\s+transfer)"
                ],
                "failure_reason": "No international data transfer disclosures were found. Fiduciaries must disclose cross-border processing locations under Section 16."
            },
            {
                "id": "RULE_NOTICE_PURPOSE",
                "pillar": "Notice",
                "name": "Notice of Purpose of Collection",
                "description": "Checks for explanations of the purpose of collecting personal data (Section 5).",
                "patterns": [
                    r"(purpose\s+of\s+collection|why\s+we\s+collect|use\s+your\s+data\s+for|reasons\s+for\s+processing|collect\s+personal\s+data\s+to)"
                ],
                "failure_reason": "No explicit section explaining the purpose of personal data collection was found. Section 5 mandates presenting a clear notice specifying the personal data and the purpose."
            },
            {
                "id": "RULE_RIGHTS_ACCESS",
                "pillar": "Data Principal Rights",
                "name": "Right to Access and Correction",
                "description": "Checks if users are informed of their rights to access, correct, and update their personal details (Section 11 & 12).",
                "patterns": [
                    r"(right\s+to\s+access|request\s+access|correct\s+information|update\s+details|rectify\s+data|right\s+of\s+correction|rectification)"
                ],
                "failure_reason": "Missing clear disclosures regarding data rectification or access. DPDP Sections 11 and 12 grant Data Principals the right to access and correct inaccurate or misleading personal data."
            },
            {
                "id": "RULE_RIGHTS_ERASURE",
                "pillar": "Data Principal Rights",
                "name": "Right to Erasure (Deletion)",
                "description": "Checks for the right to request deletion of personal details once the purpose is served (Section 12).",
                "patterns": [
                    r"(right\s+to\s+delete|request\s+deletion|erase\s+data|right\s+to\s+erasure|remove\s+your\s+information|right\s+to\s+be\s+forgotten)"
                ],
                "failure_reason": "No explicit right to erasure or deletion was found. Section 12 grants Data Principals the right to request erasure of their personal data."
            },
            {
                "id": "RULE_SECURITY_SAFEGUARDS",
                "pillar": "Security Safeguards",
                "name": "Security Safeguards Disclosure",
                "description": "Checks for disclosures regarding technical and organizational security measures to protect personal data (Section 8(5)).",
                "patterns": [
                    r"(security\s+safeguards?|protect\s+your\s+data|reasonable\s+security|encryption|technical\s+and\s+organizational\s+measures|prevent\s+unauthorized\s+access)"
                ],
                "failure_reason": "No explicit security safeguards disclosure found. Section 8(5) mandates that data fiduciaries implement reasonable security safeguards to prevent personal data breaches."
            },
            {
                "id": "RULE_BREACH_NOTIFICATION",
                "pillar": "Data Breach Notification",
                "name": "Data Breach Notification Obligation",
                "description": "Scans for disclosures acknowledging the obligation to notify the Data Protection Board and affected Data Principals in case of a personal data breach (Section 8(6)).",
                "patterns": [
                    r"(data\s+breach|breach\s+notification|notify\s+in\s+the\s+event\s+of\s+a\s+breach|report\s+security\s+incidents?|intimate\s+the\s+board)"
                ],
                "failure_reason": "Missing data breach notification procedures. Section 8(6) requires data fiduciaries to notify the Data Protection Board and affected Data Principals of any personal data breach."
            }
        ]

    def run(self, text: str) -> Dict[str, Any]:
        """Runs rule checks on the policy text and extracts evidence and indices."""
        passed_rules = []
        failed_rules = []
        
        # Normalize text to improve search accuracy
        normalized_text = text.lower()
        
        for rule in self.rules:
            matched = False
            evidence = ""
            start_idx = -1
            end_idx = -1
            
            for pattern in rule["patterns"]:
                match = re.search(pattern, normalized_text)
                if match:
                    matched = True
                    start_idx = match.start()
                    end_idx = match.end()
                    
                    # Expand indices to capture full, untruncated sentences
                    start_idx, end_idx, evidence = expand_to_full_sentences(text, start_idx, end_idx)
                    break
            
            rule_result = {
                "rule_id": rule["id"],
                "pillar": rule["pillar"],
                "name": rule["name"],
                "description": rule["description"],
                "status": "Pass" if matched else "Fail",
                "evidence_snippet": evidence if matched else None,
                "start_index": start_idx if matched else -1,
                "end_index": end_idx if matched else -1,
                "failure_reason": None if matched else rule["failure_reason"]
            }
            
            if matched:
                passed_rules.append(rule_result)
            else:
                failed_rules.append(rule_result)
                
        # Calculate raw rule compliance score (0 - 100)
        total_rules = len(self.rules)
        passed_count = len(passed_rules)
        rule_score = (passed_count / total_rules) * 100 if total_rules > 0 else 100.0
        
        return {
            "rule_score": round(rule_score, 1),
            "passed_count": passed_count,
            "failed_count": len(failed_rules),
            "passed_rules": passed_rules,
            "failed_rules": failed_rules
        }
