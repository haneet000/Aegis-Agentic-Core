from pydantic import BaseModel
from typing import List, Optional, Literal

class Citation(BaseModel):
    source: str
    content: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    tool_used: Literal["RAG", "SQL", "BOTH", "FALLBACK"]
    citations: Optional[List[Citation]] = None
    sql_query: Optional[str] = None
