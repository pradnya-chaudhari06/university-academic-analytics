'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { useAuth } from '../../../lib/auth';
import {
  fetchFacultyPerformance,
  FacultyPerformanceData,
  FacultyCourseItem,
  FacultyGradeDistributionItem,
  FacultyPerformanceTrendPoint,
} from '../../../lib/api';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BarChart2,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Info,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

export default function FacultyPerformancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [perfData, setPerfData] = useState<FacultyPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester VI');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Computer Engineering');
  const [courseFilter, setCourseFilter] = useState<'ALL' | 'BOTTLENECK' | 'EXCELLENT'>('ALL');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'Faculty' && user.role !== 'Administrator') {
      router.replace('/student');
      return;
    }

    setIsLoading(true);
    setError(null);
    fetchFacultyPerformance(selectedDepartment, selectedSemester)
      .then((data) => {
        setPerfData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load performance analytics:', err);
        setError(err.message || 'Failed to retrieve class performance data.');
        setIsLoading(false);
      });
  }, [user, authLoading, router, selectedDepartment, selectedSemester]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchFacultyPerformance(selectedDepartment, selectedSemester)
      .then((data) => {
        setPerfData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to refresh data.');
        setIsLoading(false);
      });
  };

  // Filter courses
  const filteredCourses = (perfData?.courses || []).filter((c) => {
    if (courseFilter === 'BOTTLENECK') return c.performanceStatus === 'Needs Attention' || c.passRate < 90.0;
    if (courseFilter === 'EXCELLENT') return c.performanceStatus === 'Optimal' || c.passRate >= 95.0;
    return true;
  });

  // Calculate highest and lowest courses
  const sortedByPassRate = [...(perfData?.courses || [])].sort((a, b) => b.passRate - a.passRate);
  const topCourse = sortedByPassRate[0];
  const lowestCourse = sortedByPassRate[sortedByPassRate.length - 1];

  // Total Grade Band count
  const totalGradeStudents = (perfData?.gradeDistribution || []).reduce((acc, g) => acc + g.studentCount, 0);

  return (
    <AppShell activeItem="class-performance">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/faculty" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Faculty Dashboard</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">Class Performance Analytics</span>
        </div>

        {/* Header Banner */}
        <div className="bg-[#1e2238] rounded-xl text-white p-6 border border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/30">
                Curriculum Analytics
              </span>
              <span className="text-xs text-slate-400">Department of {perfData?.department || selectedDepartment}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#f87941]" />
              <span>Class Performance &amp; Curriculum Evaluation</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Course evaluation metrics, longitudinal semester progression, grade band distributions, and biometric attendance correlations derived directly from the conformed warehouse.
            </p>
          </div>

          {/* Department & Semester Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="Computer Engineering" className="bg-slate-900 text-white">Computer Engineering</option>
                <option value="Information Technology" className="bg-slate-900 text-white">Information Technology</option>
                <option value="Electronics & Telecommunication" className="bg-slate-900 text-white">Electronics &amp; Telecom</option>
                <option value="Mechanical Engineering" className="bg-slate-900 text-white">Mechanical Engineering</option>
                <option value="Civil Engineering" className="bg-slate-900 text-white">Civil Engineering</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Filter by academic semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="Semester VI" className="bg-slate-900 text-white">Semester VI (Active)</option>
                <option value="Semester V" className="bg-slate-900 text-white">Semester V</option>
                <option value="Semester IV" className="bg-slate-900 text-white">Semester IV</option>
                <option value="Semester III" className="bg-slate-900 text-white">Semester III</option>
                <option value="Semester II" className="bg-slate-900 text-white">Semester II</option>
                <option value="Semester I" className="bg-slate-900 text-white">Semester I</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Performance Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Failed to Load Performance Analytics</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !error && perfData && (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Department Offerings</span>
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {perfData.courses.length} <span className="text-xs font-medium text-slate-500">Core Courses</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Curriculum courses evaluated in {selectedSemester}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Highest Performing Course</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-lg font-bold text-emerald-700 truncate">
                  {topCourse ? `${topCourse.courseCode} · ${topCourse.passRate}%` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {topCourse?.courseName || 'Stable curriculum evaluation'}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Curriculum Bottleneck Focus</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-lg font-bold text-amber-700 truncate">
                  {lowestCourse ? `${lowestCourse.courseCode} · ${lowestCourse.passRate}%` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  Target for tutorial &amp; practical remediation
                </div>
              </div>
            </div>

            {/* Course Performance Matrix */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#f87941]" />
                    <span>Curriculum Evaluation Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Course-level pass rates, average marks, and biometric attendance for {perfData.department}
                  </p>
                </div>
                
                {/* Course Filter Badges */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCourseFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      courseFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Courses ({perfData.courses.length})
                  </button>
                  <button
                    onClick={() => setCourseFilter('BOTTLENECK')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      courseFilter === 'BOTTLENECK'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Attention Needed
                  </button>
                  <button
                    onClick={() => setCourseFilter('EXCELLENT')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      courseFilter === 'EXCELLENT'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    High Pass Rate (≥95%)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Course Code</th>
                      <th className="px-4 py-3">Course Title</th>
                      <th className="px-3 py-3 text-center">Credits</th>
                      <th className="px-3 py-3 text-center">Students</th>
                      <th className="px-4 py-3 text-center">Pass %</th>
                      <th className="px-3 py-3 text-center">Avg GPA</th>
                      <th className="px-3 py-3 text-center">Attendance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCourses.map((c) => {
                      const isWeak = c.performanceStatus === 'Needs Attention' || c.passRate < 90.0;
                      return (
                        <tr key={c.courseCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {c.courseCode}
                          </td>
                          <td className="px-4 py-3 text-slate-800">
                            {c.courseName}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600">
                            {c.credits}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600">
                            {c.enrolledCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              c.passRate >= 95.0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.passRate >= 90.0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {c.passRate}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-900">
                            {c.averageGpa.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-[11px] font-semibold ${
                              c.attendanceRate >= 85.0
                                ? 'text-emerald-700'
                                : c.attendanceRate >= 75.0
                                ? 'text-slate-700'
                                : 'text-rose-600'
                            }`}>
                              {c.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.performanceStatus === 'Optimal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.performanceStatus === 'Needs Attention'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {c.performanceStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Longitudinal Progression Trend & Grade Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Longitudinal Progression Trend (Sem I - VI) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#f87941]" />
                    <span>Longitudinal Semester Progression</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cohort average GPA and pass rate across all completed semesters
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {perfData.performanceTrend.map((pt) => {
                    const gpaPercent = Math.min(100, Math.max(0, (pt.averageGpa / 10.0) * 100));
                    return (
                      <div key={pt.semester} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {pt.semester}
                            {pt.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#f87941] text-white">
                                Active
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500">Pass: {pt.passPercentage}%</span>
                            <span className="font-bold text-slate-900">{pt.averageGpa.toFixed(2)} GPA</span>
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              pt.isCurrent ? 'bg-[#f87941]' : 'bg-slate-700'
                            }`}
                            style={{ width: `${gpaPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Scale: 0.00 – 10.00 GPA</span>
                  <span>Data Source: FactAcademicPerformance</span>
                </div>
              </div>

              {/* Grade Band Distribution */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#f87941]" />
                    <span>Conformed Grade Band Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student count and percentage across dim_grade_band categories
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {perfData.gradeDistribution.map((gb) => {
                    const isHonors = gb.grade === 'O' || gb.grade === 'A+';
                    const isFail = gb.grade === 'F';
                    return (
                      <div key={gb.grade} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            Grade {gb.grade}
                            {isHonors && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                Distinction
                              </span>
                            )}
                            {isFail && (
                              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                                Backlog
                              </span>
                            )}
                          </span>
                          <span className="text-slate-600 font-semibold">
                            {gb.studentCount.toLocaleString()} students ({gb.percentage}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isHonors
                                ? 'bg-emerald-500'
                                : isFail
                                ? 'bg-rose-500'
                                : 'bg-[#1e2238]'
                            }`}
                            style={{ width: `${Math.min(100, gb.percentage * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Total Grades Logged: {totalGradeStudents.toLocaleString()}</span>
                  <span>Source: DimGradeBand &amp; FactAcademicPerformance</span>
                </div>
              </div>

            </div>

            {/* Attendance vs Performance Observed Correlation */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#f87941]" />
                    <span>Attendance Rate vs. Academic Performance</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Empirical biometric attendance tiers compared with semester GPA (Pearson r = {perfData.correlation.coefficient})
                  </p>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">
                  Observed Relationship: r = {perfData.correlation.coefficient}
                </div>
              </div>

              {/* 4 Attendance Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {perfData.correlation.attendanceBands.map((band) => (
                  <div key={band.tier} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-xs font-semibold text-slate-600">{band.tier}</div>
                    <div className="text-lg font-bold text-slate-900">{band.averageGpa.toFixed(2)} GPA</div>
                    <div className="text-[11px] text-slate-500">
                      {band.studentCount.toLocaleString()} students · {band.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-700" />
                  <span>Pedagogical Takeaway for Faculty</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Students maintaining ≥90% biometric attendance achieve an average GPA of{' '}
                  <span className="font-semibold">
                    {perfData.correlation.attendanceBands.find((b) => b.tier.includes('≥90%'))?.averageGpa || 8.4}
                  </span>
                  , whereas students falling below the statutory 75% attendance threshold average{' '}
                  <span className="font-semibold">
                    {perfData.correlation.attendanceBands.find((b) => b.tier.includes('<75%'))?.averageGpa || 6.2}
                  </span>
                  . Biometric attendance monitoring serves as an early indicator before formal term assessments.
                </p>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                href="/faculty"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Faculty Dashboard</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/faculty/insights"
                  className="px-4 py-2 bg-[#1e2238] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#f87941]" />
                  <span>View Pedagogical ML Insights</span>
                </Link>
                <Link
                  href="/students"
                  className="px-4 py-2 bg-[#f87941] hover:bg-[#e06530] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Inspect Student Roster</span>
                </Link>
              </div>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
