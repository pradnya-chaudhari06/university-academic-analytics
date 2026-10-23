"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Backend Database Connection & Engine Configuration
==============================================================================
Supports dual-mode execution:
1. PostgreSQL / Supabase (When SUPABASE_DB_URL or DATABASE_URL is set in environment)
2. Local Data Warehouse SQLite engine (database/warehouse_local.db for local ETL & dev)
"""

import os
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List

try:
    from dotenv import load_dotenv
    # Load from root workspace directory or current directory with override=True
    load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)
    load_dotenv(override=True)
except ImportError:
    pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "database"
LOCAL_DB_PATH = DB_DIR / "warehouse_local.db"

def get_database_url() -> Optional[str]:
    """Retrieve remote PostgreSQL / Supabase connection URL if configured."""
    return os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

_pg_checked: Optional[bool] = None
_pg_active: bool = False

def is_remote_postgres() -> bool:
    """Check if remote PostgreSQL connection string is active, enabled, and genuinely reachable."""
    global _pg_checked, _pg_active
    if _pg_checked is not None:
        return _pg_active

    if os.getenv("USE_REMOTE_POSTGRES", "false").lower() != "true":
        _pg_checked = True
        _pg_active = False
        return False

    url = get_database_url()
    if not url or not url.startswith("postgres"):
        _pg_checked = True
        _pg_active = False
        return False

    # If the URL contains template placeholders, treat as unconfigured and use local warehouse
    placeholders = ["[YOUR_PASSWORD]", "[PASSWORD]", "[PROJECT_REF]", "your-project", "placeholder"]
    if any(p in url for p in placeholders):
        _pg_checked = True
        _pg_active = False
        return False

    try:
        import psycopg2
        test_conn = psycopg2.connect(url, connect_timeout=3)
        test_conn.close()
        _pg_active = True
    except Exception:
        _pg_active = False

    _pg_checked = True
    return _pg_active

def get_db_connection():
    """
    Get an active database connection.
    Connects to Supabase PostgreSQL when enabled via USE_REMOTE_POSTGRES=true.
    Gracefully falls back to local SQLite warehouse if remote connection fails or is disabled.
    """
    if is_remote_postgres():
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn_str = get_database_url()
            return psycopg2.connect(conn_str, cursor_factory=RealDictCursor, connect_timeout=5)
        except Exception:
            # Safe automatic fallback to local SQLite warehouse if remote connection fails
            pass

    conn = sqlite3.connect(str(LOCAL_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute a read query and return list of dictionaries."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Adapt positional placeholders for PostgreSQL (psycopg2 uses %s, sqlite uses ?)
        is_pg = hasattr(conn, "status")  # psycopg2 connections have a .status attribute
        exec_query = query.replace("?", "%s") if is_pg else query
        cursor.execute(exec_query, params)
        rows = cursor.fetchall()
        # Convert sqlite3.Row or RealDictCursor to pure dicts
        result = [dict(row) for row in rows]
        cursor.close()
        return result
    finally:
        conn.close()

def execute_dml(query: str, params: tuple = ()) -> int:
    """Execute an INSERT/UPDATE/DELETE statement and commit."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        is_pg = hasattr(conn, "status")
        exec_query = query.replace("?", "%s") if is_pg else query
        cursor.execute(exec_query, params)
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        return affected
    finally:
        conn.close()
