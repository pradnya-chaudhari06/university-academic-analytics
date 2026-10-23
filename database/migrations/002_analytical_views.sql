-- ==============================================================================
-- UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
-- Migration 002: Analytical OLAP Views & Metric Derivations
-- Target Database: PostgreSQL 14+ / Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- View 1: view_student_academic_summary
-- Calculates granular student GPA, earned credits, attendance, and dynamic risk flag
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_student_academic_summary AS
WITH student_perf AS (
    SELECT
        f.student_key,
        COUNT(f.performance_key) AS total_courses_evaluated,
        SUM(f.credits) AS total_credits_registered,
        SUM(CASE WHEN f.result_status = 'Pass' THEN f.credits ELSE 0 END) AS total_credits_earned,
        SUM(CASE WHEN f.result_status != 'Pass' THEN 1 ELSE 0 END) AS failed_courses_count,
        ROUND(SUM(f.grade_point * f.credits) / NULLIF(SUM(f.credits), 0), 2) AS calculated_gpa,
        MIN(f.grade_point) AS lowest_grade_point
    FROM fact_academic_performance f
    WHERE f.time_key = 20260630
    GROUP BY f.student_key
),
student_att AS (
    SELECT
        a.student_key,
        SUM(a.classes_conducted) AS total_classes_conducted,
        SUM(a.classes_attended) AS total_classes_attended,
        ROUND(
            (SUM(a.classes_attended)::numeric / NULLIF(SUM(a.classes_conducted), 0)::numeric) * 100.0,
            2
        ) AS overall_attendance_rate
    FROM fact_attendance a
    WHERE a.time_key = 20260630
    GROUP BY a.student_key
)
SELECT
    s.student_key,
    s.student_id,
    s.student_name,
    s.gender,
    d.department_code,
    d.department_name,
    s.academic_year,
    s.semester,
    s.section,
    s.status,
    COALESCE(p.calculated_gpa, 0.0) AS gpa,
    COALESCE(p.total_credits_registered, 0.0) AS credits_registered,
    COALESCE(p.total_credits_earned, 0.0) AS credits_earned,
    COALESCE(p.failed_courses_count, 0) AS failed_courses,
    COALESCE(a.overall_attendance_rate, 0.0) AS attendance_rate,
    -- Ground Truth Risk Classification: Read directly from stored FactStudentRiskStatus ETL classification
    COALESCE(r.is_at_risk, FALSE) AS is_at_risk,
    COALESCE(r.risk_level, 'None') AS risk_level
FROM dim_student s
JOIN dim_department d ON s.department_key = d.department_key
LEFT JOIN student_perf p ON s.student_key = p.student_key
LEFT JOIN student_att a ON s.student_key = a.student_key
LEFT JOIN fact_student_risk_status r ON s.student_key = r.student_key AND r.time_key = 20260630;

COMMENT ON VIEW view_student_academic_summary IS 'OLAP view aggregating individual student GPA, attendance, and at-risk status derived strictly from fact tables';

-- ------------------------------------------------------------------------------
-- View 2: view_department_performance
-- Rollup by Department for the dashboard Department Performance grid
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_department_performance AS
SELECT
    d.department_key,
    d.department_code,
    d.department_name,
    d.faculty_name,
    COUNT(DISTINCT v.student_key) AS total_students,
    ROUND(AVG(v.gpa), 2) AS average_gpa,
    ROUND(
        (SUM(v.credits_earned)::numeric / NULLIF(SUM(v.credits_registered), 0)::numeric) * 100.0,
        1
    ) AS pass_rate,
    ROUND(AVG(v.attendance_rate), 1) AS attendance_rate,
    COUNT(CASE WHEN v.is_at_risk = TRUE THEN 1 END) AS at_risk_students_count
FROM dim_department d
LEFT JOIN view_student_academic_summary v ON d.department_code = v.department_code
GROUP BY d.department_key, d.department_code, d.department_name, d.faculty_name;

COMMENT ON VIEW view_department_performance IS 'Department-level performance rollups calculated dynamically from underlying student facts';

-- ------------------------------------------------------------------------------
-- View 3: view_semester_trends
-- Longitudinal cohort progression trends across semesters
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_semester_trends AS
SELECT
    t.academic_year,
    t.semester,
    COUNT(DISTINCT f.student_key) AS enrolled_students,
    ROUND(AVG(f.grade_point), 2) AS average_gpa,
    ROUND(
        (COUNT(CASE WHEN f.result_status = 'Pass' THEN 1 END)::numeric / NULLIF(COUNT(f.performance_key), 0)::numeric) * 100.0,
        1
    ) AS pass_percentage,
    ROUND(AVG(att.attendance_percentage), 1) AS attendance_rate,
    7.50 AS benchmark_gpa
FROM dim_time t
JOIN fact_academic_performance f ON t.time_key = f.time_key
LEFT JOIN fact_attendance att ON f.student_key = att.student_key AND f.course_key = att.course_key AND f.time_key = att.time_key
GROUP BY t.time_key, t.academic_year, t.semester
ORDER BY t.time_key ASC;

COMMENT ON VIEW view_semester_trends IS 'Longitudinal trend points by academic year and semester for the performance chart';

-- ------------------------------------------------------------------------------
-- View 4: view_performance_distribution
-- Categorizes cohort into institutional grade bands (Excellent, Good, Average, Needs Support)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_performance_distribution AS
WITH cohort_classified AS (
    SELECT
        student_key,
        gpa,
        CASE
            WHEN gpa >= 8.50 THEN 'Excellent'
            WHEN gpa >= 7.00 THEN 'Good'
            WHEN gpa >= 6.00 THEN 'Average'
            ELSE 'Needs Support'
        END AS category
    FROM view_student_academic_summary
),
totals AS (
    SELECT COUNT(*) AS total_cohort FROM cohort_classified
)
SELECT
    c.category,
    COUNT(c.student_key) AS student_count,
    ROUND((COUNT(c.student_key)::numeric / NULLIF(t.total_cohort, 0)::numeric) * 100.0, 1) AS percentage,
    CASE c.category
        WHEN 'Excellent' THEN 'GPA ≥ 8.50'
        WHEN 'Good' THEN '7.00 – 8.49'
        WHEN 'Average' THEN '6.00 – 6.99'
        WHEN 'Needs Support' THEN 'GPA < 6.00'
    END AS gpa_range
FROM cohort_classified c
CROSS JOIN totals t
GROUP BY c.category, t.total_cohort;

COMMENT ON VIEW view_performance_distribution IS 'Distribution breakdown of students across academic standing tiers';

-- ------------------------------------------------------------------------------
-- View 5: view_at_risk_roster
-- Actionable list of flagged students with lowest scoring subject and metrics
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_at_risk_roster AS
WITH lowest_courses AS (
    SELECT DISTINCT ON (f.student_key)
        f.student_key,
        c.course_name AS flagged_subject,
        f.grade_point AS subject_grade_point
    FROM fact_academic_performance f
    JOIN dim_course c ON f.course_key = c.course_key
    WHERE f.time_key = 20260630
    ORDER BY f.student_key, f.grade_point ASC
)
SELECT
    v.student_key,
    v.student_id,
    v.student_name,
    v.department_code,
    v.gpa,
    v.risk_level,
    v.attendance_rate,
    COALESCE(lc.flagged_subject, r.flagged_subject, 'General Academic') AS flagged_subject
FROM view_student_academic_summary v
LEFT JOIN lowest_courses lc ON v.student_key = lc.student_key
LEFT JOIN fact_student_risk_status r ON v.student_key = r.student_key AND r.time_key = 20260630
WHERE v.is_at_risk = TRUE
ORDER BY v.gpa ASC, v.attendance_rate ASC;

COMMENT ON VIEW view_at_risk_roster IS 'Roster of students requiring remedial intervention with identified bottleneck subjects';
