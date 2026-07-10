import os
import json
from google import genai
from app.db.database import get_db_schema
from app.utils.logger import get_logger

logger = get_logger(__name__)

def route_intent(query: str) -> str:
    """
    Returns one of: 'RAG', 'SQL', 'BOTH', 'FALLBACK'
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        logger.warning("No GEMINI_API_KEY environment variable found. Falling back to local heuristic routing.")
        q = query.lower()
        has_sql = any(w in q for w in ["order", "customer", "product", "amount", "status", "price", "sale", "date", "table"])
        has_rag = any(w in q for w in ["leave", "policy", "remote", "work", "handbook", "vacation", "sick", "holiday", "document"])
        if has_sql and has_rag:
            return "BOTH"
        elif has_sql:
            return "SQL"
        elif has_rag:
            return "RAG"
        else:
            return "FALLBACK"

    try:
        client = genai.Client(api_key=api_key)
        schema = get_db_schema()
        
        prompt = f"""
You are an intelligent router for a chatbot. 
You must decide which tool is best to answer the user's question.

We have two data sources:
1. SQL Database (Structured). Schema:
{schema}

2. Document Knowledge Base (Unstructured). 
Topics covered: Employee Handbooks, Leave Policies, Remote Work Policies.

Rules for routing:
- If the question can be answered entirely by querying the SQL Database (e.g. asking about orders, prices, customers), output "SQL".
- If the question can be answered entirely by the Document Knowledge Base (e.g. asking about leave, remote work), output "RAG".
- If the question requires information from BOTH sources, output "BOTH".
- If the question is completely unrelated to our company policies or orders, output "FALLBACK".

Respond ONLY with a valid JSON object in the following format:
{{"intent": "..."}}

User Question: {query}
"""

        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        intent = data.get("intent", "FALLBACK").upper()
        if intent not in ["RAG", "SQL", "BOTH", "FALLBACK"]:
            intent = "FALLBACK"
        return intent
    except Exception as e:
        logger.error(f"Gemini routing failed. EXACT EXCEPTION: {e.__class__.__name__}: {e}. Falling back to local heuristic routing.")
        q = query.lower()
        has_sql = any(w in q for w in ["order", "customer", "product", "amount", "status", "price", "sale", "date", "table"])
        has_rag = any(w in q for w in ["leave", "policy", "remote", "work", "handbook", "vacation", "sick", "holiday", "document"])
        if has_sql and has_rag:
            return "BOTH"
        elif has_sql:
            return "SQL"
        elif has_rag:
            return "RAG"
        else:
            return "FALLBACK"
