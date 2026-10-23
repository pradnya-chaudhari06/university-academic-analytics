export type PerformanceGradeBand =
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs Support';

export type MetricTrendView = 'gpa' | 'passRate' | 'attendance';

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  secondaryValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: string;
    description: string;
    isPositive: boolean;
  };
  dwmMapping: {
    factTable: string;
    aggregation: string;
  };
}

export interface SemesterTrendPoint {
  semester: string;
  academicYear: string;
  averageGpa: number;
  passPercentage: number;
  attendanceRate: number;
  benchmarkGpa: number;
  enrolledStudents: number;
}

export interface DepartmentPerformanceData {
  code: string;
  name: string;
  facultyName?: string;
  averageGpa: number;
  passRate: number;
  totalStudents: number;
  atRiskStudents: number;
  attendanceRate: number;
  facultyCount: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceDistributionCategory {
  category: PerformanceGradeBand;
  gpaRange: string;
  studentCount: number;
  percentage: number;
  colorHex: string;
  badgeClass: string;
  description: string;
}

export interface AtRiskStudent {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  gpa: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  attendanceRate: number;
  flaggedSubject: string;
  failedCoursesCount?: number;
  primaryRiskFactor?: string | null;
}

export interface AcademicAlertItem {
  id: string;
  title: string;
  description: string;
  level: 'warning' | 'info' | 'critical';
  metricContext: string;
  dwmSource: string;
}

export interface EtlJobRecord {
  id: string;
  datasetName: string;
  sourceSystem: string;
  targetTable: string;
  recordsProcessed: number;
  status: 'Completed' | 'In Progress' | 'Queued' | 'Failed';
  lastUpdated: string;
  durationSeconds: number;
}

export interface AcademicInsightItem {
  id: string;
  title: string;
  value: string;
  detail: string;
  dwmReference: string;
}

export interface WarehouseStatusData {
  status: 'Healthy' | 'Degraded' | 'Syncing';
  lastEtlRun: string;
  recordsProcessed: number;
  factTablesCount: number;
  dimensionTablesCount: number;
  lastRunDurationSeconds?: number;
  lastRunRecordsRejected?: number;
}

export interface AcademicReport {
  id: string;
  reportName: string;
  generatedDate: string;
  type: string;
  size: string;
  status: 'Ready' | 'Generating';
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  category: 'Students' | 'Courses' | 'Departments' | 'Reports';
  subtitle: string;
  meta: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  type: 'etl' | 'report' | 'risk' | 'sync';
  read: boolean;
}

export interface AcademicFilterState {
  academicYear: string;
  semester: string;
  department: string;
  course: string;
}

export interface AttendanceVsGpaPoint {
  id: string;
  studentId: string;
  department: string;
  attendance: number;
  gpa: number;
  category: 'High Performer' | 'Average' | 'At-Risk';
}

export interface CourseItem {
  code: string;
  name: string;
  department: string;
  departmentCode: string;
  credits: number;
  semester: string;
  enrolledStudents?: number;
  evaluatedCount?: number;
  passRate: number;
  averageGpa: number;
  averageMarks?: number;
  attendanceRate?: number;
  passCount?: number;
  failCount?: number;
}

export interface CourseQueryFilters {
  department?: string;
  semester?: string;
  search?: string;
}

export interface UniversityAcademicDashboardData {
  academicYear: string;
  currentSemester: string;
  lastWarehouseSync: string;
  kpis: KpiMetric[];
  semesterTrends: SemesterTrendPoint[];
  departmentPerformance: DepartmentPerformanceData[];
  distribution: PerformanceDistributionCategory[];
  attendanceVsGpa: AttendanceVsGpaPoint[];
  atRiskStudents: AtRiskStudent[];
  warehouseStatus: WarehouseStatusData;
  etlJobs: EtlJobRecord[];
  reports: AcademicReport[];
}

export interface StudentDirectoryItem {
  studentId: string;
  studentName: string;
  department: string;
  departmentName?: string;
  semester: string;
  currentGpa: number;
  gpa: number;
  attendanceRate: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'None' | string;
  isAtRisk: boolean;
  failedCoursesCount: number;
}

export interface PaginatedStudentsResponse {
  students: StudentDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  risk?: string;
  semester?: string;
}

// ------------------------------------------------------------------------------
// Student Academic Analytics Portal Interfaces
// ------------------------------------------------------------------------------

export interface StudentProfile {
  studentId: string;
  studentName: string;
  gender: string;
  departmentCode: string;
  departmentName: string;
  semester: string;
  section: string;
  status: string;
  academicStanding: string;
}

export interface StudentKpis {
  cgpa: number;
  currentSgpa: number;
  attendancePercentage: number;
  creditsAttempted: number;
  creditsEarned: number;
  subjectsAtRisk: number;
  academicStanding: string;
  riskLevel: string;
  isAtRisk: boolean;
}

export interface StudentSemesterTrendPoint {
  semester: string;
  sgpa: number;
  credits: number;
  coursesCount: number;
  avgMarks: number;
  isCurrent: boolean;
}

export interface StudentTrendInsight {
  sgpaDelta: number;
  direction: 'improved' | 'declined' | 'stable';
  summary: string;
}

export interface StudentSubject {
  courseCode: string;
  courseName: string;
  credits: number;
  marks: number;
  gradePoint: number;
  resultStatus: 'Pass' | 'Fail';
  attendanceRate: number;
  classesAttended: number;
  classesConducted: number;
  performanceCategory: 'Strong' | 'Average' | 'Needs Improvement' | 'At Risk / Failed';
  status: 'Pass' | 'Fail';
}

export interface StudentExtremumSubject {
  courseCode: string;
  courseName: string;
  marks: number;
  gradePoint: number;
  explanation: string;
}

export interface StudentAttendanceAnalysis {
  overallRate: number;
  institutionalThreshold: number;
  isBelowThreshold: boolean;
  deficitSubjectsCount: number;
  summary: string;
}

export interface StudentClassComparison {
  studentGpa: number;
  classAvgGpa: number;
  gpaDelta: number;
  studentAttendance: number;
  classAvgAttendance: number;
  attendanceDelta: number;
  departmentName: string;
  semester: string;
}

export interface StudentAcademicRisk {
  isAtRisk: boolean;
  riskLevel: string;
  primaryRiskFactor: string;
  flaggedSubject: string;
  failedCoursesCount: number;
  indicators: string[];
}

export interface StudentSuggestion {
  type: 'attendance' | 'subject' | 'trend' | 'reinforcement';
  priority: 'High' | 'Medium' | 'Positive';
  title: string;
  detail: string;
}

export interface StudentGoalImprovement {
  focusSubject: string;
  currentMarks: number;
  targetMarks: number;
  difference: number;
  currentGradePoint: number;
  targetGradePoint: number;
  recommendedAction: string;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  kpis: StudentKpis;
  semesterTrend: StudentSemesterTrendPoint[];
  trendInsight: StudentTrendInsight;
  subjects: StudentSubject[];
  strongestSubject: StudentExtremumSubject | null;
  weakestSubject: StudentExtremumSubject | null;
  attendance: StudentAttendanceAnalysis;
  classComparison: StudentClassComparison;
  academicRisk: StudentAcademicRisk;
  suggestions: StudentSuggestion[];
  goalImprovement: StudentGoalImprovement | null;
}


