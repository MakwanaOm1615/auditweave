import os
import re
from pypdf import PdfReader

pdf_path = "backend/app/knowledge_base/DPDP_Act_2023.pdf"
reader = PdfReader(pdf_path)
full_text = ""
for page in reader.pages:
    page_text = page.extract_text()
    if page_text:
        full_text += f"\n{page_text}"

# Find all potential matches
pattern = re.compile(r'\n\s*(\d+)\.\s')
matches = list(pattern.finditer(full_text))

sections_pos = {}
current_target = 1
for m in matches:
    num = int(m.group(1))
    if num == current_target:
        sections_pos[num] = m.start()
        current_target += 1

print("Found sequential sections:", list(sections_pos.keys()))

# Now extract section text
sec_texts = {}
sorted_nums = sorted(list(sections_pos.keys()))
for idx, num in enumerate(sorted_nums):
    start = sections_pos[num]
    if idx + 1 < len(sorted_nums):
        end = sections_pos[sorted_nums[idx + 1]]
    else:
        end = len(full_text)
    
    # Extract the raw section text (excluding the header digits)
    # The header pattern matched is like \n\s*(\d+)\.\s
    text_segment = full_text[start:end].strip()
    sec_texts[num] = text_segment

print("Section 5 text length:", len(sec_texts.get(5, "")))
print("Section 5 snippet:")
print(repr(sec_texts.get(5, "")[:300]))

print("\nSection 6 text length:", len(sec_texts.get(6, "")))
print("Section 6 snippet:")
print(repr(sec_texts.get(6, "")[:300]))

print("\nSection 44 text length:", len(sec_texts.get(44, "")))
print("Section 44 snippet:")
print(repr(sec_texts.get(44, "")[:300]))
