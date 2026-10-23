import sys, os
sys.path.insert(0, os.path.abspath('.'))
import urllib.request
import urllib.error
import json
import time

BASE = "http://127.0.0.1:8000"

def fetch_api(endpoint, headers=None, method="GET", data=None):
    headers = headers or {}
    url = f"{BASE}{endpoint}"
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = None
        try:
            body = json.loads(e.read().decode())
        except:
            pass
        return e.code, body

print("=" * 80)
print("COMPREHENSIVE ADMINISTRATOR & OLAP MODULE AUDIT SUITE")
print("=" * 80)

results = []

# ------------------------------------------------------------------------------
# 1. Administrator Dashboard KPIs
# ------------------------------------------------------------------------------
print("[1/10] Testing GET /api/kpis...")
st, kpis = fetch_api("/api/kpis", headers={"X-User-Role": "Administrator"})
kpi_pass = (
    st == 200 and
    kpis.get("total_students") == 4820 and
    kpis.get("average_gpa") is not None and
    kpis.get("pass_rate") is not None and
    kpis.get("at_risk_students") is not None
)
results.append({
    "test": "Admin KPIs (System-wide)",
    "endpoint": "GET /api/kpis",
    "details": f"Total: {kpis.get('total_students')}, Avg GPA: {kpis.get('average_gpa')}, Pass Rate: {kpis.get('pass_rate')}%, At-Risk: {kpis.get('at_risk_students')}",
    "pass": kpi_pass
})

# ------------------------------------------------------------------------------
# 2. Departments Rollup
# ------------------------------------------------------------------------------
print("[2/10] Testing GET /api/departments...")
st, depts = fetch_api("/api/departments", headers={"X-User-Role": "Administrator"})
dept_pass = (
    st == 200 and
    isinstance(depts, list) and
    len(depts) == 5 and
    all(d.get("code") and d.get("total_students") for d in depts)
)
results.append({
    "test": "Departments Aggregate Rollup",
    "endpoint": "GET /api/departments",
    "details": f"Departments: {len(depts)} (Codes: {[d['code'] for d in depts]})",
    "pass": dept_pass
})

# ------------------------------------------------------------------------------
# 3. Department Specific Drill-down
# ------------------------------------------------------------------------------
print("[3/10] Testing GET /api/departments/CE...")
st, ce = fetch_api("/api/departments/CE", headers={"X-User-Role": "Administrator"})
ce_pass = (
    st == 200 and
    ce.get("code") == "CE" and
    ce.get("totalStudents") == 1180
)
results.append({
    "test": "Department Drill-down (CE)",
    "endpoint": "GET /api/departments/CE",
    "details": f"Dept: {ce.get('name')} ({ce.get('code')}), Enrolled: {ce.get('totalStudents')}, Pass: {ce.get('passRate')}%, GPA: {ce.get('averageGpa')}",
    "pass": ce_pass
})

# ------------------------------------------------------------------------------
# 4. Global Courses Catalog
# ------------------------------------------------------------------------------
print("[4/10] Testing GET /api/courses...")
st, courses = fetch_api("/api/courses", headers={"X-User-Role": "Administrator"})
courses_pass = (
    st == 200 and
    isinstance(courses, list) and
    len(courses) == 30
)
results.append({
    "test": "Global Course Catalog",
    "endpoint": "GET /api/courses",
    "details": f"Total Offerings: {len(courses)} courses across 5 departments",
    "pass": courses_pass
})

# ------------------------------------------------------------------------------
# 5. Course Specific Details
# ------------------------------------------------------------------------------
print("[5/10] Testing GET /api/courses/CS601...")
st, c601 = fetch_api("/api/courses/CS601", headers={"X-User-Role": "Administrator"})
c601_pass = (
    st == 200 and
    c601.get("code") == "CS601" and
    c601.get("enrolledStudents") == 1180
)
results.append({
    "test": "Course Drill-down (CS601)",
    "endpoint": "GET /api/courses/CS601",
    "details": f"Course: {c601.get('name')}, Credits: {c601.get('credits')}, Pass: {c601.get('passRate')}%, Avg GPA: {c601.get('averageGpa')}",
    "pass": c601_pass
})

# ------------------------------------------------------------------------------
# 6. Global Student Directory & Pagination
# ------------------------------------------------------------------------------
print("[6/10] Testing GET /api/students...")
st, stus = fetch_api("/api/students?page=1&limit=25", headers={"X-User-Role": "Administrator"})
stus_pass = (
    st == 200 and
    stus.get("total") == 4820 and
    len(stus.get("students", [])) == 25
)
results.append({
    "test": "Global Student Directory & Pagination",
    "endpoint": "GET /api/students",
    "details": f"Total Cohort: {stus.get('total')}, Page Size: {len(stus.get('students', []))}, Total Pages: {stus.get('totalPages')}",
    "pass": stus_pass
})

# ------------------------------------------------------------------------------
# 7. Longitudinal Semester Trends
# ------------------------------------------------------------------------------
print("[7/10] Testing GET /api/trends...")
st, trends = fetch_api("/api/trends", headers={"X-User-Role": "Administrator"})
trends_pass = (
    st == 200 and
    isinstance(trends, list) and
    len(trends) == 6
)
results.append({
    "test": "Longitudinal Semester Progression Trends",
    "endpoint": "GET /api/trends",
    "details": f"Progression Points: {len(trends)} semesters (Sem I to Sem VI), Active Benchmark: 7.50",
    "pass": trends_pass
})

# ------------------------------------------------------------------------------
# 8. Multi-dimensional OLAP Cube Matrix
# ------------------------------------------------------------------------------
print("[8/10] Testing GET /api/olap/matrix...")
st, olap = fetch_api("/api/olap/matrix", headers={"X-User-Role": "Analytics"})
olap_cells = len(olap) if isinstance(olap, list) else 0
# 6 semesters × 5 departments = 30 cells
olap_pass = (
    st == 200 and
    isinstance(olap, list) and
    olap_cells == 30 and
    all("semester" in c and "departmentCode" in c and "averageGpa" in c for c in olap)
)
results.append({
    "test": "Multi-dimensional OLAP Cube Matrix",
    "endpoint": "GET /api/olap/matrix",
    "details": f"Conformed Cells: {olap_cells} (DimTime[6] × DimDepartment[5]), Measure: GPA & Pass Rate",
    "pass": olap_pass
})

# ------------------------------------------------------------------------------
# 9. Warehouse Operational Status
# ------------------------------------------------------------------------------
print("[9/10] Testing GET /api/warehouse/status...")
st, wh = fetch_api("/api/warehouse/status", headers={"X-User-Role": "Administrator"})
wh_pass = (
    st == 200 and
    wh.get("status") == "Healthy" and
    wh.get("fact_tables_count") == 3 and
    wh.get("dimension_tables_count") == 5 and
    len(wh.get("audit_logs", [])) > 0
)
results.append({
    "test": "Data Warehouse Operational Status",
    "endpoint": "GET /api/warehouse/status",
    "details": f"Status: {wh.get('status')}, Facts: {wh.get('fact_tables_count')}, Dims: {wh.get('dimension_tables_count')}, Logs: {len(wh.get('audit_logs', []))}",
    "pass": wh_pass
})

# ------------------------------------------------------------------------------
# 10. Role Isolation on Warehouse Status (Admin Only)
# ------------------------------------------------------------------------------
print("[10/10] Testing Warehouse Status Access Restrictions...")
st_fac, _ = fetch_api("/api/warehouse/status", headers={"X-User-Role": "Faculty"})
st_stu, _ = fetch_api("/api/warehouse/status", headers={"X-User-Role": "Student"})
st_ana, _ = fetch_api("/api/warehouse/status", headers={"X-User-Role": "Analytics"})
iso_pass = (st_fac == 403 and st_stu == 403 and st_ana == 403)
results.append({
    "test": "Warehouse Status Access Isolation",
    "endpoint": "GET /api/warehouse/status (non-admin roles)",
    "details": f"Faculty: {st_fac} (exp 403), Student: {st_stu} (exp 403), Analytics: {st_ana} (exp 403)",
    "pass": iso_pass
})

print("\n" + "=" * 80)
print("ADMINISTRATOR & OLAP AUDIT SUMMARY")
print("=" * 80)
all_pass = True
for r in results:
    status_str = "PASS" if r["pass"] else "FAIL"
    if not r["pass"]:
        all_pass = False
    print(f"[{status_str}] {r['test']:<42} | {r['details']}")

print("=" * 80)
print(f"STATUS: {'ALL ADMIN & OLAP AUDITS PASSED (100%)' if all_pass else 'FAILURES DETECTED'}")
print("=" * 80)
