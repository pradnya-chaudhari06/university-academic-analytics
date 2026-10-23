"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Institutional Reporting & Data Export Router
==============================================================================
Generates real conformed CSV and tabular data downloads for all 5 institutional
report templates, OLAP cube matrices, and Data Mining artifacts.
All data is queried directly from live warehouse facts and dimensions.
Zero fake files, zero mock responses.
==============================================================================
"""

import io
import csv
from fastapi import APIRouter, HTTPException, Query, Header, Response
from typing import Optional

from backend.database import execute_query

reports_router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

def build_csv_response(filename: str, headers: list, rows: list) -> Response:
    """Generate a clean RFC-4180 CSV response with UTF-8 BOM for Excel compatibility."""
    output = io.StringIO()
    # Write UTF-8 BOM so Excel opens special characters correctly
    output.write('\ufeff')
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)
    
    csv_bytes = output.getvalue().encode('utf-8')
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.csv"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@reports_router.get("/export")
def export_report(
    report_id: str = Query(..., description="Report identifier: semester_executive, department_comparison, at_risk_intervention, course_outcomes, warehouse_audit, olap_cube, mining_clusters, mining_rules"),
    format: str = Query("csv", description="Export format: 'csv'"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id")
):
    """
    Exports genuine, live institutional report dossiers compiled directly from warehouse tables.
    Validates user role permissions: Students are restricted from institutional administrative dossiers.
    """
    role = (x_user_role or "").strip()
    rep_id = report_id.strip().lower()

    # RBAC Validation
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are not authorized to export institutional administrative dossiers."
        )

    # 1. Semester VI Executive Performance Summary
    if rep_id in ("semester_executive", "rep-sem-06", "rep-sem-01", "executive"):
        dept_rows = execute_query("""
        SELECT 
            d.department_code,
            d.department_name,
            COUNT(DISTINCT s.student_key) as total_students,
            ROUND(AVG(f.grade_point), 2) as avg_gpa,
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as pass_rate,
            ROUND(AVG(att.attendance_percentage), 1) as attendance_rate,
            COUNT(DISTINCT CASE WHEN r.is_at_risk = 1 THEN r.student_key END) as at_risk_count
        FROM dim_department d
        JOIN dim_student s ON d.department_key = s.department_key
        JOIN fact_academic_performance f ON s.student_key = f.student_key AND f.time_key = 20260630
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        LEFT JOIN fact_student_risk_status r ON s.student_key = r.student_key AND r.time_key = 20260630
        GROUP BY d.department_key, d.department_code, d.department_name
        ORDER BY d.department_key ASC;
        """)

        headers = [
            "Department Code", "Department Name", "Enrolled Students",
            "Mean CGPA (10.0 Scale)", "Pass Percentage (%)", "Attendance Rate (%)",
            "At-Risk Students Count", "Academic Term", "Conformed Fact Lineage"
        ]
        rows = []
        for d in dept_rows:
            rows.append([
                d["department_code"],
                d["department_name"],
                d["total_students"],
                f"{d['avg_gpa']:.2f}",
                f"{d['pass_rate']:.1f}%",
                f"{d['attendance_rate']:.1f}%",
                d["at_risk_count"],
                "AY 2025–26 · Semester VI",
                "FactAcademicPerformance, FactAttendance, FactStudentRiskStatus"
            ])
        return build_csv_response("Semester_VI_Executive_Performance_Summary", headers, rows)

    # 2. Departmental Comparative Analytics Report
    elif rep_id in ("department_comparison", "rep-dept-02", "rep-dpt-01", "department", "departments"):
        dept_rows = execute_query("""
        SELECT 
            d.department_code,
            d.department_name,
            d.faculty_name as dean_or_faculty,
            COUNT(DISTINCT s.student_key) as total_students,
            ROUND(AVG(f.grade_point), 2) as avg_gpa,
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as pass_rate,
            ROUND(AVG(att.attendance_percentage), 1) as attendance_rate,
            COUNT(DISTINCT CASE WHEN r.is_at_risk = 1 THEN r.student_key END) as at_risk_count
        FROM dim_department d
        JOIN dim_student s ON d.department_key = s.department_key
        JOIN fact_academic_performance f ON s.student_key = f.student_key AND f.time_key = 20260630
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        LEFT JOIN fact_student_risk_status r ON s.student_key = r.student_key AND r.time_key = 20260630
        GROUP BY d.department_key, d.department_code, d.department_name, d.faculty_name
        ORDER BY avg_gpa DESC;
        """)

        headers = [
            "Rank", "Department Code", "Department Name", "Faculty / Division",
            "Total Undergraduates", "Average CGPA", "Pass Rate (%)",
            "Attendance Rate (%)", "At-Risk Cohort Count", "Risk Concentration (%)"
        ]
        total_risk = sum(d["at_risk_count"] for d in dept_rows) or 1
        rows = []
        for idx, d in enumerate(dept_rows, start=1):
            risk_pct = round((d["at_risk_count"] / total_risk) * 100, 1)
            rows.append([
                idx,
                d["department_code"],
                d["department_name"],
                d["dean_or_faculty"],
                d["total_students"],
                f"{d['avg_gpa']:.2f}",
                f"{d['pass_rate']:.1f}%",
                f"{d['attendance_rate']:.1f}%",
                d["at_risk_count"],
                f"{risk_pct}%"
            ])
        return build_csv_response("Departmental_Comparative_Analytics_Report", headers, rows)

    # 3. Student Risk & Academic Early Intervention Docket
    elif rep_id in ("at_risk_intervention", "rep-risk-04", "rep-rsk-02", "at-risk", "risk"):
        risk_rows = execute_query("""
        SELECT 
            s.student_id,
            s.student_name,
            d.department_code,
            d.department_name,
            s.gender,
            r.current_gpa,
            r.attendance_percentage,
            r.failed_courses_count,
            r.risk_level,
            r.is_at_risk
        FROM fact_student_risk_status r
        JOIN dim_student s ON r.student_key = s.student_key
        JOIN dim_department d ON r.department_key = d.department_key
        WHERE r.time_key = 20260630
        ORDER BY r.is_at_risk DESC, r.current_gpa ASC;
        """)

        headers = [
            "Student ID", "Student Name", "Department Code", "Department Name",
            "Gender", "Current SGPA", "Biometric Attendance (%)",
            "Failed Courses Count", "Risk Level Classification", "Academic Standing",
            "Recommended Intervention Pathway"
        ]
        rows = []
        for r in risk_rows:
            level = r["risk_level"]
            standing = "Good Standing" if r["is_at_risk"] != 1 else f"{level} Risk"
            action = "Urgent Academic Mentorship & Tutorial Remediation" if level in ("Critical", "High") else (
                "Attendance Counseling & Supplementary Quizzes" if level == "Moderate" else "Regular Academic Tracking"
            )
            rows.append([
                r["student_id"],
                r["student_name"],
                r["department_code"],
                r["department_name"],
                r["gender"],
                f"{r['current_gpa']:.2f}",
                f"{r['attendance_percentage']:.1f}%",
                r["failed_courses_count"],
                level,
                standing,
                action
            ])
        return build_csv_response("Student_Risk_And_Early_Intervention_Docket", headers, rows)

    # 4. Curriculum & Course Outcome Assessment
    elif rep_id in ("course_outcomes", "rep-curr-03", "rep-crs-03", "courses", "curriculum"):
        course_rows = execute_query("""
        SELECT 
            c.course_code,
            c.course_name,
            d.department_code,
            d.department_name,
            c.credits,
            c.semester,
            ROUND(AVG(f.marks), 1) as avg_marks,
            ROUND(AVG(f.grade_point), 2) as avg_gpa,
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as pass_rate,
            COUNT(DISTINCT f.student_key) as enrollment_count
        FROM dim_course c
        JOIN dim_department d ON c.department_key = d.department_key
        LEFT JOIN fact_academic_performance f ON c.course_key = f.course_key
        GROUP BY c.course_key, c.course_code, c.course_name, d.department_code, d.department_name, c.credits, c.semester
        ORDER BY c.course_code ASC;
        """)

        headers = [
            "Course Code", "Course Title", "Department Code", "Department",
            "Credit Weight", "Instruction Semester", "Mean Raw Score (100)",
            "Average GPA Equivalent", "Pass Percentage (%)", "Total Student Evaluations"
        ]
        rows = []
        for c in course_rows:
            rows.append([
                c["course_code"],
                c["course_name"],
                c["department_code"],
                c["department_name"],
                f"{c['credits']:.1f}",
                c["semester"],
                f"{c['avg_marks'] or 0.0:.1f}",
                f"{c['avg_gpa'] or 0.0:.2f}",
                f"{c['pass_rate'] or 0.0:.1f}%",
                c["enrollment_count"]
            ])
        return build_csv_response("Curriculum_Course_Outcome_Assessment", headers, rows)

    # 5. Data Warehouse Star Schema & ETL Audit Record
    elif rep_id in ("warehouse_audit", "rep-etl-05", "rep-dwm-05", "etl", "warehouse"):
        audit_rows = execute_query("""
        SELECT 
            log_id, job_id, job_name, source_system, target_table,
            status, records_extracted, records_loaded, duration_seconds, completed_at
        FROM etl_audit_log
        ORDER BY log_id DESC;
        """)

        headers = [
            "Log ID", "Job ID", "Job Name", "Source Data Systems",
            "Target Star Schema Tables", "Execution Status", "Records Extracted",
            "Records Loaded", "Execution Duration (Seconds)", "Completion Timestamp"
        ]
        rows = []
        for a in audit_rows:
            rows.append([
                a["log_id"],
                a["job_id"],
                a["job_name"],
                a["source_system"],
                a["target_table"],
                a["status"],
                a["records_extracted"],
                a["records_loaded"],
                f"{a['duration_seconds']:.2f}",
                a["completed_at"]
            ])
        return build_csv_response("Warehouse_Star_Schema_ETL_Audit_Report", headers, rows)

    # 6. OLAP Cube Matrix Export
    elif rep_id in ("olap_cube", "olap"):
        olap_rows = execute_query("""
        SELECT 
            t.semester,
            t.academic_year,
            d.department_code,
            d.department_name,
            ROUND(AVG(f.grade_point), 2) as avg_gpa,
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as pass_rate,
            ROUND(AVG(att.attendance_percentage), 1) as attendance_rate,
            COUNT(DISTINCT f.student_key) as student_count
        FROM dim_time t
        JOIN fact_academic_performance f ON t.time_key = f.time_key
        JOIN dim_department d ON f.department_key = d.department_key
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        GROUP BY t.time_key, t.semester, t.academic_year, d.department_key, d.department_code, d.department_name
        ORDER BY t.time_key ASC, d.department_key ASC;
        """)

        headers = [
            "Semester Coordinate (DimTime)", "Academic Year", "Department Code",
            "Department Name (DimDepartment)", "Cohort Mean GPA (Scale 10.0)",
            "Pass Rate (%)", "Attendance Rate (%)", "Distinct Enrolled Students"
        ]
        rows = []
        for o in olap_rows:
            rows.append([
                o["semester"],
                o["academic_year"],
                o["department_code"],
                o["department_name"],
                f"{o['avg_gpa']:.2f}",
                f"{o['pass_rate']:.1f}%",
                f"{o['attendance_rate']:.1f}%",
                o["student_count"]
            ])
        return build_csv_response("OLAP_Conformed_Cube_Matrix", headers, rows)

    # 7. Data Mining Exports
    elif rep_id in ("mining_clusters", "kmeans"):
        from backend.mining.clustering import clustering_engine
        
        cluster_res = clustering_engine.run_kmeans(k=3)
        headers = [
            "Cluster ID", "Archetype Label", "Risk Tier", "Student Count", "Cohort Share (%)",
            "Mean Current GPA", "Mean Historical GPA", "Mean Attendance (%)",
            "Mean Failed Courses", "Intervention Recommendation"
        ]
        rows = []
        for c in cluster_res.get("clusters", []):
            cent = c.get("centroid", {})
            rows.append([
                c.get("clusterId", ""),
                c.get("archetypeName", ""),
                c.get("tier", ""),
                c.get("studentCount", 0),
                f"{c.get('percentage', 0.0):.1f}%",
                f"{cent.get('current_gpa', 0.0):.2f}",
                f"{cent.get('historical_gpa', 0.0):.2f}",
                f"{cent.get('attendance_percentage', 0.0):.1f}%",
                f"{cent.get('failed_courses_count', 0.0):.2f}",
                c.get("recommendedAction", "")
            ])
        return build_csv_response("Data_Mining_KMeans_Clusters", headers, rows)

    elif rep_id in ("mining_rules", "apriori"):
        from backend.mining.association import association_engine
        
        rule_res = association_engine.run_apriori(min_support=0.015, min_confidence=0.60, max_length=3)
        headers = [
            "Rule ID", "Antecedents (If)", "Consequents (Then)",
            "Support", "Confidence (%)", "Lift Ratio", "Pedagogical Category", "Interpretation"
        ]
        rows = []
        for idx, r in enumerate(rule_res.get("rules", []), start=1):
            rows.append([
                idx,
                " + ".join(r.get("antecedent", [])),
                " + ".join(r.get("consequent", [])),
                f"{r.get('support', 0.0):.4f}",
                r.get("confidencePct", f"{r.get('confidence', 0.0)*100:.1f}%"),
                f"{r.get('lift', 0.0):.2f}",
                r.get("category", ""),
                r.get("interpretation", "")
            ])
        return build_csv_response("Data_Mining_Apriori_Rules", headers, rows)

    elif rep_id in ("mining_tree", "tree", "mining_features", "feature_importance"):
        from backend.mining.classification import classification_engine
        
        tree_res = classification_engine.train_decision_tree(max_depth=3)
        headers = [
            "Feature Identifier", "Feature Display Name", "Importance Score (Gini)", "Relative Impact (%)"
        ]
        rows = []
        for f in tree_res.get("featureImportances", []):
            rows.append([
                f.get("feature", ""),
                f.get("featureDisplay", f.get("feature", "")),
                f"{f.get('importance', 0.0):.4f}",
                f.get("importancePct", f"{f.get('importance', 0.0)*100:.1f}%")
            ])
        return build_csv_response("Data_Mining_Feature_Importance", headers, rows)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported report identifier: '{report_id}'")
