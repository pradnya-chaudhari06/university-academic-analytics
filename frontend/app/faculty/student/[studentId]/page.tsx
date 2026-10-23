'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../../../components/layout/AppShell';
import { useAuth } from '../../../../lib/auth';
import {
  fetchFacultyStudentDetail,
  FacultyStudentDetailData,
} from '../../../../lib/api';
import {
  Users,
  ArrowLeft,
  Award,
  Clock,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  RefreshCw,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function FacultyStudentDetailPage() {
  const params = useParams();
  const rawId = (params?.studentId as string || '').toUpperCase();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [detailData, setDetailData] = useState<FacultyStudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    // Role Guard: Only Faculty and Administrators may view faculty-scoped student profiles
    if (user.role === 'Student') {
      router.replace('/student');
      return;
    }

    if (!rawId) return;

    setIsLoading(true);
    setError(null);
    fetchFacultyStudentDetail(rawId)
      .then((data) => {
        setDetailData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student academic record:', err);
        setError(err.message || 'Failed to retrieve student performance record.');
        setIsLoading(false);
      });
  }, [user, authLoading, rawId, router]);

  const handleRefresh = () => {
    if (!rawId) return;
    setIsLoading(true);
    fetchFacultyStudentDetail(rawId)
      .then((data) => {
        setDetailData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to refresh student record.');
        setIsLoading(false);
      });
  };

  const student = detailData?.student;

  return (
    <AppShell activeItem="faculty-students">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/faculty" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Faculty Dashboard</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link href="/students" className="hover:text-slate-900 transition-colors">
            Students Roster
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">Student Academic Profile ({rawId})</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse p-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Student Record Not Found</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <Link
                href="/faculty"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                Return to Faculty Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Loaded Profile Content */}
        {!isLoading && !error && student && detailData && (
          <>
            {/* Header Identity Banner */}
            <div className="bg-[#1e2238] rounded-xl text-white p-6 border border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                  {student.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f87941] text-white">
                      {student.studentId}
                    </span>
                    <span className="text-xs text-slate-400">
                      {student.departmentName} ({student.departmentCode})
                    </span>
                    <span className="text-xs text-slate-400">· {student.semester}</span>
                  </div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{student.studentName}</span>
                    {student.isAtRisk ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Academic Risk Flag</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Good Academic Standing</span>
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-300">
                    Faculty Academic Inspection Profile · Section {student.section} · Enrollment Status: {student.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  title="Refresh Record"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <Link
                  href="/students"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Back to Roster
                </Link>
              </div>
            </div>

            {/* Academic KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Current Cumulative GPA</span>
                  <Award className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {student.gpa.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 10.0</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {student.gpa >= 8.5 ? "Dean's Honors Tier" : student.gpa >= 7.0 ? "First Class Tier" : "Pass Division"}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Biometric Attendance</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className={`text-2xl font-bold ${student.attendance < 75.0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {student.attendance.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {student.attendance >= 75.0 ? "Statutory requirement met" : "Deficit: <75% statutory threshold"}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Risk Status Level</span>
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                </div>
                <div className={`text-2xl font-bold ${student.isAtRisk ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {student.riskLevel}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {student.primaryRiskFactor}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Evaluated Courses</span>
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {detailData.currentCourses.length} <span className="text-xs font-normal text-slate-500">Subjects</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Active in {student.semester}
                </div>
              </div>
            </div>

            {/* Recommended Faculty Pedagogical Intervention */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
              <Target className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Recommended Faculty Academic Action
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {student.recommendedIntervention}
                </p>
              </div>
            </div>

            {/* Course-by-Course Evaluation Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#f87941]" />
                  <span>Current Semester Course Breakdown ({student.semester})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Course examination marks, conformed grade band, and lecture/lab biometric attendance
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Course Code</th>
                      <th className="px-4 py-3">Course Name</th>
                      <th className="px-3 py-3 text-center">Credits</th>
                      <th className="px-3 py-3 text-center">Marks</th>
                      <th className="px-3 py-3 text-center">Grade Point</th>
                      <th className="px-3 py-3 text-center">Grade Band</th>
                      <th className="px-3 py-3 text-center">Attendance</th>
                      <th className="px-4 py-3 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {detailData.currentCourses.map((c) => (
                      <tr key={c.courseCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {c.courseCode}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {c.courseName}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">
                          {c.credits}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">
                          {c.marks.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-800">
                          {c.gradePoint.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            c.gradeBand === 'O' || c.gradeBand === 'A+'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.gradeBand === 'F'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.gradeBand}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs font-semibold ${
                            c.attendance < 75.0 ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {c.attendance.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({c.classesAttended}/{c.classesConducted})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.resultStatus === 'Pass'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.resultStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Longitudinal Semester Performance Trend */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#f87941]" />
                  <span>Longitudinal Academic Progression</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Semester GPA and biometric attendance history across completed terms
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                {detailData.semesterTrend.map((st) => (
                  <div key={st.semester} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1">
                    <div className="text-[11px] font-bold text-slate-600">{st.semester}</div>
                    <div className="text-lg font-bold text-slate-900">{st.gpa.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">{st.attendance.toFixed(1)}% Att.</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/students"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Student Roster</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/at-risk"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>At-Risk Student Monitoring</span>
                </Link>
                <Link
                  href="/faculty"
                  className="px-4 py-2 bg-[#f87941] hover:bg-[#e06530] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Faculty Dashboard</span>
                </Link>
              </div>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
