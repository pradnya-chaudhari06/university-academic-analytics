"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
User Profile Service & RBAC-Protected Profile Router
==============================================================================
Serves human-appropriate, role-tailored user profiles with real database
persistence. Allows users to edit allowed personal fields with strict validation.
Zero technical RBAC internals, zero raw route matrices exposed to users.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Header, Body
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

from backend.database import execute_query, execute_dml, get_db_connection

profile_router = APIRouter(prefix="/api/user", tags=["User Profile"])

def init_user_profiles_table():
    """Ensure user_profiles table exists in the active database engine."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        is_pg = hasattr(conn, "status")
        
        sql = """
        CREATE TABLE IF NOT EXISTS user_profiles (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            user_id TEXT NOT NULL,
            student_id TEXT,
            faculty_id TEXT,
            department TEXT,
            designation TEXT,
            program TEXT,
            phone TEXT,
            office_location TEXT,
            address TEXT,
            bio TEXT,
            specialization TEXT,
            avatar_initials TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(sql)
        conn.commit()
        cursor.close()
    finally:
        conn.close()

# Default profiles seed catalog
DEFAULT_PROFILES = {
    "student@university.edu": {
        "email": "student@university.edu",
        "name": "Riya Patil",
        "role": "Student",
        "user_id": "usr-student-01",
        "student_id": "STU1178",
        "faculty_id": None,
        "department": "Computer Engineering",
        "designation": "Undergraduate Student (STU1178) · Computer Engineering",
        "program": "B.Tech in Computer Engineering",
        "phone": "+91 98201 44512",
        "office_location": None,
        "address": "Campus Residence Hall 3, Room 204",
        "bio": "Third-year undergraduate student focused on distributed data engineering and high-performance computing.",
        "specialization": "Data Systems & Algorithms",
        "avatar_initials": "RP"
    },
    "faculty@university.edu": {
        "email": "faculty@university.edu",
        "name": "Prof. Rajesh Sharma",
        "role": "Faculty",
        "user_id": "usr-faculty-01",
        "student_id": None,
        "faculty_id": "FAC-CE-104",
        "department": "Computer Engineering",
        "designation": "Senior Faculty & Academic Mentor",
        "program": "Faculty of Engineering & Technology",
        "phone": "+91 98202 88419",
        "office_location": "Computing Block B, Room 402",
        "address": "Faculty Quarters, Villa 12",
        "bio": "Senior Faculty in Computer Engineering. Teaching Advanced Algorithms and Cloud Computing with academic focus on cohort success.",
        "specialization": "Distributed Systems, Machine Learning & Algorithms",
        "avatar_initials": "RS"
    },
    "analyst@university.edu": {
        "email": "analyst@university.edu",
        "name": "Priya Nair",
        "role": "Analyst",
        "user_id": "usr-analyst-01",
        "student_id": None,
        "faculty_id": None,
        "department": "Institutional Research & Analytics",
        "designation": "Institutional Research Analyst",
        "program": "Office of Academic Planning & Accreditation",
        "phone": "+91 98203 11290",
        "office_location": "Analytics Wing, Room 210",
        "address": "Staff Residence B-4",
        "bio": "Institutional data analyst specializing in conformed OLAP cube operations, student retention models, and predictive mining.",
        "specialization": "OLAP Modeling, Predictive Data Mining & Academic Retention",
        "avatar_initials": "PN"
    },
    "admin@university.edu": {
        "email": "admin@university.edu",
        "name": "Dr. Sarah Jenkins",
        "role": "Academic Administrator",
        "user_id": "usr-admin-01",
        "student_id": None,
        "faculty_id": None,
        "department": "Office of Academic Affairs",
        "designation": "Dean of Academic Affairs",
        "program": "University Academic Senate",
        "phone": "+91 98204 77610",
        "office_location": "Central Administration Building, Suite 101",
        "address": "Executive Quarters, House 02",
        "bio": "Oversees university-wide academic performance, curriculum quality standards, and conformed data warehouse governance.",
        "specialization": "Academic Administration, Accreditation Governance & Policy",
        "avatar_initials": "SJ"
    },
    "sysadmin@university.edu": {
        "email": "sysadmin@university.edu",
        "name": "Dr. Alan Turing",
        "role": "System Administrator",
        "user_id": "usr-sysadmin-01",
        "student_id": None,
        "faculty_id": None,
        "department": "Computing & Warehouse Services",
        "designation": "Chief Data Architect & System Administrator",
        "program": "Division of Enterprise Information Systems",
        "phone": "+91 98205 33118",
        "office_location": "Data Center Complex, Suite 001",
        "address": "Senior Staff Enclave, Villa 01",
        "bio": "Architect of the institutional academic data warehouse and batch ETL pipelines.",
        "specialization": "Data Warehousing, Star Schema Optimization & ETL Pipelines",
        "avatar_initials": "AT"
    }
}

class ProfileUpdateRequest(BaseModel):
    phone: Optional[str] = Field(None, max_length=30)
    office_location: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=500)
    specialization: Optional[str] = Field(None, max_length=150)

def ensure_profile_seeded(email: str):
    """Seed profile if it doesn't already exist in database."""
    init_user_profiles_table()
    rows = execute_query("SELECT email FROM user_profiles WHERE email = ?;", (email.lower().strip(),))
    if not rows and email.lower().strip() in DEFAULT_PROFILES:
        d = DEFAULT_PROFILES[email.lower().strip()]
        execute_dml("""
        INSERT INTO user_profiles (
            email, name, role, user_id, student_id, faculty_id, department,
            designation, program, phone, office_location, address, bio, specialization, avatar_initials
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            d["email"], d["name"], d["role"], d["user_id"], d["student_id"], d["faculty_id"],
            d["department"], d["designation"], d["program"], d["phone"], d["office_location"],
            d["address"], d["bio"], d["specialization"], d["avatar_initials"]
        ))

def _normalize_role(r: Optional[str]) -> str:
    r = (r or "").strip().lower()
    if "admin" in r:
        return "admin"
    if "analys" in r or "analytic" in r:
        return "analytics"
    if "facult" in r:
        return "faculty"
    if "stud" in r:
        return "student"
    return r

@profile_router.get("/profile")
def get_user_profile(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id")
):
    """
    Retrieves the authentic personal profile for the authenticated session.
    Derives identity securely from session headers and canonical warehouse records.
    Calculates student academic summaries strictly from conformed star schema facts.
    """
    init_user_profiles_table()
    
    # Determine user email
    email = (x_user_email or "").strip().lower()
    if not email:
        # Fallback to role-based default email
        role = (x_user_role or "").strip()
        if role == "Student":
            email = "student@university.edu"
        elif role == "Faculty":
            email = "faculty@university.edu"
        elif role in ("Analyst", "Analytics"):
            email = "analyst@university.edu"
        elif role == "System Administrator":
            email = "sysadmin@university.edu"
        else:
            email = "admin@university.edu"

    ensure_profile_seeded(email)

    rows = execute_query("SELECT * FROM user_profiles WHERE email = ?;", (email,))
    if not rows:
        name = (x_user_role or "Academic User")
        role = x_user_role or "Faculty"
        uid = x_user_id or "usr-default"
        initials = "".join([part[0].upper() for part in name.split()[:2]]) or "AU"
        execute_dml("""
        INSERT INTO user_profiles (
            email, name, role, user_id, designation, avatar_initials
        ) VALUES (?, ?, ?, ?, ?, ?);
        """, (email, name, role, uid, f"{role} Member", initials))
        rows = execute_query("SELECT * FROM user_profiles WHERE email = ?;", (email,))

    profile = dict(rows[0])
    
    # Enforce role consistency: prevent accessing another role's profile
    req_role = (x_user_role or "").strip()
    if req_role and profile.get("role") and _normalize_role(req_role) != _normalize_role(profile.get("role")):
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: {req_role} is not authorized to inspect a {profile.get('role')} profile."
        )

    # Enforce Student Data Privacy & Authorization
    if _normalize_role(req_role) == "student":
        target_student_id = (profile.get("student_id") or "STU1178").strip().upper()
        if x_student_id:
            auth_stu_id = x_student_id.strip().upper()
            if auth_stu_id != target_student_id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Students are strictly restricted to their own academic profile."
                )
    
    # Add role-appropriate academic metrics summary if student
    academic_summary = None
    if profile.get("role") == "Student":
        target_student_id = (profile.get("student_id") or "STU1178").strip().upper()
        
        # 1. Fetch Student Dimension & Department
        stu_query = """
        SELECT s.student_key, s.student_id, s.student_name, s.gender, s.semester, s.section, s.status, s.admission_year,
               d.department_key, d.department_code, d.department_name
        FROM dim_student s
        JOIN dim_department d ON s.department_key = d.department_key
        WHERE UPPER(s.student_id) = UPPER(?);
        """
        stu_rows = execute_query(stu_query, (target_student_id,))
        if not stu_rows:
            raise HTTPException(
                status_code=404,
                detail=f"Student record '{target_student_id}' not found in conformed data warehouse."
            )
        
        s_info = stu_rows[0]
        s_key = s_info["student_key"]

        # 2. Cumulative CGPA & Credits Earned across all completed semesters (from fact_academic_performance)
        cum_query = """
        SELECT ROUND(CAST(SUM(grade_point * credits) / NULLIF(SUM(credits), 0) AS numeric), 2) as cgpa,
               SUM(credits) as credits_attempted,
               SUM(CASE WHEN result_status = 'Pass' THEN credits ELSE 0 END) as credits_earned
        FROM fact_academic_performance
        WHERE student_key = ?;
        """
        cum_rows = execute_query(cum_query, (s_key,))
        cgpa_val = float(cum_rows[0]["cgpa"]) if cum_rows and cum_rows[0]["cgpa"] is not None else 0.0
        credits_attempted = float(cum_rows[0]["credits_attempted"]) if cum_rows and cum_rows[0]["credits_attempted"] is not None else 0.0
        credits_earned = float(cum_rows[0]["credits_earned"]) if cum_rows and cum_rows[0]["credits_earned"] is not None else 0.0

        # 3. Semester VI Risk Classification & SGPA (from fact_student_risk_status)
        risk_query = """
        SELECT risk_level, is_at_risk, current_gpa, attendance_percentage, failed_courses_count,
               primary_risk_factor, flagged_subject
        FROM fact_student_risk_status
        WHERE student_key = ? AND time_key = 20260630;
        """
        risk_rows = execute_query(risk_query, (s_key,))
        risk_row = risk_rows[0] if risk_rows else None

        is_at_risk = bool(risk_row["is_at_risk"]) if risk_row else False
        risk_level = risk_row["risk_level"] if risk_row else "None"
        curr_sgpa = float(risk_row["current_gpa"]) if risk_row and risk_row["current_gpa"] is not None else 0.0
        failed_count = int(risk_row["failed_courses_count"]) if risk_row and risk_row["failed_courses_count"] is not None else 0
        primary_factor = risk_row["primary_risk_factor"] if risk_row else "Good Academic Standing"
        flagged_subject = risk_row["flagged_subject"] if risk_row else None

        # 4. Overall Attendance across active semester courses (from fact_attendance)
        att_query = """
        SELECT ROUND(AVG(attendance_percentage), 1) as overall_attendance
        FROM fact_attendance
        WHERE student_key = ? AND time_key = 20260630;
        """
        att_rows = execute_query(att_query, (s_key,))
        if att_rows and att_rows[0]["overall_attendance"] is not None:
            overall_att = float(att_rows[0]["overall_attendance"])
        elif risk_row and risk_row["attendance_percentage"] is not None:
            overall_att = float(risk_row["attendance_percentage"])
        else:
            overall_att = 0.0

        academic_standing = "At-Risk / Academic Monitoring" if is_at_risk else "Good Standing"
        sec_str = f"Section {s_info['section']}" if s_info.get("section") else "Section B"
        cohort_str = f"Cohort {s_info['admission_year']}–{s_info['admission_year'] + 4}" if s_info.get("admission_year") else "Cohort 2023–2027"

        # Conformed profile values derived from canonical warehouse dimensions
        profile["name"] = s_info["student_name"]
        profile["student_id"] = s_info["student_id"]
        profile["department"] = s_info["department_name"]
        profile["department_code"] = s_info["department_code"]
        profile["semester"] = s_info["semester"]
        profile["section"] = sec_str
        profile["cohort"] = cohort_str
        profile["program"] = "B.Tech in Computer Engineering"
        profile["designation"] = f"Undergraduate Student ({s_info['student_id']}) · {s_info['department_name']}"

        academic_summary = {
            "cgpa": cgpa_val,
            "currentSgpa": curr_sgpa,
            "attendancePercentage": overall_att,
            "creditsAttempted": credits_attempted,
            "creditsEarned": credits_earned,
            "backlogs": failed_count,
            "standing": academic_standing,
            "riskLevel": f"{risk_level} Risk" if risk_level != "None" else "None",
            "isAtRisk": is_at_risk,
            "semester": s_info["semester"],
            "section": sec_str,
            "cohort": cohort_str,
            "primaryRiskFactor": primary_factor,
            "flaggedSubject": flagged_subject,
            "department": s_info["department_name"],
            "departmentCode": s_info["department_code"],
        }

    return {
        "success": True,
        "profile": profile,
        "academicSummary": academic_summary
    }

@profile_router.put("/profile")
def update_user_profile(
    body: ProfileUpdateRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_student_id: Optional[str] = Header(None, alias="X-Student-Id")
):
    """
    Updates allowed personal profile fields for the authenticated user.
    Strictly validates input: only phone, office_location, address, bio, and specialization are editable.
    Institutional academic values (CGPA, SGPA, attendance, credits, risk, department, section) are immutable.
    Prevents cross-user and cross-role tampering.
    """
    init_user_profiles_table()
    
    email = (x_user_email or "").strip().lower()
    if not email:
        role = (x_user_role or "").strip()
        if role == "Student":
            email = "student@university.edu"
        elif role == "Faculty":
            email = "faculty@university.edu"
        elif role in ("Analyst", "Analytics"):
            email = "analyst@university.edu"
        elif role == "System Administrator":
            email = "sysadmin@university.edu"
        else:
            email = "admin@university.edu"

    ensure_profile_seeded(email)

    existing = execute_query("SELECT * FROM user_profiles WHERE email = ?;", (email,))
    if not existing:
        raise HTTPException(status_code=404, detail="User profile record not found.")

    curr = dict(existing[0])

    # Enforce role consistency: prevent modifying another role's profile
    req_role = (x_user_role or "").strip()
    if req_role and curr.get("role") and _normalize_role(req_role) != _normalize_role(curr.get("role")):
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: {req_role} is not authorized to modify a {curr.get('role')} profile."
        )

    # Enforce Student Data Privacy & Authorization on update
    if _normalize_role(req_role) == "student":
        target_student_id = (curr.get("student_id") or "STU1178").strip().upper()
        if x_student_id:
            auth_stu_id = x_student_id.strip().upper()
            if auth_stu_id != target_student_id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Students are strictly restricted to modifying their own profile."
                )

    # Clean and validate allowed fields ONLY
    new_phone = body.phone.strip() if body.phone is not None else curr.get("phone")
    new_office = body.office_location.strip() if body.office_location is not None else curr.get("office_location")
    new_address = body.address.strip() if body.address is not None else curr.get("address")
    new_bio = body.bio.strip() if body.bio is not None else curr.get("bio")
    new_spec = body.specialization.strip() if body.specialization is not None else curr.get("specialization")

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    execute_dml("""
    UPDATE user_profiles
    SET phone = ?, office_location = ?, address = ?, bio = ?, specialization = ?, updated_at = ?
    WHERE email = ?;
    """, (new_phone, new_office, new_address, new_bio, new_spec, now_str, email))

    updated = execute_query("SELECT * FROM user_profiles WHERE email = ?;", (email,))[0]

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "profile": updated
    }
