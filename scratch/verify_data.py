from backend.database import execute_query

row = execute_query("SELECT student_id, student_name, semester FROM dim_student WHERE student_id='STU1178'")
print("STU1178:", row[0] if row else None)

total = execute_query("SELECT COUNT(*) as count FROM dim_student")
print("Total students:", total[0]['count'])

risk_count = execute_query("SELECT COUNT(*) as count FROM fact_student_risk_status WHERE is_at_risk = TRUE")
print("At-risk count:", risk_count[0]['count'])

risk = execute_query("""
    SELECT s.student_id, r.current_gpa, r.attendance_percentage, r.risk_level, r.flagged_subject, r.primary_risk_factor, r.failed_courses_count
    FROM fact_student_risk_status r 
    JOIN dim_student s ON r.student_key=s.student_key 
    WHERE s.student_id='STU1178'
""")
print("STU1178 risk record:", risk[0] if risk else None)

courses = execute_query("""
    SELECT c.course_code, c.course_name, c.credits, f.marks, f.grade_point, f.result_status
    FROM fact_academic_performance f
    JOIN dim_student s ON f.student_key = s.student_key
    JOIN dim_course c ON f.course_key = c.course_key
    WHERE s.student_id = 'STU1178' AND f.time_key = 20260630
    ORDER BY c.course_code
""")
print(f"STU1178 Sem VI Courses ({len(courses)}):")
for crs in courses:
    print("  ", crs)

good_students = execute_query("""
    SELECT s.student_id, s.student_name, r.current_gpa, r.attendance_percentage, r.risk_level, r.is_at_risk
    FROM fact_student_risk_status r
    JOIN dim_student s ON r.student_key=s.student_key
    WHERE r.is_at_risk = FALSE
    LIMIT 3
""")
print("Sample Good Standing Students:", good_students)
