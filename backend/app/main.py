import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env before other imports that might need it
load_dotenv()

from app.api.endpoints import router as api_router
from app.db.database import init_db
from app.rag.ingest import ingest_documents

app = FastAPI(title="Dual-Mode Agentic RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    ingest_documents()

app.include_router(api_router, prefix="/api")
