import datetime
import io
import re
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def get_grc_styles():
    """Initializes and returns common stylesheet typography styles."""
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=25
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    evidence_style = ParagraphStyle(
        'EvidenceText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#D97706'),
        spaceAfter=6,
        leftIndent=15
    )
    
    meta_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B')
    )
    
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'evidence': evidence_style,
        'meta': meta_style
    }

def generate_audit_pdf(audit_data: dict, company_name: str, industry: str, audit_date: str) -> bytes:
    """Generates a styled, publication-ready PDF report of the compliance audit."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    c_styles = get_grc_styles()
    story = []
    
    # --- PAGE 1: COVER PAGE / EXECUTIVE HEADER ---
    story.append(Paragraph("AuditWeave AI", ParagraphStyle('Brand', parent=c_styles['title'], fontSize=14, textColor=colors.HexColor('#0F172A'), spaceAfter=5)))
    story.append(Paragraph("DPDP Compliance Intelligence Platform", ParagraphStyle('BrandTag', parent=c_styles['subtitle'], fontSize=9, textColor=colors.HexColor('#0284C7'), spaceAfter=30)))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Digital Personal Data Protection (DPDP) Act 2023 Compliance Report", c_styles['title']))
    story.append(Paragraph(f"Audited Entity: <b>{company_name}</b> ({industry})", c_styles['subtitle']))
    
    report_id = f"PL-AUD-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    meta_data = [
        [Paragraph("Report ID:", c_styles['meta']), Paragraph(report_id, c_styles['body'])],
        [Paragraph("Audit Date:", c_styles['meta']), Paragraph(audit_date, c_styles['body'])],
        [Paragraph("Statutory Framework:", c_styles['meta']), Paragraph("India DPDP Act 2023", c_styles['body'])],
        [Paragraph("Compliance Score:", c_styles['meta']), Paragraph(f"<b>{audit_data['compliance_score']}/100</b>", c_styles['body'])],
        [Paragraph("Overall Risk level:", c_styles['meta']), Paragraph(f"<b>{audit_data['status']}</b>", c_styles['body'])]
    ]
    
    t_meta = Table(meta_data, colWidths=[2.0 * inch, 4.0 * inch])
    t_meta.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_meta)
    story.append(Paragraph(
        "Methodology: compliance score is the mean of 11 individually-scored DPDP pillar assessments (0\u2013100 each).",
        ParagraphStyle('MethodNote', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'), spaceAfter=15)
    ))
    
    story.append(Spacer(1, 25))
    story.append(Paragraph("1. Executive Summary", c_styles['h1']))
    story.append(Paragraph(audit_data["overall_summary"], c_styles['body']))
    
    score = audit_data["compliance_score"]
    risk = audit_data["risk_score"]
    passed = audit_data["rules_passed_count"]
    failed = audit_data["rules_failed_count"]
    obs = audit_data["ai_observations_count"]
    conf = int(audit_data["ai_confidence_score"] * 100)
    
    story.append(Spacer(1, 15))
    
    metric_data = [
        ["Compliance Score", "Vulnerability Risk", "Rule Checks Passed", "Rule Violations", "AI Confidence"],
        [f"{score}%", f"{risk}%", f"{passed}", f"{failed}", f"{conf}%"]
    ]
    t_metrics = Table(metric_data, colWidths=[1.25 * inch, 1.25 * inch, 1.25 * inch, 1.25 * inch, 1.25 * inch])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,-1), 13),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_metrics)
    
    story.append(PageBreak())
    
    # --- PAGE 2: COMPLIANCE PILLAR ANALYSIS ---
    story.append(Paragraph("2. DPDP Pillar Heatmap Analysis", c_styles['h1']))
    story.append(Paragraph("The platform audited the policy against the seven structural pillars of the DPDP Act 2023, scoring each and identifying critical gaps.", c_styles['body']))
    
    pillar_scores = {
        "Consent": "Compliant",
        "Notice": "Compliant",
        "Data Principal Rights": "Compliant",
        "Children's Data": "Compliant",
        "Data Fiduciary Obligations": "Compliant",
        "Grievance Redressal": "Compliant",
        "Cross Border Transfer": "Compliant"
    }
    
    for finding in audit_data["findings"]:
        p = finding["pillar"]
        sev = finding["severity"]
        if p in pillar_scores:
            if sev in ["Critical", "High"]:
                pillar_scores[p] = "Fail"
            elif sev == "Medium" and pillar_scores[p] != "Fail":
                pillar_scores[p] = "Partial"
            elif sev == "Low" and pillar_scores[p] not in ["Fail", "Partial"]:
                pillar_scores[p] = "Partial"

    heatmap_rows = [["DPDP Pillar", "Audited Score", "Compliance Level", "Primary Requirement"]]
    pillar_reqs = {
        "Consent": "Explicit, granular, and withdrawable consent.",
        "Notice": "Purpose and rights disclosure presented in notice.",
        "Data Principal Rights": "Enable right to access, correction, and erasure.",
        "Children's Data": "Age verification and verifiable parental consent.",
        "Data Fiduciary Obligations": "Accuracy control, retention limits, security guards.",
        "Grievance Redressal": "Publish Grievance Officer contacts & SLA response.",
        "Cross Border Transfer": "Transfers compliant with federal blacklist/rules."
    }
    
    for pil, status_lvl in pillar_scores.items():
        if status_lvl == "Compliant":
            indicator = "🟢 PASS (100)"
        elif status_lvl == "Partial":
            indicator = "🟡 PARTIAL (50)"
        else:
            indicator = "🔴 FAIL (20)"
        heatmap_rows.append([pil, indicator, status_lvl.upper(), pillar_reqs.get(pil, "")])
        
    t_heatmap = Table(heatmap_rows, colWidths=[1.8 * inch, 1.3 * inch, 1.2 * inch, 2.7 * inch])
    t_heatmap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_heatmap)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("3. Detailed Risk Findings & Evidence", c_styles['h1']))
    story.append(Paragraph("Traceable compliance violations, complete with the legal section breaches, extracted textual evidence, and recommendations.", c_styles['body']))
    
    for i, f in enumerate(audit_data["findings"]):
        f_story = []
        sev_color = '#EF4444' if f["severity"] in ["Critical", "High"] else ('#F59E0B' if f["severity"] == "Medium" else '#3B82F6')
        
        f_story.append(Spacer(1, 8))
        f_story.append(Paragraph(f"Finding {i+1}: {f['issue']}", c_styles['h2']))
        
        meta_line = f"<b>Pillar:</b> {f['pillar']} | <b>Section:</b> {f['dpdp_section']} | <b>Severity:</b> <font color='{sev_color}'><b>{f['severity']}</b></font> | <b>Confidence:</b> {int(f['confidence_score'] * 100)}%"
        f_story.append(Paragraph(meta_line, ParagraphStyle('FindMeta', parent=c_styles['body'], fontSize=9, textColor=colors.HexColor('#475569'))))
        f_story.append(Paragraph(f"<b>Gap Analysis:</b> {f['reason']}", c_styles['body']))
        
        if f.get("evidence_extract"):
            f_story.append(Paragraph("<b>Policy Evidence:</b>", ParagraphStyle('EvLabel', parent=c_styles['body'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#475569'))))
            f_story.append(Paragraph(f'"{f["evidence_extract"]}"', c_styles['evidence']))
        else:
            f_story.append(Paragraph("<b>Policy Evidence:</b> <i>No clause or reference found in document.</i>", c_styles['body']))
            
        if f.get("legal_impact"):
            f_story.append(Paragraph(f"<b>Legal Liability:</b> {f['legal_impact']}", c_styles['body']))
        if f.get("business_impact"):
            f_story.append(Paragraph(f"<b>Business Impact:</b> {f['business_impact']}", c_styles['body']))
            
        rec_data = [
            [Paragraph("<b>Legal Recommendation</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold')),
             Paragraph("<b>Technical Action</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold')),
             Paragraph("<b>Business Action</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold'))],
            [Paragraph(f.get("legal_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10)),
             Paragraph(f.get("tech_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10)),
             Paragraph(f.get("business_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10))]
        ]
        t_rec = Table(rec_data, colWidths=[2.3 * inch, 2.3 * inch, 2.3 * inch])
        t_rec.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        f_story.append(t_rec)
        f_story.append(Spacer(1, 10))
        
        story.append(KeepTogether(f_story))
        
    story.append(Spacer(1, 15))
    story.append(Paragraph("4. Appendix & Regulatory Penalties", c_styles['h1']))
    story.append(Paragraph(
        "This audit report is generated automatically using hybrid deterministic parsing and advanced language understanding "
        "trained on the statutory clauses of India's Digital Personal Data Protection (DPDP) Act 2023. Compliance scores represent "
        "conformity with standard disclosure expectations but do not constitute formal legal counsel. For high-priority risks, "
        "we recommend consulting qualified cyber-lawyers in India prior to publishing revised privacy notices.",
        ParagraphStyle('Disclaimer', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))
    ))
    
    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_comparison_pdf(compare_data: dict, company_a: dict, company_b: dict) -> bytes:
    """Generates a styled comparison report PDF showing side-by-side GRC posture differences."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    c_styles = get_grc_styles()
    story = []
    
    # Header Brand
    story.append(Paragraph("AuditWeave AI", ParagraphStyle('BrandComp', parent=c_styles['title'], fontSize=12, textColor=colors.HexColor('#0F172A'), spaceAfter=5)))
    story.append(Spacer(1, 10))
    
    # Title
    story.append(Paragraph(f"GRC Compliance Comparison Audit Report", c_styles['title']))
    story.append(Paragraph(f"Comparative Posture: <b>{company_a['name']}</b> vs <b>{company_b['name']}</b>", c_styles['subtitle']))
    
    # 1. Score Matrix Table
    story.append(Paragraph("1. Compliance Score Matrix", c_styles['h1']))
    matrix_data = [
        ["GRC Metric", company_a['name'], company_b['name']],
        ["Compliance Score", f"{company_a['score']}/100", f"{company_b['score']}/100"],
        ["Risk Assessment", company_a['status'], company_b['status']],
        ["Vulnerabilities Detected", f"{company_a['findings_count']} Gaps", f"{company_b['findings_count']} Gaps"]
    ]
    t_matrix = Table(matrix_data, colWidths=[2.3 * inch, 2.3 * inch, 2.3 * inch])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 15))
    
    # 2. Executive GRC Winner & Summary
    story.append(Paragraph("2. Executive GRC Summary", c_styles['h1']))
    story.append(Paragraph(f"<b>Compliance Posture Winner:</b> {compare_data['winner']}", c_styles['body']))
    story.append(Paragraph(f"<b>Gap Analysis Details:</b>", c_styles['h2']))
    story.append(Paragraph(compare_data['gap_analysis'], c_styles['body']))
    
    story.append(Spacer(1, 15))
    
    # 3. Side-by-side Gaps Table
    story.append(Paragraph("3. Target Gaps & Missing Controls", c_styles['h1']))
    
    gaps_a = ", ".join(company_a['primary_gaps']) if company_a['primary_gaps'] else "None"
    gaps_b = ", ".join(company_b['primary_gaps']) if company_b['primary_gaps'] else "None"
    
    gaps_data = [
        ["Organization", "Primary Missing Controls / Risk Findings"],
        [company_a['name'], gaps_a],
        [company_b['name'], gaps_b]
    ]
    t_gaps = Table(gaps_data, colWidths=[2.2 * inch, 4.8 * inch])
    t_gaps.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_gaps)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("4. GRC Recommendations", c_styles['h1']))
    story.append(Paragraph(
        "For the lower-scoring entity, it is critical to address high-severity omissions. "
        "1. Appoint a designated Grievance Officer and display contacts clearly in the privacy notice.\n"
        "2. Implement minor age gates and request parental verification to align with children's data provisions (Section 9).\n"
        "3. Decouple general Terms of Service acceptance from privacy notice consent checkboxes to guarantee granular consent.",
        c_styles['body']
    ))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("5. Appendix & Disclaimers", c_styles['h1']))
    story.append(Paragraph(
        "This GRC comparison report is rendered by AuditWeave AI's hybrid validation engine based on India's DPDP Act 2023. "
        "It provides a structural audit comparison and does not constitute formal legal counsel. For regulatory implementation plans, "
        "consult qualified data privacy attorneys.",
        ParagraphStyle('DisclaimerComp', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))
    ))
    
    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _markdown_blocks_to_pdf_story(text: str, c_styles: dict) -> list:
    """Convert remediated policy Markdown into ReportLab flowables."""
    story = []
    for block in re.split(r"\n{2,}", text.strip()):
        block = block.strip()
        if not block:
            continue
        if block.startswith("### "):
            story.append(Paragraph(block[4:], c_styles["h2"]))
        elif block.startswith("## "):
            story.append(Paragraph(block[3:], c_styles["h1"]))
        elif block.startswith("# "):
            story.append(Paragraph(block[2:], c_styles["title"]))
        elif block.startswith("---"):
            story.append(Spacer(1, 12))
        else:
            for line in block.split("\n"):
                line = line.strip()
                if line:
                    story.append(Paragraph(line, c_styles["body"]))
        story.append(Spacer(1, 6))
    return story


def generate_remediated_policy_pdf(remediated_text: str, company_name: str) -> bytes:
    """Generate a branded PDF of the remediated privacy policy."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    c_styles = get_grc_styles()
    story = []

    story.append(Paragraph("AuditWeave AI", ParagraphStyle(
        "BrandRemed", parent=c_styles["title"], fontSize=14,
        textColor=colors.HexColor("#0F172A"), spaceAfter=5,
    )))
    story.append(Paragraph(
        "DPDP Compliance Intelligence Platform",
        ParagraphStyle(
            "BrandTagRemed", parent=c_styles["subtitle"], fontSize=9,
            textColor=colors.HexColor("#0284C7"), spaceAfter=20,
        ),
    ))
    story.append(Paragraph(
        f"Remediated Privacy Policy — {company_name}",
        c_styles["title"],
    ))
    story.append(Paragraph(
        f"Generated {datetime.datetime.utcnow().strftime('%B %d, %Y')} · "
        "Replace all [PLACEHOLDER] values before publishing.",
        ParagraphStyle(
            "RemedDisclaimer", parent=c_styles["subtitle"], fontSize=9,
            textColor=colors.HexColor("#64748B"), spaceAfter=20,
        ),
    ))
    story.append(Spacer(1, 10))
    story.extend(_markdown_blocks_to_pdf_story(remediated_text, c_styles))

    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_remediated_policy_docx(remediated_text: str, company_name: str) -> bytes:
    """Generate a DOCX of the remediated privacy policy."""
    doc = Document()
    doc.add_heading(f"Remediated Privacy Policy — {company_name}", 0)
    disclaimer = doc.add_paragraph(
        "Generated by AuditWeave · DPDP Act 2023 Compliance Remediation. "
        "Replace all [PLACEHOLDER] values with verified organisation details "
        "before publishing."
    )
    disclaimer.runs[0].italic = True
    doc.add_paragraph("")

    for block in re.split(r"\n{2,}", remediated_text.strip()):
        block = block.strip()
        if not block or block == "---":
            continue
        if block.startswith("### "):
            doc.add_heading(block[4:], level=2)
        elif block.startswith("## "):
            doc.add_heading(block[3:], level=1)
        elif block.startswith("# "):
            doc.add_heading(block[2:], level=0)
        else:
            for line in block.split("\n"):
                line = line.strip()
                if line:
                    doc.add_paragraph(line)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    docx_bytes = buffer.getvalue()
    buffer.close()
    return docx_bytes
