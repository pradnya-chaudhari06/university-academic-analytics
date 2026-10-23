'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import { fetchStudentDashboard } from '../../../lib/api';
import { StudentDashboardData } from '../../../types/academic';
import {
  Users,
  ArrowLeft,
  Award,
  Clock,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  ShieldAlert,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';

export default function StudentDetailPage() {
  const params = useParams();
  const rawId = (params?.studentId as string || '').toUpperCase();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Strict Authorization Check: Students are strictly restricted to their own record
    if (user.role === 'Student') {
      const ownId = (user.studentId || 'STU1178').toUpperCase();
      if (rawId !== ownId) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }
      // If student accessed their own ID via this route, redirect cleanly to /student
      router.replace('/student');
      return;
    }

    // Faculty, HOD, and Administrators may review the target student's dashboard
    setIsLoading(true);
    setError(null);
    fetchStudentDashboard(rawId)
      .then((data) => {
        setDashboardData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student record:', err);
        setError(err.message || 'Failed to retrieve student performance record.');
        setIsLoading(false);
      });
  }, [user, authLoading, rawId, router]);

  // Forbidden State for Student Attempting Unauthorized Record Access
  if (isForbidden) {
    return (
      <AppShell activeItem="student-dashboard">
        <div className="p-6 max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">403 Forbidden — Access Denied</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Institutional privacy policy strictly prohibits student accounts from accessing other students&apos; academic records, grades, attendance, or risk profiles.
            </p>
            <div className="pt-2">
              <Link
                href="/student"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#f87941] hover:bg-[#e06530] rounded-md transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Return to My Academic Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Loading State
  if (authLoading || isLoading) {
    return (
      <AppShell activeItem="students">
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
          <div className="h-24 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
        </div>
      </AppShell>
    );
  }

  // Error State for Faculty/Admin View
  if (error || !dashboardData) {
    return (
      <AppShell activeItem="students">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Link
              href="/students"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#e7eaee] px-2.5 py-1.5 rounded-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Students Directory</span>
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Student Record Not Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { profile, kpis, subjects, academicRisk, suggestions } = dashboardData;

  return (
    <AppShell activeItem="students">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/students"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#e7eaee] px-2.5 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Students Directory</span>
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-bold text-slate-800">{rawId}</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold">
            <span>Faculty / Admin Inspection View</span>
          </span>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#fff4ed] text-[#f87941] font-bold text-lg border border-[#fcd5bf]">
                {profile.studentName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                    {profile.studentName}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    kpis.isAtRisk
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {kpis.isAtRisk ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                    {profile.academicStanding}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Student ID: <strong className="font-mono text-slate-700">{profile.studentId}</strong> &middot; Department: <strong className="text-slate-700">{profile.departmentName} ({profile.departmentCode})</strong> &middot; Cohort: <strong className="text-slate-700">{profile.semester} · Section {profile.section}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">CGPA</p>
                <p className={`text-xl font-bold ${kpis.cgpa < 6.0 ? 'text-rose-600' : 'text-[#1e2238]'}`}>
                  {kpis.cgpa.toFixed(2)}
                </p>
              </div>
              <div className="text-right border-l border-slate-200 pl-3">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Attendance</p>
                <p className={`text-xl font-bold ${kpis.attendancePercentage < 75.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {kpis.attendancePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-[#e7eaee] p-4">
            <p className="text-xs text-slate-500 font-medium">Risk Status</p>
            <div className="mt-2 flex items-center gap-1.5">
              {kpis.isAtRisk ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5" /> Flagged At-Risk ({academicRisk.riskLevel})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Good Standing
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e7eaee] p-4">
            <p className="text-xs text-slate-500 font-medium">Failed Backlogs</p>
            <p className={`text-xl font-bold mt-1 font-mono ${kpis.subjectsAtRisk > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {kpis.subjectsAtRisk}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#e7eaee] p-4">
            <p className="text-xs text-slate-500 font-medium">Primary Factor</p>
            <p className="text-xs font-semibold text-rose-700 mt-2 bg-rose-50 border border-rose-100 rounded px-2 py-1 truncate">
              {academicRisk.primaryRiskFactor || 'None'}
            </p>
          </div>
        </div>

        {/* Coursework Table */}
        <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#f87941]" />
              <span>Semester VI Coursework & Attendance</span>
            </h2>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#e7eaee] text-slate-500 font-semibold uppercase text-[10px] tracking-wide">
                <th className="py-2.5 px-4">Course</th>
                <th className="py-2.5 px-3 text-center">Credits</th>
                <th className="py-2.5 px-3 text-right">Marks / 100</th>
                <th className="py-2.5 px-3 text-center">Grade Point</th>
                <th className="py-2.5 px-3 text-center">Attendance</th>
                <th className="py-2.5 px-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.courseCode} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{sub.courseName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sub.courseCode}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{sub.credits.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{sub.marks.toFixed(1)}</td>
                  <td className="py-3 px-3 text-center font-mono">{sub.gradePoint.toFixed(1)}</td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className={sub.attendanceRate < 75.0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {sub.attendanceRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      sub.resultStatus === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {sub.resultStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Personalized Recommendations */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#f87941]" />
              <span>Recommended Tutorial Actions</span>
            </h3>
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <div key={i} className="text-xs p-3 rounded bg-slate-50 border border-slate-200">
                  <strong className="text-slate-800">{sug.title}: </strong>
                  <span className="text-slate-600">{sug.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
