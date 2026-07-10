import os
import json
from google import genai
from app.db.database import get_db_schema, execute_sql_query

def text_to_sql(query: str) -> dict:
    """
    Generates SQL from user query, executes it, and returns the result.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    schema = get_db_schema()

    sql_query = None

    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
You are an expert SQL assistant.
Given the following database schema:
{schema}

Write a valid SQLite SELECT query to answer the user's question.
Return ONLY the raw SQL query, no markdown formatting, no explanation.

User Question: {query}
"""
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
            )
            sql_query = response.text.strip()
            if sql_query.startswith("```sql"):
                sql_query = sql_query[6:-3].strip()
            elif sql_query.startswith("```"):
                sql_query = sql_query[3:-3].strip()
        except Exception as e:
            from app.utils.logger import get_logger
            logger = get_logger(__name__)
            logger.error(f"Gemini Text-to-SQL generation failed. EXACT EXCEPTION: {e.__class__.__name__}: {e}. Falling back to local heuristic SQL.")

    if not sql_query:
        # Heuristic local SQL generation
        q = query.lower()
        import re
        order_id_match = re.search(r'ord-?\d+', q)
        
        if order_id_match:
            raw_id = order_id_match.group(0).upper()
            if "-" not in raw_id and len(raw_id) > 3:
                order_id = f"ORD-{raw_id[3:]}"
            else:
                order_id = raw_id

            if "status" in q:
                sql_query = f"SELECT order_id, status FROM orders WHERE order_id = '{order_id}'"
            elif "amount" in q or "price" in q:
                sql_query = f"SELECT order_id, amount FROM orders WHERE order_id = '{order_id}'"
            elif "product" in q:
                sql_query = f"SELECT order_id, product FROM orders WHERE order_id = '{order_id}'"
            else:
                sql_query = f"SELECT * FROM orders WHERE order_id = '{order_id}'"
        elif "status" in q:
            status_match = None
            for s in ["delivered", "shipped", "pending", "cancelled", "processing"]:
                if s in q:
                    status_match = s.capitalize()
                    break
            if status_match:
                sql_query = f"SELECT order_id, customer, product, amount, status FROM orders WHERE status = '{status_match}' LIMIT 5"
            else:
                sql_query = "SELECT order_id, customer, status FROM orders LIMIT 5"
        elif "amount" in q or "total" in q or "sum" in q or "revenue" in q or "sales" in q:
            sql_query = "SELECT SUM(amount) as total_sales, AVG(amount) as average_order_value FROM orders"
        elif "customer" in q:
            customer_match = None
            words = query.split()
            for w in words:
                clean_w = re.sub(r'[^\w]', '', w)
                if clean_w and clean_w[0].isupper() and clean_w.lower() not in ["show", "list", "find", "order", "customer", "status", "product", "i", "what", "where"]:
                    customer_match = clean_w
                    break
            if customer_match:
                sql_query = f"SELECT order_id, customer, product, amount, status FROM orders WHERE customer LIKE '%{customer_match}%' LIMIT 5"
            else:
                sql_query = "SELECT customer, COUNT(order_id) as order_count, SUM(amount) as total_spent FROM orders GROUP BY customer ORDER BY total_spent DESC LIMIT 5"
        else:
            sql_query = "SELECT * FROM orders LIMIT 5"

    # Execute SQL
    results = execute_sql_query(sql_query)
    
    # Generate natural language response
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            nl_prompt = f"""
You are a helpful assistant. Answer the user's question based on the SQL query results.

User Question: {query}
SQL Query: {sql_query}
SQL Results: {json.dumps(results)}

Answer concisely and clearly.
"""
            nl_response_stream = client.models.generate_content_stream(
                model='gemini-1.5-flash',
                contents=nl_prompt,
            )
            for chunk in nl_response_stream:
                if chunk.text:
                    yield {"type": "chunk", "content": chunk.text}
            yield {"type": "metadata", "sql_query": sql_query}
            return
        except Exception as e:
            from app.utils.logger import get_logger
            logger = get_logger(__name__)
            logger.error(f"Gemini Text-to-SQL synthesis failed. EXACT EXCEPTION: {e.__class__.__name__}: {e}. Falling back to local synthesis.")

    # Mock Offline Synthesis
    yield {"type": "chunk", "content": f"**[Offline/Mock Mode]** Executed SQLite query: `{sql_query}`\n\n**Database Results:**\n\n"}
    if isinstance(results, list):
        if not results:
            yield {"type": "chunk", "content": "*No records found matching the query.*"}
        else:
            for row in results:
                row_str = " | ".join([f"**{k}**: {v}" for k, v in row.items()])
                yield {"type": "chunk", "content": f"- {row_str}\n"}
    else:
        yield {"type": "chunk", "content": f"Error executing query: {results.get('error', 'unknown error')}"}
        
    yield {"type": "metadata", "sql_query": sql_query}
