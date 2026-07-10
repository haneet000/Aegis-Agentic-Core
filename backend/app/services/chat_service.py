import json
from app.router.intent_router import route_intent
from app.rag.retriever import retrieve_and_answer
from app.sql.text_to_sql import text_to_sql
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def process_chat_stream(query: str):
    logger.info(f"Received User Question: {query}")
    intent = route_intent(query)
    logger.info(f"Router Decision: {intent}")
    
    # We yield the intent immediately so the UI can show the ToolBadge early
    yield f"data: {json.dumps({'type': 'tool', 'tool_used': intent})}\n\n"
    
    if intent == "RAG":
        gen = retrieve_and_answer(query)
        for item in gen:
            yield f"data: {json.dumps(item)}\n\n"
            
    elif intent == "SQL":
        gen = text_to_sql(query)
        for item in gen:
            yield f"data: {json.dumps(item)}\n\n"
            
    elif intent == "BOTH":
        # Yield RAG first
        yield f"data: {json.dumps({'type': 'chunk', 'content': '**From Documents:**\\n'})}\n\n"
        
        rag_citations = []
        rag_gen = retrieve_and_answer(query)
        for item in rag_gen:
            if item["type"] == "chunk":
                yield f"data: {json.dumps(item)}\n\n"
            elif item["type"] == "metadata":
                rag_citations = item.get("citations", [])
                
        yield f"data: {json.dumps({'type': 'chunk', 'content': '\\n\\n**From Database:**\\n'})}\n\n"
        
        sql_query = ""
        sql_gen = text_to_sql(query)
        for item in sql_gen:
            if item["type"] == "chunk":
                yield f"data: {json.dumps(item)}\n\n"
            elif item["type"] == "metadata":
                sql_query = item.get("sql_query", "")
                
        yield f"data: {json.dumps({'type': 'metadata', 'citations': rag_citations, 'sql_query': sql_query})}\n\n"
        
    else:
        # Fallback
        msg = "I'm sorry, but I can only answer questions related to company policies (documents) or our orders database."
        yield f"data: {json.dumps({'type': 'chunk', 'content': msg})}\n\n"
        yield f"data: {json.dumps({'type': 'metadata'})}\n\n"

    # End of stream marker
    yield "data: [DONE]\n\n"
