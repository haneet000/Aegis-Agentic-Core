import os
from google import genai
from app.rag.ingest import get_chroma_collection, get_embedding_model
from app.utils.logger import get_logger

logger = get_logger(__name__)

def retrieve_and_answer(query: str) -> dict:
    collection = get_chroma_collection()
    embedding_model = get_embedding_model()
    
    query_embedding = embedding_model.encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )
    
    contexts = results['documents'][0] if results['documents'] else []
    metadatas = results['metadatas'][0] if results['metadatas'] else []
    
    citations = []
    context_str = ""
    for i, ctx in enumerate(contexts):
        if i < len(metadatas):
            filename = metadatas[i].get("source", "Unknown Document")
            page = metadatas[i].get("page", "N/A")
            source = f"{filename} (Page {page})" if page != "N/A" else filename
        else:
            source = "Unknown Document"

        citations.append({"source": source, "content": ctx})
        context_str += f"\nSource: {source}\nContent: {ctx}\n"
        
    logger.info(f"RAG Retrieval retrieved {len(contexts)} contexts for query: {query}")
        
    api_key = os.environ.get("GEMINI_API_KEY")
    is_mock = not api_key or api_key.startswith("your_") or api_key.startswith("AQ.")
    
    if not is_mock:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
You are an intelligent assistant. Answer the user's question using ONLY the provided context from our knowledge base.
If the answer is not contained in the context, say so.

Context:
{context_str}

User Question: {query}
"""
            response_stream = client.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            for chunk in response_stream:
                if chunk.text:
                    yield {"type": "chunk", "content": chunk.text}
            yield {"type": "metadata", "citations": citations}
            return
        except Exception as e:
            logger.error(f"Gemini RAG synthesis failed: {e}. Falling back to local offline mode.")
            
    # Mock Offline Synthesis
    yield {"type": "chunk", "content": f"**[Offline/Mock Mode]** Here is the relevant information retrieved from our document base:\n\n"}
    for ctx in contexts:
        yield {"type": "chunk", "content": f"- {ctx.strip()}\n\n"}
    yield {"type": "metadata", "citations": citations}
