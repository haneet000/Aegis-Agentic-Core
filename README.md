# Dual-Mode Agentic RAG Chatbot

## Project Overview
A production-ready chatbot that intelligently routes user questions to either an unstructured document knowledge base (Agentic RAG) or a structured SQL database (Text-to-SQL).

## Features
- Agentic RAG with citations.
- Text-to-SQL on an SQLite database.
- Intelligent intent routing using Gemini.
- Full-stack integration (FastAPI + Next.js).
- Clean chat interface.

## Architecture
Frontend: Next.js + Tailwind CSS.
Backend: FastAPI + Gemini 2.5 Flash + ChromaDB + SQLite + sentence-transformers.

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, TypeScript
- Backend: FastAPI, Python 3.12, Uvicorn
- LLM: Gemini 2.5 Flash
- Vector Store: ChromaDB
- Relational DB: SQLite

## Folder Structure
- `/backend`: FastAPI Python application.
- `/frontend`: Next.js application.

## Installation

### Prerequisites
- Docker & Docker Compose
- Gemini API Key

### Environment Variables
Copy `.env.example` to `.env` and fill in your Gemini API key:
```bash
cp .env.example .env
```

### Quick Start (Recommended - Docker)
1. **Set Environment Variables**:
   Copy `.env.example` to `.env` and enter your `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
2. **Build and Run**:
   Spin up the frontend and backend services:
   ```bash
   docker compose up --build
   ```
3. **Access the Applications**:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

*Note: On startup, the backend automatically initializes the SQLite database from `orders.csv` and populates the ChromaDB index by parsing the PDF documents in `backend/app/doc/`.*

### Manual Local Execution (Fallback)
If you prefer to run the services bare-metal:

**1. Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

### `POST /api/chat`
Sends a message to the chatbot and returns a real-time **Server-Sent Events (SSE)** stream.

- **Request Body**:
  ```json
  {
    "message": "What is the status of order ORD-1001?"
  }
  ```
- **Stream Response Chunk Types**:
  - `tool`: The selected intent routing (`RAG`, `SQL`, `BOTH`, or `FALLBACK`).
  - `chunk`: Real-time streaming content.
  - `metadata`: Citations for RAG or execution metadata like generated SQL query.

#### Test the API with `curl`
Use the following `curl` command (the `-N` or `--no-buffer` flag ensures real-time streaming output in your terminal):

```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who bought the Mechanical Keyboard under order ORD-1001?"}'
```

### Example Questions to Try
Test the chatbot's intelligent routing and dual-mode execution using these queries:

| Type | Intent/Route | Example Query |
| :--- | :--- | :--- |
| **SQL Database** | `SQL` | `"Show me all orders that are currently pending."`<br>`"What is the total amount spent on Mechanical Keyboards?"`<br>`"Who is the customer for order ORD-1002?"` |
| **RAG Docs** | `RAG` | `"What is the return policy and how many days do I have?"`<br>`"What is covered under the product warranty?"`<br>`"What are the rules for taking sick leave?"` |
| **Dual Mode** | `BOTH` | `"Who bought order ORD-1001, and what is the warranty policy for their product?"`<br>`"Check the amount for ORD-1003 and check if it qualifies for bulk discounts."` |
| **Fallback** | `FALLBACK` | `"What is the weather like in New York today?"`<br>`"How do I cook pasta?"` |

---

## Deployment
For details on deploying the application to production, refer to the [deployment_guide.md](file:///Users/haneet/.gemini/antigravity-ide/brain/0b358b6d-4efd-4e53-947f-ec0293deca56/deployment_guide.md).

## Known Limitations
- Text-to-SQL operates under the assumption of a static, simple SQLite schema for demonstration purposes.
- ChromaDB is used locally; in production, you might want to use a managed vector database (like Pinecone or Qdrant).

