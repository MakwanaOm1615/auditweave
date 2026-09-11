import re
import io
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
import docx

def clean_extracted_text(text: str) -> str:
    """Removes excessive whitespace and standardizes formatting, keeping basic newlines."""
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t\r\f\v]+', ' ', text)
    # Replace multiple newlines with a single newline
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

from .text_extractor import extract_text_from_url

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
