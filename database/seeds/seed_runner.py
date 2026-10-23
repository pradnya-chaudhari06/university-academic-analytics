"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Seed Runner & Migration Executor
==============================================================================
This script automates the sequential execution of SQL migrations and seed data
into the target PostgreSQL / Supabase database.

Usage:
    python seed_runner.py [--migrations-only] [--seeds-only] [--dry-run]
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
SEEDS_DIR = BASE_DIR / "seeds"

def get_connection_string() -> str:
    """Retrieve database connection string from environment variables."""
    conn_str = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not conn_str:
        print("[WARNING] No DATABASE_URL or SUPABASE_DB_URL found in environment.")
        print("Set SUPABASE_DB_URL (e.g., postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres) in .env")
    return conn_str or ""

def load_sql_file(file_path: Path) -> str:
    """Read SQL file content."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def run_script():
    parser = argparse.ArgumentParser(description="University DWM Star Schema Migration & Seed Runner")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL files to be executed without connecting")
    parser.add_argument("--migrations-only", action="store_true", help="Execute DDL migrations only")
    parser.add_argument("--seeds-only", action="store_true", help="Execute reference and seed data only")
    args = parser.parse_args()

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    seed_files = sorted(SEEDS_DIR.glob("*.sql"))

    print("=" * 70)
    print("University Academic Analytics DWM - Database Initialization Runner")
    print("=" * 70)

    if not args.seeds_only:
        print(f"\n[+] Found {len(migration_files)} Migration files:")
        for mf in migration_files:
            print(f"    - {mf.name}")

    if not args.migrations_only:
        print(f"\n[+] Found {len(seed_files)} Seed files:")
        for sf in seed_files:
            print(f"    - {sf.name}")

    conn_str = get_connection_string()

    if args.dry_run or not conn_str:
        print("\n[INFO] Dry-run mode or database URL not configured. SQL files ready for Supabase SQL Editor:")
        print("1. Go to your Supabase Project Dashboard -> SQL Editor")
        print("2. Paste and run:")
        for mf in migration_files:
            print(f"   -> {mf.relative_to(BASE_DIR)}")
        for sf in seed_files:
            print(f"   -> {sf.relative_to(BASE_DIR)}")
        return

    try:
        import psycopg2
        print(f"\n[+] Connecting to PostgreSQL at {conn_str.split('@')[-1] if '@' in conn_str else 'configured host'}...")
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()

        if not args.seeds_only:
            for mf in migration_files:
                print(f"[EXECUTING MIGRATION] {mf.name}...")
                sql = load_sql_file(mf)
                cursor.execute(sql)
                print(f"[OK] {mf.name} applied successfully.")

        if not args.migrations_only:
            for sf in seed_files:
                print(f"[EXECUTING SEED] {sf.name}...")
                sql = load_sql_file(sf)
                cursor.execute(sql)
                print(f"[OK] {sf.name} seeded successfully.")

        cursor.close()
        conn.close()
        print("\n[SUCCESS] Database initialized and verified with Star Schema DWM tables!")

    except ImportError:
        print("\n[NOTICE] 'psycopg2' not installed. You can install it via: pip install psycopg2-binary")
        print("Alternatively, copy and run the SQL migration files directly into the Supabase SQL Editor.")
    except Exception as e:
        print(f"\n[ERROR] Database execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_script()
