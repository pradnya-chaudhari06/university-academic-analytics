'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { fetchCourses, fetchStudentDashboard } from '../../lib/api';
import { CourseItem, StudentDashboardData, StudentSubject } from '../../types/academic';
import {
  BookOpen,
  Search,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Award,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function CoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isStudent = user?.role === 'Student';

  // ---------------------------------------------------------------------------
  // Faculty & Administrator Curriculum State
  // ---------------------------------------------------------------------------
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Authenticated Student Enrolled Coursework State
  // ---------------------------------------------------------------------------
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentCategoryFilter, setStudentCategoryFilter] = useState('All');

  // Debounce search input for curriculum catalog
  useEffect(() => {
    if (isStudent) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isStudent]);

  // Load General Curriculum Catalog (Faculty / Admin / Analyst)
  const loadCourses = () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    fetchCourses({
      department: selectedDept,
      semester: selectedSemester,
      search: debouncedSearch,
    })
      .then((data) => {
        setCourses(data);
        setIsCatalogLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load courses:', err);
        setCatalogError(err.message || 'Failed to load courses from data warehouse.');
        setIsCatalogLoading(false);
      });
  };

  // Load Personal Enrolled Coursework (Student)
  const loadStudentCourses = () => {
    setIsStudentLoading(true);
    setStudentError(null);
    fetchStudentDashboard()
      .then((data) => {
        setStudentData(data);
        setIsStudentLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student courses:', err);
        setStudentError(err.message || 'Failed to load coursework records from warehouse.');
        setIsStudentLoading(false);
      });
  };

  useEffect(() => {
    if (authLoading || !user) return;
    if (isStudent) {
      loadStudentCourses();
    } else {
      loadCourses();
    }
  }, [authLoading, user, isStudent, debouncedSearch, selectedDept, selectedSemester]);

  const formatSemester = (sem: string) => {
    if (!sem) return '';
    if (sem.startsWith('Semester')) return sem.replace('Semester', 'Sem');
    if (sem.startsWith('Sem')) return sem;
    return `Sem ${sem}`;
  };

  // ===========================================================================
  // RENDER: STUDENT VIEW — PERSONAL ENROLLED COURSES & SUBJECTS
  // ===========================================================================
  if (isStudent) {
    const subjects = studentData?.subjects || [];
    const filteredSubjects = subjects.filter((s) => {
      if (studentCategoryFilter === 'All') return true;
      if (studentCategoryFilter === 'At Risk') return s.performanceCategory.includes('At Risk') || s.resultStatus === 'Fail';
      return s.performanceCategory === studentCategoryFilter;
    });

    const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
    const earnedCredits = subjects
      .filter((s) => s.resultStatus === 'Pass')
      .reduce((acc, s) => acc + s.credits, 0);

    return (
      <AppShell activeItem="courses">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <span>Academic</span>
                <span>/</span>
                <span className="text-slate-800 font-medium">My Courses &amp; Subjects</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                Enrolled Courses &amp; Evaluations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Semester VI coursework, evaluated credits, biometric attendance, and grading status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 shadow-2xs">
                <BookOpen className="h-3.5 w-3.5 text-[#f87941]" />
                <span>{subjects.length} Enrolled Courses</span>
              </span>
              <button
                type="button"
                onClick={loadStudentCourses}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e7eaee] bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh courses"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isStudentLoading ? 'animate-spin text-[#f87941]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Student Identity Banner */}
          {studentData && (
            <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff4ed] text-[#f87941] font-bold text-sm border border-[#fcd5bf]">
                  {studentData.profile.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{studentData.profile.studentName}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {studentData.profile.studentId} · {studentData.profile.departmentName} ({studentData.profile.departmentCode})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  {studentData.profile.semester} · Section {studentData.profile.section}
                </span>
                <span className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                  studentData.kpis.isAtRisk
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {studentData.profile.academicStanding}
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {studentError ? (
            <div className="bg-white rounded-lg border border-rose-200 p-8 text-center bg-rose-50/40 shadow-2xs space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Unable to load coursework records</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{studentError}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loadStudentCourses}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Query</span>
                </button>
              </div>
            </div>
          ) : isStudentLoading ? (
            /* Loading State */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-4" />
                ))}
              </div>
              <div className="h-64 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
            </div>
          ) : (
            <>
              {/* Coursework Metrics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Courses</span>
                  <span className="text-2xl font-bold text-[#1e2238] mt-1 block">{subjects.length}</span>
                  <span className="text-[10.5px] text-slate-500">Semester VI Catalog</span>
                </div>

                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Credits Progress</span>
                  <span className="text-2xl font-bold text-[#1e2238] mt-1 block">
                    {earnedCredits.toFixed(0)} <span className="text-xs text-slate-400 font-normal">/ {totalCredits.toFixed(0)}</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {earnedCredits === totalCredits ? 'All Credits Earned' : `${(totalCredits - earnedCredits).toFixed(0)} Credits Pending`}
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Current Semester SGPA</span>
                  <span className="text-2xl font-bold text-[#1e2238] mt-1 block">
                    {studentData?.kpis.currentSgpa.toFixed(2) || '—'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">Derived from 4 Evaluations</span>
                </div>

                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Deficits</span>
                  <span className={`text-2xl font-bold mt-1 block ${
                    (studentData?.kpis.subjectsAtRisk ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {studentData?.kpis.subjectsAtRisk ?? 0}
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {(studentData?.kpis.subjectsAtRisk ?? 0) > 0 ? 'Remediation Required' : 'Zero Deficit Courses'}
                  </span>
                </div>
              </div>

              {/* Coursework Table */}
              <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#f87941]" />
                      <span>Semester VI Coursework Roster</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Academic evaluations, grade points, and biometric attendance records
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['All', 'Strong', 'Average', 'Needs Improvement', 'At Risk'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setStudentCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          studentCategoryFilter === cat
                            ? 'bg-[#1e2238] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f7f8fa] border-b border-[#e7eaee] text-slate-500 font-semibold uppercase text-[10px] tracking-wide">
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-3 text-center">Credits</th>
                        <th className="py-3 px-3 text-right">Marks / 100</th>
                        <th className="py-3 px-3 text-center">Grade Point</th>
                        <th className="py-3 px-4 text-center">Attendance</th>
                        <th className="py-3 px-3 text-center">Performance Status</th>
                        <th className="py-3 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((sub) => {
                          const isAtRisk = sub.resultStatus === 'Fail' || sub.marks < 40.0;
                          const isStrong = sub.marks >= 70.0;
                          const isAverage = sub.marks >= 60.0 && sub.marks < 70.0;

                          return (
                            <tr key={sub.courseCode} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{sub.courseName}</div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{sub.courseCode}</div>
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                                {sub.credits.toFixed(1)}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <span className={`font-bold font-mono text-sm ${
                                  isAtRisk ? 'text-rose-600' : 'text-slate-800'
                                }`}>
                                  {sub.marks.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="font-mono font-semibold text-slate-800">
                                  {sub.gradePoint.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <span className={`font-mono font-semibold ${
                                    sub.attendanceRate < 75.0 ? 'text-rose-600' : 'text-slate-700'
                                  }`}>
                                    {sub.attendanceRate.toFixed(1)}%
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({sub.classesAttended}/{sub.classesConducted})
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                                  isAtRisk
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isStrong
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isAverage
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {sub.performanceCategory}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  sub.resultStatus === 'Pass'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {sub.resultStatus === 'Pass' ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {sub.resultStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                            No courses match the selected category filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // ===========================================================================
  // RENDER: FACULTY / ADMIN / ANALYST VIEW — INSTITUTIONAL CURRICULUM CATALOG
  // ===========================================================================
  return (
    <AppShell activeItem="courses">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Academic</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Courses</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Curriculum &amp; Course Performance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Conformed curriculum catalog with live evaluation statistics from FactAcademicPerformance and FactAttendance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 shadow-2xs">
              <BookOpen className="h-3.5 w-3.5 text-[#f87941]" />
              <span>{courses.length} Conformed Courses</span>
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search course code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[#e7eaee] text-xs focus:outline-hidden focus:border-[#f87941]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
            <span className="font-medium text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="CE">Computer Engineering (CE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="EXTC">Electronics (EXTC)</option>
              <option value="MECH">Mechanical (MECH)</option>
              <option value="CIVIL">Civil (CIVIL)</option>
            </select>

            <span className="font-medium text-slate-500 ml-2">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Semesters</option>
              <option value="Semester I">Semester I</option>
              <option value="Semester II">Semester II</option>
              <option value="Semester III">Semester III</option>
              <option value="Semester IV">Semester IV</option>
              <option value="Semester V">Semester V</option>
              <option value="Semester VI">Semester VI</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isCatalogLoading && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-12 text-center shadow-2xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f87941] border-t-transparent" />
              <span className="text-xs font-medium text-slate-500">
                Querying curriculum evaluations from warehouse...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isCatalogLoading && catalogError && (
          <div className="bg-white rounded-lg border border-rose-200 p-8 text-center bg-rose-50/40 shadow-2xs">
            <div className="inline-flex flex-col items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              <p className="font-semibold text-sm">{catalogError}</p>
              <button
                type="button"
                onClick={loadCourses}
                className="mt-2 px-3 py-1.5 bg-white border border-rose-300 rounded-md text-rose-700 font-semibold hover:bg-rose-100/50 cursor-pointer transition-colors"
              >
                Retry Query
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isCatalogLoading && !catalogError && courses.length === 0 && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-10 text-center shadow-2xs">
            <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching courses found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your department filter, semester selection, or search query.</p>
          </div>
        )}

        {/* Courses Table */}
        {!isCatalogLoading && !catalogError && courses.length > 0 && (
          <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Course Name</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4 text-center">Semester</th>
                    <th className="py-2.5 px-4 text-center">Credits</th>
                    <th className="py-2.5 px-4 text-right">Evaluations</th>
                    <th className="py-2.5 px-4 text-right">Pass Rate</th>
                    <th className="py-2.5 px-4 text-right">Mean GPA</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                      <td className="py-3 px-4 font-semibold text-[#1e2238]">{c.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {c.departmentCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{formatSemester(c.semester)}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{c.credits}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{(c.evaluatedCount ?? c.enrolledStudents ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{(c.passRate || 0).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{(c.averageGpa || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/courses/${c.code.toLowerCase()}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f87941] hover:underline"
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
