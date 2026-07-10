import os
import glob
import fitz  # PyMuPDF
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import re
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Initialize ChromaDB
client = chromadb.Client(Settings(is_persistent=True, persist_directory="./chroma_db"))
collection = client.get_or_create_collection(name="documents")

# Initialize Embedding Model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_chroma_collection():
    return collection

def get_embedding_model():
    return embedding_model

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def strip_markdown(text: str) -> str:
    """Basic markdown syntax stripping."""
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    # Remove links
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text

def ingest_documents(doc_dir: str = "./app/doc"):
    """
    Ingests actual PDF and Markdown files from the specified directory.
    """
    if doc_dir == "./app/doc":
        current_dir = os.path.dirname(os.path.abspath(__file__))
        doc_dir = os.path.abspath(os.path.join(current_dir, "..", "doc"))

    if not os.path.exists(doc_dir):
        logger.warning(f"Directory {doc_dir} does not exist. Skipping ingestion.")
        return

    # Delete existing data to prevent duplicates on restart (for clean ingestion)
    # In a real production system, you'd check for existing hashes/filenames.
    try:
        if collection.count() > 0:
            logger.info(f"Collection already has {collection.count()} chunks. Skipping re-ingestion.")
            return
    except Exception as e:
        pass

    pdf_files = glob.glob(os.path.join(doc_dir, "**/*.pdf"), recursive=True)
    md_files = glob.glob(os.path.join(doc_dir, "**/*.md"), recursive=True)

    total_chunks = 0

    # Process PDFs
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if not text.strip():
                    continue
                
                chunks = chunk_text(text)
                for i, chunk in enumerate(chunks):
                    embedding = embedding_model.encode(chunk).tolist()
                    collection.add(
                        embeddings=[embedding],
                        documents=[chunk],
                        metadatas=[{
                            "source": filename,
                            "type": "pdf",
                            "page": str(page_num + 1)
                        }],
                        ids=[f"{filename}_p{page_num+1}_c{i}"]
                    )
                    total_chunks += 1
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {e}")

    # Process Markdowns
    for md_path in md_files:
        filename = os.path.basename(md_path)
        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            clean_text = strip_markdown(content)
            if not clean_text.strip():
                continue
            
            chunks = chunk_text(clean_text)
            for i, chunk in enumerate(chunks):
                embedding = embedding_model.encode(chunk).tolist()
                collection.add(
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{
                        "source": filename,
                        "type": "markdown",
                        "page": "N/A"
                    }],
                    ids=[f"{filename}_c{i}"]
                )
                total_chunks += 1
        except Exception as e:
            logger.error(f"Error processing MD {filename}: {e}")
            
    logger.info(f"Ingestion complete. Total chunks ingested: {total_chunks}")
