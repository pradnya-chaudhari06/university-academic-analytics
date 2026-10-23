"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
SQLite to Supabase PostgreSQL Migration Utility
==============================================================================
Extracts conformed star-schema dimensions, facts, and audit logs from the
working local SQLite warehouse (database/warehouse_local.db) and safely
migrates them into Supabase PostgreSQL.

Features:
- Live migration mode (--migrate) with transaction management & upsert logic
- Safe dry-run mode (--dry-run, default) with zero writes to any database
- Target connectivity test (--test-connection) using SELECT 1 with secret masking
- Strict FK topological load order (Stage 1 -> 2 -> 3 -> 4)
- Post-migration row-count verification (1:1 reconciliation between SQLite & Postgres)
- Automatic PostgreSQL identity sequence synchronization
- Guaranteed SQLite safety (always reads via read-only URI mode=ro)

Usage:
    python database/migrate_sqlite_to_supabase.py --dry-run
    python database/migrate_sqlite_to_supabase.py --test-connection
    python database/migrate_sqlite_to_supabase.py --migrate
"""

import os
import sys
import re
import time
import argparse
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

try:
    from dotenv import load_dotenv
    # Load from project root .env or database .env with override=True
    BASE_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(BASE_DIR / ".env", override=True)
    load_dotenv(override=True)
except ImportError:
    BASE_DIR = Path(__file__).resolve().parent.parent

# Paths
DB_DIR = BASE_DIR / "database"
LOCAL_DB_PATH = DB_DIR / "warehouse_local.db"

# Topological load order specification (respects all foreign keys)
MIGRATION_STAGES = [
    {
        "stage": 1,
        "description": "Independent Dimensions (Root Dimensions with 0 FK dependencies)",
        "tables": [
            {
                "table": "dim_department",
                "pk": "department_key",
                "columns": ["department_key", "department_code", "department_name", "faculty_name", "created_at"],
                "has_identity": True,
                "expected_count": 5,
                "fks": [],
                "description": "Department and faculty structural hierarchy",
            },
            {
                "table": "dim_time",
                "pk": "time_key",
                "columns": ["time_key", "date", "day", "month", "month_name", "quarter", "semester", "academic_year", "year", "created_at"],
                "has_identity": False,
                "expected_count": 6,
                "fks": [],
                "description": "Temporal semester dimensions (Sem I through Sem VI)",
            },
            {
                "table": "dim_grade_band",
                "pk": "grade_band_key",
                "columns": ["grade_band_key", "grade", "grade_point", "grade_category", "min_marks", "max_marks", "created_at"],
                "has_identity": True,
                "expected_count": 8,
                "fks": [],
                "description": "Institutional 10-point grade classification tiers",
            },
        ],
    },
    {
        "stage": 2,
        "description": "Dependent Dimensions (Foreign Key references to DimDepartment)",
        "tables": [
            {
                "table": "dim_course",
                "pk": "course_key",
                "columns": ["course_key", "course_code", "course_name", "department_key", "credits", "semester", "created_at"],
                "has_identity": True,
                "expected_count": 30,
                "fks": ["dim_department(department_key)"],
                "description": "Curriculum course catalog across all 5 departments",
            },
            {
                "table": "dim_student",
                "pk": "student_key",
                "columns": ["student_key", "student_id", "student_name", "gender", "date_of_birth", "department_key", "admission_year", "academic_year", "semester", "section", "status", "created_at"],
                "has_identity": True,
                "expected_count": 4820,
                "fks": ["dim_department(department_key)"],
                "description": "Complete student cohort profile & enrollment records",
            },
        ],
    },
    {
        "stage": 3,
        "description": "Fact Tables (Grain evaluations referencing DimStudent, DimCourse, DimTime, DimDepartment)",
        "tables": [
            {
                "table": "fact_academic_performance",
                "pk": "performance_key",
                "columns": ["performance_key", "student_key", "course_key", "department_key", "time_key", "grade_band_key", "marks", "grade_point", "credits", "result_status", "created_at"],
                "has_identity": True,
                "expected_count": 67480,
                "fks": [
                    "dim_student(student_key)",
                    "dim_course(course_key)",
                    "dim_department(department_key)",
                    "dim_time(time_key)",
                    "dim_grade_band(grade_band_key)",
                ],
                "description": "Longitudinal exam performance & grade points across 6 semesters",
            },
            {
                "table": "fact_attendance",
                "pk": "attendance_key",
                "columns": ["attendance_key", "student_key", "course_key", "department_key", "time_key", "classes_conducted", "classes_attended", "attendance_percentage", "created_at"],
                "has_identity": True,
                "expected_count": 67480,
                "fks": [
                    "dim_student(student_key)",
                    "dim_course(course_key)",
                    "dim_department(department_key)",
                    "dim_time(time_key)",
                ],
                "description": "Lecture & session attendance metrics across 6 semesters",
            },
            {
                "table": "fact_student_risk_status",
                "pk": "risk_key",
                "columns": ["risk_key", "student_key", "department_key", "time_key", "current_gpa", "attendance_percentage", "failed_courses_count", "risk_level", "is_at_risk", "primary_risk_factor", "flagged_subject", "created_at"],
                "has_identity": True,
                "expected_count": 4820,
                "fks": [
                    "dim_student(student_key)",
                    "dim_department(department_key)",
                    "dim_time(time_key)",
                ],
                "description": "Periodic snapshot risk classifications (108 at-risk students)",
            },
        ],
    },
    {
        "stage": 4,
        "description": "Operational & Audit Logging (Independent operational table)",
        "tables": [
            {
                "table": "etl_audit_log",
                "pk": "log_id",
                "columns": ["log_id", "job_id", "job_name", "source_system", "target_table", "status", "records_extracted", "records_loaded", "records_rejected", "duration_seconds", "started_at", "completed_at", "error_message"],
                "has_identity": True,
                "expected_count": 19,
                "fks": [],
                "description": "ETL batch pipeline operational audit execution logs",
            },
        ],
    },
]

def mask_connection_uri(uri: Optional[str]) -> str:
    """Safely mask password and sensitive elements in database connection string."""
    if not uri:
        return "<NOT SET>"
    # Pattern matching postgresql://user:password@host:port/dbname
    pattern = r"(postgresql(?:\+psycopg2)?:\/\/[^:]+:)([^@]+)(@.+)"
    masked = re.sub(pattern, r"\1********\3", uri)
    return masked

IST = timezone(timedelta(hours=5, minutes=30))

def normalize_timestamp(val: Any) -> Optional[str]:
    """
    Normalize timestamp values from SQLite into valid ISO 8601 strings for PostgreSQL TIMESTAMPTZ.
    Handles human-readable strings like '03 Oct 2026 · 18:06 IST', mapping IST to UTC+05:30.
    """
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str:
        return None

    # Handle human-readable IST format: e.g., '03 Oct 2026 · 18:06 IST' or '04 Oct 2026 · 00:43 IST'
    if "IST" in val_str:
        # Strip middle dots (· / \xb7 / \u00b7), bullets, and 'IST'
        cleaned = re.sub(r"[\xb7\u00b7\u2022\-\|]", " ", val_str)
        cleaned = cleaned.replace("IST", "").strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        for fmt in ("%d %b %Y %H:%M:%S", "%d %b %Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
            try:
                dt = datetime.strptime(cleaned, fmt)
                dt = dt.replace(tzinfo=IST)
                return dt.isoformat()
            except ValueError:
                pass

    # Standard ISO / SQL datetime string (e.g. '2026-10-03 12:23:19' or '2026-10-03T17:53:19.607797')
    try:
        iso_cand = val_str.replace(" ", "T")
        dt = datetime.fromisoformat(iso_cand)
        return dt.isoformat()
    except Exception:
        pass

    return val_str

def get_target_db_url() -> Optional[str]:
    """Retrieve target Supabase / PostgreSQL connection URL."""
    try:
        from dotenv import load_dotenv
        load_dotenv(BASE_DIR / ".env", override=True)
    except ImportError:
        pass
    return os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

def is_placeholder_uri(uri: Optional[str]) -> bool:
    """Detect if connection URI contains template placeholders."""
    if not uri:
        return True
    placeholders = ["[YOUR_PASSWORD]", "[PASSWORD]", "[PROJECT_REF]", "your-project", "placeholder"]
    return any(p in uri for p in placeholders)

def test_supabase_connection() -> Dict[str, Any]:
    """
    Test connectivity to Supabase PostgreSQL using SELECT 1.
    Guarantees secrets are never printed.
    """
    raw_url = get_target_db_url()
    masked_url = mask_connection_uri(raw_url)

    result = {
        "configured": bool(raw_url),
        "is_placeholder": is_placeholder_uri(raw_url),
        "masked_url": masked_url,
        "reachable": False,
        "message": "",
    }

    if not raw_url:
        result["message"] = "No SUPABASE_DB_URL or DATABASE_URL found in environment (.env)."
        return result

    if is_placeholder_uri(raw_url):
        result["message"] = (
            "Target PostgreSQL URI is configured with template placeholder credentials. "
            "Reachable check requires live Supabase credentials in .env."
        )
        return result

    try:
        import psycopg2
        # Use short timeout so test returns promptly
        conn = psycopg2.connect(raw_url, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        res = cur.fetchone()
        cur.close()
        conn.close()

        if res and res[0] == 1:
            result["reachable"] = True
            result["message"] = "Connection successful. Target PostgreSQL database is REACHABLE (SELECT 1 returned 1)."
        else:
            result["message"] = "Query executed but unexpected response returned."
    except ImportError:
        result["message"] = "psycopg2 is not installed in the environment."
    except Exception as e:
        # Sanitize exception message to ensure no credentials or raw passwords leaked
        err_msg = str(e)
        if raw_url and "@" in raw_url:
            err_msg = re.sub(re.escape(raw_url), masked_url, err_msg)
        result["message"] = f"Connection failed: {err_msg.strip()}"

    return result

def run_dry_run_audit() -> Dict[str, Any]:
    """
    Execute read-only audit of database/warehouse_local.db.
    Performs ZERO writes.
    Reports table row counts, expected targets, and foreign-key sequence.
    """
    if not LOCAL_DB_PATH.exists():
        raise FileNotFoundError(f"Local warehouse database not found at {LOCAL_DB_PATH}")

    # Connect strictly in read-only mode using SQLite URI mode
    db_uri = f"file:{LOCAL_DB_PATH.as_posix()}?mode=ro"
    conn = sqlite3.connect(db_uri, uri=True)
    cursor = conn.cursor()

    report = {
        "database_path": str(LOCAL_DB_PATH),
        "mode": "READ-ONLY (ZERO WRITES)",
        "stages": [],
        "total_expected_rows": 0,
        "total_actual_rows": 0,
        "all_matched": True,
    }

    for stage_info in MIGRATION_STAGES:
        stage_entry = {
            "stage_number": stage_info["stage"],
            "description": stage_info["description"],
            "tables": [],
        }

        for tspec in stage_info["tables"]:
            tname = tspec["table"]
            expected = tspec["expected_count"]
            fks = tspec["fks"]
            desc = tspec["description"]

            cursor.execute(f"SELECT COUNT(*) FROM {tname};")
            actual = cursor.fetchone()[0]

            report["total_expected_rows"] += expected
            report["total_actual_rows"] += actual

            # etl_audit_log baseline target is 19; subsequent test runs increment it
            is_valid = (actual == expected) if tname != "etl_audit_log" else (actual >= expected)
            if not is_valid:
                report["all_matched"] = False

            stage_entry["tables"].append({
                "table": tname,
                "type": "Fact" if "fact_" in tname else ("Audit" if "audit" in tname else "Dimension"),
                "pk": tspec["pk"],
                "fks": fks,
                "expected_count": expected,
                "actual_count": actual,
                "valid": is_valid,
                "description": desc,
            })

        report["stages"].append(stage_entry)

    conn.close()
    return report

def print_dry_run_report(report: Dict[str, Any], conn_status: Dict[str, Any]):
    print("=" * 80)
    print("UNI-ANALYTICS: SQLITE -> SUPABASE MIGRATION UTILITY (PHASE C DRY-RUN)")
    print("=" * 80)
    print(f"Source Database : {report['database_path']}")
    print(f"Execution Mode  : {report['mode']}")
    print(f"PostgreSQL Target: {conn_status['masked_url']}")
    print(f"Target Status   : {'REACHABLE' if conn_status['reachable'] else 'UNREACHABLE / PLACEHOLDER'}")
    print(f"Diagnostics     : {conn_status['message']}")
    print("=" * 80)

    print("\nFOREIGN-KEY TOPOLOGICAL LOAD ORDER & RECORD VERIFICATION:\n")

    for stage in report["stages"]:
        print(f"STAGE {stage['stage_number']}: {stage['description']}")
        print("-" * 80)
        print(f"{'Table Name':<28} {'PK':<18} {'Expected':<12} {'Actual':<12} {'Status':<10}")
        print("-" * 80)
        for tbl in stage["tables"]:
            status_str = "[OK]" if tbl["valid"] else "[MISMATCH]"
            exp_str = f"{tbl['expected_count']:,}"
            act_str = f"{tbl['actual_count']:,}"
            if tbl["table"] == "etl_audit_log" and tbl["actual_count"] > tbl["expected_count"]:
                exp_str = f"{tbl['expected_count']}+"
            print(f"{tbl['table']:<28} {tbl['pk']:<18} {exp_str:<12} {act_str:<12} {status_str:<10}")
            if tbl["fks"]:
                fks_str = ", ".join(tbl["fks"])
                print(f"   -> Foreign Key Constraints: {fks_str}")
        print()

    print("=" * 80)
    print(f"TOTAL EXPECTED BASELINE ROWS : {report['total_expected_rows']:,}")
    print(f"TOTAL ACTUAL LOCAL ROWS     : {report['total_actual_rows']:,}")
    print("=" * 80)
    print("[SAFEGUARD] DRY-RUN VERIFIED: Exactly ZERO writes were performed.")
    print("[SAFEGUARD] Local database 'warehouse_local.db' is preserved 100% intact.")
    print("=" * 80)

def build_upsert_query(table: str, pk: str, columns: List[str]) -> str:
    """Build idempotent PostgreSQL UPSERT query using ON CONFLICT (pk) DO UPDATE."""
    cols_joined = ", ".join(columns)
    non_pk_cols = [c for c in columns if c != pk]
    if non_pk_cols:
        update_clause = ", ".join(f"{c} = EXCLUDED.{c}" for c in non_pk_cols)
        conflict_clause = f"ON CONFLICT ({pk}) DO UPDATE SET {update_clause}"
    else:
        conflict_clause = f"ON CONFLICT ({pk}) DO NOTHING"

    return f"INSERT INTO {table} ({cols_joined}) VALUES %s {conflict_clause};"

def run_migration(batch_size: int = 2000) -> bool:
    """
    Execute real SQLite to Supabase PostgreSQL migration.
    - Strictly reads SQLite in read-only mode (warehouse_local.db untouched)
    - Follows topological FK sequence (Stage 1 -> 2 -> 3 -> 4)
    - Uses batch upsert (execute_values)
    - Manages transaction safety with commit / rollback
    - Resets PostgreSQL identity sequences post-load
    - Performs 1:1 post-migration verification between SQLite & Supabase
    """
    import psycopg2
    from psycopg2.extras import execute_values

    conn_status = test_supabase_connection()
    if not conn_status["reachable"]:
        print("\n[ERROR] Cannot execute migration. Supabase PostgreSQL target is not reachable.")
        print(f"Diagnostics: {conn_status['message']}")
        return False

    raw_url = get_target_db_url()
    masked_url = mask_connection_uri(raw_url)

    if not LOCAL_DB_PATH.exists():
        print(f"\n[ERROR] Local SQLite database not found at {LOCAL_DB_PATH}")
        return False

    print("=" * 80)
    print("UNI-ANALYTICS: SQLITE -> SUPABASE POSTGRESQL MIGRATION EXECUTION")
    print("=" * 80)
    print(f"Source Database : {LOCAL_DB_PATH} (Strict Read-Only)")
    print(f"Target Database : {masked_url}")
    print(f"Batch Size      : {batch_size:,} records/chunk")
    print(f"Transaction     : Full ACID rollback protection")
    print("=" * 80)

    # 1. Connect to SQLite (READ-ONLY)
    s_uri = f"file:{LOCAL_DB_PATH.as_posix()}?mode=ro"
    s_conn = sqlite3.connect(s_uri, uri=True)
    s_cur = s_conn.cursor()

    # 2. Connect to PostgreSQL
    p_conn = psycopg2.connect(raw_url)
    p_conn.autocommit = False
    p_cur = p_conn.cursor()

    migration_results: List[Dict[str, Any]] = []
    start_total_time = time.time()

    try:
        for stage in MIGRATION_STAGES:
            stage_num = stage["stage"]
            stage_desc = stage["description"]
            print(f"\n>>> EXECUTING STAGE {stage_num}: {stage_desc}")
            print("-" * 80)

            for tspec in stage["tables"]:
                tname = tspec["table"]
                pk = tspec["pk"]
                cols = tspec["columns"]
                has_identity = tspec["has_identity"]
                cols_str = ", ".join(cols)

                t_start = time.time()

                # Extract from SQLite
                s_cur.execute(f"SELECT {cols_str} FROM {tname} ORDER BY {pk} ASC;")
                raw_rows = s_cur.fetchall()
                total_rows = len(raw_rows)

                # Type sanitization and normalization
                if tname == "fact_student_risk_status":
                    is_at_risk_idx = cols.index("is_at_risk")
                    processed_rows = []
                    for row in raw_rows:
                        row_list = list(row)
                        row_list[is_at_risk_idx] = bool(row_list[is_at_risk_idx]) if row_list[is_at_risk_idx] is not None else None
                        processed_rows.append(tuple(row_list))
                elif tname == "etl_audit_log":
                    # Normalize started_at and completed_at to valid ISO timestamps for TIMESTAMPTZ
                    started_idx = cols.index("started_at")
                    completed_idx = cols.index("completed_at")
                    processed_rows = []
                    for row in raw_rows:
                        row_list = list(row)
                        row_list[started_idx] = normalize_timestamp(row_list[started_idx])
                        row_list[completed_idx] = normalize_timestamp(row_list[completed_idx])
                        processed_rows.append(tuple(row_list))
                else:
                    processed_rows = raw_rows

                # Upsert into PostgreSQL using execute_values
                upsert_query = build_upsert_query(tname, pk, cols)
                execute_values(p_cur, upsert_query, processed_rows, page_size=batch_size)

                # Synchronize PostgreSQL identity sequence if table uses GENERATED AS IDENTITY
                if has_identity:
                    seq_query = f"SELECT setval(pg_get_serial_sequence('{tname}', '{pk}'), COALESCE(MAX({pk}), 1)) FROM {tname};"
                    p_cur.execute(seq_query)

                t_duration = round(time.time() - t_start, 2)
                print(f"[OK] {tname:<28} : {total_rows:>7,} rows upserted ({t_duration:>4.2f}s)")

                migration_results.append({
                    "stage": stage_num,
                    "table": tname,
                    "pk": pk,
                    "sqlite_count": total_rows,
                    "duration": t_duration,
                })

        # 3. Commit PostgreSQL transaction
        print("\n" + "=" * 80)
        print("[+] Committing transaction to Supabase PostgreSQL...")
        p_conn.commit()
        print("[SUCCESS] All tables successfully committed!")
        print("=" * 80)

    except Exception as e:
        p_conn.rollback()
        err_msg = str(e)
        if raw_url and "@" in raw_url:
            err_msg = re.sub(re.escape(raw_url), masked_url, err_msg)
        print(f"\n[FATAL ERROR] Migration failed during execution. Transaction rolled back!")
        print(f"Details: {err_msg.strip()}")
        p_cur.close()
        p_conn.close()
        s_conn.close()
        return False

    # 4. Post-Migration Row-Count Verification (SQLite vs PostgreSQL)
    print("\nPOST-MIGRATION RECONCILIATION VERIFICATION MATRIX:")
    print("=" * 80)
    print(f"{'Stage':<7} {'Table Name':<28} {'SQLite Count':<14} {'Supabase Count':<16} {'Status':<10}")
    print("-" * 80)

    all_matched = True
    total_sqlite_count = 0
    total_pg_count = 0

    for item in migration_results:
        tname = item["table"]
        s_count = item["sqlite_count"]

        p_cur.execute(f"SELECT COUNT(*) FROM {tname};")
        pg_count = p_cur.fetchone()[0]

        total_sqlite_count += s_count
        total_pg_count += pg_count

        matched = (s_count == pg_count)
        if not matched:
            all_matched = False

        status_tag = "[MATCH]" if matched else "[MISMATCH]"
        print(f"Stage {item['stage']:<2} {tname:<28} {s_count:<14,} {pg_count:<16,} {status_tag:<10}")

    total_time = round(time.time() - start_total_time, 2)
    print("=" * 80)
    print(f"TOTAL MIGRATED WAREHOUSE RECORDS: {total_pg_count:,} / {total_sqlite_count:,}")
    print(f"TOTAL MIGRATION RUNTIME          : {total_time} seconds")
    print(f"RECONCILIATION INTEGRITY         : {'100% PERFECT MATCH' if all_matched else 'FAILED - MISMATCH'}")
    print("=" * 80)
    print("[SAFEGUARD VERIFIED] Source SQLite warehouse 'database/warehouse_local.db' is untouched.")
    print("=" * 80)

    p_cur.close()
    p_conn.close()
    s_conn.close()
    return all_matched

def main():
    parser = argparse.ArgumentParser(
        description="SQLite to Supabase PostgreSQL Migration Utility for UniAnalytics Data Warehouse"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform dry-run row count validation & FK dependency verification without any writes",
    )
    parser.add_argument(
        "--test-connection",
        action="store_true",
        help="Test connectivity to Supabase PostgreSQL with SELECT 1",
    )
    parser.add_argument(
        "--migrate",
        action="store_true",
        help="Execute real migration from SQLite to Supabase PostgreSQL using batch upserts",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=2000,
        help="Batch size for bulk upsert operations (default: 2000)",
    )
    args = parser.parse_args()

    # Priority: --test-connection -> --migrate -> --dry-run (default)
    if args.test_connection:
        conn_status = test_supabase_connection()
        print("=" * 80)
        print("SUPABASE POSTGRESQL CONNECTIVITY TEST")
        print("=" * 80)
        print(f"Target URI : {conn_status['masked_url']}")
        print(f"Configured : {conn_status['configured']}")
        print(f"Reachable  : {conn_status['reachable']}")
        print(f"Message    : {conn_status['message']}")
        print("=" * 80)
        if not args.migrate and not args.dry_run:
            return

    if args.migrate:
        success = run_migration(batch_size=args.batch_size)
        if not success:
            sys.exit(1)
        return

    # Default fallback is dry-run
    conn_status = test_supabase_connection()
    report = run_dry_run_audit()
    print_dry_run_report(report, conn_status)

if __name__ == "__main__":
    main()
