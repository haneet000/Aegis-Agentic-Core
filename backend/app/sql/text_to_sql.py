import os
import json
from google import genai
from app.db.database import get_db_schema, execute_sql_query

def text_to_sql(query: str) -> dict:
    """
    Generates SQL from user query, executes it, and returns the result.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    schema = get_db_schema()

    prompt = f"""
You are an expert SQL assistant.
Given the following database schema:
{schema}

Write a valid SQLite SELECT query to answer the user's question.
Return ONLY the raw SQL query, no markdown formatting, no explanation.

User Question: {query}
"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    
    sql_query = response.text.strip()
    if sql_query.startswith("```sql"):
        sql_query = sql_query[6:-3].strip()
    elif sql_query.startswith("```"):
        sql_query = sql_query[3:-3].strip()

    # Execute SQL
    results = execute_sql_query(sql_query)
    
    # Generate natural language response
    nl_prompt = f"""
You are a helpful assistant. Answer the user's question based on the SQL query results.

User Question: {query}
SQL Query: {sql_query}
SQL Results: {json.dumps(results)}

Answer concisely and clearly.
"""
    nl_response_stream = client.models.generate_content_stream(
        model='gemini-2.5-flash',
        contents=nl_prompt,
    )
    
    for chunk in nl_response_stream:
        if chunk.text:
            yield {"type": "chunk", "content": chunk.text}
            
    yield {"type": "metadata", "sql_query": sql_query}
