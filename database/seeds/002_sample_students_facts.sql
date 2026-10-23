-- ==============================================================================
-- UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
-- Seed 002: Representative Students, Fact Evaluations & Attendance Records
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Representative Student Dimension Records
-- ------------------------------------------------------------------------------
WITH dept AS (
    SELECT department_code, department_key FROM dim_department
)
INSERT INTO dim_student (student_id, student_name, gender, date_of_birth, department_key, admission_year, academic_year, semester, section, status)
VALUES
    -- Flagged At-Risk Students
    ('STU1024', 'Aarav Sharma',   'Male',   '2004-04-12', (SELECT department_key FROM dept WHERE department_code = 'IT'),    2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU1178', 'Riya Patil',     'Female', '2004-09-21', (SELECT department_key FROM dept WHERE department_code = 'CE'),    2023, 'AY 2025–26', 'Semester VI', 'B', 'Active'),
    ('STU1282', 'Kabir Shah',     'Male',   '2003-11-05', (SELECT department_key FROM dept WHERE department_code = 'EXTC'),  2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU1390', 'Ananya Verma',   'Female', '2004-01-18', (SELECT department_key FROM dept WHERE department_code = 'MECH'),  2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU1412', 'Rohan Deshmukh', 'Male',   '2003-07-30', (SELECT department_key FROM dept WHERE department_code = 'CIVIL'), 2023, 'AY 2025–26', 'Semester VI', 'B', 'Active'),

    -- High Performers & Cohort Benchmarks
    ('STU101',  'Pooja Nair',     'Female', '2004-03-14', (SELECT department_key FROM dept WHERE department_code = 'IT'),    2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU102',  'Aditya Kulkarni','Male',   '2004-05-19', (SELECT department_key FROM dept WHERE department_code = 'CE'),    2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU103',  'Neha Joshi',     'Female', '2004-08-11', (SELECT department_key FROM dept WHERE department_code = 'IT'),    2023, 'AY 2025–26', 'Semester VI', 'B', 'Active'),
    ('STU104',  'Vikram Mehta',   'Male',   '2004-02-27', (SELECT department_key FROM dept WHERE department_code = 'CE'),    2023, 'AY 2025–26', 'Semester VI', 'B', 'Active'),
    ('STU105',  'Tanvi Sawant',   'Female', '2004-10-09', (SELECT department_key FROM dept WHERE department_code = 'EXTC'),  2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU106',  'Siddharth Rao',  'Male',   '2003-12-14', (SELECT department_key FROM dept WHERE department_code = 'MECH'),  2023, 'AY 2025–26', 'Semester VI', 'A', 'Active'),
    ('STU108',  'Gauri Shinde',   'Female', '2004-06-22', (SELECT department_key FROM dept WHERE department_code = 'CIVIL'), 2023, 'AY 2025–26', 'Semester VI', 'A', 'Active')
ON CONFLICT (student_id) DO UPDATE
SET student_name = EXCLUDED.student_name,
    semester = EXCLUDED.semester;

-- ------------------------------------------------------------------------------
-- 2. FactAcademicPerformance Sample Records
-- Evaluated against Semester VI (time_key = 20260630)
-- ------------------------------------------------------------------------------
WITH 
    s AS (SELECT student_id, student_key, department_key FROM dim_student),
    c AS (SELECT course_code, course_key, credits FROM dim_course),
    g AS (SELECT grade, grade_band_key, grade_point FROM dim_grade_band),
    t AS (SELECT time_key FROM dim_time WHERE time_key = 20260630)
INSERT INTO fact_academic_performance (
    student_key, course_key, department_key, time_key, grade_band_key, marks, grade_point, credits, result_status
)
VALUES
    -- STU1024 (Aarav Sharma - IT, Flagged in CS201 / IT601)
    ((SELECT student_key FROM s WHERE student_id = 'STU1024'), (SELECT course_key FROM c WHERE course_code = 'IT601'), (SELECT department_key FROM s WHERE student_id = 'STU1024'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B'),  56.0, 6.0, (SELECT credits FROM c WHERE course_code = 'IT601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1024'), (SELECT course_key FROM c WHERE course_code = 'CS201'), (SELECT department_key FROM s WHERE student_id = 'STU1024'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'C'),  52.0, 5.0, (SELECT credits FROM c WHERE course_code = 'CS201'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1024'), (SELECT course_key FROM c WHERE course_code = 'IT602'), (SELECT department_key FROM s WHERE student_id = 'STU1024'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B'),  58.0, 6.0, (SELECT credits FROM c WHERE course_code = 'IT602'), 'Pass'),

    -- STU1178 (Riya Patil - CE, Flagged in CS202)
    ((SELECT student_key FROM s WHERE student_id = 'STU1178'), (SELECT course_key FROM c WHERE course_code = 'CS601'), (SELECT department_key FROM s WHERE student_id = 'STU1178'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B+'), 64.0, 7.0, (SELECT credits FROM c WHERE course_code = 'CS601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1178'), (SELECT course_key FROM c WHERE course_code = 'CS202'), (SELECT department_key FROM s WHERE student_id = 'STU1178'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'C'),  51.0, 5.0, (SELECT credits FROM c WHERE course_code = 'CS202'), 'Pass'),

    -- STU1282 (Kabir Shah - EXTC, Flagged in EC601)
    ((SELECT student_key FROM s WHERE student_id = 'STU1282'), (SELECT course_key FROM c WHERE course_code = 'EC601'), (SELECT department_key FROM s WHERE student_id = 'STU1282'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'C'),  52.0, 5.0, (SELECT credits FROM c WHERE course_code = 'EC601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1282'), (SELECT course_key FROM c WHERE course_code = 'EC602'), (SELECT department_key FROM s WHERE student_id = 'STU1282'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B'),  58.0, 6.0, (SELECT credits FROM c WHERE course_code = 'EC602'), 'Pass'),

    -- STU1390 (Ananya Verma - MECH, Flagged in ME601)
    ((SELECT student_key FROM s WHERE student_id = 'STU1390'), (SELECT course_key FROM c WHERE course_code = 'ME601'), (SELECT department_key FROM s WHERE student_id = 'STU1390'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'P'),  48.0, 4.0, (SELECT credits FROM c WHERE course_code = 'ME601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1390'), (SELECT course_key FROM c WHERE course_code = 'ME602'), (SELECT department_key FROM s WHERE student_id = 'STU1390'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B'),  57.0, 6.0, (SELECT credits FROM c WHERE course_code = 'ME602'), 'Pass'),

    -- STU1412 (Rohan Deshmukh - CIVIL, Flagged in CE601)
    ((SELECT student_key FROM s WHERE student_id = 'STU1412'), (SELECT course_key FROM c WHERE course_code = 'CE601'), (SELECT department_key FROM s WHERE student_id = 'STU1412'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'C'),  53.0, 5.0, (SELECT credits FROM c WHERE course_code = 'CE601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1412'), (SELECT course_key FROM c WHERE course_code = 'CE602'), (SELECT department_key FROM s WHERE student_id = 'STU1412'), (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'B'),  59.0, 6.0, (SELECT credits FROM c WHERE course_code = 'CE602'), 'Pass'),

    -- High Performers (O, A+, A Grades)
    ((SELECT student_key FROM s WHERE student_id = 'STU101'),  (SELECT course_key FROM c WHERE course_code = 'IT601'), (SELECT department_key FROM s WHERE student_id = 'STU101'),  (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'O'),  92.0, 10.0, (SELECT credits FROM c WHERE course_code = 'IT601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU101'),  (SELECT course_key FROM c WHERE course_code = 'IT602'), (SELECT department_key FROM s WHERE student_id = 'STU101'),  (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'A+'), 88.0,  9.0, (SELECT credits FROM c WHERE course_code = 'IT602'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU102'),  (SELECT course_key FROM c WHERE course_code = 'CS601'), (SELECT department_key FROM s WHERE student_id = 'STU102'),  (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'O'),  91.0, 10.0, (SELECT credits FROM c WHERE course_code = 'CS601'), 'Pass'),
    ((SELECT student_key FROM s WHERE student_id = 'STU102'),  (SELECT course_key FROM c WHERE course_code = 'CS602'), (SELECT department_key FROM s WHERE student_id = 'STU102'),  (SELECT time_key FROM t), (SELECT grade_band_key FROM g WHERE grade = 'A+'), 86.0,  9.0, (SELECT credits FROM c WHERE course_code = 'CS602'), 'Pass')
ON CONFLICT (student_key, course_key, time_key) DO UPDATE
SET marks = EXCLUDED.marks,
    grade_point = EXCLUDED.grade_point,
    grade_band_key = EXCLUDED.grade_band_key;

-- ------------------------------------------------------------------------------
-- 3. FactAttendance Sample Records
-- ------------------------------------------------------------------------------
WITH 
    s AS (SELECT student_id, student_key, department_key FROM dim_student),
    c AS (SELECT course_code, course_key FROM dim_course),
    t AS (SELECT time_key FROM dim_time WHERE time_key = 20260630)
INSERT INTO fact_attendance (
    student_key, course_key, department_key, time_key, classes_conducted, classes_attended, attendance_percentage
)
VALUES
    -- Flagged Students (Attendance below 75% threshold)
    ((SELECT student_key FROM s WHERE student_id = 'STU1024'), (SELECT course_key FROM c WHERE course_code = 'IT601'), (SELECT department_key FROM s WHERE student_id = 'STU1024'), (SELECT time_key FROM t), 60, 41, 68.33),
    ((SELECT student_key FROM s WHERE student_id = 'STU1178'), (SELECT course_key FROM c WHERE course_code = 'CS601'), (SELECT department_key FROM s WHERE student_id = 'STU1178'), (SELECT time_key FROM t), 60, 44, 73.33),
    ((SELECT student_key FROM s WHERE student_id = 'STU1282'), (SELECT course_key FROM c WHERE course_code = 'EC601'), (SELECT department_key FROM s WHERE student_id = 'STU1282'), (SELECT time_key FROM t), 60, 39, 65.00),
    ((SELECT student_key FROM s WHERE student_id = 'STU1390'), (SELECT course_key FROM c WHERE course_code = 'ME601'), (SELECT department_key FROM s WHERE student_id = 'STU1390'), (SELECT time_key FROM t), 60, 37, 61.67),
    ((SELECT student_key FROM s WHERE student_id = 'STU1412'), (SELECT course_key FROM c WHERE course_code = 'CE601'), (SELECT department_key FROM s WHERE student_id = 'STU1412'), (SELECT time_key FROM t), 60, 44, 73.33),

    -- High Attendance Students (>85%)
    ((SELECT student_key FROM s WHERE student_id = 'STU101'),  (SELECT course_key FROM c WHERE course_code = 'IT601'), (SELECT department_key FROM s WHERE student_id = 'STU101'),  (SELECT time_key FROM t), 60, 58, 96.67),
    ((SELECT student_key FROM s WHERE student_id = 'STU102'),  (SELECT course_key FROM c WHERE course_code = 'CS601'), (SELECT department_key FROM s WHERE student_id = 'STU102'),  (SELECT time_key FROM t), 60, 56, 93.33)
ON CONFLICT (student_key, course_key, time_key) DO UPDATE
SET classes_conducted = EXCLUDED.classes_conducted,
    classes_attended = EXCLUDED.classes_attended,
    attendance_percentage = EXCLUDED.attendance_percentage;

-- ------------------------------------------------------------------------------
-- 4. FactStudentRiskStatus Periodic Snapshot Records (AY 2025–26 Sem VI)
-- ------------------------------------------------------------------------------
WITH
    s AS (SELECT student_id, student_key, department_key FROM dim_student),
    t AS (SELECT time_key FROM dim_time WHERE time_key = 20260630)
INSERT INTO fact_student_risk_status (
    student_key, department_key, time_key, current_gpa, attendance_percentage,
    failed_courses_count, risk_level, is_at_risk, primary_risk_factor, flagged_subject
)
VALUES
    ((SELECT student_key FROM s WHERE student_id = 'STU1024'), (SELECT department_key FROM s WHERE student_id = 'STU1024'), (SELECT time_key FROM t), 5.80, 68.33, 0, 'High',   TRUE,  'Low Attendance & Core Course Difficulty', 'Data Structures & Algorithms'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1178'), (SELECT department_key FROM s WHERE student_id = 'STU1178'), (SELECT time_key FROM t), 6.10, 73.33, 0, 'Medium', TRUE,  'Attendance Below 75% Benchmark',         'Discrete Mathematics'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1282'), (SELECT department_key FROM s WHERE student_id = 'STU1282'), (SELECT time_key FROM t), 5.90, 65.00, 0, 'High',   TRUE,  'Deficit in Theory & Lab Attendance',     'Signals & Systems'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1390'), (SELECT department_key FROM s WHERE student_id = 'STU1390'), (SELECT time_key FROM t), 5.60, 61.67, 1, 'High',   TRUE,  'Critical Attendance & Exam Shortfall',   'Applied Thermodynamics'),
    ((SELECT student_key FROM s WHERE student_id = 'STU1412'), (SELECT department_key FROM s WHERE student_id = 'STU1412'), (SELECT time_key FROM t), 5.90, 73.33, 0, 'Medium', TRUE,  'Cumulative GPA Below 6.00',              'Structural Analysis'),
    ((SELECT student_key FROM s WHERE student_id = 'STU101'),  (SELECT department_key FROM s WHERE student_id = 'STU101'),  (SELECT time_key FROM t), 9.50, 96.67, 0, 'None',   FALSE, NULL,                                     NULL),
    ((SELECT student_key FROM s WHERE student_id = 'STU102'),  (SELECT department_key FROM s WHERE student_id = 'STU102'),  (SELECT time_key FROM t), 9.50, 93.33, 0, 'None',   FALSE, NULL,                                     NULL)
ON CONFLICT (student_key, time_key) DO UPDATE
SET current_gpa = EXCLUDED.current_gpa,
    attendance_percentage = EXCLUDED.attendance_percentage,
    risk_level = EXCLUDED.risk_level,
    is_at_risk = EXCLUDED.is_at_risk,
    primary_risk_factor = EXCLUDED.primary_risk_factor,
    flagged_subject = EXCLUDED.flagged_subject;
