'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { fetchAtRiskStudents, fetchMyAttendanceRisk, StudentAttendanceRiskData } from '../../lib/api';
import { AtRiskStudent } from '../../types/academic';
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  RefreshCw,
  BookOpen,
  XCircle,
} from 'lucide-react';

export default function AtRiskPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isStudent = user?.role === 'Student';

  // ---------------------------------------------------------------------------
  // Faculty & Administrator Institutional Roster State
  // ---------------------------------------------------------------------------
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isRosterLoading, setIsRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Authenticated Student Personal Attendance & Risk State
  // ---------------------------------------------------------------------------
  const [studentData, setStudentData] = useState<StudentAttendanceRiskData | null>(null);
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Load Institutional Roster (Faculty / Admin / Analyst ONLY)
  const loadInstitutionalRoster = () => {
    setIsRosterLoading(true);
    setRosterError(null);
    fetchAtRiskStudents()
      .then((data) => {
        setStudents(data);
        setIsRosterLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load at-risk students:', err);
        setRosterError(err.message || 'Failed to load at-risk roster.');
        setIsRosterLoading(false);
      });
  };

  // Load Personal Risk & Attendance Docket (Authenticated Student ONLY)
  const loadStudentRiskDocket = () => {
    setIsStudentLoading(true);
    setStudentError(null);
    fetchMyAttendanceRisk()
      .then((data) => {
        setStudentData(data);
        setIsStudentLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student risk docket:', err);
        setStudentError(err.message || 'Unable to load attendance & risk data');
        setIsStudentLoading(false);
      });
  };

  useEffect(() => {
    // CRITICAL: Never trigger institutional roster or personal risk until authentication is resolved
    if (authLoading || !user) return;

    if (isStudent) {
      loadStudentRiskDocket();
    } else {
      loadInstitutionalRoster();
    }
  }, [authLoading, user, isStudent]);

  // Loading skeleton while resolving session role
  if (authLoading) {
    return (
      <AppShell activeItem="at-risk">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          <div className="h-7 w-64 bg-slate-200/70 rounded animate-pulse" />
          <div className="h-20 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  // ===========================================================================
  // RENDER: STUDENT VIEW — PERSONAL ATTENDANCE & RISK DOCKET
  // ===========================================================================
  if (isStudent) {
    const courses = studentData?.courses || [];
    const deficitCourses = studentData?.deficit_courses || [];
    const suggestions = studentData?.suggestions || [];
    const indicators = studentData?.indicators || [];

    return (
      <AppShell activeItem="at-risk">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <span>Academic</span>
                <span>/</span>
                <span className="text-slate-800 font-medium">Personal Attendance &amp; Risk Docket</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                Attendance Compliance &amp; Academic Risk Docket
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official biometric attendance logs and supervised risk classification from conformed fact tables
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold shadow-2xs ${
                studentData?.is_at_risk
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {studentData?.is_at_risk ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>{studentData?.risk_level || 'Good Standing'}</span>
              </span>
              <button
                type="button"
                onClick={loadStudentRiskDocket}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e7eaee] bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh attendance & risk records"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isStudentLoading ? 'animate-spin text-[#f87941]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Student Identity Card */}
          {studentData && (
            <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff4ed] text-[#f87941] font-bold text-sm border border-[#fcd5bf]">
                  {studentData.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{studentData.student_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {studentData.student_id} · {studentData.department} ({studentData.department_code})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  {studentData.semester} · Section {studentData.section}
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  {studentData.cohort}
                </span>
                <span className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                  studentData.is_at_risk
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {studentData.academic_standing}
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
              <h2 className="text-base font-bold text-slate-900">Unable to load attendance &amp; risk data</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{studentError}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loadStudentRiskDocket}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
                <div className="h-72 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* 1. Attendance Rate */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className={`text-2xl font-bold mt-1 block ${
                    (studentData?.attendance_percentage ?? 0) < (studentData?.attendance_cutoff ?? 75.0)
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}>
                    {studentData?.attendance_percentage.toFixed(1) || '—'}%
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {(studentData?.attendance_percentage ?? 0) < (studentData?.attendance_cutoff ?? 75.0)
                      ? `Below ${studentData?.attendance_cutoff.toFixed(1)}% Mandatory Cutoff`
                      : `Above ${studentData?.attendance_cutoff.toFixed(1)}% Cutoff`}
                  </span>
                </div>

                {/* 2. Active Deficits */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Deficits</span>
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                  <span className={`text-2xl font-bold mt-1 block ${
                    (studentData?.active_deficits ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {studentData?.active_deficits ?? 0}
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {(studentData?.active_deficits ?? 0) > 0 ? 'Remediation Needed' : 'Zero Active Backlogs'}
                  </span>
                </div>

                {/* 3. Academic Standing */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Academic Standing</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className={`text-sm sm:text-base font-bold mt-1.5 block truncate ${
                    studentData?.is_at_risk ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {studentData?.academic_standing || 'Good Standing'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">Official Standing</span>
                </div>

                {/* 4. Risk Tier */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Risk Tier</span>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className={`text-2xl font-bold mt-1 block ${
                    studentData?.is_at_risk ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    {studentData?.risk_level || 'None'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">Supervised Classification</span>
                </div>
              </div>

              {/* Two Column Grid: Biometric Attendance & Academic Risk */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Biometric Attendance Analysis */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          <span>Biometric Attendance Analysis</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Evaluated against university mandatory 75.0% eligibility cutoff
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        studentData?.is_below_threshold
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {studentData?.is_below_threshold ? 'Attendance Warning' : 'Good Attendance'}
                      </span>
                    </div>

                    {/* Progress bar with 75% cutoff marker */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Cumulative Attendance Rate</span>
                        <span className="font-mono font-bold text-slate-800">
                          {studentData?.attendance_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            studentData?.is_below_threshold ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, studentData?.attendance_percentage || 0)}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                          style={{ left: '75%' }}
                          title="75.0% Mandatory Cutoff"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0%</span>
                        <span className="font-semibold text-slate-700">75% Mandatory Cutoff</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Subject Attendance Breakdown */}
                    <div className="mt-5 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Subject Attendance
                      </span>
                      <div className="space-y-1.5">
                        {courses.map((sub) => {
                          const isDeficit = (sub.attendance_percentage ?? 0) < 75.0;
                          const isFailed = sub.result_status === 'Fail';

                          return (
                            <div
                              key={sub.course_code}
                              className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-md border ${
                                isFailed
                                  ? 'bg-rose-50/70 border-rose-200'
                                  : isDeficit
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'bg-slate-50/50 border-slate-100'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-mono font-bold text-slate-800 text-[11px] mr-1.5">
                                  {sub.course_code}
                                </span>
                                <span className="text-slate-700 font-medium truncate">
                                  · {sub.course_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`font-mono font-bold ${isDeficit ? 'text-rose-600' : 'text-slate-700'}`}>
                                  {sub.attendance_percentage.toFixed(1)}%
                                </span>
                                {isFailed ? (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                                    <XCircle className="h-3 w-3" />
                                    Fail
                                  </span>
                                ) : isDeficit ? (
                                  <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                                    Below 75%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Pass
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Observation box */}
                  <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2.5 rounded leading-relaxed">
                    <span className="font-semibold text-slate-800">Analytical Observation: </span>
                    <span>{studentData?.summary}</span>
                  </div>
                </div>

                {/* Right Card: Academic Risk Status */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${studentData?.is_at_risk ? 'text-rose-600' : 'text-slate-500'}`} />
                          <span>My Academic Risk Status</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Supervised Decision Tree &amp; FactStudentRiskStatus classification
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        studentData?.is_at_risk
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {studentData?.is_at_risk ? studentData.risk_level : 'Good Standing'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Primary Factor */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
                          Primary Identified Factor
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {studentData?.primary_risk_factor}
                        </p>
                        {studentData?.flagged_subject && studentData.flagged_subject !== 'None' && (
                          <p className="text-xs text-rose-700 mt-1 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Flagged Deficit Course: {studentData.flagged_subject}</span>
                          </p>
                        )}
                      </div>

                      {/* Deficit Course Spotlight */}
                      {deficitCourses.length > 0 && (
                        <div className="border border-rose-200 bg-rose-50/50 p-3 rounded-md space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wide">
                              Active Deficit Coursework
                            </span>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              {deficitCourses.length} Backlog
                            </span>
                          </div>
                          {deficitCourses.map((dc) => (
                            <div key={dc.course_code} className="text-xs text-rose-950 flex items-center justify-between pt-1">
                              <div>
                                <span className="font-mono font-bold">{dc.course_code}</span> · {dc.course_name}
                              </div>
                              <span className="font-semibold text-rose-700">
                                {dc.attendance_percentage.toFixed(1)}% Attendance ({dc.result_status})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Indicators */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide mb-1.5">
                          Analytical Indicators
                        </span>
                        <ul className="space-y-2">
                          {indicators.map((ind, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f87941] shrink-0 mt-1.5" />
                              <span>{ind}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Risk indicators represent conformed data warehouse metrics designed to assist personal academic planning and tutorial advisement.</span>
                  </div>
                </div>
              </div>

              {/* Personalized Academic Recommendations */}
              <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#f87941]" />
                    <span>Personalized Academic Recommendations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Targeted action items generated strictly from your semester evaluation &amp; attendance records
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((sug, idx) => {
                    const isHigh = sug.priority === 'High';
                    const isPositive = sug.priority === 'Positive';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          isHigh
                            ? 'bg-rose-50/50 border-rose-200'
                            : isPositive
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-slate-900">{sug.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800'
                              : isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sug.priority} Priority
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed mt-1">
                          {sug.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // ===========================================================================
  // RENDER: FACULTY / ADMIN / ANALYST VIEW — INSTITUTIONAL AT-RISK ROSTER
  // ===========================================================================
  const filtered = students.filter((s) => {
    const matchSearch =
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.studentName.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <AppShell activeItem="at-risk-students">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Analytics</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">At-Risk Students</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Academic Risk &amp; Early Intervention Roster
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live warehouse classification from FactStudentRiskStatus (Semester VI)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 shadow-2xs">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>{students.length} Flagged Students</span>
            </span>
          </div>
        </div>

        {/* Academic Ground-Truth Audit Card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Audited Risk Classification Metadata
            </p>
            <p className="text-amber-800 leading-relaxed text-[11.5px]">
              The <strong>108 flagged at-risk students</strong> represent students who have exactly 1 failed course in the active semester. An additional <strong>356 students</strong> maintain a GPA below 6.00 and are tracked for preventative monitoring.
            </p>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[#e7eaee] text-xs focus:outline-hidden focus:border-[#f87941]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-md border border-[#e7eaee] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments ({students.length})</option>
              <option value="CE">Computer Engineering (22)</option>
              <option value="IT">Information Technology (18)</option>
              <option value="EXTC">Electronics (28)</option>
              <option value="MECH">Mechanical (24)</option>
              <option value="CIVIL">Civil (16)</option>
            </select>
          </div>
        </div>

        {/* At-Risk Table */}
        <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
          {rosterError ? (
            <div className="p-8 text-center bg-rose-50/30 space-y-2">
              <p className="text-sm font-semibold text-rose-700">Unable to load at-risk roster</p>
              <p className="text-xs text-slate-500">{rosterError}</p>
              <button
                type="button"
                onClick={loadInstitutionalRoster}
                className="mt-2 px-3 py-1.5 rounded bg-slate-800 text-white text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : isRosterLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading at-risk students roster...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                  <tr>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4 text-right">Current GPA</th>
                    <th className="py-2.5 px-4 text-right">Attendance</th>
                    <th className="py-2.5 px-4 text-center">Failed Courses</th>
                    <th className="py-2.5 px-4">Primary Risk Factor</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.studentId}</td>
                      <td className="py-3 px-4 font-semibold text-[#1e2238]">{s.studentName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">{s.gpa.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{s.attendanceRate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {s.failedCoursesCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {s.primaryRiskFactor || 'Academic Deficit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/students/${s.studentId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f87941] hover:underline"
                        >
                          Profile &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
