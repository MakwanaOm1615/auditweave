import os
import re
import json
import logging
from pypdf import PdfReader
import google.generativeai as genai
from ..utils.helpers import load_env

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_env()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

KB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_base")
PDF_PATH = os.path.join(KB_DIR, "DPDP_Act_2023.pdf")
JSON_PATH = os.path.join(KB_DIR, "dpdp_chunks.json")

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    return sum(x * x for x in v) ** 0.5

def cosine_similarity(v1, v2):
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0
    return dot_product(v1, v2) / (mag1 * mag2)

def chunk_section(text: str, section_num: int, min_words: int = 300, max_words: int = 600) -> list:
    """Chunks a section text into pieces between 300 and 600 words."""
    words = text.split()
    if len(words) <= max_words:
        return [{
            "section": f"Section {section_num}",
            "text": text,
            "word_count": len(words)
        }]
    
    chunks = []
    chunk_size = 400
    overlap = 100
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        if not chunk_words:
            break
        if len(chunk_words) < 100 and chunks:
            # Append remaining words to last chunk
            chunks[-1]["text"] += " " + " ".join(chunk_words)
            chunks[-1]["word_count"] = len(chunks[-1]["text"].split())
            break
        
        chunks.append({
            "section": f"Section {section_num}",
            "text": " ".join(chunk_words),
            "word_count": len(chunk_words)
        })
    return chunks

def build_knowledge_base_if_needed():
    """Reads the PDF, splits it sequentially, chunks it, embeds it, and saves it locally."""
    if os.path.exists(JSON_PATH):
        logger.info(f"Knowledge base already initialized at {JSON_PATH}")
        return
    
    if not os.path.exists(PDF_PATH):
        logger.error(f"DPDP Act PDF not found at {PDF_PATH}")
        raise FileNotFoundError(f"Missing mandatory DPDP Act 2023 PDF at: {PDF_PATH}")
    
    logger.info("Initializing knowledge base from DPDP Act 2023 PDF...")
    reader = PdfReader(PDF_PATH)
    full_text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            full_text += f"\n{page_text}"
            
    # Sequential extraction of sections 1 to 44
    pattern = re.compile(r'\n\s*(\d+)\.\s')
    matches = list(pattern.finditer(full_text))
    
    sections_pos = {}
    current_target = 1
    for m in matches:
        num = int(m.group(1))
        if num == current_target:
            sections_pos[num] = m.start()
            current_target += 1
            
    sorted_nums = sorted(list(sections_pos.keys()))
    chunks = []
    
    # Extract sections and chunk
    for idx, num in enumerate(sorted_nums):
        start = sections_pos[num]
        end = sections_pos[sorted_nums[idx + 1]] if idx + 1 < len(sorted_nums) else len(full_text)
        section_text = full_text[start:end].strip()
        
        section_chunks = chunk_section(section_text, num)
        chunks.extend(section_chunks)
        
    logger.info(f"Split PDF into {len(chunks)} text chunks. Generating embeddings using models/text-embedding-004...")
    
    # Generate embeddings
    if not api_key:
        logger.warning("No GEMINI_API_KEY set. Embeddings will be generated as empty vectors for testing purposes.")
        for chunk in chunks:
            chunk["embedding"] = [0.0] * 768
    else:
        for idx, chunk in enumerate(chunks):
            try:
                logger.info(f"Embedding chunk {idx+1}/{len(chunks)} (Section {chunk['section']})")
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=chunk["text"],
                    task_type="retrieval_document"
                )
                chunk["embedding"] = result["embedding"]
            except Exception as e:
                logger.error(f"Failed to embed chunk {idx+1}: {e}")
                chunk["embedding"] = [0.0] * 768
                
    # Save to json file
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    logger.info(f"Knowledge base saved successfully at {JSON_PATH}")

def retrieve_relevant_sections(query: str, top_k: int = 3) -> list:
    """Generates embedding for the query and returns the top_k most similar chunks from the DPDP Act."""
    build_knowledge_base_if_needed()
    
    if not os.path.exists(JSON_PATH):
        return []
        
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        chunks = json.load(f)
        
    if not chunks:
        return []
        
    # Get query embedding
    query_vector = None
    if api_key:
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )
            query_vector = result["embedding"]
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            
    if not query_vector:
        # Fallback to simple keyword overlap if embedding generation fails
        logger.warning("Falling back to keyword overlap for retrieval.")
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_chunks = []
        for c in chunks:
            c_words = set(re.findall(r'\w+', c["text"].lower()))
            overlap = len(query_words.intersection(c_words))
            scored_chunks.append((overlap, c))
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:top_k]]
        
    # Perform cosine similarity search
    scored_chunks = []
    for c in chunks:
        sim = cosine_similarity(query_vector, c["embedding"])
        scored_chunks.append((sim, c))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Return chunks with similarity score added to metadata
    results = []
    for score, chunk in scored_chunks[:top_k]:
        chunk_copy = chunk.copy()
        chunk_copy["similarity"] = score
        results.append(chunk_copy)
        
    return results
