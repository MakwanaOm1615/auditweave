# 🛡️ AuditWeave AI — Enterprise Data Protection & GRC Compliance Auditor

**AuditWeave AI** is a state-of-the-art Governance, Risk, and Compliance (GRC) platform designed to perform automated, explainable compliance audits of enterprise privacy policies against India's statutory **Digital Personal Data Protection (DPDP) Act 2023**.

---

## 🌟 Key Features

1. **⚡ Single & Multi-Format Policy Audit (`/audit/new`)**:
   - Accepts Privacy Policy **Web URLs**, **Raw Text**, or **Uploaded Files** (`.pdf`, `.docx`).
   - Powered by a **Fail-Safe Multi-Stage Extractor** combining Next.js SPA state parsing, BeautifulSoup DOM cleaning, and Jina AI Web Reader (`r.jina.ai`) fallback to extract full policies from complex SPAs or bot-protected sites (e.g., Swiggy, Paytm, Flipkart).

2. **📊 Multi-Company Batch Compliance Audit (`/audit/batch`)**:
   - Audit multiple enterprise policies simultaneously.
   - Input URLs, text, or files for multiple companies at once.
   - Generates an **11-Pillar Side-by-Side Comparative Matrix**, identifies the benchmark winner, and presents individual GRC scorecards.

3. **📜 Compliance Audit History & Management (`/history`)**:
   - Full historical registry of all completed audits with company domain badges, industry tags, risk status badges, and rule counts.
   - Real-time search by company or domain, industry sector filters, and single-click **Audit Deletion**.

4. **📑 Executive PDF Report Generator**:
   - Generates statutory compliance audit PDF reports with penalty caps (up to ₹250 Crore under Sec 8(5) & Sec 8(6)), compliance scores, risk matrices, and actionable technical/legal recommendations using ReportLab.

5. **🤖 AI Copilot & Clause Rewriter**:
   - Interactive AI Copilot grounded strictly in the official **DPDP Act 2023 PDF** (`backend/app/knowledge_base/DPDP_Act_2023.pdf`).
   - One-click legally compliant clause rewriter to turn non-compliant clauses into compliant ones.

---

## 🛠️ Complete Technology Stack

### **Frontend Stack**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling & Design**: [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism Theme (Dark mode, Vibrant Gradients)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Native Fetch API with custom TypeScript wrapper (`src/lib/api.ts`)

### **Backend Stack**
- **Language**: Python 3.11+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI Web Framework)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) + SQLite (`AuditWeave.db`)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)

### **Text Extraction & Web Scraping Pipeline**
- **SPA & DOM Parser**: `BeautifulSoup4` + `requests`
- **SPA Hydration State Extractor**: Custom JSON state extractor for Next.js `__NEXT_DATA__` & Nuxt state payloads
- **Web Reader API Fallback**: [Jina AI Web Reader (`r.jina.ai`)](https://jina.ai/) for bot-protected/Cloudflare SPA pages
- **Document Extractors**: `PyPDF` (for PDF documents), `python-docx` (for Word documents)

### **AI & Statutory Compliance Engine**
- **Statutory Knowledge Base**: Grounded in official **DPDP Act 2023 PDF** (`backend/app/knowledge_base/DPDP_Act_2023.pdf`) via RAG text chunking & keyword overlap retrieval.
- **AI Engine**: Google Gemini API (`google.generativeai`) with high-fidelity GRC mock engine fallback.
- **Rule Engine**: 11-Pillar Hybrid Compliance Engine (`rule_engine.py`) covering all DPDP Act statutory mandates.

### **PDF Report Generator**
- **Engine**: [ReportLab](https://www.reportlab.com/) Python PDF Library

---

## ⚖️ Grounded DPDP Act 2023 Statutory Framework (11 Pillars)

| Statutory Pillar | DPDP Section | Description & Penalty Cap |
| :--- | :--- | :--- |
| **Notice & Transparency** | Section 5 | Itemized notice in English & 22 8th Schedule languages before data collection. |
| **Explicit & Free Consent** | Section 6 | Unbundled, affirmative consent; clear opt-in requirements. |
| **Purpose Limitation** | Section 7 | Data processed strictly for specified lawful purpose. |
| **Data Retention & Erasure** | Section 8(7) | Mandatory erasure when purpose is fulfilled or consent withdrawn. |
| **Protection of Minors** | Section 9 | Verifiable parental consent; no behavioral tracking/targeted ads for children (<18). |
| **Grievance Officer Contact** | Section 13 | Mandatory publication of Nodal/Grievance Officer contact details. |
| **Withdrawal of Consent** | Section 6(4) | Right to withdraw consent as easily as it was given. |
| **Data Principal Rights** | Section 11-14 | Rights to access, summary of data processed, correction, and erasure. |
| **Security Safeguards** | Section 8(5) | Reasonable security safeguards; penalty cap **up to ₹250 Crore**. |
| **Breach Notification** | Section 8(6) | Mandatory reporting of data breaches; penalty cap **up to ₹200 Crore**. |
| **Cross-Border Transfers** | Section 16 | Compliance with Central Government negative list for international transfers. |

---

## 📂 Project Directory Structure

```
AuditWeave - AI/
├── backend/
│   ├── app/
│   │   ├── api/                  # Extra routing modules
│   │   ├── knowledge_base/       # DPDP Act 2023 PDF & RAG chunks
│   │   │   ├── DPDP_Act_2023.pdf
│   │   │   └── dpdp_chunks.json
│   │   ├── services/             # Core Business Logic & AI Engines
│   │   │   ├── gemini.py         # AI Copilot & Analysis Engine
│   │   │   ├── parser.py         # Document & Web URL Parser
│   │   │   ├── pdf_generator.py  # ReportLab PDF Generator
│   │   │   ├── retrieval.py     # RAG Retrieval Engine for DPDP PDF
│   │   │   ├── rule_engine.py    # 11-Pillar Hybrid Compliance Engine
│   │   │   └── text_extractor.py # Multi-Stage Web & Document Extractor
│   │   ├── auth.py               # JWT & Guest Authentication
│   │   ├── database.py           # SQLAlchemy Database Session
│   │   ├── main.py               # FastAPI App & Endpoints
│   │   ├── models.py             # SQLAlchemy Database Models
│   │   └── schemas.py            # Pydantic Schemas
│   ├── AuditWeave.db             # SQLite Database File
│   ├── requirements.txt          # Python Dependencies
│   └── venv/                     # Python Virtual Environment
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── audit/
│   │   │   │   ├── [id]/         # GRC Audit Report Detail View
│   │   │   │   ├── batch/        # Multi-Company Batch Audit Page
│   │   │   │   └── new/          # New Audit Submission Page
│   │   │   ├── history/          # Audit History Registry Page
│   │   │   ├── contact/          # Support Page
│   │   │   ├── globals.css       # Tailwind CSS & Glassmorphism Theme
│   │   │   └── layout.tsx        # App Root Layout & Sidebar Navigation
│   │   └── lib/
│   │       └── api.ts            # Frontend REST API Client
│   ├── package.json              # Node.js Dependencies
│   ├── tailwind.config.js        # Tailwind Theme Config
│   └── tsconfig.json             # TypeScript Config
└── README.md
```

---

## 🚀 Step-by-Step Local Setup & Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11.0 or higher
- **Git**: Installed

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/AuditWeave-ai.git
cd AuditWeave-ai
```

---

### Step 2: Set Up Backend (FastAPI)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file inside `backend/` (optional for Gemini API key):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=sqlite:///./AuditWeave.db
   SECRET_KEY=your_jwt_secret_key_here
   ```

5. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The FastAPI backend will run on `http://127.0.0.1:8000`.*

---

### Step 3: Set Up Frontend (Next.js)

1. Open a new terminal window and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The Next.js frontend will run on `http://localhost:3000`.*

---

## 🧪 Testing the Application

1. Open your browser and go to `http://localhost:3000`.
2. **Single Audit**: Click **Compliance Auditor** (`/audit/new`) and enter a company name, industry, and paste a Privacy Policy Web URL (e.g., `https://www.swiggy.com/privacy-policy`).
3. **Batch Audit**: Click **Batch Multi-Audit** (`/audit/batch`), add multiple companies, and click **Run Multi-Company Batch Audit** to view the 11-pillar comparative matrix.
4. **Audit History**: Click **Audit History** (`/history`) to search, view, download PDFs, or delete past audit records.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
