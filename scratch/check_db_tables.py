import sys, os
sys.path.insert(0, os.path.abspath('.'))
from backend.database import execute_query, is_remote_postgres

print('Database Engine:', 'PostgreSQL / Supabase' if is_remote_postgres() else 'SQLite Fallback')

tables = [
    'dim_student',
    'dim_department',
    'dim_course',
    'dim_time',
    'dim_grade_band',
    'fact_academic_performance',
    'fact_attendance',
    'fact_student_risk_status',
    'etl_audit_log'
]

for t in tables:
    try:
        res = execute_query(f'SELECT COUNT(*) as cnt FROM {t};')
        cnt = res[0]['cnt'] if res else 0
        print(f'{t:<30}: {cnt:>8} rows')
    except Exception as e:
        print(f'{t:<30}: ERROR: {e}')
