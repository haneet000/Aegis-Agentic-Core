import sqlite3
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker
import os
from app.utils.logger import get_logger

logger = get_logger(__name__)

DATABASE_URL = "sqlite:///./orders.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """
    Initializes the database with real orders data if it doesn't exist.
    """
    if os.path.exists("./orders.db"):
        logger.info("Database already exists. Skipping initialization.")
        return

    logger.info("Initializing database with real data from orders.csv...")
    with sqlite3.connect("orders.db") as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                customer TEXT NOT NULL,
                product TEXT NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL,
                order_date TEXT NOT NULL
            )
        ''')
        
        csv_path = os.path.join(os.path.dirname(__file__), "..", "doc", "orders.csv")
        if not os.path.exists(csv_path):
            logger.error(f"Cannot find CSV at {csv_path}. Database will be empty.")
            return

        import csv
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data_to_insert = []
            for row in reader:
                order_id = row.get("order_id")
                customer = row.get("customer")
                product = row.get("product")
                status = row.get("status")
                date = row.get("order_date")
                try:
                    amount = float(row.get("amount") or 0.0)
                except ValueError:
                    amount = 0.0
                
                data_to_insert.append((order_id, customer, product, amount, status, date))
        
        cursor.executemany('''
            INSERT INTO orders (order_id, customer, product, amount, status, order_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', data_to_insert)
        conn.commit()
        logger.info(f"Successfully loaded {len(data_to_insert)} rows from CSV into SQLite.")

def execute_sql_query(query: str):
    """
    Safely executes a read-only SQL query.
    """
    logger.info(f"Executing SQL Query: {query}")
    query = query.strip()
    if not query.upper().startswith("SELECT"):
        return {"error": "Only SELECT queries are allowed for safety."}
        
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query))
            rows = [dict(row._mapping) for row in result]
            return rows
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        return {"error": str(e)}

def get_db_schema() -> str:
    return """
    Table: orders
    Columns:
    - order_id (TEXT, PRIMARY KEY)
    - customer (TEXT)
    - product (TEXT)
    - amount (REAL)
    - status (TEXT)
    - order_date (TEXT, format YYYY-MM-DD)
    """
