-- ==============================================================================
-- UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
-- Seed 001: Reference and Master Dimension Seed Data
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DimDepartment Reference Data
-- Standard 5 engineering departments
-- ------------------------------------------------------------------------------
INSERT INTO dim_department (department_code, department_name, faculty_name)
VALUES
    ('CE',    'Computer Engineering',               'Faculty of Engineering & Technology'),
    ('IT',    'Information Technology',             'Faculty of Engineering & Technology'),
    ('EXTC',  'Electronics & Telecommunication',   'Faculty of Engineering & Technology'),
    ('MECH',  'Mechanical Engineering',             'Faculty of Engineering & Technology'),
    ('CIVIL', 'Civil Engineering',                  'Faculty of Engineering & Technology')
ON CONFLICT (department_code) DO UPDATE
SET department_name = EXCLUDED.department_name,
    faculty_name = EXCLUDED.faculty_name;

-- ------------------------------------------------------------------------------
-- 2. DimGradeBand Reference Data
-- Institutional 10-point scale grade boundaries and categories
-- ------------------------------------------------------------------------------
INSERT INTO dim_grade_band (grade, grade_point, grade_category, min_marks, max_marks)
VALUES
    ('O',   10.00, 'Excellent',     85.00, 100.00),
    ('A+',   9.00, 'Excellent',     75.00,  84.99),
    ('A',    8.00, 'Good',          70.00,  74.99),
    ('B+',   7.00, 'Good',          60.00,  69.99),
    ('B',    6.00, 'Average',       55.00,  59.99),
    ('C',    5.00, 'Average',       50.00,  54.99),
    ('P',    4.00, 'Needs Support', 40.00,  49.99),
    ('F',    0.00, 'Needs Support',  0.00,  39.99)
ON CONFLICT (grade) DO UPDATE
SET grade_point = EXCLUDED.grade_point,
    grade_category = EXCLUDED.grade_category,
    min_marks = EXCLUDED.min_marks,
    max_marks = EXCLUDED.max_marks;

-- ------------------------------------------------------------------------------
-- 3. DimCourse Reference Catalog
-- Engineering core & elective courses mapped to departments and semesters
-- ------------------------------------------------------------------------------
WITH dept AS (
    SELECT department_code, department_key FROM dim_department
)
INSERT INTO dim_course (course_code, course_name, department_key, credits, semester)
VALUES
    -- Computer Engineering (CE)
    ('CS601', 'Data Warehousing & Mining',      (SELECT department_key FROM dept WHERE department_code = 'CE'), 4.0, 'Semester VI'),
    ('CS602', 'Cloud Computing & DevOps',       (SELECT department_key FROM dept WHERE department_code = 'CE'), 4.0, 'Semester VI'),
    ('CS603', 'Artificial Intelligence',        (SELECT department_key FROM dept WHERE department_code = 'CE'), 3.0, 'Semester VI'),
    ('CS202', 'Discrete Mathematics',           (SELECT department_key FROM dept WHERE department_code = 'CE'), 3.0, 'Semester III'),

    -- Information Technology (IT)
    ('IT601', 'Enterprise Systems & Analytics', (SELECT department_key FROM dept WHERE department_code = 'IT'), 4.0, 'Semester VI'),
    ('IT602', 'Information Retrieval Systems',  (SELECT department_key FROM dept WHERE department_code = 'IT'), 3.0, 'Semester VI'),
    ('IT603', 'Big Data Engineering',           (SELECT department_key FROM dept WHERE department_code = 'IT'), 4.0, 'Semester VI'),
    ('CS201', 'Data Structures & Algorithms',   (SELECT department_key FROM dept WHERE department_code = 'IT'), 4.0, 'Semester III'),

    -- Electronics & Telecommunication (EXTC)
    ('EC601', 'Signals & Systems',              (SELECT department_key FROM dept WHERE department_code = 'EXTC'), 4.0, 'Semester VI'),
    ('EC602', 'Digital Signal Processing',      (SELECT department_key FROM dept WHERE department_code = 'EXTC'), 4.0, 'Semester VI'),
    ('EC603', 'VLSI Design & Architecture',     (SELECT department_key FROM dept WHERE department_code = 'EXTC'), 3.0, 'Semester VI'),

    -- Mechanical Engineering (MECH)
    ('ME601', 'Applied Thermodynamics',         (SELECT department_key FROM dept WHERE department_code = 'MECH'), 4.0, 'Semester VI'),
    ('ME602', 'Heat & Mass Transfer',           (SELECT department_key FROM dept WHERE department_code = 'MECH'), 4.0, 'Semester VI'),
    ('ME603', 'Finite Element Analysis',        (SELECT department_key FROM dept WHERE department_code = 'MECH'), 3.0, 'Semester VI'),

    -- Civil Engineering (CIVIL)
    ('CE601', 'Structural Analysis',            (SELECT department_key FROM dept WHERE department_code = 'CIVIL'), 4.0, 'Semester VI'),
    ('CE602', 'Geotechnical Engineering',       (SELECT department_key FROM dept WHERE department_code = 'CIVIL'), 4.0, 'Semester VI'),
    ('CE603', 'Environmental Engineering',      (SELECT department_key FROM dept WHERE department_code = 'CIVIL'), 3.0, 'Semester VI')
ON CONFLICT (course_code) DO UPDATE
SET course_name = EXCLUDED.course_name,
    credits = EXCLUDED.credits,
    semester = EXCLUDED.semester;

-- ------------------------------------------------------------------------------
-- 4. DimTime Reference Calendar Points
-- Representative semester milestones across academic cycles
-- ------------------------------------------------------------------------------
INSERT INTO dim_time (time_key, date, day, month, month_name, quarter, semester, academic_year, year)
VALUES
    (20231215, '2023-12-15', 15, 12, 'December', 4, 'Sem I',   '2023–24', 2023),
    (20240520, '2024-05-20', 20,  5, 'May',      2, 'Sem II',  '2023–24', 2024),
    (20241218, '2024-12-18', 18, 12, 'December', 4, 'Sem III', '2024–25', 2024),
    (20250522, '2025-05-22', 22,  5, 'May',      2, 'Sem IV',  '2024–25', 2025),
    (20251220, '2025-12-20', 20, 12, 'December', 4, 'Sem V',   '2025–26', 2025),
    (20260630, '2026-06-30', 30,  6, 'June',     2, 'Sem VI',  '2025–26', 2026)
ON CONFLICT (time_key) DO UPDATE
SET date = EXCLUDED.date,
    semester = EXCLUDED.semester,
    academic_year = EXCLUDED.academic_year;
