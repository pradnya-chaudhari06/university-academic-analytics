# University Academic Performance Data Warehouse & Mining (DWM)
## Phase 1: Database Architecture & Star Schema Specification

This document details the Star Schema architecture, dimensional modeling principles, grain definitions, indexing strategies, and metric derivation queries for the **University Academic Performance Data Warehouse & Mining System**.

---

### 1. Conceptual Star Schema Architecture

The Data Warehouse follows a classic **dimensional star schema** designed specifically for Online Analytical Processing (OLAP), institutional KPI reporting, and predictive student risk modeling.

```
                      +-------------------+
                      |   DimDepartment   |
                      +-------------------+
                                | (1:N)
                                |
 +-------------------+          |          +-------------------+
 |    DimStudent     |----------+----------|     DimCourse     |
 +-------------------+          |          +-------------------+
        |                       |                    |
        | (1:N)                 | (1:N)              | (1:N)
        |                       v                    |
        |          +--------------------------+      |
        +--------->| FactAcademicPerformance  |<-----+
        |          +--------------------------+      |
        |                       ^                    |
        |                       | (1:N)              |
        |             +-------------------+          |
        |             |   DimGradeBand    |          |
        |             +-------------------+          |
        |                                            |
        |          +--------------------------+      |
        +--------->|      FactAttendance      |<-----+
        | (1:N)    +--------------------------+      | (1:N)
        |                       ^                    |
        |                       | (1:N)              |
        +-----------------------+--------------------+
                                |
                      +-------------------+
                      |      DimTime      |
                      +-------------------+
```

---

### 2. Dimension Tables (Normalized Reference Grain)

All dimension tables utilize **surrogate integer keys** for primary keys to decouple the analytical warehouse from operational SIS/ERP database keys, enable rapid integer joins, and support SCD (Slowly Changing Dimensions) patterns. Natural keys (e.g., `student_id`, `course_code`) are preserved as unique indexed attributes.

#### 2.1 `dim_department`
- **Grain**: One record per university academic department.
- **Surrogate PK**: `department_key` (INTEGER IDENTITY)
- **Natural Key**: `department_code` (VARCHAR(20) UNIQUE) — e.g., `'CE'`, `'IT'`, `'EXTC'`, `'MECH'`, `'CIVIL'`
- **Attributes**: `department_name`, `faculty_name`, `created_at`

#### 2.2 `dim_course`
- **Grain**: One record per academic course offering in the university curriculum.
- **Surrogate PK**: `course_key` (INTEGER IDENTITY)
- **Natural Key**: `course_code` (VARCHAR(30) UNIQUE) — e.g., `'CS601'`, `'IT602'`
- **FK**: `department_key` &rarr; `dim_department(department_key)`
- **Attributes**: `course_name`, `credits`, `semester`, `created_at`

#### 2.3 `dim_student`
- **Grain**: One record per enrolled student.
- **Surrogate PK**: `student_key` (BIGINT IDENTITY)
- **Natural Key**: `student_id` (VARCHAR(30) UNIQUE) — e.g., `'STU1024'`
- **FK**: `department_key` &rarr; `dim_department(department_key)`
- **Attributes**: `student_name`, `gender`, `date_of_birth`, `admission_year`, `academic_year`, `semester`, `section`, `status`, `created_at`
- **Design Rule**: No calculated aggregates (GPA, attendance percentage, risk status) are stored in this dimension table.

#### 2.4 `dim_time`
- **Grain**: One record per calendar milestone / evaluation snapshot date.
- **Surrogate PK**: `time_key` (INTEGER, formatted as `YYYYMMDD` e.g., `20260630`)
- **Natural Key**: `date` (DATE UNIQUE)
- **Attributes**: `day`, `month`, `month_name`, `quarter`, `semester`, `academic_year`, `year`, `created_at`

#### 2.5 `dim_grade_band`
- **Grain**: One record per institutional letter grade tier on the 10-point scale.
- **Surrogate PK**: `grade_band_key` (INTEGER IDENTITY)
- **Natural Key**: `grade` (VARCHAR(10) UNIQUE) — `'O'`, `'A+'`, `'A'`, `'B+'`, `'B'`, `'C'`, `'P'`, `'F'`
- **Attributes**: `grade_point`, `grade_category` (`'Excellent'`, `'Good'`, `'Average'`, `'Needs Support'`), `min_marks`, `max_marks`, `created_at`

---

### 3. Fact Tables (Additive & Semi-Additive Grain)

#### 3.1 `fact_academic_performance`
- **Grain**: One record per student evaluation per course per academic time period.
- **Surrogate PK**: `performance_key` (BIGINT IDENTITY)
- **Foreign Keys**:
  - `student_key` &rarr; `dim_student`
  - `course_key` &rarr; `dim_course`
  - `department_key` &rarr; `dim_department`
  - `time_key` &rarr; `dim_time`
  - `grade_band_key` &rarr; `dim_grade_band`
- **Measures**:
  - `marks` (NUMERIC(5,2)) — Scale 0 to 100
  - `grade_point` (NUMERIC(4,2)) — Scale 0.0 to 10.0
  - `credits` (NUMERIC(3,1)) — Course weight
  - `result_status` (VARCHAR(20)) — `'Pass'`, `'Fail'`, `'Backlog'`, `'Absent'`
- **Uniqueness Constraint**: `(student_key, course_key, time_key)`

#### 3.2 `fact_attendance`
- **Grain**: One record per student course attendance aggregate per evaluation cycle.
- **Surrogate PK**: `attendance_key` (BIGINT IDENTITY)
- **Foreign Keys**:
  - `student_key` &rarr; `dim_student`
  - `course_key` &rarr; `dim_course`
  - `department_key` &rarr; `dim_department`
  - `time_key` &rarr; `dim_time`
- **Measures**:
  - `classes_conducted` (INTEGER) — Total scheduled classes
  - `classes_attended` (INTEGER) — Classes attended
  - `attendance_percentage` (NUMERIC(5,2)) — Calculated attendance proportion
- **Uniqueness Constraint**: `(student_key, course_key, time_key)`

---

### 4. Derived Metric Calculations (Fact-Based Derivations)

As per dimensional modeling best practices, dashboard metrics are not hard-coded in dimensions; they are dynamically computed using analytical SQL views:

1. **Cohort & Student Cumulative GPA**:
   ```sql
   GPA = ROUND(SUM(fact.grade_point * fact.credits) / NULLIF(SUM(fact.credits), 0), 2)
   ```

2. **Course Pass Rate**:
   ```sql
   Pass Rate (%) = ROUND(
     (COUNT(CASE WHEN fact.result_status = 'Pass' THEN 1 END)::numeric /
      NULLIF(COUNT(fact.performance_key), 0)::numeric) * 100.0, 1
   )
   ```

3. **Cohort Attendance Rate**:
   ```sql
   Attendance Rate (%) = ROUND(
     (SUM(att.classes_attended)::numeric /
      NULLIF(SUM(att.classes_conducted), 0)::numeric) * 100.0, 1
   )
   ```

4. **Dynamic At-Risk Classification**:
   ```sql
   is_at_risk = (calculated_gpa < 6.00 OR attendance_percentage < 75.0)
   ```

---

### 5. Indexing & Query Optimization Strategy

B-Tree indexes are created on:
- All foreign keys in `fact_academic_performance` and `fact_attendance`.
- Composite indexes `(department_key, time_key)` and `(student_key, time_key)` for rapid rollup queries and time-series slicing.
- Unique constraints on all natural dimension identifiers.

---

### 6. File Inventory & Execution Guide

| File | Purpose |
| :--- | :--- |
| `migrations/001_create_star_schema.sql` | DDL for dimension tables, fact tables, foreign keys, constraints, indexes, and RLS policies. |
| `migrations/002_analytical_views.sql` | SQL OLAP views computing student GPA, department performance, semester trends, and at-risk rosters. |
| `seeds/001_reference_data.sql` | Reference seed data for the 5 engineering departments, courses, 10-point grade bands, and academic calendar points. |
| `seeds/002_sample_students_facts.sql` | Reference test cohort containing the dashboard's flagged students and fact evaluations. |
| `seeds/seed_runner.py` | Python automation runner for executing migrations and seed scripts. |
| `types.ts` | Complete TypeScript interfaces for tables, views, and Supabase client typing. |
| `.env.example` | Template for Supabase URL, anon key, service role key, and PostgreSQL connection string. |

---

### 7. Supabase Setup Instructions (When Ready)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your Project URL and Anon Key into `frontend/.env.local` and `database/.env`.
3. Open the **Supabase SQL Editor** in your dashboard:
   - Run `migrations/001_create_star_schema.sql`
   - Run `migrations/002_analytical_views.sql`
   - Run `seeds/001_reference_data.sql`
   - Run `seeds/002_sample_students_facts.sql`
4. Verify all 5 dimension tables and 2 fact tables appear under the **Table Editor**.
