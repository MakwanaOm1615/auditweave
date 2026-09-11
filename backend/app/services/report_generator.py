import datetime
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def get_grc_styles():
    """Initializes and returns common stylesheet typography styles."""
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    
    evidence_style = ParagraphStyle(
        'EvidenceText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#D97706'),
        spaceAfter=6,
        leftIndent=15
    )
    
    meta_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
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

def generate_report_pdf(audit_data: dict) -> bytes:
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
    
    # Header Brand
    story.append(Paragraph("PolicyLens AI", ParagraphStyle('Brand', parent=c_styles['title'], fontSize=12, textColor=colors.HexColor('#0F172A'), spaceAfter=2)))
    story.append(Paragraph("DPDP Compliance Intelligence Platform", ParagraphStyle('BrandTag', parent=c_styles['subtitle'], fontSize=8, textColor=colors.HexColor('#0284C7'), spaceAfter=15)))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("Digital Personal Data Protection (DPDP) Act 2023 Compliance Report", c_styles['title']))
    
    company_name = audit_data.get("company_name", "N/A")
    industry = audit_data.get("industry", "N/A")
    policy_name = audit_data.get("policy_name", "N/A")
    timestamp = audit_data.get("timestamp", "N/A")
    
    story.append(Paragraph(f"Audited Entity: <b>{company_name}</b> ({industry}) | Document: <b>{policy_name}</b>", c_styles['subtitle']))
    
    # Metadata Table
    report_id = f"PL-AUD-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"
    meta_data = [
        [Paragraph("Report ID:", c_styles['meta']), Paragraph(report_id, c_styles['body'])],
        [Paragraph("Audit Date:", c_styles['meta']), Paragraph(timestamp, c_styles['body'])],
        [Paragraph("Statutory Framework:", c_styles['meta']), Paragraph("India DPDP Act 2023", c_styles['body'])],
        [Paragraph("Overall Compliance Score:", c_styles['meta']), Paragraph(f"<b>{audit_data['compliance_score']}/100</b>", c_styles['body'])],
        [Paragraph("Compliance Verdict:", c_styles['meta']), Paragraph(f"<b>{audit_data['status']}</b>", c_styles['body'])]
    ]
    
    t_meta = Table(meta_data, colWidths=[2.0 * inch, 4.5 * inch])
    t_meta.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_meta)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("1. Executive Summary", c_styles['h1']))
    
    # Generate executive summary paragraph dynamically if not in data
    score = audit_data["compliance_score"]
    status_label = audit_data["status"]
    
    summary_text = (
        f"PolicyLens AI completed a comprehensive GRC compliance audit for {company_name}. "
        f"The privacy policy was parsed and analyzed against India's DPDP Act 2023. "
        f"The document received a score of <b>{score}/100</b>, indicating a <b>{status_label}</b> posture. "
        f"The analysis assessed 11 critical legal compliance pillars. The system identified "
        f"{audit_data.get('rules_passed_count', 0)} fully compliant elements and "
        f"{audit_data.get('rules_failed_count', 0)} gaps or warning areas that require immediate remediation."
    )
    story.append(Paragraph(summary_text, c_styles['body']))
    
    # GRC Metrics Table
    story.append(Spacer(1, 10))
    metric_data = [
        ["Compliance Score", "Vulnerability Risk", "Pillars Passed", "Gaps Found", "AI Confidence"],
        [f"{score}%", f"{audit_data['risk_score']}%", f"{audit_data['rules_passed_count']}", f"{audit_data['rules_failed_count']}", f"{int(audit_data['ai_confidence_score'] * 100)}%"]
    ]
    t_metrics = Table(metric_data, colWidths=[1.3 * inch, 1.3 * inch, 1.3 * inch, 1.3 * inch, 1.3 * inch])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_metrics)
    
    story.append(PageBreak())
    
    # Heatmap Section
    story.append(Paragraph("2. DPDP Pillar Heatmap Analysis", c_styles['h1']))
    story.append(Paragraph("The hybrid engine checked the policy against the 11 core pillars of the DPDP Act 2023, yielding the following posture map:", c_styles['body']))
    story.append(Spacer(1, 10))
    
    heatmap_rows = [["DPDP Pillar", "Score", "Compliance Status", "Section Referenced"]]
    
    for f in audit_data["findings"]:
        p_name = f["pillar"]
        p_score = f.get("score", 0)
        p_status = f.get("status", "Fail")
        p_section = f.get("dpdp_section", "N/A")
        
        status_indicator = "🔴 FAIL"
        if p_status == "Pass":
            status_indicator = "🟢 PASS"
        elif p_status == "Partial":
            status_indicator = "🟡 PARTIAL"
            
        heatmap_rows.append([p_name, f"{p_score}/100", status_indicator, p_section])
        
    t_heatmap = Table(heatmap_rows, colWidths=[2.2 * inch, 1.2 * inch, 1.6 * inch, 1.5 * inch])
    t_heatmap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_heatmap)
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("3. Detailed Risk Findings & Evidence", c_styles['h1']))
    story.append(Paragraph("Each compliance finding is detailed below with the extracted policy text, statutory obligations, gap analyses, and recommendations.", c_styles['body']))
    
    # Findings story
    for idx, f in enumerate(audit_data["findings"]):
        f_story = []
        p_status = f.get("status", "Fail")
        
        # Color severity and status
        status_color = '#10B981' if p_status == "Pass" else ('#F59E0B' if p_status == "Partial" else '#EF4444')
        
        f_story.append(Spacer(1, 8))
        f_story.append(Paragraph(f"Finding {idx+1}: {f['pillar']}", c_styles['h2']))
        
        meta_line = (
            f"<b>Status:</b> <font color='{status_color}'><b>{p_status}</b></font> | "
            f"<b>Score:</b> {f['score']}/100 | "
            f"<b>Statutory Clause:</b> {f['dpdp_section']} | "
            f"<b>Risk Level:</b> {f.get('risk_level', 'High')}"
        )
        f_story.append(Paragraph(meta_line, ParagraphStyle('FindMeta', parent=c_styles['body'], fontSize=8.5, textColor=colors.HexColor('#475569'))))
        f_story.append(Paragraph(f"<b>Gap Analysis:</b> {f['why_it_passed_or_failed']}", c_styles['body']))
        
        # Evidence
        evidence = f.get("policy_evidence")
        if evidence and evidence != "Clause Missing. No supporting evidence found.":
            f_story.append(Paragraph("<b>Policy Evidence:</b>", ParagraphStyle('EvLabel', parent=c_styles['body'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#475569'))))
            f_story.append(Paragraph(f'"{evidence}"', c_styles['evidence']))
        else:
            f_story.append(Paragraph("<b>Policy Evidence:</b> <font color='#EF4444'><i>Clause Missing. No supporting evidence found.</i></font>", c_styles['body']))
            
        if f.get("business_impact"):
            f_story.append(Paragraph(f"<b>Business Impact:</b> {f['business_impact']}", c_styles['body']))
            
        # Recommendation
        recommended_fix = f.get("recommended_fix", f.get("recommendation", "N/A"))
        f_story.append(Paragraph(f"<b>Recommended Remedy:</b> {recommended_fix}", c_styles['body']))
        f_story.append(Spacer(1, 4))
        
        story.append(KeepTogether(f_story))
        
    story.append(Spacer(1, 15))
    story.append(Paragraph("4. Statutory Appendix & GRC Disclaimer", c_styles['h1']))
    story.append(Paragraph(
        "This audit report is generated automatically by PolicyLens AI's hybrid compliance engine. "
        "Every score and finding is mapped and grounded in retrieved excerpts of the Digital Personal Data Protection Act, 2023. "
        "This report is for GRC information purposes and does not constitute formal legal advice. "
        "Please consult a certified data protection attorney in India for regulatory filings.",
        ParagraphStyle('Disclaimer', parent=c_styles['body'], fontSize=7.5, leading=10, textColor=colors.HexColor('#64748B'))
    ))
    
    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
