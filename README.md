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

### Running Locally (Docker)
To run the full stack locally:
```bash
docker-compose up --build
```
Frontend will be available at `http://localhost:3000`.
Backend API will be at `http://localhost:8000/api`.

### Running Locally (Manual)
**Backend:**
```bash
cd backend
pip install -r requirements.txt
```
**Add Documents (RAG):**
Place any `.pdf` or `.md` files you want to index into `backend/app/doc/`. The backend will automatically parse, chunk, and embed them using `PyMuPDF` upon startup.

```bash
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Deployment on Render (Backend)
1. Connect your repository to Render.
2. Create a new "Web Service".
3. Choose Docker as the runtime.
4. Set the Root Directory to `backend`.
5. Add the `GEMINI_API_KEY` environment variable.

### Deployment on Vercel (Frontend)
1. Connect your repository to Vercel.
2. Set the Framework Preset to Next.js.
3. Set the Root Directory to `frontend`.
4. Add the `NEXT_PUBLIC_API_URL` pointing to your deployed Render URL.

## API Endpoints
- `POST /api/chat`: Send a message to the chatbot. Returns a **Server-Sent Events (SSE)** stream.
  - Streams token-by-token using `yield "data: {...}\n\n"`.
  - JSON chunk types: `tool` (intent), `chunk` (text), and `metadata` (citations/SQL queries).

## Known Limitations
- Text-to-SQL operates under the assumption of a static, simple SQLite schema for demonstration purposes.
- ChromaDB is used locally; in production, you might want to use a managed vector database (like Pinecone or Qdrant).
