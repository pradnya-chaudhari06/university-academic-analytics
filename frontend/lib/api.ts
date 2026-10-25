/**
 * ==============================================================================
 * UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
 * Frontend API Client for FastAPI Backend
 * ==============================================================================
 * Connects the Next.js analytics dashboard directly to the Conformed Star Schema
 * Data Warehouse endpoints hosted on FastAPI (port 8000).
 * Handles snake_case to camelCase field mapping and reuses existing academic types.
 * ==============================================================================
 */

import {
  DepartmentPerformanceData,
  SemesterTrendPoint,
  PerformanceDistributionCategory,
  PerformanceGradeBand,
  AtRiskStudent,
  WarehouseStatusData,
  StudentDirectoryItem,
  PaginatedStudentsResponse,
  StudentQueryFilters,
  CourseQueryFilters,
  CourseItem,
  StudentDashboardData,
} from '../types/academic';

import {
  MiningOverviewResponse,
  ClusterMiningResponse,
  AssociationMiningResponse,
  DecisionTreeMiningResponse,
  FeatureImportanceResponse,
  KMeansExperimentRequest,
  KMeansExperimentResponse,
  ClusterDetailResponse,
  AlgorithmType,
  SingleAlgorithmRunResponse,
  AlgorithmBenchmarkResponse,
  AlgorithmRunRequest,
  AlgorithmBenchmarkRequest,
  ClassificationExperimentResponse,
  ClassificationHistoryItem,
} from '../types/mining';

export * from '../types/mining';
export * from '../types/academic';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ------------------------------------------------------------------------------
// Internal Raw API Response Interfaces (matching FastAPI Star Schema queries)
// ------------------------------------------------------------------------------

interface RawApiHealthResponse {
  status: string;
  database_engine?: string;
  schema?: string;
  enrolled_students_grain?: number;
  fact_tables?: string[];
  dimension_tables?: string[];
  error?: string;
}

interface RawApiKpisResponse {
  academic_period: string;
  department_slice: string;
  total_students: number;
  average_gpa: number;
  pass_rate: number;
  attendance_rate: number;
  at_risk_students: number;
}

interface RawApiDepartmentRow {
  code: string;
  name: string;
  facultyName?: string;
  faculty_name?: string;
  average_gpa: number;
  pass_rate: number;
  total_students: number;
  attendance_rate: number;
  at_risk_students: number;
}

interface RawApiCourseRow {
  code: string;
  name: string;
  departmentCode: string;
  department: string;
  credits: number;
  semester: string;
  evaluated_count: number;
  evaluatedCount?: number;
  enrolledStudents?: number;
  pass_rate: number;
  passRate?: number;
  average_gpa: number;
  averageGpa?: number;
  averageMarks?: number;
  attendanceRate?: number;
  passCount?: number;
  failCount?: number;
}

interface RawApiAtRiskStudentRow {
  studentId: string;
  studentName: string;
  department: string;
  gpa: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  attendanceRate: number;
  failedCoursesCount: number;
  flaggedSubject: string;
  primaryRiskFactor?: string | null;
}

interface RawApiWarehouseStatusResponse {
  status: string;
  last_etl_run: string;
  records_processed: number;
  fact_tables_count: number;
  dimension_tables_count: number;
  audit_logs?: Array<{
    log_id: number;
    job_id?: string;
    job_name: string;
    source_system?: string;
    target_table: string;
    status: string;
    records_extracted?: number;
    records_loaded: number;
    records_rejected?: number;
    duration_seconds?: number;
    started_at: string;
    completed_at: string | null;
    error_message?: string | null;
  }>;
}

// ------------------------------------------------------------------------------
// Exported TypeScript Interfaces (Frontend Conformed / CamelCase)
// ------------------------------------------------------------------------------

export interface HealthStatusResponse {
  status: string;
  databaseEngine?: string;
  schema?: string;
  enrolledStudentsGrain?: number;
  factTables?: string[];
  dimensionTables?: string[];
  error?: string;
}

export interface KpisResponse {
  academicPeriod: string;
  departmentSlice: string;
  totalStudents: number;
  averageGpa: number;
  passRate: number;
  attendanceRate: number;
  atRiskStudents: number;
}

export interface CoursePerformanceData {
  code: string;
  name: string;
  departmentCode: string;
  department: string;
  credits: number;
  semester: string;
  enrolledStudents: number;
  evaluatedCount: number;
  passRate: number;
  averageGpa: number;
  averageMarks?: number;
  attendanceRate?: number;
  passCount?: number;
  failCount?: number;
}

export interface WarehouseStatusResponse extends WarehouseStatusData {
  auditLogs?: RawApiWarehouseStatusResponse['audit_logs'];
}

export interface EtlRunResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ------------------------------------------------------------------------------
// Institutional Department & Distribution Metadata Mappings
// ------------------------------------------------------------------------------

const FACULTY_COUNT_LOOKUP: Record<string, number> = {
  CE: 44,
  IT: 42,
  EXTC: 36,
  MECH: 38,
  CIVIL: 26,
};

const DISTRIBUTION_METADATA: Record<
  PerformanceGradeBand,
  { colorHex: string; badgeClass: string; description: string }
> = {
  Excellent: {
    colorHex: '#4f46e5',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'First Class with Distinction honors criteria',
  },
  Good: {
    colorHex: '#059669',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'First Class standard benchmarks',
  },
  Average: {
    colorHex: '#d97706',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Higher Second Class standing',
  },
  'Needs Support': {
    colorHex: '#dc2626',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    description: 'Pass Class & Remedial attention tier',
  },
};

// ------------------------------------------------------------------------------
// Base Request Helper
// ------------------------------------------------------------------------------

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('uni_academic_auth_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.role) authHeaders['X-User-Role'] = session.role;
        if (session && session.studentId) authHeaders['X-Student-Id'] = session.studentId;
        if (session && session.email) authHeaders['X-User-Email'] = session.email;
      }
    } catch {
      // Ignore session read error
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Fallback to HTTP status text if response is not JSON
    }
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorDetail}`);
  }

  return response.json() as Promise<T>;
}

// ------------------------------------------------------------------------------
// API Functions
// ------------------------------------------------------------------------------

/**
 * GET /api/health
 * System health check and database connection status.
 */
export async function fetchHealth(): Promise<HealthStatusResponse> {
  const raw = await apiFetch<RawApiHealthResponse>('/api/health');
  return {
    status: raw.status,
    databaseEngine: raw.database_engine,
    schema: raw.schema,
    enrolledStudentsGrain: raw.enrolled_students_grain,
    factTables: raw.fact_tables,
    dimensionTables: raw.dimension_tables,
    error: raw.error,
  };
}

const DEPT_NAME_MAP: Record<string, string> = {
  Electronics: 'Electronics & Telecommunication',
  Mechanical: 'Mechanical Engineering',
  Civil: 'Civil Engineering',
};

/**
 * GET /api/kpis?department={department}
 * Aggregate KPI metrics calculated dynamically from fact tables for the active semester.
 * Supports optional department slice filter with canonical naming.
 */
export async function fetchKpis(department?: string): Promise<KpisResponse> {
  let endpoint = '/api/kpis';
  if (department && department !== 'All Departments') {
    const canonicalDept = DEPT_NAME_MAP[department] || department;
    endpoint += `?department=${encodeURIComponent(canonicalDept)}`;
  }
  const raw = await apiFetch<RawApiKpisResponse>(endpoint);
  return {
    academicPeriod: raw.academic_period,
    departmentSlice: raw.department_slice,
    totalStudents: raw.total_students,
    averageGpa: raw.average_gpa,
    passRate: raw.pass_rate,
    attendanceRate: raw.attendance_rate,
    atRiskStudents: raw.at_risk_students,
  };
}

/**
 * GET /api/departments
 * Department performance rollups calculated dynamically from underlying student facts.
 */
export async function fetchDepartments(): Promise<DepartmentPerformanceData[]> {
  const rows = await apiFetch<RawApiDepartmentRow[]>('/api/departments');
  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    facultyName: row.facultyName || row.faculty_name,
    averageGpa: row.average_gpa,
    passRate: row.pass_rate,
    totalStudents: row.total_students,
    attendanceRate: row.attendance_rate,
    atRiskStudents: row.at_risk_students,
    facultyCount: FACULTY_COUNT_LOOKUP[row.code] ?? 35,
    trend: row.pass_rate >= 90 ? 'improving' : 'stable',
  }));
}

/**
 * GET /api/departments/{code}
 * Single department performance rollup from conformed facts.
 */
export async function fetchDepartmentByCode(code: string): Promise<DepartmentPerformanceData> {
  const row = await apiFetch<RawApiDepartmentRow>(`/api/departments/${encodeURIComponent(code.trim())}`);
  return {
    code: row.code,
    name: row.name,
    facultyName: row.facultyName || row.faculty_name,
    averageGpa: row.average_gpa,
    passRate: row.pass_rate,
    totalStudents: row.total_students,
    attendanceRate: row.attendance_rate,
    atRiskStudents: row.at_risk_students,
    facultyCount: FACULTY_COUNT_LOOKUP[row.code] ?? 35,
    trend: row.pass_rate >= 90 ? 'improving' : 'stable',
  };
}

/**
 * GET /api/courses
 * Curriculum catalog and pass rates from DimCourse, FactAcademicPerformance, and FactAttendance.
 * Supports optional department, semester, and search query filters.
 */
export async function fetchCourses(filters?: CourseQueryFilters): Promise<CoursePerformanceData[]> {
  const params = new URLSearchParams();
  if (filters?.department && filters.department !== 'ALL' && filters.department !== 'All Departments') {
    params.append('department', filters.department);
  }
  if (filters?.semester && filters.semester !== 'ALL' && filters.semester !== 'All') {
    params.append('semester', filters.semester);
  }
  if (filters?.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const rows = await apiFetch<RawApiCourseRow[]>(`/api/courses${queryStr}`);
  return rows.map((row) => {
    const evalCount = row.evaluatedCount ?? row.evaluated_count ?? 0;
    return {
      code: row.code,
      name: row.name,
      departmentCode: row.departmentCode,
      department: row.department,
      credits: row.credits,
      semester: row.semester,
      enrolledStudents: evalCount,
      evaluatedCount: evalCount,
      passRate: row.passRate ?? row.pass_rate ?? 0,
      averageGpa: row.averageGpa ?? row.average_gpa ?? 0,
      averageMarks: row.averageMarks,
      attendanceRate: row.attendanceRate,
      passCount: row.passCount,
      failCount: row.failCount,
    };
  });
}

/**
 * GET /api/courses/{code}
 * Detailed course record and conformed fact metrics.
 */
export async function fetchCourseByCode(code: string): Promise<CoursePerformanceData> {
  const row = await apiFetch<RawApiCourseRow>(`/api/courses/${encodeURIComponent(code.trim())}`);
  const evalCount = row.evaluatedCount ?? row.evaluated_count ?? 0;
  return {
    code: row.code,
    name: row.name,
    departmentCode: row.departmentCode,
    department: row.department,
    credits: row.credits,
    semester: row.semester,
    enrolledStudents: evalCount,
    evaluatedCount: evalCount,
    passRate: row.passRate ?? row.pass_rate ?? 0,
    averageGpa: row.averageGpa ?? row.average_gpa ?? 0,
    averageMarks: row.averageMarks,
    attendanceRate: row.attendanceRate,
    passCount: row.passCount,
    failCount: row.failCount,
  };
}

/**
 * GET /api/students/at-risk
 * Roster of flagged at-risk students from FactStudentRiskStatus.
 */
export async function fetchAtRiskStudents(): Promise<AtRiskStudent[]> {
  const rows = await apiFetch<RawApiAtRiskStudentRow[]>('/api/students/at-risk');
  return rows.map((row, idx) => ({
    id: `ars-${row.studentId || idx + 1}`,
    studentId: row.studentId,
    studentName: row.studentName,
    department: row.department,
    gpa: row.gpa,
    riskLevel: row.riskLevel,
    attendanceRate: row.attendanceRate,
    failedCoursesCount: row.failedCoursesCount,
    flaggedSubject: row.flaggedSubject || 'General Academic',
    primaryRiskFactor: row.primaryRiskFactor,
  }));
}

/**
 * GET /api/trends?department={department}
 * Longitudinal progression across Semesters I through VI from FactAcademicPerformance and DimTime.
 * Supports optional department slice filter with canonical naming.
 */
export async function fetchTrends(department?: string): Promise<SemesterTrendPoint[]> {
  let endpoint = '/api/trends';
  if (department && department !== 'All Departments') {
    const canonicalDept = DEPT_NAME_MAP[department] || department;
    endpoint += `?department=${encodeURIComponent(canonicalDept)}`;
  }
  return apiFetch<SemesterTrendPoint[]>(endpoint);
}

export interface OlapMatrixCell {
  semester: string;
  academicYear: string;
  departmentCode: string;
  department: string;
  averageGpa: number;
  passRate: number;
  attendanceRate: number;
  studentCount: number;
}

/**
 * GET /api/olap/matrix
 * Multi-dimensional OLAP Cube Matrix across DimTime × DimDepartment (30 cells).
 */
export async function fetchOlapMatrix(): Promise<OlapMatrixCell[]> {
  return apiFetch<OlapMatrixCell[]>('/api/olap/matrix');
}

/**
 * GET /api/distribution
 * Distribution of cohort into institutional grade categories from FactStudentRiskStatus.
 */
export async function fetchDistribution(): Promise<PerformanceDistributionCategory[]> {
  interface RawDistributionItem {
    category: PerformanceGradeBand;
    studentCount: number;
    percentage: number;
    gpaRange: string;
  }

  const rows = await apiFetch<RawDistributionItem[]>('/api/distribution');
  return rows.map((row) => {
    const meta = DISTRIBUTION_METADATA[row.category] || {
      colorHex: '#64748b',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      description: 'Institutional standing tier',
    };
    return {
      category: row.category,
      gpaRange: row.gpaRange,
      studentCount: row.studentCount,
      percentage: row.percentage,
      colorHex: meta.colorHex,
      badgeClass: meta.badgeClass,
      description: meta.description,
    };
  });
}

/**
 * GET /api/warehouse/status
 * Operational status and audit metadata from etl_audit_log.
 */
export async function fetchWarehouseStatus(): Promise<WarehouseStatusResponse> {
  const raw = await apiFetch<RawApiWarehouseStatusResponse>('/api/warehouse/status');
  const validStatus: 'Healthy' | 'Degraded' | 'Syncing' =
    raw.status === 'Healthy' || raw.status === 'Degraded' || raw.status === 'Syncing'
      ? raw.status
      : 'Healthy';

  return {
    status: validStatus,
    lastEtlRun: raw.last_etl_run,
    recordsProcessed: raw.records_processed,
    factTablesCount: raw.fact_tables_count,
    dimensionTablesCount: raw.dimension_tables_count,
    lastRunDurationSeconds: raw.audit_logs?.[0]?.duration_seconds,
    lastRunRecordsRejected: raw.audit_logs?.[0]?.records_rejected,
    auditLogs: raw.audit_logs,
  };
}

/**
 * POST /api/etl/run
 * Executes the batch ETL pipeline and updates all warehouse tables.
 */
export async function triggerEtlRun(): Promise<EtlRunResponse> {
  return apiFetch<EtlRunResponse>('/api/etl/run', {
    method: 'POST',
  });
}

/**
 * GET /api/students
 * Paginated student directory backed by conformed star schema tables.
 * Returns full cohort with academic standing, attendance, and risk classification.
 */
export async function fetchStudents(
  filters: StudentQueryFilters = {}
): Promise<PaginatedStudentsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
  if (filters.department && filters.department !== 'ALL' && filters.department !== 'All Departments') {
    params.append('department', filters.department);
  }
  if (filters.risk && filters.risk !== 'ALL' && filters.risk !== 'All') {
    params.append('risk', filters.risk);
  }
  if (filters.semester && filters.semester !== 'ALL' && filters.semester !== 'All') {
    params.append('semester', filters.semester);
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<PaginatedStudentsResponse>(`/api/students${queryStr}`);
}

// ------------------------------------------------------------------------------
// Data Mining & Academic Risk API Functions (Phase 4)
// ------------------------------------------------------------------------------

/**
 * GET /api/mining/overview
 * High-level overview of the academic feature store, sample size, and algorithm readiness.
 */
export async function fetchMiningOverview(): Promise<MiningOverviewResponse> {
  return apiFetch<MiningOverviewResponse>('/api/mining/overview');
}

/**
 * GET /api/mining/clusters?k={k}
 * Executes K-Means clustering on the conformed student feature matrix.
 */
export async function fetchMiningClusters(k: number = 3): Promise<ClusterMiningResponse> {
  const boundedK = Math.max(2, Math.min(6, k));
  return apiFetch<ClusterMiningResponse>(`/api/mining/clusters?k=${boundedK}`);
}

/**
 * POST /api/mining/kmeans/experiment
 * Executes an advanced multi-K K-Means experiment sweep with inertia, silhouette,
 * Davies-Bouldin, Calinski-Harabasz, geometric chord elbow curvature, and multi-criteria recommendation.
 */
export async function runKMeansExperiment(
  req: KMeansExperimentRequest
): Promise<KMeansExperimentResponse> {
  return apiFetch<KMeansExperimentResponse>('/api/mining/kmeans/experiment', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/**
 * GET /api/mining/kmeans/experiment/config?k={k}&run_id={run_id}
 * Retrieves full cluster profiles, distributions, exemplar students,
 * and 2D projection scatter coordinates for a specific K from an experiment run.
 */
export async function fetchKMeansExperimentDetail(
  k: number,
  runId: string
): Promise<ClusterDetailResponse> {
  const params = new URLSearchParams({
    k: k.toString(),
    run_id: runId,
  });
  return apiFetch<ClusterDetailResponse>(`/api/mining/kmeans/experiment/config?${params.toString()}`);
}

/**
 * POST /api/mining/clustering/run
 * Executes a specific unsupervised clustering algorithm:
 * K-Means, Hierarchical Agglomerative, DBSCAN, or Gaussian Mixture Model (GMM).
 */
export async function runClusteringAlgorithm(
  req: AlgorithmRunRequest
): Promise<SingleAlgorithmRunResponse> {
  return apiFetch<SingleAlgorithmRunResponse>('/api/mining/clustering/run', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/**
 * POST /api/mining/clustering/benchmark
 * Runs multi-algorithm comparative benchmark evaluating K-Means, Hierarchical, DBSCAN, and GMM.
 * Returns comparative metrics, cluster distributions, outlier counts, and explainable recommendations.
 */
export async function runClusteringBenchmark(
  req?: AlgorithmBenchmarkRequest
): Promise<AlgorithmBenchmarkResponse> {
  return apiFetch<AlgorithmBenchmarkResponse>('/api/mining/clustering/benchmark', {
    method: 'POST',
    body: JSON.stringify(req || {}),
  });
}

/**
 * GET /api/mining/rules?min_support={s}&min_confidence={c}&max_length={l}
 * Discovers frequent itemsets and association rules using the Apriori algorithm.
 */
export async function fetchMiningRules(
  minSupport: number = 0.015,
  minConfidence: number = 0.60,
  maxLength: number = 3
): Promise<AssociationMiningResponse> {
  const params = new URLSearchParams({
    min_support: minSupport.toString(),
    min_confidence: minConfidence.toString(),
    max_length: maxLength.toString(),
  });
  return apiFetch<AssociationMiningResponse>(`/api/mining/rules?${params.toString()}`);
}

/**
 * GET /api/mining/decision-tree?max_depth={d}&criterion={c}
 * Trains and evaluates a Decision Tree Classifier predicting academic risk standing.
 */
export async function fetchMiningDecisionTree(
  maxDepth: number = 3,
  criterion: 'gini' | 'entropy' = 'gini',
  classWeight?: 'balanced' | null
): Promise<DecisionTreeMiningResponse> {
  const boundedDepth = Math.max(2, Math.min(6, maxDepth));
  const params = new URLSearchParams({
    max_depth: boundedDepth.toString(),
    criterion,
  });
  if (classWeight) {
    params.append('class_weight', classWeight);
  }
  return apiFetch<DecisionTreeMiningResponse>(`/api/mining/decision-tree?${params.toString()}`);
}

/**
 * POST /api/mining/classification/experiment
 * Runs multi-classifier benchmark across 5 models with 5-fold stratified CV and held-out test evaluation.
 */
export async function runClassificationExperiment(
  req: {
    test_size?: number;
    n_splits?: number;
    random_state?: number;
    metric_policy?: string;
  } = {}
): Promise<ClassificationExperimentResponse> {
  return apiFetch<ClassificationExperimentResponse>('/api/mining/classification/experiment', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/**
 * GET /api/mining/classification/experiment
 * Retrieves the latest classification experiment result or default benchmark.
 */
export async function fetchLatestClassificationExperiment(
  forceRerun: boolean = false
): Promise<ClassificationExperimentResponse> {
  const params = new URLSearchParams();
  if (forceRerun) params.set('force_rerun', 'true');
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ClassificationExperimentResponse>(`/api/mining/classification/experiment${queryStr}`);
}

/**
 * GET /api/mining/classification/history
 * Retrieves history of classification experiment runs.
 */
export async function fetchClassificationHistory(): Promise<{
  totalExperiments: number;
  history: ClassificationHistoryItem[];
}> {
  return apiFetch<{ totalExperiments: number; history: ClassificationHistoryItem[] }>(
    '/api/mining/classification/history'
  );
}

/**
 * GET /api/mining/classification/experiment/{experimentId}
 * Retrieves specific classification experiment run by ID.
 */
export async function fetchClassificationExperimentById(
  experimentId: string
): Promise<ClassificationExperimentResponse> {
  return apiFetch<ClassificationExperimentResponse>(
    `/api/mining/classification/experiment/${encodeURIComponent(experimentId)}`
  );
}

/**
 * POST /api/mining/classification/predict
 * Executes real-time academic risk inference using the selected champion model artifact.
 */
export async function predictStudentRisk(
  payload: import('../types/mining').PredictStudentRiskRequest
): Promise<import('../types/mining').PredictStudentRiskResponse> {
  return apiFetch<import('../types/mining').PredictStudentRiskResponse>(
    '/api/mining/classification/predict',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * GET /api/mining/feature-importance
 * Returns Gini feature importances and Pearson correlation matrix for academic performance measures.
 */
export async function fetchMiningFeatureImportance(): Promise<FeatureImportanceResponse> {
  return apiFetch<FeatureImportanceResponse>('/api/mining/feature-importance');
}

// ------------------------------------------------------------------------------
// Student Academic Analytics Portal API
// ------------------------------------------------------------------------------

/**
 * GET /api/student/me/dashboard
 * Authenticated Student Academic Analytics Dashboard endpoint.
 * Returns personal academic record, KPIs, semester trends, subjects, attendance,
 * anonymized benchmark comparison, risk analysis, and actionable suggestions.
 */
export async function fetchStudentDashboard(studentId?: string): Promise<StudentDashboardData> {
  const queryStr = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
  return apiFetch<StudentDashboardData>(`/api/student/me/dashboard${queryStr}`);
}

export interface StudentCourseAttendanceItem {
  course_code: string;
  courseCode?: string;
  course_name: string;
  courseName?: string;
  credits: number;
  marks: number;
  grade_point: number;
  gradePoint?: number;
  attendance_percentage: number;
  attendanceRate?: number;
  classes_attended?: number;
  classesAttended?: number;
  classes_conducted?: number;
  classesConducted?: number;
  result_status: string;
  resultStatus?: string;
  performance_category?: string;
  performanceCategory?: string;
}

export interface StudentAttendanceRiskData {
  success: boolean;
  student_id: string;
  studentId: string;
  student_name: string;
  studentName: string;
  department: string;
  department_code: string;
  departmentCode: string;
  semester: string;
  section: string;
  cohort: string;
  cgpa: number;
  current_sgpa: number;
  currentSgpa: number;
  attendance_percentage: number;
  attendancePercentage: number;
  attendance_cutoff: number;
  attendanceCutoff: number;
  is_below_threshold: boolean;
  isBelowThreshold: boolean;
  risk_level: string;
  riskLevel: string;
  raw_risk_level?: string;
  academic_standing: string;
  academicStanding: string;
  is_at_risk: boolean;
  isAtRisk: boolean;
  active_deficits: number;
  activeDeficits: number;
  primary_risk_factor: string;
  primaryRiskFactor: string;
  flagged_subject: string;
  flaggedSubject: string;
  deficit_courses: StudentCourseAttendanceItem[];
  deficitCourses?: StudentCourseAttendanceItem[];
  courses: StudentCourseAttendanceItem[];
  subjects?: StudentCourseAttendanceItem[];
  indicators?: string[];
  suggestions?: Array<{
    type: string;
    priority: string;
    title: string;
    detail: string;
  }>;
  summary?: string;
}

/**
 * GET /api/student/me/attendance-risk
 * Dedicated personal risk & biometric attendance endpoint for the authenticated Student.
 * Returns strictly the current student's conformed warehouse records.
 */
export async function fetchMyAttendanceRisk(): Promise<StudentAttendanceRiskData> {
  return apiFetch<StudentAttendanceRiskData>('/api/student/me/attendance-risk');
}

// ------------------------------------------------------------------------------
// Faculty Academic Analytics Workspace API
// ------------------------------------------------------------------------------

export interface FacultyKpis {
  totalStudents: number;
  classAverageGpa: number;
  passPercentage: number;
  averageAttendance: number;
  atRiskStudentsCount: number;
  topPerformersCount: number;
  departmentCode: string;
  departmentName: string;
  activeSemester: string;
}

export interface FacultyPerformanceTrendPoint {
  semester: string;
  timeKey: number;
  averageGpa: number;
  passPercentage: number;
  attendanceRate: number;
  enrolledStudents: number;
  isCurrent: boolean;
}

export interface FacultyGradeDistributionItem {
  grade: string;
  gradeCategory: string;
  gradePoint: number;
  studentCount: number;
  percentage: number;
}

export interface FacultyCourseItem {
  courseCode: string;
  courseName: string;
  credits: number;
  enrolledCount: number;
  averageGpa: number;
  passRate: number;
  attendanceRate: number;
  passCount: number;
  failCount: number;
  performanceStatus: string;
}

export interface FacultyAttendanceBand {
  tier: string;
  studentCount: number;
  averageGpa: number;
  status: string;
}

export interface FacultyScatterPoint {
  studentId: string;
  studentName: string;
  attendance: number;
  gpa: number;
  isAtRisk: boolean;
}

export interface FacultyCorrelationData {
  coefficient: number;
  interpretation: string;
  attendanceBands: FacultyAttendanceBand[];
  scatterSample: FacultyScatterPoint[];
}

export interface FacultyAtRiskStudent {
  studentId: string;
  studentName: string;
  gpa: number;
  attendanceRate: number;
  failedCoursesCount: number;
  riskLevel: string;
  flaggedSubject: string;
  primaryRiskFactor: string;
  recommendedIntervention: string;
}

export interface FacultyTopPerformer {
  studentId: string;
  studentName: string;
  gpa: number;
  attendanceRate: number;
  standing: string;
}

export interface FacultyInsight {
  id: string;
  type: 'warning' | 'alert' | 'positive';
  severity: 'High' | 'Medium' | 'Positive';
  title: string;
  metric: string;
  explanation: string;
  action: string;
}

export interface FacultyDashboardData {
  kpis: FacultyKpis;
  performanceTrend: FacultyPerformanceTrendPoint[];
  gradeDistribution: FacultyGradeDistributionItem[];
  courses: FacultyCourseItem[];
  correlation: FacultyCorrelationData;
  atRiskStudents: FacultyAtRiskStudent[];
  topPerformers: FacultyTopPerformer[];
  insights: FacultyInsight[];
}

export interface FacultyPerformanceData {
  department: string;
  semester: string;
  courses: FacultyCourseItem[];
  gradeDistribution: FacultyGradeDistributionItem[];
  performanceTrend: FacultyPerformanceTrendPoint[];
  correlation: FacultyCorrelationData;
}

export interface FacultyPedagogicalInsightsData {
  status: string;
  scope: string;
  studentArchetypes: Array<{
    clusterId: number;
    archetype: string;
    studentCount: number;
    percentage: number;
    meanGpa: number;
    meanAttendance: number;
    meanFailedCourses: number;
    teachingStrategy: string;
  }>;
  curriculumBottleneckRules: Array<{
    pattern: string;
    outcome: string;
    confidence: string;
    lift: number;
    pedagogicalAdvice: string;
  }>;
  keyRiskIndicators: Array<{
    indicator: string;
    importanceScore: number;
    facultyTakeaway: string;
  }>;
}

/**
 * GET /api/faculty/dashboard
 * Aggregates complete faculty teaching analytics cockpit.
 */
export async function fetchFacultyDashboard(
  department?: string,
  semester?: string
): Promise<FacultyDashboardData> {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  if (semester) params.append('semester', semester);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<FacultyDashboardData>(`/api/faculty/dashboard${q}`);
}

/**
 * GET /api/faculty/performance
 * Detailed course and cohort performance analytics for faculty.
 */
export async function fetchFacultyPerformance(
  department?: string,
  semester?: string
): Promise<FacultyPerformanceData> {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  if (semester) params.append('semester', semester);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<FacultyPerformanceData>(`/api/faculty/performance${q}`);
}

/**
 * GET /api/faculty/insights
 * Translated data mining insights and pedagogical recommendations for faculty.
 */
export async function fetchFacultyInsights(
  department?: string
): Promise<FacultyPedagogicalInsightsData> {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<FacultyPedagogicalInsightsData>(`/api/faculty/insights${q}`);
}

export interface FacultyAttendanceData {
  summary: {
    department: string;
    semester: string;
    totalStudents: number;
    averageAttendance: number;
    deficitCount: number;
    criticalCount: number;
    distinctionCount: number;
    deficitPercentage: number;
    correlationCoefficient: number;
  };
  attendanceTiers: FacultyAttendanceBand[];
  scatterSample: FacultyScatterPoint[];
  deficitStudents: Array<{
    studentId: string;
    studentName: string;
    department: string;
    semester: string;
    attendance: number;
    gpa: number;
    riskLevel: string;
    primaryFactor: string;
    status: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    metric: string;
    explanation: string;
    action: string;
  }>;
}

export interface FacultyCourseDetailData {
  course: {
    code: string;
    name: string;
    departmentCode: string;
    department: string;
    credits: number;
    semester: string;
    enrolledCount: number;
    passRate: number;
    averageGpa: number;
    averageMarks: number;
    attendanceRate: number;
    passCount: number;
    failCount: number;
  };
  gradeDistribution: Array<{
    grade: string;
    category: string;
    count: number;
    percentage: number;
  }>;
  students: Array<{
    studentId: string;
    studentName: string;
    marks: number;
    gradePoint: number;
    grade: string;
    resultStatus: string;
    attendance: number;
  }>;
}

export interface FacultyStudentDetailData {
  student: {
    studentId: string;
    studentName: string;
    gender: string;
    departmentCode: string;
    departmentName: string;
    semester: string;
    section: string;
    status: string;
    gpa: number;
    attendance: number;
    isAtRisk: boolean;
    riskLevel: string;
    primaryRiskFactor: string;
    recommendedIntervention: string;
  };
  semesterTrend: Array<{
    semester: string;
    gpa: number;
    attendance: number;
    coursesCount: number;
  }>;
  currentCourses: Array<{
    courseCode: string;
    courseName: string;
    credits: number;
    marks: number;
    gradePoint: number;
    gradeBand: string;
    resultStatus: string;
    attendance: number;
    classesAttended: number;
    classesConducted: number;
  }>;
}

/**
 * GET /api/faculty/attendance
 * Dedicated Attendance Analysis for Faculty cohort.
 */
export async function fetchFacultyAttendance(
  department?: string,
  semester?: string
): Promise<FacultyAttendanceData> {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  if (semester) params.append('semester', semester);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<FacultyAttendanceData>(`/api/faculty/attendance${q}`);
}

/**
 * GET /api/faculty/courses/{courseCode}
 * Detailed course curriculum evaluation for faculty.
 */
export async function fetchFacultyCourseDetail(
  courseCode: string
): Promise<FacultyCourseDetailData> {
  return apiFetch<FacultyCourseDetailData>(`/api/faculty/courses/${encodeURIComponent(courseCode)}`);
}

/**
 * GET /api/faculty/student/{studentId}
 * Faculty-safe inspection of an individual student academic record.
 */
export async function fetchFacultyStudentDetail(
  studentId: string
): Promise<FacultyStudentDetailData> {
  return apiFetch<FacultyStudentDetailData>(`/api/faculty/student/${encodeURIComponent(studentId)}`);
}

// ------------------------------------------------------------------------------
// User Profile & Personal Information API
// ------------------------------------------------------------------------------

export interface UserProfileData {
  email: string;
  name: string;
  role: string;
  user_id: string;
  student_id?: string | null;
  faculty_id?: string | null;
  department?: string;
  department_code?: string;
  designation: string;
  program?: string;
  semester?: string;
  section?: string;
  cohort?: string;
  phone?: string;
  office_location?: string;
  address?: string;
  bio?: string;
  specialization?: string;
  avatar_initials?: string;
  updated_at?: string;
}

export interface UserAcademicSummary {
  cgpa: number;
  currentSgpa: number;
  attendancePercentage: number;
  creditsAttempted: number;
  creditsEarned: number;
  backlogs: number;
  standing: string;
  riskLevel: string;
  isAtRisk: boolean;
  semester: string;
  section: string;
  cohort: string;
  primaryRiskFactor?: string;
  flaggedSubject?: string | null;
  department?: string;
  departmentCode?: string;
}

export interface UserProfileResponse {
  success: boolean;
  profile: UserProfileData;
  academicSummary?: UserAcademicSummary | null;
}

export interface ProfileUpdatePayload {
  phone?: string;
  office_location?: string;
  address?: string;
  bio?: string;
  specialization?: string;
}

/**
 * GET /api/user/profile
 * Retrieves authentic user profile for the authenticated session.
 */
export async function fetchUserProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/user/profile');
}

/**
 * PUT /api/user/profile
 * Updates allowed personal profile fields for the authenticated user.
 */
export async function updateUserProfile(payload: ProfileUpdatePayload): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
