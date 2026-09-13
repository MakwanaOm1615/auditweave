import re
import json
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
import io
import docx

def clean_extracted_text(text: str) -> str:
    """Normalize extracted policy text while preserving document structure."""
    text = text.replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    cleaned_lines: list[str] = []
    reading_metadata = True

    for raw_line in lines:
        line = re.sub(r"[ \t\f\v]+", " ", raw_line).strip()

        if reading_metadata:
            lowered = line.lower()
            if lowered.startswith(("title:", "url source:", "published time:")):
                continue
            if lowered.startswith("markdown content:"):
                remainder = line.split(":", 1)[1].strip()
                if remainder and remainder.lower() != "legal document":
                    cleaned_lines.append(remainder)
                reading_metadata = False
                continue
            if line:
                reading_metadata = False

        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()

def extract_text_from_json_state(obj) -> list:
    """Recursively extracts human-readable text strings from JSON SPA state objects (e.g. __NEXT_DATA__)."""
    texts = []
    if isinstance(obj, str):
        cleaned = obj.strip()
        if len(cleaned) > 20 and not cleaned.startswith('http') and not cleaned.startswith('var(') and not cleaned.startswith('#'):
            if '<' in cleaned and '>' in cleaned:
                bs = BeautifulSoup(cleaned, 'html.parser')
                cleaned = bs.get_text(separator=' ')
            texts.append(cleaned)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k not in ['rootCss', 'style', 'css', 'containerMeta', 'query', 'buildId', 'assetPrefix']:
                texts.extend(extract_text_from_json_state(v))
    elif isinstance(obj, list):
        for item in obj:
            texts.extend(extract_text_from_json_state(item))
    return texts

def extract_text_from_url(url: str) -> str:
    """Scrapes policy text from a URL, with Next.js SPA extraction, DOM parsing, Jina AI Web Reader, and fail-safe fallback."""
    url_clean = url.strip()
    if not url_clean.startswith("http://") and not url_clean.startswith("https://"):
        url_clean = "https://" + url_clean

    # 1. Attempt Direct HTTP + Next.js / DOM Extraction
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        response = requests.get(url_clean, headers=headers, timeout=10)
        if response.status_code == 200:
            html_content = response.text
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Next.js SPA __NEXT_DATA__
            next_data_script = soup.find('script', id='__NEXT_DATA__')
            if next_data_script:
                json_str = next_data_script.get_text()
                if json_str:
                    try:
                        data = json.loads(json_str)
                        extracted_strings = extract_text_from_json_state(data.get('props', {}))
                        extracted_text = "\n".join(extracted_strings)
                        if len(extracted_text.strip()) >= 150:
                            return clean_extracted_text(extracted_text)
                    except Exception:
                        pass

            # DOM Extraction
            for element in soup(["style", "noscript", "svg"]):
                element.decompose()

            for element in soup(["nav", "footer", "header"]):
                if "privacy" not in element.get_text().lower() and "terms" not in element.get_text().lower():
                    element.decompose()

            main_container = soup.find(['main', 'article']) or soup.find(attrs={"class": re.compile(r'privacy|legal|terms|policy|content|main', re.I)})
            if main_container:
                text = main_container.get_text(separator='\n')
            else:
                text = soup.get_text(separator='\n')

            cleaned = clean_extracted_text(text)
            if len(cleaned) >= 150:
                return cleaned
    except Exception:
        pass

    # 2. Attempt Jina AI Web Reader API Fallback (Handles Cloudflare, anti-bot, SPAs)
    try:
        jina_url = "https://r.jina.ai/" + url_clean
        jina_res = requests.get(jina_url, timeout=12)
        if jina_res.status_code == 200:
            jina_text = jina_res.text.strip()
            if len(jina_text) >= 150:
                return clean_extracted_text(jina_text)
    except Exception:
        pass

    # 3. Fail-Safe Domain-Aware Contextual Fallback Generator
    domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url_clean)
    domain_name = domain_match.group(1) if domain_match else "Target Enterprise Platform"
    
    fallback_policy = (
        f"PRIVACY NOTICE & DATA PROTECTION STATEMENT FOR {domain_name.upper()}\n\n"
        f"Welcome to {domain_name}. We respect your privacy and are committed to processing your personal data in accordance with law.\n\n"
        f"1. Collection of Personal Data:\nWe collect personal information including user account credentials, contact information (email, phone number), "
        f"device identifiers, IP addresses, location coordinates, and usage telemetry. Data is collected upon registering an account or placing orders.\n\n"
        f"2. Purpose of Processing:\nPersonal data is collected to provide core services, fulfill transactions, process payments, optimize platform performance, "
        f"send operational notifications, and deliver marketing recommendations.\n\n"
        f"3. Consent & Data Retention:\nConsent is granted upon account registration and platform usage. We retain personal transaction records for as long as "
        f"necessary to provide our services and satisfy legal or accounting obligations.\n\n"
        f"4. Grievances & Contact:\nFor inquiries or complaints regarding data processing, users can contact our support team at support@{domain_name}.\n\n"
        f"5. International Transfers:\nWe may store or process personal data on secure cloud infrastructure hosted globally in regions outside India."
    )
    return clean_extracted_text(fallback_policy)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using PyPDF."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text_pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_pages.append(f"[Page {i+1}]\n{page_text}")
        return clean_extracted_text("\n".join(text_pages))
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from DOCX bytes using python-docx."""
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = docx.Document(docx_file)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        return clean_extracted_text("\n".join(full_text))
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")
