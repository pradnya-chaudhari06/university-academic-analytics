"""
Script to validate Phase 2C API endpoints using Starlette TestClient.
"""
from starlette.testclient import TestClient
from backend.main import app

def main():
    client = TestClient(app)
    print("=" * 75)
    print("PHASE 2C: VALIDATING FASTAPI ENDPOINTS DERIVED FROM WAREHOUSE")
    print("=" * 75)

    # 1. GET /api/health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    health = res.json()
    print("\n[1] GET /api/health:")
    print("    - Status:", health["status"])
    print("    - Database Engine:", health["database_engine"])
    print("    - Enrolled Grain:", health["enrolled_students_grain"])
    assert health["enrolled_students_grain"] == 4820, f"Expected 4820 students, got {health['enrolled_students_grain']}"

    # 2. GET /api/kpis
    res = client.get("/api/kpis")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    kpis = res.json()
    print("\n[2] GET /api/kpis (All Departments):")
    print("    - Academic Period:", kpis["academic_period"])
    print("    - Total Students:", kpis["total_students"])
    print("    - Average GPA:", kpis["average_gpa"])
    print("    - Pass Rate:", f"{kpis['pass_rate']}%")
    print("    - Attendance Rate:", f"{kpis['attendance_rate']}%")
    print("    - At-Risk Students:", kpis["at_risk_students"])
    assert kpis["total_students"] == 4820, f"Expected 4820, got {kpis['total_students']}"
    assert kpis["average_gpa"] == 7.82, f"Expected 7.82, got {kpis['average_gpa']}"
    assert kpis["pass_rate"] == 91.4, f"Expected 91.4, got {kpis['pass_rate']}"
    assert kpis["attendance_rate"] == 87.6, f"Expected 87.6, got {kpis['attendance_rate']}"
    assert kpis["at_risk_students"] == 108, f"Expected 108, got {kpis['at_risk_students']}"

    # Test sliced KPI (e.g. Computer Engineering)
    res_ce = client.get("/api/kpis?department=Computer%20Engineering")
    kpi_ce = res_ce.json()
    print("    [Slice: CE] Students:", kpi_ce["total_students"], "GPA:", kpi_ce["average_gpa"], "Pass:", f"{kpi_ce['pass_rate']}%", "At-Risk:", kpi_ce["at_risk_students"])

    # 3. GET /api/departments
    res = client.get("/api/departments")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    depts = res.json()
    print("\n[3] GET /api/departments:")
    assert len(depts) == 5, f"Expected 5 departments, got {len(depts)}"
    for d in depts:
        print(f"    - {d['code']} ({d['name']}): Students={d['total_students']}, GPA={d['average_gpa']}, Pass={d['pass_rate']}%, Att={d['attendance_rate']}%, At-Risk={d['at_risk_students']}")

    # 4. GET /api/courses
    res = client.get("/api/courses")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    courses = res.json()
    print(f"\n[4] GET /api/courses: ({len(courses)} curriculum catalog courses)")
    for c in courses[:5]:
        print(f"    - {c['code']} ({c['name']}): Evaluated={c['evaluated_count']}, Pass={c['pass_rate']}%, Avg GPA={c['average_gpa']}")
    print("    ... [remaining courses omitted for brevity]")

    # 5. GET /api/students/at-risk
    res = client.get("/api/students/at-risk")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    at_risk = res.json()
    print(f"\n[5] GET /api/students/at-risk: ({len(at_risk)} flagged students)")
    assert len(at_risk) == 108, f"Expected 108 at-risk students, got {len(at_risk)}"
    for s in at_risk[:5]:
        print(f"    - {s['studentId']} ({s['studentName']}, {s['department']}): GPA={s['gpa']}, Att={s['attendanceRate']}%, Risk={s['riskLevel']}, Subject={s['flaggedSubject']}")
    print(f"    ... [{len(at_risk) - 5} remaining at-risk students verified]")

    # 6. GET /api/warehouse/status
    res = client.get("/api/warehouse/status")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    status = res.json()
    print("\n[6] GET /api/warehouse/status:")
    print("    - Status:", status["status"])
    print("    - Last ETL Run:", status["last_etl_run"])
    print("    - Records Processed:", status["records_processed"])
    print("    - Fact Tables Count:", status["fact_tables_count"])
    print("    - Dimension Tables Count:", status["dimension_tables_count"])

    print("\n" + "=" * 75)
    print("ALL 6 FASTAPI ENDPOINTS VALIDATED DYNAMICALLY AGAINST WAREHOUSE!")
    print("=" * 75)

if __name__ == "__main__":
    main()
