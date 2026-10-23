"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Online Analytical Processing (OLAP) Router
==============================================================================
Implements all four core OLAP operations:
1. SLICE: Fixes one dimension to a single coordinate (Time or Department)
2. DICE: Selects a multi-dimensional subcube across Time, Department & Measure
3. ROLL-UP: Aggregates facts up the hierarchy (Course -> Dept -> Institution)
4. DRILL-DOWN: De-aggregates from Institutional/Dept level to Course/Student detail
All calculations are evaluated live against conformed Star Schema fact tables.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional, List, Dict, Any
from backend.database import execute_query

olap_router = APIRouter(prefix="/api/olap", tags=["OLAP Operations"])

@olap_router.get("/slice")
def get_olap_slice(
    dimension: str = Query("time", description="Dimension to slice: 'time' or 'department'"),
    value: str = Query("Semester VI", description="Fixed coordinate value, e.g. 'Semester VI' or 'CE'"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """
    Executes OLAP SLICE: Fixes a single dimension to a specific coordinate value.
    Computes conformed fact aggregations across all remaining orthogonal dimensions.
    """
    role = (x_user_role or "").strip()
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are strictly restricted from accessing institutional OLAP calculations."
        )

    val = value.strip()
    dim = dimension.strip().lower()

    if dim in ("time", "semester"):
        # Fix time coordinate (e.g. 'Semester VI' or 'Sem VI')
        # Slices across all 5 departments for that semester
        sem_short = val.replace("Semester ", "Sem ")
        sem_long = val.replace("Sem ", "Semester ")
        query = """
        SELECT 
            t.semester,
            t.academic_year as "academicYear",
            d.department_code as "departmentCode",
            d.department_name as department,
            ROUND(AVG(f.grade_point), 2) as "averageGpa",
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
            ROUND(AVG(att.attendance_percentage), 1) as "attendanceRate",
            COUNT(DISTINCT f.student_key) as "studentCount"
        FROM dim_time t
        JOIN fact_academic_performance f ON t.time_key = f.time_key
        JOIN dim_department d ON f.department_key = d.department_key
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        WHERE t.semester = ? OR t.semester = ? OR t.semester = ?
        GROUP BY t.time_key, t.semester, t.academic_year, d.department_key, d.department_code, d.department_name
        ORDER BY d.department_key ASC;
        """
        rows = execute_query(query, (val, sem_short, sem_long))
        slice_dim = "Time (DimTime)"
    else:
        # Fix department coordinate (e.g. 'CE' or 'Computer Engineering')
        # Slices across all 6 semesters for that department
        query = """
        SELECT 
            t.semester,
            t.academic_year as "academicYear",
            d.department_code as "departmentCode",
            d.department_name as department,
            ROUND(AVG(f.grade_point), 2) as "averageGpa",
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
            ROUND(AVG(att.attendance_percentage), 1) as "attendanceRate",
            COUNT(DISTINCT f.student_key) as "studentCount"
        FROM dim_time t
        JOIN fact_academic_performance f ON t.time_key = f.time_key
        JOIN dim_department d ON f.department_key = d.department_key
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        WHERE d.department_code = ? OR d.department_name = ? OR d.department_code = ?
        GROUP BY t.time_key, t.semester, t.academic_year, d.department_key, d.department_code, d.department_name
        ORDER BY t.time_key ASC;
        """
        rows = execute_query(query, (val, val, val.upper()))
        slice_dim = "Department (DimDepartment)"

    if not rows:
        raise HTTPException(status_code=404, detail=f"No conformed records found for slice {dimension} = '{value}'")

    # Compute aggregate summary over the slice
    avg_gpa = round(sum(r["averageGpa"] for r in rows) / len(rows), 2) if rows else 0.0
    pass_rate = round(sum(r["passRate"] for r in rows) / len(rows), 1) if rows else 0.0
    att_rate = round(sum(r["attendanceRate"] for r in rows) / len(rows), 1) if rows else 0.0
    total_students = sum(r["studentCount"] for r in rows)

    return {
        "operation": "SLICE",
        "dimension": slice_dim,
        "sliceValue": val,
        "cellCount": len(rows),
        "cells": rows,
        "summary": {
            "averageGpa": avg_gpa,
            "passRate": pass_rate,
            "attendanceRate": att_rate,
            "totalStudents": total_students
        }
    }

@olap_router.get("/dice")
def get_olap_dice(
    semesters: str = Query("Semester V,Semester VI", description="Comma-separated list of semesters"),
    departments: str = Query("CE,IT,EXTC", description="Comma-separated list of department codes"),
    measure: str = Query("averageGpa", description="Measure: averageGpa, passRate, attendanceRate, studentCount"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """
    Executes OLAP DICE: Selects a multi-dimensional subcube by specifying ranges/sets
    across Time, Department, and Measure dimensions simultaneously.
    """
    role = (x_user_role or "").strip()
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are strictly restricted from accessing institutional OLAP calculations."
        )

    raw_sems = [s.strip() for s in semesters.split(",") if s.strip()]
    raw_depts = [d.strip() for d in departments.split(",") if d.strip()]

    if not raw_sems or not raw_depts:
        raise HTTPException(status_code=400, detail="DICE operation requires at least one semester and one department.")

    # Expand semesters to match both Sem V and Semester V
    sem_expanded = set()
    for s in raw_sems:
        sem_expanded.add(s)
        sem_expanded.add(s.replace("Semester ", "Sem "))
        sem_expanded.add(s.replace("Sem ", "Semester "))

    sem_list = list(sem_expanded)
    dept_list = list(set(raw_depts + [d.upper() for d in raw_depts]))

    sem_placeholders = ",".join(["?"] * len(sem_list))
    dept_placeholders = ",".join(["?"] * len(dept_list))

    query = f"""
    SELECT 
        t.semester,
        t.academic_year as "academicYear",
        d.department_code as "departmentCode",
        d.department_name as department,
        ROUND(AVG(f.grade_point), 2) as "averageGpa",
        ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
        ROUND(AVG(att.attendance_percentage), 1) as "attendanceRate",
        COUNT(DISTINCT f.student_key) as "studentCount"
    FROM dim_time t
    JOIN fact_academic_performance f ON t.time_key = f.time_key
    JOIN dim_department d ON f.department_key = d.department_key
    LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
    WHERE t.semester IN ({sem_placeholders}) AND (d.department_code IN ({dept_placeholders}) OR d.department_name IN ({dept_placeholders}))
    GROUP BY t.time_key, t.semester, t.academic_year, d.department_key, d.department_code, d.department_name
    ORDER BY t.time_key ASC, d.department_key ASC;
    """
    params = tuple(sem_list + dept_list + dept_list)
    rows = execute_query(query, params)

    avg_gpa = round(sum(r["averageGpa"] for r in rows) / len(rows), 2) if rows else 0.0
    pass_rate = round(sum(r["passRate"] for r in rows) / len(rows), 1) if rows else 0.0
    att_rate = round(sum(r["attendanceRate"] for r in rows) / len(rows), 1) if rows else 0.0
    total_students = sum(r["studentCount"] for r in rows)

    return {
        "operation": "DICE",
        "activeFilters": {
            "semesters": sem_list,
            "departments": dept_list,
            "measure": measure
        },
        "cellCount": len(rows),
        "cells": rows,
        "subcubeSummary": {
            "averageGpa": avg_gpa,
            "passRate": pass_rate,
            "attendanceRate": att_rate,
            "totalStudents": total_students
        }
    }

@olap_router.get("/rollup")
def get_olap_rollup(
    level: str = Query("institution", description="Hierarchy aggregation level: 'institution' or 'department'"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """
    Executes OLAP ROLL-UP: Aggregates facts along the dimensional hierarchy
    from fine grain (Department/Course) up to broader summary levels (Institutional Cohort Totals).
    """
    role = (x_user_role or "").strip()
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are strictly restricted from accessing institutional OLAP calculations."
        )

    lvl = level.strip().lower()

    if lvl == "institution":
        # Roll-up across all departments to show Semester-by-Semester Institutional Totals
        query = """
        SELECT 
            t.semester,
            t.academic_year as "academicYear",
            'University-Wide' as "aggregationLevel",
            5 as "departmentsConsolidated",
            ROUND(AVG(f.grade_point), 2) as "averageGpa",
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
            ROUND(AVG(att.attendance_percentage), 1) as "attendanceRate",
            COUNT(DISTINCT f.student_key) as "totalEnrolledStudents"
        FROM dim_time t
        JOIN fact_academic_performance f ON t.time_key = f.time_key
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        GROUP BY t.time_key, t.semester, t.academic_year
        ORDER BY t.time_key ASC;
        """
        rows = execute_query(query)
    else:
        # Roll-up across all semesters to show Department Cumulative Totals
        query = """
        SELECT 
            d.department_code as "departmentCode",
            d.department_name as department,
            'Departmental Cumulative' as "aggregationLevel",
            6 as "semestersConsolidated",
            ROUND(AVG(f.grade_point), 2) as "averageGpa",
            ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
            ROUND(AVG(att.attendance_percentage), 1) as "attendanceRate",
            COUNT(DISTINCT f.student_key) as "cohortStudents"
        FROM dim_department d
        JOIN fact_academic_performance f ON d.department_key = f.department_key
        LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
        GROUP BY d.department_key, d.department_code, d.department_name
        ORDER BY d.department_key ASC;
        """
        rows = execute_query(query)

    return {
        "operation": "ROLL-UP",
        "hierarchyLevel": lvl.capitalize(),
        "rolledUpRows": len(rows),
        "data": rows
    }

@olap_router.get("/drilldown")
def get_olap_drilldown(
    semester: str = Query("Semester VI", description="Target semester"),
    department: str = Query("CE", description="Target department code or name"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """
    Executes OLAP DRILL-DOWN: De-aggregates from higher dimensional cells into
    finer course evaluations and student-level grain.
    """
    role = (x_user_role or "").strip()
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are strictly restricted from accessing institutional OLAP calculations."
        )

    sem = semester.strip()
    dept = department.strip()
    sem_short = sem.replace("Semester ", "Sem ")
    sem_long = sem.replace("Sem ", "Semester ")

    # Query course-level evaluations
    query = """
    SELECT 
        c.course_code as "courseCode",
        c.course_name as "courseName",
        c.credits,
        ROUND(AVG(f.marks), 1) as "averageScore",
        ROUND(AVG(f.grade_point), 2) as "averageGpa",
        ROUND((COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END) * 100.0) / NULLIF(COUNT(f.performance_key), 0), 1) as "passRate",
        COUNT(DISTINCT f.student_key) as "studentCount"
    FROM fact_academic_performance f
    JOIN dim_course c ON f.course_key = c.course_key
    JOIN dim_time t ON f.time_key = t.time_key
    JOIN dim_department d ON f.department_key = d.department_key
    WHERE (t.semester = ? OR t.semester = ? OR t.semester = ?)
      AND (d.department_code = ? OR d.department_name = ? OR d.department_code = ?)
    GROUP BY c.course_key, c.course_code, c.course_name, c.credits
    ORDER BY c.course_code ASC;
    """
    courses = execute_query(query, (sem, sem_short, sem_long, dept, dept, dept.upper()))

    return {
        "operation": "DRILL-DOWN",
        "targetCoordinate": {
            "semester": sem,
            "department": dept
        },
        "courseCount": len(courses),
        "courses": courses
    }
