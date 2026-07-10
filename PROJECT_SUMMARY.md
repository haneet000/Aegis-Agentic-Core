# Dual-Mode Agentic RAG Chatbot

## Project Objective
Build a production-ready chatbot that automatically decides whether to answer from unstructured documents (Agentic RAG) or a structured SQL database (Text-to-SQL), or both. The application routes user questions to the correct tool intelligently.

## Features Implemented
1. **Agentic RAG**: Ingests PDF and Markdown files, chunks them, embeds them using `sentence-transformers`, stores them in ChromaDB, and retrieves relevant chunks to answer queries with citations.
2. **Text-to-SQL**: Generates SQL queries from natural language, executes them on an SQLite database (`orders`), and returns the results.
3. **Intelligent Router**: Routes queries to `RAG`, `SQL`, `BOTH`, or a `FALLBACK` using an LLM as a reasoning engine.
4. **Chat UI**: A clean, modern chat interface built with Next.js and Tailwind CSS that shows citations, generated SQL, and the tools used.

## Technologies Used
- **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
- **Backend**: FastAPI, Python 3.12
- **LLM**: Gemini 2.5 Flash
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
- **Databases**: ChromaDB (Vector), SQLite (Structured)
- **Containerization**: Docker, Docker Compose

## Architecture Decisions
- **FastAPI** was chosen for its high performance, async support, and auto-generated API documentation.
- **Gemini 2.5 Flash** provides the core reasoning for the router and Text-to-SQL at a very high speed and low cost.
- **ChromaDB** and **SQLite** are lightweight and embeddable, perfect for a self-contained demonstration and easy deployment.

## Routing Logic
The user intent is passed to a Gemini prompt which analyzes the question against descriptions of the SQL database schema and the document knowledge base. It outputs a JSON classification (`RAG`, `SQL`, `BOTH`, `FALLBACK`).

## RAG Pipeline
Documents are loaded and split into chunks using a recursive character text splitter. `sentence-transformers` generates embeddings, which are upserted into ChromaDB. During retrieval, we perform a similarity search to fetch the top `k` chunks as context for the LLM.

## SQL Pipeline
The database schema (`orders` table) is provided to Gemini. When an SQL intent is detected, Gemini outputs an SQLite query. The backend executes this query securely (read-only enforcement in prompt) and passes the results back to Gemini to synthesize an answer.

## Security Measures
- Environment variables for API keys.
- SQL query execution is strictly read-only (using prompt guardrails, and ideally DB permissions).
- Fallback for out-of-scope questions to prevent hallucinations.

## Folder Structure
```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── agents/
│   │   ├── rag/
│   │   ├── sql/
│   │   ├── router/
│   │   ├── services/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── components/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Deployment Strategy
- **Backend**: Render (via Dockerfile).
- **Frontend**: Vercel.

## Future Enhancements
- Add multi-user conversation history.
- Implement more robust SQL sandboxing.
- Expand vector search with hybrid search (BM25 + Dense).
