"""
Synchronize STU1178 Semester VI records and dim_course catalog in warehouse_local.db
with the exact canonical academic values specified in Section 4.
"""
from backend.database import get_db_connection

def sync():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Update dim_course catalog for Computer Engineering Semester VI
    cursor.execute("UPDATE dim_course SET course_name = 'Advanced Algorithms' WHERE course_code = 'CS601';")
    cursor.execute("UPDATE dim_course SET course_name = 'Distributed Cloud Computing' WHERE course_code = 'CS602';")
    cursor.execute("UPDATE dim_course SET course_name = 'Advanced Database Systems' WHERE course_code = 'CS603';")
    cursor.execute("UPDATE dim_course SET course_name = 'Data Warehousing & Mining' WHERE course_code = 'CS604';")

    # 2. Get student_key for STU1178
    cursor.execute("SELECT student_key FROM dim_student WHERE student_id = 'STU1178';")
    s_row = cursor.fetchone()
    if not s_row:
        print("STU1178 not found in dim_student!")
        return
    s_key = s_row[0]

    # 3. Get course keys
    cursor.execute("SELECT course_code, course_key FROM dim_course WHERE course_code IN ('CS601', 'CS602', 'CS603', 'CS604');")
    c_keys = {row[0]: row[1] for row in cursor.fetchall()}

    # 4. Update fact_academic_performance for STU1178 in Semester VI
    cursor.execute(
        "UPDATE fact_academic_performance SET marks = 78.5, grade_point = 8.0, credits = 4.0, result_status = 'Pass' "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS601'])
    )
    cursor.execute(
        "UPDATE fact_academic_performance SET marks = 72.0, grade_point = 7.0, credits = 4.0, result_status = 'Pass' "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS602'])
    )
    cursor.execute(
        "UPDATE fact_academic_performance SET marks = 61.5, grade_point = 6.0, credits = 4.0, result_status = 'Pass' "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS604'])
    )
    cursor.execute(
        "UPDATE fact_academic_performance SET marks = 38.0, grade_point = 3.0, credits = 4.0, result_status = 'Fail' "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS603'])
    )

    # 5. Update fact_attendance for STU1178 in Semester VI
    cursor.execute(
        "UPDATE fact_attendance SET attendance_percentage = 85.0, classes_conducted = 60, classes_attended = 51 "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS601'])
    )
    cursor.execute(
        "UPDATE fact_attendance SET attendance_percentage = 72.5, classes_conducted = 60, classes_attended = 44 "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS602'])
    )
    cursor.execute(
        "UPDATE fact_attendance SET attendance_percentage = 60.0, classes_conducted = 60, classes_attended = 36 "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS604'])
    )
    cursor.execute(
        "UPDATE fact_attendance SET attendance_percentage = 35.0, classes_conducted = 60, classes_attended = 21 "
        "WHERE student_key = ? AND course_key = ? AND time_key = 20260630;",
        (s_key, c_keys['CS603'])
    )

    # 6. Update fact_student_risk_status for STU1178 in Semester VI
    cursor.execute(
        "UPDATE fact_student_risk_status "
        "SET current_gpa = 6.00, "
        "    attendance_percentage = 63.1, "
        "    failed_courses_count = 1, "
        "    is_at_risk = 1, "
        "    risk_level = 'Medium', "
        "    flagged_subject = 'Advanced Database Systems', "
        "    primary_risk_factor = 'Attendance Below 75% Benchmark & Course Backlog' "
        "WHERE student_key = ? AND time_key = 20260630;",
        (s_key,)
    )

    conn.commit()
    conn.close()
    print("SUCCESS: Synced warehouse_local.db with Section 4 canonical academic values.")

if __name__ == '__main__':
    sync()
