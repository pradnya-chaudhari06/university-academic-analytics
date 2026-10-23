"""
Script to execute Phase 2B SQL validation checks against the Data Warehouse.
"""
from backend.database import execute_query

def main():
    print("=" * 75)
    print("PHASE 2B: EXECUTING SQL VALIDATION ON CONFORMED DATA WAREHOUSE")
    print("=" * 75)

    # 1. Total Students
    res = execute_query("SELECT COUNT(*) as count FROM dim_student;")
    print(f"[1] Total Students: {res[0]['count']} (Target: 4,820)")

    # 2. Students by Department
    res = execute_query("""
    SELECT d.department_code, COUNT(s.student_key) as count
    FROM dim_department d
    JOIN dim_student s ON d.department_key = s.department_key
    GROUP BY d.department_code ORDER BY d.department_key;
    """)
    print("[2] Students by Department:")
    for r in res:
        print(f"    - {r['department_code']}: {r['count']}")

    # 3. Average GPA (Semester VI)
    res = execute_query("SELECT ROUND(AVG(grade_point), 2) as avg_gpa FROM fact_academic_performance WHERE time_key = 20260630;")
    print(f"[3] Average Cohort GPA (Sem VI): {res[0]['avg_gpa']} (Target: 7.82)")

    # 4. Pass Rate (Semester VI)
    res = execute_query("""
    SELECT ROUND((COUNT(CASE WHEN result_status = 'Pass' THEN 1 END) * 100.0) / COUNT(*), 1) as pass_rate
    FROM fact_academic_performance WHERE time_key = 20260630;
    """)
    print(f"[4] Pass Rate (Sem VI): {res[0]['pass_rate']}% (Target: 91.4%)")

    # 5. Attendance Percentage (Semester VI)
    res = execute_query("SELECT ROUND(AVG(attendance_percentage), 1) as att_rate FROM fact_attendance WHERE time_key = 20260630;")
    print(f"[5] Attendance Rate (Sem VI): {res[0]['att_rate']}% (Target: 87.6%)")

    # 6. At-Risk Count (Semester VI)
    res = execute_query("SELECT COUNT(*) as count FROM fact_student_risk_status WHERE is_at_risk = 1 AND time_key = 20260630;")
    print(f"[6] At-Risk Students Count: {res[0]['count']} (Target: 108)")

    # 7. Grade Distribution
    res = execute_query("""
    SELECT 
        CASE 
            WHEN current_gpa >= 8.50 THEN 'Excellent'
            WHEN current_gpa >= 7.00 THEN 'Good'
            WHEN current_gpa >= 6.00 THEN 'Average'
            ELSE 'Needs Support'
        END as tier,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / 4820.0, 1) as pct
    FROM fact_student_risk_status
    WHERE time_key = 20260630
    GROUP BY tier
    ORDER BY CASE tier
        WHEN 'Excellent' THEN 1
        WHEN 'Good' THEN 2
        WHEN 'Average' THEN 3
        WHEN 'Needs Support' THEN 4
    END;
    """)
    print("[7] Grade Distribution (Sem VI):")
    for r in res:
        print(f"    - {r['tier']}: {r['count']} ({r['pct']}%)")

    # 8. Semester Progression
    res = execute_query("""
    SELECT t.semester, ROUND(AVG(f.grade_point), 2) as avg_gpa,
           ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / COUNT(*), 1) as pass_rate,
           ROUND(AVG(att.attendance_percentage), 1) as att_rate,
           COUNT(DISTINCT f.student_key) as enrolled
    FROM dim_time t
    JOIN fact_academic_performance f ON t.time_key = f.time_key
    LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
    GROUP BY t.time_key, t.semester
    ORDER BY t.time_key ASC;
    """)
    print("[8] Semester Progression (Sem I to Sem VI):")
    for r in res:
        print(f"    - {r['semester']}: GPA={r['avg_gpa']}, Pass={r['pass_rate']}%, Att={r['att_rate']}%, Enrolled={r['enrolled']}")

    # 9. Department Metrics
    res = execute_query("""
    SELECT 
        d.department_code,
        ROUND(AVG(f.grade_point), 2) as avg_gpa,
        ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / COUNT(f.performance_key), 1) as pass_rate,
        ROUND(AVG(att.attendance_percentage), 1) as avg_att,
        COUNT(DISTINCT CASE WHEN r.is_at_risk = 1 THEN r.student_key END) as risk_count
    FROM dim_department d
    JOIN dim_student s ON d.department_key = s.department_key
    JOIN fact_academic_performance f ON s.student_key = f.student_key AND f.time_key = 20260630
    JOIN fact_attendance att ON s.student_key = att.student_key AND f.course_key = att.course_key AND att.time_key = 20260630
    JOIN fact_student_risk_status r ON s.student_key = r.student_key AND r.time_key = 20260630
    GROUP BY d.department_key, d.department_code
    ORDER BY d.department_key;
    """)
    print("[9] Department Metrics (Sem VI):")
    for r in res:
        print(f"    - {r['department_code']}: GPA={r['avg_gpa']}, Pass={r['pass_rate']}%, Att={r['avg_att']}%, At-Risk={r['risk_count']}")

if __name__ == "__main__":
    main()
