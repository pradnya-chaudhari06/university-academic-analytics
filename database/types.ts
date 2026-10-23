/**
 * ==============================================================================
 * UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
 * Database TypeScript Definitions (Supabase & PostgreSQL Compatible)
 * ==============================================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ------------------------------------------------------------------------------
// 1. Dimension Tables
// ------------------------------------------------------------------------------

/** DimDepartment: Academic faculty and department structure */
export interface DimDepartmentRow {
  department_key: number;
  department_code: string;
  department_name: string;
  faculty_name: string;
  created_at: string;
}

export interface DimDepartmentInsert {
  department_key?: never; // Generated identity
  department_code: string;
  department_name: string;
  faculty_name: string;
  created_at?: string;
}

export interface DimDepartmentUpdate {
  department_code?: string;
  department_name?: string;
  faculty_name?: string;
  created_at?: string;
}

/** DimCourse: Course catalog and curriculum metadata */
export interface DimCourseRow {
  course_key: number;
  course_code: string;
  course_name: string;
  department_key: number;
  credits: number;
  semester: string;
  created_at: string;
}

export interface DimCourseInsert {
  course_key?: never;
  course_code: string;
  course_name: string;
  department_key: number;
  credits: number;
  semester: string;
  created_at?: string;
}

export interface DimCourseUpdate {
  course_code?: string;
  course_name?: string;
  department_key?: number;
  credits?: number;
  semester?: string;
  created_at?: string;
}

/** DimStudent: Student demographic, cohort, and academic status */
export interface DimStudentRow {
  student_key: number; // BigInt surrogate key (treated as number in TS/JS)
  student_id: string;  // Natural key (e.g., 'STU1024')
  student_name: string;
  gender: 'Male' | 'Female' | 'Non-Binary' | 'Other' | null;
  date_of_birth: string | null;
  department_key: number;
  admission_year: number;
  academic_year: string;
  semester: string;
  section: string;
  status: 'Active' | 'Graduated' | 'Suspended' | 'Withdrawn' | 'On Leave';
  created_at: string;
}

export interface DimStudentInsert {
  student_key?: never;
  student_id: string;
  student_name: string;
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Other' | null;
  date_of_birth?: string | null;
  department_key: number;
  admission_year: number;
  academic_year: string;
  semester: string;
  section?: string;
  status?: 'Active' | 'Graduated' | 'Suspended' | 'Withdrawn' | 'On Leave';
  created_at?: string;
}

export interface DimStudentUpdate {
  student_id?: string;
  student_name?: string;
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Other' | null;
  date_of_birth?: string | null;
  department_key?: number;
  admission_year?: number;
  academic_year?: string;
  semester?: string;
  section?: string;
  status?: 'Active' | 'Graduated' | 'Suspended' | 'Withdrawn' | 'On Leave';
  created_at?: string;
}

/** DimTime: Academic calendar temporal dimension */
export interface DimTimeRow {
  time_key: number; // YYYYMMDD integer key (e.g., 20260630)
  date: string;
  day: number;
  month: number;
  month_name: string;
  quarter: number;
  semester: string;
  academic_year: string;
  year: number;
  created_at: string;
}

export interface DimTimeInsert {
  time_key: number;
  date: string;
  day: number;
  month: number;
  month_name: string;
  quarter: number;
  semester: string;
  academic_year: string;
  year: number;
  created_at?: string;
}

export interface DimTimeUpdate {
  date?: string;
  day?: number;
  month?: number;
  month_name?: string;
  quarter?: number;
  semester?: string;
  academic_year?: string;
  year?: number;
  created_at?: string;
}

/** DimGradeBand: Institutional grading criteria and tiers */
export interface DimGradeBandRow {
  grade_band_key: number;
  grade: string;
  grade_point: number;
  grade_category: 'Excellent' | 'Good' | 'Average' | 'Needs Support';
  min_marks: number;
  max_marks: number;
  created_at: string;
}

export interface DimGradeBandInsert {
  grade_band_key?: never;
  grade: string;
  grade_point: number;
  grade_category: 'Excellent' | 'Good' | 'Average' | 'Needs Support';
  min_marks: number;
  max_marks: number;
  created_at?: string;
}

export interface DimGradeBandUpdate {
  grade?: string;
  grade_point?: number;
  grade_category?: 'Excellent' | 'Good' | 'Average' | 'Needs Support';
  min_marks?: number;
  max_marks?: number;
  created_at?: string;
}

// ------------------------------------------------------------------------------
// 2. Fact Tables
// ------------------------------------------------------------------------------

/** FactAcademicPerformance: Granular course examination results */
export interface FactAcademicPerformanceRow {
  performance_key: number;
  student_key: number;
  course_key: number;
  department_key: number;
  time_key: number;
  grade_band_key: number;
  marks: number;
  grade_point: number;
  credits: number;
  result_status: 'Pass' | 'Fail' | 'Backlog' | 'Absent' | 'Exempted';
  created_at: string;
}

export interface FactAcademicPerformanceInsert {
  performance_key?: never;
  student_key: number;
  course_key: number;
  department_key: number;
  time_key: number;
  grade_band_key: number;
  marks: number;
  grade_point: number;
  credits: number;
  result_status: 'Pass' | 'Fail' | 'Backlog' | 'Absent' | 'Exempted';
  created_at?: string;
}

export interface FactAcademicPerformanceUpdate {
  student_key?: number;
  course_key?: number;
  department_key?: number;
  time_key?: number;
  grade_band_key?: number;
  marks?: number;
  grade_point?: number;
  credits?: number;
  result_status?: 'Pass' | 'Fail' | 'Backlog' | 'Absent' | 'Exempted';
  created_at?: string;
}

/** FactAttendance: Session attendance records */
export interface FactAttendanceRow {
  attendance_key: number;
  student_key: number;
  course_key: number;
  department_key: number;
  time_key: number;
  classes_conducted: number;
  classes_attended: number;
  attendance_percentage: number;
  created_at: string;
}

export interface FactAttendanceInsert {
  attendance_key?: never;
  student_key: number;
  course_key: number;
  department_key: number;
  time_key: number;
  classes_conducted: number;
  classes_attended: number;
  attendance_percentage: number;
  created_at?: string;
}

export interface FactAttendanceUpdate {
  student_key?: number;
  course_key?: number;
  department_key?: number;
  time_key?: number;
  classes_conducted?: number;
  classes_attended?: number;
  attendance_percentage?: number;
  created_at?: string;
}

/** FactStudentRiskStatus: Periodic snapshot risk evaluations */
export interface FactStudentRiskStatusRow {
  risk_key: number;
  student_key: number;
  department_key: number;
  time_key: number;
  current_gpa: number;
  attendance_percentage: number;
  failed_courses_count: number;
  risk_level: 'High' | 'Medium' | 'Low' | 'None';
  is_at_risk: boolean;
  primary_risk_factor: string | null;
  flagged_subject: string | null;
  created_at: string;
}

export interface FactStudentRiskStatusInsert {
  risk_key?: never;
  student_key: number;
  department_key: number;
  time_key: number;
  current_gpa: number;
  attendance_percentage: number;
  failed_courses_count?: number;
  risk_level: 'High' | 'Medium' | 'Low' | 'None';
  is_at_risk: boolean;
  primary_risk_factor?: string | null;
  flagged_subject?: string | null;
  created_at?: string;
}

export interface FactStudentRiskStatusUpdate {
  student_key?: number;
  department_key?: number;
  time_key?: number;
  current_gpa?: number;
  attendance_percentage?: number;
  failed_courses_count?: number;
  risk_level?: 'High' | 'Medium' | 'Low' | 'None';
  is_at_risk?: boolean;
  primary_risk_factor?: string | null;
  flagged_subject?: string | null;
  created_at?: string;
}

/** EtlAuditLog: Operational batch pipeline execution audit log */
export interface EtlAuditLogRow {
  log_id: number;
  job_id: string;
  job_name: string;
  source_system: string;
  target_table: string;
  status: 'Started' | 'Completed' | 'Failed' | 'In Progress';
  records_extracted: number;
  records_loaded: number;
  records_rejected: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// ------------------------------------------------------------------------------
// 3. OLAP Analytical Views (Derived from Fact Data)
// ------------------------------------------------------------------------------

export interface ViewStudentAcademicSummaryRow {
  student_key: number;
  student_id: string;
  student_name: string;
  gender: string | null;
  department_code: string;
  department_name: string;
  academic_year: string;
  semester: string;
  section: string;
  status: string;
  gpa: number;
  credits_registered: number;
  credits_earned: number;
  failed_courses: number;
  attendance_rate: number;
  is_at_risk: boolean;
  risk_level: 'High' | 'Medium' | 'Low';
}

export interface ViewDepartmentPerformanceRow {
  department_key: number;
  department_code: string;
  department_name: string;
  faculty_name: string;
  total_students: number;
  average_gpa: number;
  pass_rate: number;
  attendance_rate: number;
  at_risk_students_count: number;
}

export interface ViewSemesterTrendsRow {
  academic_year: string;
  semester: string;
  enrolled_students: number;
  average_gpa: number;
  pass_percentage: number;
  attendance_rate: number;
  benchmark_gpa: number;
}

export interface ViewPerformanceDistributionRow {
  category: 'Excellent' | 'Good' | 'Average' | 'Needs Support';
  student_count: number;
  percentage: number;
  gpa_range: string;
}

export interface ViewAtRiskRosterRow {
  student_key: number;
  student_id: string;
  student_name: string;
  department_code: string;
  gpa: number;
  risk_level: 'High' | 'Medium' | 'Low';
  attendance_rate: number;
  flagged_subject: string;
}

// ------------------------------------------------------------------------------
// 4. Supabase Database Schema Definition
// Compatible with @supabase/supabase-js createClient<Database>()
// ------------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      dim_department: {
        Row: DimDepartmentRow;
        Insert: DimDepartmentInsert;
        Update: DimDepartmentUpdate;
      };
      dim_course: {
        Row: DimCourseRow;
        Insert: DimCourseInsert;
        Update: DimCourseUpdate;
      };
      dim_student: {
        Row: DimStudentRow;
        Insert: DimStudentInsert;
        Update: DimStudentUpdate;
      };
      dim_time: {
        Row: DimTimeRow;
        Insert: DimTimeInsert;
        Update: DimTimeUpdate;
      };
      dim_grade_band: {
        Row: DimGradeBandRow;
        Insert: DimGradeBandInsert;
        Update: DimGradeBandUpdate;
      };
      fact_academic_performance: {
        Row: FactAcademicPerformanceRow;
        Insert: FactAcademicPerformanceInsert;
        Update: FactAcademicPerformanceUpdate;
      };
      fact_attendance: {
        Row: FactAttendanceRow;
        Insert: FactAttendanceInsert;
        Update: FactAttendanceUpdate;
      };
      fact_student_risk_status: {
        Row: FactStudentRiskStatusRow;
        Insert: FactStudentRiskStatusInsert;
        Update: FactStudentRiskStatusUpdate;
      };
      etl_audit_log: {
        Row: EtlAuditLogRow;
        Insert: Omit<EtlAuditLogRow, 'log_id'>;
        Update: Partial<Omit<EtlAuditLogRow, 'log_id'>>;
      };
    };
    Views: {
      view_student_academic_summary: {
        Row: ViewStudentAcademicSummaryRow;
      };
      view_department_performance: {
        Row: ViewDepartmentPerformanceRow;
      };
      view_semester_trends: {
        Row: ViewSemesterTrendsRow;
      };
      view_performance_distribution: {
        Row: ViewPerformanceDistributionRow;
      };
      view_at_risk_roster: {
        Row: ViewAtRiskRosterRow;
      };
    };
    Functions: Record<string, never>;
  };
}
