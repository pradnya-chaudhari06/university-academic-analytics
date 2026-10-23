"""
==============================================================================
Comprehensive Security, RBAC Matrix, & Functional Verification Test Suite
For Faculty Module & Multi-Role System Isolation
==============================================================================
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(url: str, method: str = "GET", headers: dict = None, data: dict = None):
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("=" * 80)
    print("RUNNING COMPREHENSIVE FACULTY & RBAC SYSTEM AUDIT")
    print("=" * 80)

    results = []

    # --------------------------------------------------------------------------
    # 1. FACULTY ACCESS TESTS
    # --------------------------------------------------------------------------
    fac_headers = {
        "X-User-Role": "Faculty",
        "X-User-Email": "faculty@university.edu"
    }

    # Faculty Dashboard
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/dashboard", headers=fac_headers)
    is_ok = status == 200 and "kpis" in data and "courses" in data and "performanceTrend" in data
    results.append(("Faculty -> /api/faculty/dashboard", 200, status, is_ok))

    # Faculty Performance
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/performance", headers=fac_headers)
    is_ok = status == 200 and "courses" in data and "gradeDistribution" in data
    results.append(("Faculty -> /api/faculty/performance", 200, status, is_ok))

    # Faculty Insights (Data Mining translation)
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/insights", headers=fac_headers)
    is_ok = status == 200 and "studentArchetypes" in data and "curriculumBottleneckRules" in data
    results.append(("Faculty -> /api/faculty/insights", 200, status, is_ok))

    # Faculty Courses
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/courses", headers=fac_headers)
    is_ok = status == 200 and isinstance(data, list) and len(data) > 0
    results.append(("Faculty -> /api/faculty/courses", 200, status, is_ok))

    # Faculty Course Detail (e.g. CS601)
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/courses/CS601", headers=fac_headers)
    is_ok = status == 200 and "course" in data and "gradeDistribution" in data
    results.append(("Faculty -> /api/faculty/courses/CS601", 200, status, is_ok))

    # Faculty Attendance Analytics
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/attendance", headers=fac_headers)
    is_ok = status == 200 and "summary" in data and "attendanceTiers" in data
    results.append(("Faculty -> /api/faculty/attendance", 200, status, is_ok))

    # Faculty At-Risk Students
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/at-risk", headers=fac_headers)
    is_ok = status == 200 and isinstance(data, list)
    results.append(("Faculty -> /api/faculty/at-risk", 200, status, is_ok))

    # Faculty Students Directory (paginated)
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/students?page=1&limit=10", headers=fac_headers)
    is_ok = status == 200 and "students" in data and data.get("total", 0) > 0
    results.append(("Faculty -> /api/faculty/students", 200, status, is_ok))

    # Faculty Student Detail (e.g. STU1178)
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/student/STU1178", headers=fac_headers)
    is_ok = status == 200 and "student" in data and "currentCourses" in data
    results.append(("Faculty -> /api/faculty/student/STU1178", 200, status, is_ok))

    # --------------------------------------------------------------------------
    # 2. FACULTY ISOLATION / FORBIDDEN ROUTES
    # --------------------------------------------------------------------------
    # Faculty blocked from Warehouse Status
    status, data = test_endpoint(f"{BASE_URL}/api/warehouse/status", headers=fac_headers)
    results.append(("Faculty blocked from /api/warehouse/status", 403, status, status == 403))

    # Faculty blocked from ETL trigger
    status, data = test_endpoint(f"{BASE_URL}/api/etl/run", method="POST", headers=fac_headers)
    results.append(("Faculty blocked from /api/etl/run", 403, status, status == 403))

    # --------------------------------------------------------------------------
    # 3. STUDENT ISOLATION / FORBIDDEN ROUTES
    # --------------------------------------------------------------------------
    stu_headers = {
        "X-User-Role": "Student",
        "X-Student-Id": "STU1178",
        "X-User-Email": "student@university.edu"
    }

    # Student blocked from /api/faculty/student/STU1178
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/student/STU1178", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/student/STU1178", 403, status, status == 403))

    # Student blocked from /api/faculty/attendance
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/attendance", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/attendance", 403, status, status == 403))

    # Student accessing own dashboard
    status, data = test_endpoint(f"{BASE_URL}/api/student/me/dashboard", headers=stu_headers)
    is_own = status == 200 and data.get("profile", {}).get("studentId") == "STU1178"
    results.append(("Student accessing own dashboard (/api/student/me/dashboard)", 200, status, is_own))

    # Student spoofing parameter student_id=STU102
    status, data = test_endpoint(f"{BASE_URL}/api/student/me/dashboard?student_id=STU102", headers=stu_headers)
    results.append(("Student spoofing student_id=STU102", 403, status, status == 403))

    # Student attempting /api/student/STU102
    status, data = test_endpoint(f"{BASE_URL}/api/student/STU102", headers=stu_headers)
    results.append(("Student accessing /api/student/STU102", 403, status, status == 403))

    # Student blocked from /api/faculty/dashboard
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/dashboard", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/dashboard", 403, status, status == 403))

    # Student blocked from /api/faculty/performance
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/performance", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/performance", 403, status, status == 403))

    # Student blocked from /api/faculty/insights
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/insights", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/insights", 403, status, status == 403))

    # Student blocked from /api/faculty/students
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/students", headers=stu_headers)
    results.append(("Student blocked from /api/faculty/students", 403, status, status == 403))

    # Student blocked from /api/students (cohort directory)
    status, data = test_endpoint(f"{BASE_URL}/api/students", headers=stu_headers)
    results.append(("Student blocked from /api/students", 403, status, status == 403))

    # Student blocked from /api/students/at-risk (institutional risk roster)
    status, data = test_endpoint(f"{BASE_URL}/api/students/at-risk", headers=stu_headers)
    results.append(("Student blocked from /api/students/at-risk", 403, status, status == 403))

    # Student blocked from /api/warehouse/status
    status, data = test_endpoint(f"{BASE_URL}/api/warehouse/status", headers=stu_headers)
    results.append(("Student blocked from /api/warehouse/status", 403, status, status == 403))

    # --------------------------------------------------------------------------
    # 4. ADMINISTRATOR CAPABILITIES
    # --------------------------------------------------------------------------
    admin_headers = {
        "X-User-Role": "Administrator",
        "X-User-Email": "admin@university.edu"
    }

    # Admin access to warehouse status
    status, data = test_endpoint(f"{BASE_URL}/api/warehouse/status", headers=admin_headers)
    results.append(("Admin access to /api/warehouse/status", 200, status, status == 200))

    # Admin access to faculty dashboard
    status, data = test_endpoint(f"{BASE_URL}/api/faculty/dashboard", headers=admin_headers)
    results.append(("Admin access to /api/faculty/dashboard", 200, status, status == 200))

    # Admin access to student directory
    status, data = test_endpoint(f"{BASE_URL}/api/students?limit=5", headers=admin_headers)
    results.append(("Admin access to /api/students", 200, status, status == 200))

    # --------------------------------------------------------------------------
    # 5. ANALYTICS CAPABILITIES
    # --------------------------------------------------------------------------
    analyst_headers = {
        "X-User-Role": "Analytics",
        "X-User-Email": "analyst@university.edu"
    }

    # Analytics access to OLAP aggregates
    status, data = test_endpoint(f"{BASE_URL}/api/olap/matrix", headers=analyst_headers)
    results.append(("Analytics access to /api/olap/matrix", 200, status, status == 200))

    # Analytics access to Data Mining K-Means
    status, data = test_endpoint(f"{BASE_URL}/api/mining/clusters?k=3", headers=analyst_headers)
    results.append(("Analytics access to /api/mining/clusters", 200, status, status == 200))

    # Print Formatted Results
    print(f"\n{'TEST DESCRIPTION':<55} | {'EXP':<4} | {'ACT':<4} | {'RESULT':<6}")
    print("-" * 80)
    all_passed = True
    for desc, exp, act, ok in results:
        res_str = "PASS" if ok else "FAIL"
        if not ok:
            all_passed = False
        print(f"{desc:<55} | {exp:<4} | {act:<4} | {res_str:<6}")

    print("=" * 80)
    print(f"OVERALL STATUS: {'ALL TESTS PASSED (100%)' if all_passed else 'SOME TESTS FAILED'}")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
