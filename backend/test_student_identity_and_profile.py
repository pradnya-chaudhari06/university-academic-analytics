"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (UniAnalytics)
MASTER STUDENT EXPERIENCE, DATA CONSISTENCY & SECURITY AUDIT TEST SUITE
==============================================================================
Validates:
1. Canonical identity resolution (Riya Patil, STU1178, CE, Sem VI, Section B, Cohort 2023-2027)
2. Star Schema conformed warehouse academic data alignment
3. Cross-page consistency across Dashboard, Profile, Courses, and Attendance/Risk
4. Semester performance trajectory & mathematical trend delta
5. Anonymous class benchmark & mathematical delta validation
6. Profile editing persistence and institutional field protection
7. Student data isolation & server-side authorization enforcement (HTTP 403 on all unauthorized endpoints)
8. Absence of technical internals / zero hardcoded fake academic values
==============================================================================
"""

import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import execute_query

client = TestClient(app)

results = []

def record(test_name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {test_name}: {detail}")
    results.append({"test": test_name, "status": status, "detail": detail})

print("=" * 80)
print("STARTING MASTER STUDENT PORTAL AUDIT & VERIFICATION")
print("=" * 80)

# Canonical Student Headers
student_headers = {
    "X-User-Role": "Student",
    "X-User-Email": "student@university.edu",
    "X-Student-Id": "STU1178"
}

# 1. Fetch Student Dashboard
res_dash = client.get("/api/student/me/dashboard", headers=student_headers)
dash_data = res_dash.json() if res_dash.status_code == 200 else {}
dash_profile = dash_data.get("profile", {})
dash_kpis = dash_data.get("kpis", {})
dash_subjects = dash_data.get("subjects", [])
dash_attendance = dash_data.get("attendance", {})
dash_risk = dash_data.get("academicRisk", {})
dash_trend = dash_data.get("semesterTrend", [])
dash_trend_insight = dash_data.get("trendInsight", {})
dash_benchmark = dash_data.get("classComparison", {})

# 2. Fetch User Profile
res_prof = client.get("/api/user/profile", headers=student_headers)
prof_data = res_prof.json() if res_prof.status_code == 200 else {}
user_profile = prof_data.get("profile", {})
academic_summary = prof_data.get("academicSummary", {})

# --- 1. Canonical Student Identity ---
record(
    "Student login identity resolves to Riya Patil",
    user_profile.get("name") == "Riya Patil" and dash_profile.get("studentName") == "Riya Patil",
    f"Profile Name: '{user_profile.get('name')}', Dashboard Name: '{dash_profile.get('studentName')}'"
)

record(
    "Student ID resolves to STU1178",
    user_profile.get("student_id") == "STU1178" and dash_profile.get("studentId") == "STU1178",
    f"Profile ID: '{user_profile.get('student_id')}', Dashboard ID: '{dash_profile.get('studentId')}'"
)

record(
    "Department resolves to Computer Engineering (CE)",
    dash_profile.get("departmentCode") == "CE" and "Computer Engineering" in (dash_profile.get("departmentName") or ""),
    f"Dept: {dash_profile.get('departmentName')} ({dash_profile.get('departmentCode')})"
)

record(
    "Semester and Section resolve to Semester VI · Section B",
    dash_profile.get("semester") == "Semester VI" and dash_profile.get("section") == "B",
    f"Semester: '{dash_profile.get('semester')}', Section: '{dash_profile.get('section')}'"
)

# --- 2. Warehouse Conformed Academic Metrics ---
record(
    "GET /api/user/profile returns 200",
    res_prof.status_code == 200,
    f"HTTP Status: {res_prof.status_code}"
)

record(
    "Profile name matches dashboard",
    user_profile.get("name") == dash_profile.get("studentName"),
    f"'{user_profile.get('name')}' == '{dash_profile.get('studentName')}'"
)

record(
    "Profile student ID matches dashboard",
    user_profile.get("student_id") == dash_profile.get("studentId"),
    f"'{user_profile.get('student_id')}' == '{dash_profile.get('studentId')}'"
)

cgpa_prof = academic_summary.get("cgpa")
cgpa_dash = dash_kpis.get("cgpa")
record(
    "Profile CGPA matches dashboard",
    cgpa_prof is not None and cgpa_dash is not None and round(float(cgpa_prof), 2) == round(float(cgpa_dash), 2) == 6.13,
    f"Profile CGPA: {cgpa_prof}, Dashboard CGPA: {cgpa_dash} (Expected: 6.13)"
)

att_prof = academic_summary.get("attendancePercentage")
att_dash = dash_kpis.get("attendancePercentage")
record(
    "Profile attendance matches dashboard",
    att_prof is not None and att_dash is not None and round(float(att_prof), 1) == round(float(att_dash), 1) == 63.1,
    f"Profile Att: {att_prof}%, Dashboard Att: {att_dash}% (Expected: 63.1%)"
)

deficits_prof = academic_summary.get("backlogs")
deficits_dash = dash_kpis.get("subjectsAtRisk")
record(
    "Profile deficits match dashboard",
    deficits_prof == deficits_dash == 1,
    f"Profile Backlogs: {deficits_prof}, Dashboard Deficits: {deficits_dash} (Expected: 1)"
)

sec_prof = academic_summary.get("section") or user_profile.get("section")
sec_dash = dash_profile.get("section")
record(
    "Profile section matches dashboard",
    sec_dash in (sec_prof or ""),
    f"Profile Section: '{sec_prof}', Dashboard Section: '{sec_dash}' (Section B)"
)

# --- 3. Cross-Page Consistency: Dashboard <-> Courses ---
failed_courses = [s for s in dash_subjects if s.get("resultStatus") == "Fail"]
failed_course_names = [s.get("courseName") for s in failed_courses]
earned_sem_credits = sum(s.get("credits", 0) for s in dash_subjects if s.get("resultStatus") == "Pass")
record(
    "Dashboard <-> Courses: Deficit course matches backlog count",
    len(failed_courses) == dash_kpis.get("subjectsAtRisk") == 1 and "Advanced Database Systems" in failed_course_names[0],
    f"Failed Courses Count: {len(failed_courses)}, Deficit: {failed_course_names}"
)

record(
    "Dashboard <-> Courses: Semester VI credit calculation matches",
    len(dash_subjects) == 4 and earned_sem_credits == 12.0,
    f"Total Courses: {len(dash_subjects)}, Earned Credits in Sem VI: {earned_sem_credits} (12.0/16.0)"
)

sub_dict = {s["courseCode"]: s for s in dash_subjects}
cs601 = sub_dict.get("CS601", {})
cs602 = sub_dict.get("CS602", {})
cs603 = sub_dict.get("CS603", {})
cs604 = sub_dict.get("CS604", {})
courses_canonical_pass = (
    cs601.get("courseName") == "Advanced Algorithms" and cs601.get("attendanceRate") == 85.0 and cs601.get("marks") == 78.5 and
    cs602.get("courseName") == "Distributed Cloud Computing" and cs602.get("attendanceRate") == 72.5 and cs602.get("marks") == 72.0 and
    cs604.get("courseName") == "Data Warehousing & Mining" and cs604.get("attendanceRate") == 60.0 and cs604.get("marks") == 61.5 and
    cs603.get("courseName") == "Advanced Database Systems" and cs603.get("attendanceRate") == 35.0 and cs603.get("marks") == 38.0 and cs603.get("resultStatus") == "Fail"
)
record(
    "Dashboard: All 4 Semester VI course titles, marks, and attendances conform to Section 4",
    courses_canonical_pass,
    f"CS601: {cs601.get('courseName')} ({cs601.get('attendanceRate')}%), CS602: {cs602.get('courseName')} ({cs602.get('attendanceRate')}%), CS604: {cs604.get('courseName')} ({cs604.get('attendanceRate')}%), CS603: {cs603.get('courseName')} ({cs603.get('attendanceRate')}%)"
)

# --- 4. Cross-Page Consistency: Dashboard <-> Attendance & Risk ---
record(
    "Dashboard <-> Attendance: Overall attendance is consistent",
    round(dash_attendance.get("overallRate", 0), 1) == 63.1 and dash_attendance.get("isBelowThreshold") is True,
    f"Overall Attendance: {dash_attendance.get('overallRate')}%, Below 75% Cutoff: {dash_attendance.get('isBelowThreshold')}"
)

record(
    "Dashboard <-> Risk: Risk level and classification are consistent",
    dash_risk.get("riskLevel") == "Medium" and dash_risk.get("isAtRisk") is True and dash_kpis.get("academicStanding") == "At-Risk / Academic Monitoring",
    f"Risk Tier: {dash_risk.get('riskLevel')}, Standing: '{dash_kpis.get('academicStanding')}'"
)

# --- 5. Semester Performance Trajectory & Trend Delta ---
sem_names = [t.get("semester") for t in dash_trend]
expected_sems = ["Sem I", "Sem II", "Sem III", "Sem IV", "Sem V", "Sem VI"]
sem5_pt = next((t for t in dash_trend if t.get("semester") in ("Sem V", "Semester V")), None)
sem6_pt = next((t for t in dash_trend if t.get("semester") in ("Sem VI", "Semester VI")), None)
math_delta_valid = False
if sem5_pt and sem6_pt:
    calc_delta = round(sem6_pt.get("sgpa", 0) - sem5_pt.get("sgpa", 0), 2)
    math_delta_valid = (calc_delta == -1.00 and sem5_pt.get("sgpa") == 7.00 and sem6_pt.get("sgpa") == 6.00)

record(
    "Semester Trend: All 6 semesters chronologically present",
    sem_names == expected_sems,
    f"Semesters: {sem_names}"
)

record(
    "Semester Trend: Mathematical SGPA decline verified (7.00 - 6.00 = 1.00)",
    math_delta_valid and dash_trend_insight.get("direction") == "declined",
    f"Sem V SGPA: {sem5_pt.get('sgpa') if sem5_pt else None}, Sem VI SGPA: {sem6_pt.get('sgpa') if sem6_pt else None}, Delta: {dash_trend_insight.get('sgpaDelta')}"
)

# --- 6. Class Benchmark Comparison ---
stu_sgpa = dash_benchmark.get("studentGpa")
class_gpa = dash_benchmark.get("classAvgGpa")
gpa_delta = dash_benchmark.get("gpaDelta")
stu_att = dash_benchmark.get("studentAttendance")
class_att = dash_benchmark.get("classAvgAttendance")
att_delta = dash_benchmark.get("attendanceDelta")

benchmark_math_valid = (
    stu_sgpa == 6.00 and
    class_gpa == 8.08 and
    gpa_delta == -2.08 and
    stu_att == 63.1 and
    class_att == 88.8 and
    att_delta == -25.7 and
    round(class_gpa - stu_sgpa, 2) == 2.08 and
    round(class_att - stu_att, 1) == 25.7
)

record(
    "Class Benchmark: SGPA & Attendance mathematical differences verified",
    benchmark_math_valid,
    f"SGPA Delta: {gpa_delta} (6.00 vs {class_gpa}), Attendance Delta: {att_delta}% ({stu_att}% vs {class_att}%)"
)

# --- 7. Profile Editing & Personal Field Persistence ---
unique_test_phone = "+91 98201 44512"
unique_test_address = "Campus Residence Hall 3, Suite 204-B"
edit_res = client.put(
    "/api/user/profile",
    json={
        "phone": unique_test_phone,
        "address": unique_test_address,
        "bio": "Third-year undergraduate student focused on distributed data engineering and high-performance computing."
    },
    headers=student_headers
)
verify_res = client.get("/api/user/profile", headers=student_headers)
persisted_p = verify_res.json().get("profile", {})
record(
    "Editable personal field persists",
    edit_res.status_code == 200 and persisted_p.get("phone") == unique_test_phone and persisted_p.get("address") == unique_test_address,
    f"PUT Status: {edit_res.status_code}, Persisted Phone: '{persisted_p.get('phone')}'"
)

# --- 8. Academic Fields Locked and Immutable ---
tamper_res = client.put(
    "/api/user/profile",
    json={
        "cgpa": 10.0,
        "current_gpa": 10.0,
        "attendancePercentage": 100.0,
        "student_id": "STU9999",
        "section": "Section A",
        "backlogs": 0
    },
    headers=student_headers
)
verify_after_tamper = client.get("/api/user/profile", headers=student_headers)
summary_after = verify_after_tamper.json().get("academicSummary", {})
profile_after = verify_after_tamper.json().get("profile", {})
record(
    "Academic fields cannot be modified by student",
    round(float(summary_after.get("cgpa", 0)), 2) == 6.13 and
    round(float(summary_after.get("attendancePercentage", 0)), 1) == 63.1 and
    summary_after.get("backlogs") == 1 and
    profile_after.get("student_id") == "STU1178",
    f"CGPA remains {summary_after.get('cgpa')}, Att remains {summary_after.get('attendancePercentage')}%, ID remains {profile_after.get('student_id')}"
)

# --- 9. Security Audit: Cross-Student & Unauthorized Access Blocked ---
cross_profile_res = client.get(
    "/api/user/profile",
    headers={
        "X-User-Role": "Student",
        "X-User-Email": "student@university.edu",
        "X-Student-Id": "STU102"
    }
)
record(
    "Cross-student profile access blocked (HTTP 403)",
    cross_profile_res.status_code == 403,
    f"Tampered Student ID STU102 returned HTTP {cross_profile_res.status_code}"
)

cross_student_res = client.get(
    "/api/student/STU102",
    headers=student_headers
)
record(
    "Cross-student performance record access blocked (HTTP 403)",
    cross_student_res.status_code == 403,
    f"Direct /api/student/STU102 query returned HTTP {cross_student_res.status_code}"
)

at_risk_roster_res = client.get(
    "/api/students/at-risk",
    headers=student_headers
)
record(
    "Institutional at-risk roster blocked for Student (HTTP 403)",
    at_risk_roster_res.status_code == 403,
    f"Institutional roster query returned HTTP {at_risk_roster_res.status_code}"
)

# --- 10. Student Personal Attendance & Risk Endpoint Verification ---
res_att_risk = client.get("/api/student/me/attendance-risk", headers=student_headers)
record(
    "GET /api/student/me/attendance-risk returns 200 for Student",
    res_att_risk.status_code == 200,
    f"HTTP Status: {res_att_risk.status_code}"
)
att_risk_data = res_att_risk.json() if res_att_risk.status_code == 200 else {}
record(
    "Personal risk resolves canonical student identity (STU1178 · Riya Patil)",
    att_risk_data.get("student_id") == "STU1178" and att_risk_data.get("student_name") == "Riya Patil",
    f"ID: '{att_risk_data.get('student_id')}', Name: '{att_risk_data.get('student_name')}'"
)
record(
    "Personal risk resolves conformed attendance 63.1% and 75.0% cutoff",
    round(float(att_risk_data.get("attendance_percentage", 0)), 1) == 63.1 and
    round(float(att_risk_data.get("attendance_cutoff", 0)), 1) == 75.0 and
    att_risk_data.get("is_below_threshold") is True,
    f"Att: {att_risk_data.get('attendance_percentage')}%, Cutoff: {att_risk_data.get('attendance_cutoff')}%, Below: {att_risk_data.get('is_below_threshold')}"
)
record(
    "Personal risk resolves Medium Risk and At-Risk / Academic Monitoring standing",
    att_risk_data.get("risk_level") == "Medium Risk" and
    att_risk_data.get("academic_standing") == "At-Risk / Academic Monitoring" and
    att_risk_data.get("is_at_risk") is True,
    f"Risk: '{att_risk_data.get('risk_level')}', Standing: '{att_risk_data.get('academic_standing')}'"
)
record(
    "Personal risk resolves exactly 1 active deficit in CS603",
    att_risk_data.get("active_deficits") == 1 and
    len(att_risk_data.get("deficit_courses", [])) == 1 and
    att_risk_data.get("deficit_courses", [])[0].get("course_code") == "CS603",
    f"Active Deficits: {att_risk_data.get('active_deficits')}, Courses: {[c.get('course_code') for c in att_risk_data.get('deficit_courses', [])]}"
)
record(
    "Personal risk resolves all 4 Semester VI enrolled courses with biometric rates",
    len(att_risk_data.get("courses", [])) == 4,
    f"Enrolled courses count: {len(att_risk_data.get('courses', []))}"
)

# Cross-student tampered personal risk access
tampered_risk_res = client.get(
    "/api/student/me/attendance-risk",
    headers={
        "X-User-Role": "Student",
        "X-User-Email": "student@university.edu",
        "X-Student-Id": "STU102"
    }
)
record(
    "Tampered student ID on personal risk blocked (HTTP 403)",
    tampered_risk_res.status_code == 403,
    f"Tampered Student ID STU102 returned HTTP {tampered_risk_res.status_code}"
)

# Faculty access to institutional roster
fac_roster_res = client.get(
    "/api/students/at-risk",
    headers={
        "X-User-Role": "Faculty",
        "X-User-Email": "faculty@university.edu"
    }
)
record(
    "Faculty access to institutional at-risk roster allowed (HTTP 200, 108 records)",
    fac_roster_res.status_code == 200 and len(fac_roster_res.json()) == 108,
    f"HTTP Status: {fac_roster_res.status_code}, Records: {len(fac_roster_res.json()) if fac_roster_res.status_code == 200 else 0}"
)

etl_res = client.post(
    "/api/etl/run",
    headers=student_headers
)
record(
    "ETL pipeline execution blocked for Student (HTTP 403)",
    etl_res.status_code == 403,
    f"ETL run request returned HTTP {etl_res.status_code}"
)

settings_res = client.put(
    "/api/settings",
    json={"kmeans_k": 5},
    headers=student_headers
)
record(
    "Institutional settings modification blocked for Student (HTTP 403)",
    settings_res.status_code == 403,
    f"Settings modification returned HTTP {settings_res.status_code}"
)

export_res = client.get(
    "/api/reports/export?report_id=rep-sem-06&format=csv",
    headers=student_headers
)
record(
    "Administrative report export blocked for Student (HTTP 403)",
    export_res.status_code == 403,
    f"Report export returned HTTP {export_res.status_code}"
)

# --- 10. Privacy & UX: Zero Technical RBAC or Database Internals ---
profile_keys = set(user_profile.keys()) | set(academic_summary.keys())
technical_terms = {"permissions", "roles_matrix", "table_name", "etl_status", "fact_academic_performance", "fact_student_risk_status", "sql_query"}
exposed_tech = technical_terms.intersection(profile_keys)
record(
    "No technical RBAC or database table names in student profile",
    len(exposed_tech) == 0,
    f"Exposed internal fields: {list(exposed_tech) if exposed_tech else 'None'}"
)

record(
    "No 404 profile error after login",
    res_prof.status_code == 200,
    f"Profile status {res_prof.status_code} != 404"
)

print("\n" + "=" * 80)
total_tests = len(results)
passed_tests = sum(1 for r in results if r["status"] == "PASS")
print(f"MASTER AUDIT SUMMARY: {passed_tests}/{total_tests} ASSERTIONS PASSED")
print("=" * 80)

if passed_tests < total_tests:
    sys.exit(1)
