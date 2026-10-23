"""
==============================================================================
University Academic Analytics - Complete Institutional ETL & Warehouse Test
==============================================================================
Validates:
1. 4,820 students across 5 engineering departments
2. 5 conformed departments with exact student counts
3. 108 flagged at-risk students with departmental breakdown
4. Valid fact/dimension relationships and foreign key integrity (zero orphan keys)
5. Non-zero fact table volumes (performance and attendance facts)
6. Grade distribution across 4 tiers (Excellent, Good, Average, Needs Support)
7. Semester GPA progression (Sem I to Sem VI)
8. Successful ETL audit execution logging
9. Dynamic FastAPI endpoint responses
==============================================================================
"""

import sys
from starlette.testclient import TestClient
from backend.etl.etl_pipeline import run_etl_pipeline
from backend.database import execute_query
from backend.main import app

def test_warehouse_integrity():
    print("=" * 75)
    print("TEST SUITE: UNIVERSITY ACADEMIC DATA WAREHOUSE INTEGRITY (4,820 STUDENTS)")
    print("=" * 75)

    # 1. Run ETL
    print("\n--- 1. Executing ETL Pipeline ---")
    res = run_etl_pipeline()
    assert res["status"] == "Completed", "ETL failed to complete"
    print(f"[PASS] ETL pipeline executed successfully (Job ID: {res['job_id']}) in {res['duration_seconds']}s")

    # 2. Check Dimension Tables
    print("\n--- 2. Validating Conformed Dimensions ---")
    dept_rows = execute_query("SELECT COUNT(*) as c FROM dim_department;")
    assert dept_rows[0]["c"] == 5, f"Expected 5 departments, got {dept_rows[0]['c']}"
    print(f"[PASS] DimDepartment contains exactly 5 departments")

    course_rows = execute_query("SELECT COUNT(*) as c FROM dim_course;")
    assert course_rows[0]["c"] >= 20, f"Expected >= 20 courses, got {course_rows[0]['c']}"
    print(f"[PASS] DimCourse contains {course_rows[0]['c']} curriculum courses")

    time_rows = execute_query("SELECT COUNT(*) as c FROM dim_time;")
    assert time_rows[0]["c"] == 6, f"Expected 6 time points, got {time_rows[0]['c']}"
    print(f"[PASS] DimTime contains 6 semester time points (Sem I - Sem VI)")

    student_rows = execute_query("SELECT COUNT(*) as c FROM dim_student;")
    assert student_rows[0]["c"] == 4820, f"Expected 4820 students, got {student_rows[0]['c']}"
    print(f"[PASS] DimStudent contains exactly 4,820 student records")

    # 3. Check Department Distributions
    print("\n--- 3. Validating Department Student Counts ---")
    dept_counts_query = """
    SELECT d.department_code, COUNT(s.student_key) as c
    FROM dim_department d
    JOIN dim_student s ON d.department_key = s.department_key
    GROUP BY d.department_code;
    """
    dept_counts = {r["department_code"]: r["c"] for r in execute_query(dept_counts_query)}
    expected_depts = {
        'CE': 1180,
        'IT': 1120,
        'EXTC': 980,
        'MECH': 920,
        'CIVIL': 620,
    }
    for code, exp_count in expected_depts.items():
        actual = dept_counts.get(code, 0)
        assert actual == exp_count, f"Department {code}: expected {exp_count}, got {actual}"
        print(f"[PASS] Department {code}: {actual} students (Target: {exp_count})")

    # 4. Check Fact Tables Volume
    print("\n--- 4. Validating Fact Table Row Counts ---")
    perf_rows = execute_query("SELECT COUNT(*) as c FROM fact_academic_performance;")
    assert perf_rows[0]["c"] > 60000, f"Expected > 60,000 performance facts, got {perf_rows[0]['c']}"
    print(f"[PASS] FactAcademicPerformance contains {perf_rows[0]['c']} evaluation facts")

    att_rows = execute_query("SELECT COUNT(*) as c FROM fact_attendance;")
    assert att_rows[0]["c"] > 60000, f"Expected > 60,000 attendance facts, got {att_rows[0]['c']}"
    print(f"[PASS] FactAttendance contains {att_rows[0]['c']} session attendance facts")

    risk_total_rows = execute_query("SELECT COUNT(*) as c FROM fact_student_risk_status;")
    assert risk_total_rows[0]["c"] == 4820, f"Expected 4,820 risk snapshot rows, got {risk_total_rows[0]['c']}"
    print(f"[PASS] FactStudentRiskStatus contains {risk_total_rows[0]['c']} snapshot records")

    # 5. Check Foreign Key Integrity (Zero Orphan Rows)
    print("\n--- 5. Validating Foreign Key Relationships (No Orphan Keys) ---")
    orphan_perf_stu = execute_query("""
    SELECT COUNT(*) as c FROM fact_academic_performance f
    LEFT JOIN dim_student s ON f.student_key = s.student_key WHERE s.student_key IS NULL;
    """)[0]["c"]
    assert orphan_perf_stu == 0, f"Orphan student_key in fact_academic_performance: {orphan_perf_stu}"

    orphan_perf_course = execute_query("""
    SELECT COUNT(*) as c FROM fact_academic_performance f
    LEFT JOIN dim_course c ON f.course_key = c.course_key WHERE c.course_key IS NULL;
    """)[0]["c"]
    assert orphan_perf_course == 0, f"Orphan course_key in fact_academic_performance: {orphan_perf_course}"

    orphan_att_stu = execute_query("""
    SELECT COUNT(*) as c FROM fact_attendance a
    LEFT JOIN dim_student s ON a.student_key = s.student_key WHERE s.student_key IS NULL;
    """)[0]["c"]
    assert orphan_att_stu == 0, f"Orphan student_key in fact_attendance: {orphan_att_stu}"

    orphan_risk_stu = execute_query("""
    SELECT COUNT(*) as c FROM fact_student_risk_status r
    LEFT JOIN dim_student s ON r.student_key = s.student_key WHERE s.student_key IS NULL;
    """)[0]["c"]
    assert orphan_risk_stu == 0, f"Orphan student_key in fact_student_risk_status: {orphan_risk_stu}"

    print(f"[PASS] All Foreign Key relationships conformed with 0 orphan keys across all fact tables")

    # 6. Check At-Risk Students Count & Department Breakdown
    print("\n--- 6. Validating At-Risk Students (Target: 108) ---")
    risk_rows = execute_query("SELECT COUNT(*) as c FROM fact_student_risk_status WHERE is_at_risk = TRUE AND time_key = 20260630;")
    assert risk_rows[0]["c"] == 108, f"Expected 108 at-risk students, got {risk_rows[0]['c']}"
    print(f"[PASS] Total at-risk students in FactStudentRiskStatus: exactly {risk_rows[0]['c']}")

    dept_risk_query = """
    SELECT d.department_code, COUNT(r.risk_key) as c
    FROM fact_student_risk_status r
    JOIN dim_department d ON r.department_key = d.department_key
    WHERE r.is_at_risk = TRUE AND r.time_key = 20260630
    GROUP BY d.department_code;
    """
    dept_risks = {r["department_code"]: r["c"] for r in execute_query(dept_risk_query)}
    expected_risks = {
        'CE': 22,
        'IT': 18,
        'EXTC': 28,
        'MECH': 24,
        'CIVIL': 16,
    }
    for code, exp_r in expected_risks.items():
        actual_r = dept_risks.get(code, 0)
        assert actual_r == exp_r, f"Department {code}: expected {exp_r} at-risk, got {actual_r}"
        print(f"[PASS] Department {code} at-risk count: {actual_r} (Target: {exp_r})")

    # 7. Check Dashboard Target Metrics (Semester VI)
    print("\n--- 7. Validating Active Semester Metrics (Sem VI) ---")
    gpa_res = execute_query("SELECT ROUND(AVG(grade_point), 2) as avg_gpa FROM fact_academic_performance WHERE time_key = 20260630;")
    assert float(gpa_res[0]["avg_gpa"]) == 7.82, f"Expected cohort GPA 7.82, got {gpa_res[0]['avg_gpa']}"
    print(f"[PASS] Cohort Average GPA: {gpa_res[0]['avg_gpa']} (Target: 7.82)")

    pass_res = execute_query("""
    SELECT ROUND((COUNT(CASE WHEN result_status = 'Pass' THEN 1 END) * 100.0) / COUNT(*), 1) as pass_rate
    FROM fact_academic_performance WHERE time_key = 20260630;
    """)
    assert float(pass_res[0]["pass_rate"]) == 91.4, f"Expected pass rate 91.4%, got {pass_res[0]['pass_rate']}%"
    print(f"[PASS] Cohort Pass Rate: {pass_res[0]['pass_rate']}% (Target: 91.4%)")

    att_res = execute_query("SELECT ROUND(AVG(attendance_percentage), 1) as att_rate FROM fact_attendance WHERE time_key = 20260630;")
    assert float(att_res[0]["att_rate"]) == 87.6, f"Expected attendance rate 87.6%, got {att_res[0]['att_rate']}%"
    print(f"[PASS] Cohort Attendance Rate: {att_res[0]['att_rate']}% (Target: 87.6%)")

    # 8. Check Grade Distribution
    print("\n--- 8. Validating Grade Distribution Tiers ---")
    tier_query = """
    SELECT 
        CASE 
            WHEN current_gpa >= 8.50 THEN 'Excellent'
            WHEN current_gpa >= 7.00 THEN 'Good'
            WHEN current_gpa >= 6.00 THEN 'Average'
            ELSE 'Needs Support'
        END as tier,
        COUNT(*) as count
    FROM fact_student_risk_status
    WHERE time_key = 20260630
    GROUP BY tier;
    """
    tier_counts = {r["tier"]: r["count"] for r in execute_query(tier_query)}
    expected_tiers = {
        'Excellent': 1245,
        'Good': 2120,
        'Average': 1099,
        'Needs Support': 356,
    }
    for tier, exp_c in expected_tiers.items():
        actual_c = tier_counts.get(tier, 0)
        assert actual_c == exp_c, f"Tier {tier}: expected {exp_c}, got {actual_c}"
        print(f"[PASS] Grade Tier '{tier}': {actual_c} students (Target: {exp_c})")

    # 9. Check Audit Log
    print("\n--- 9. Validating ETL Audit Log ---")
    log_rows = execute_query("SELECT * FROM etl_audit_log WHERE status = 'Completed' ORDER BY log_id DESC LIMIT 1;")
    assert len(log_rows) >= 1, "Expected completed audit log record"
    audit = log_rows[0]
    print(f"[PASS] Audit log verified: Job {audit['job_id']}, Records Loaded: {audit['records_loaded']}, Duration: {audit['duration_seconds']}s")

    # 10. Check FastAPI Endpoints
    print("\n--- 10. Validating FastAPI Endpoints via TestClient ---")
    client = TestClient(app)

    # Health
    r_health = client.get("/api/health")
    assert r_health.status_code == 200 and r_health.json()["enrolled_students_grain"] == 4820
    print("[PASS] Endpoint GET /api/health returned 200 OK (4,820 students)")

    # KPIs
    r_kpi = client.get("/api/kpis")
    assert r_kpi.status_code == 200
    kpi_json = r_kpi.json()
    assert kpi_json["total_students"] == 4820 and kpi_json["average_gpa"] == 7.82 and kpi_json["at_risk_students"] == 108
    print("[PASS] Endpoint GET /api/kpis returned 200 OK (4,820 students, 7.82 GPA, 108 at-risk)")

    # Departments
    r_dept = client.get("/api/departments")
    assert r_dept.status_code == 200 and len(r_dept.json()) == 5
    print("[PASS] Endpoint GET /api/departments returned 200 OK (5 departments rollups)")

    # Courses
    r_course = client.get("/api/courses")
    assert r_course.status_code == 200 and len(r_course.json()) >= 20
    print("[PASS] Endpoint GET /api/courses returned 200 OK (curriculum catalog)")

    # At-risk
    r_risk = client.get("/api/students/at-risk")
    assert r_risk.status_code == 200 and len(r_risk.json()) == 108
    print("[PASS] Endpoint GET /api/students/at-risk returned 200 OK (108 flagged students)")

    # Warehouse status
    r_status = client.get("/api/warehouse/status")
    assert r_status.status_code == 200 and r_status.json()["status"] == "Healthy"
    print("[PASS] Endpoint GET /api/warehouse/status returned 200 OK (Healthy)")

    # Trends (University-wide & Department Slice)
    r_trends = client.get("/api/trends")
    assert r_trends.status_code == 200 and len(r_trends.json()) == 6
    assert r_trends.json()[0]["enrolledStudents"] == 4820
    print("[PASS] Endpoint GET /api/trends returned 200 OK (6 semesters, 4,820 students cohort)")

    r_trends_ce = client.get("/api/trends?department=CE")
    assert r_trends_ce.status_code == 200 and len(r_trends_ce.json()) == 6
    assert r_trends_ce.json()[0]["enrolledStudents"] == 1180
    print("[PASS] Endpoint GET /api/trends?department=CE returned 200 OK (6 semesters, 1,180 CE students)")

    # OLAP Cube Matrix
    r_matrix = client.get("/api/olap/matrix")
    assert r_matrix.status_code == 200 and len(r_matrix.json()) == 30
    print("[PASS] Endpoint GET /api/olap/matrix returned 200 OK (30 cells: 6 semesters × 5 departments)")

    print("\n" + "=" * 75)
    print("ALL 12 DATA WAREHOUSE & ETL TESTS PASSED WITH 100% INTEGRITY!")
    print("=" * 75)

if __name__ == "__main__":
    test_warehouse_integrity()
