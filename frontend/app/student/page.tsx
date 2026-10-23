'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { fetchStudentDashboard } from '../../lib/api';
import {
  StudentDashboardData,
  StudentSubject,
  StudentSemesterTrendPoint,
} from '../../types/academic';
import {
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Target,
  RefreshCw,
  BarChart2,
  Users,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchStudentDashboard()
      .then((data) => {
        setDashboardData(data);
        if (data.semesterTrend && data.semesterTrend.length > 0) {
          setActivePointIndex(data.semesterTrend.length - 1);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load student dashboard:', err);
        setError(err.message || 'Failed to load academic records from warehouse.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      loadData();
    }
  }, [user, authLoading, router]);

  // Loading Skeleton State
  if (authLoading || isLoading) {
    return (
      <AppShell activeItem="student-dashboard">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          <div className="h-24 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-4" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
            <div className="h-72 bg-white rounded-lg border border-[#e7eaee] animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Error State
  if (error || !dashboardData) {
    return (
      <AppShell activeItem="student-dashboard">
        <div className="p-6 max-w-3xl mx-auto mt-8">
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-2xs">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Academic Analytics Unavailable</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {error || 'Unable to connect to conformed data warehouse. Please verify your connection or try again.'}
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#f87941] hover:bg-[#e06530] rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Query</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const {
    profile,
    kpis,
    semesterTrend,
    trendInsight,
    subjects,
    strongestSubject,
    weakestSubject,
    attendance,
    classComparison,
    academicRisk,
    suggestions,
    goalImprovement,
  } = dashboardData;

  // Filtered subjects based on category selection
  const filteredSubjects = subjects.filter((s) => {
    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'At Risk') return s.performanceCategory.includes('At Risk');
    return s.performanceCategory === categoryFilter;
  });

  // SVG Chart Geometry
  const chartWidth = 560;
  const chartHeight = 175;
  const chartPadding = { top: 16, right: 24, bottom: 26, left: 36 };
  const innerW = chartWidth - chartPadding.left - chartPadding.right;
  const innerH = chartHeight - chartPadding.top - chartPadding.bottom;
  const minGpa = 4.0;
  const maxGpa = 10.0;

  const getPointX = (index: number) => {
    if (semesterTrend.length <= 1) return chartPadding.left + innerW / 2;
    return chartPadding.left + (index / (semesterTrend.length - 1)) * innerW;
  };

  const getPointY = (val: number) => {
    const clamped = Math.min(Math.max(val, minGpa), maxGpa);
    const ratio = (clamped - minGpa) / (maxGpa - minGpa);
    return chartPadding.top + innerH - ratio * innerH;
  };

  const pointsPath = semesterTrend
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getPointX(idx)} ${getPointY(pt.sgpa)}`)
    .join(' ');

  const activeTrendPoint =
    activePointIndex !== null && semesterTrend[activePointIndex]
      ? semesterTrend[activePointIndex]
      : semesterTrend[semesterTrend.length - 1];

  return (
    <AppShell activeItem="student-dashboard">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* ==================================================================== */}
        {/* SECTION A — PERSONAL HEADER                                          */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#fff4ed] text-[#f87941] font-bold text-lg border border-[#fcd5bf] shadow-2xs">
                {profile.studentName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2238]">
                    Good Morning, {profile.studentName}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    kpis.isAtRisk
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {kpis.isAtRisk ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {profile.academicStanding}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Student ID: <strong className="font-mono text-slate-700">{profile.studentId}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Department: <strong className="text-slate-700">{profile.departmentName} ({profile.departmentCode})</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Cohort: <strong className="text-slate-700">{profile.semester} · Section {profile.section}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Badge Meta */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400 block">Warehouse Grain</span>
                <span className="text-xs font-semibold text-slate-700">Live Conformed Facts</span>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#f7f8fa] hover:bg-slate-100 border border-[#e7eaee] rounded-md transition-colors cursor-pointer"
                title="Refresh personal warehouse records"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION B — KEY PERFORMANCE INDICATORS                                */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Cumulative CGPA */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Cumulative CGPA</span>
              <Award className="h-3.5 w-3.5 text-[#f87941]" />
            </div>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              kpis.cgpa < 6.0 ? 'text-rose-600' : 'text-[#1e2238]'
            }`}>
              {kpis.cgpa.toFixed(2)}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              Scale 10.0 • All Semesters
            </p>
          </div>

          {/* 2. Current Semester SGPA */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Semester VI SGPA</span>
              <BarChart2 className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              kpis.currentSgpa < 6.0 ? 'text-rose-600' : 'text-[#1e2238]'
            }`}>
              {kpis.currentSgpa.toFixed(2)}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              Active Cycle SGPA
            </p>
          </div>

          {/* 3. Overall Attendance */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Attendance</span>
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              kpis.attendancePercentage < 75.0 ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {kpis.attendancePercentage.toFixed(1)}%
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              {kpis.attendancePercentage >= 75.0 ? 'Compliant (≥75%)' : 'Deficit (<75% cutoff)'}
            </p>
          </div>

          {/* 4. Credits Earned */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Credits Earned</span>
              <BookOpen className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2238]">
              {kpis.creditsEarned.toFixed(0)} <span className="text-xs text-slate-400 font-normal">/ {kpis.creditsAttempted.toFixed(0)}</span>
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              Degree Progress
            </p>
          </div>

          {/* 5. Subjects at Risk */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Backlogs / Deficits</span>
              <AlertTriangle className={`h-3.5 w-3.5 ${kpis.subjectsAtRisk > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              kpis.subjectsAtRisk > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {kpis.subjectsAtRisk}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              {kpis.subjectsAtRisk > 0 ? 'Remediation Needed' : 'Zero Backlogs'}
            </p>
          </div>

          {/* 6. Academic Standing */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase text-[10px] tracking-wide text-slate-400">Risk Tier</span>
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className={`text-sm sm:text-base font-bold tracking-tight truncate mt-1 ${
              kpis.isAtRisk ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {kpis.riskLevel !== 'None' ? `${kpis.riskLevel} Risk` : 'Good Standing'}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 truncate">
              Official Classification
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION C & G — SEMESTER PERFORMANCE TREND & CLASS BENCHMARK         */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Section C: Semester Performance Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#f87941]" />
                    <span>Semester Performance Trend</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Longitudinal SGPA trajectory across Semester I to Semester VI
                  </p>
                </div>

                {activeTrendPoint && (
                  <div className="inline-flex items-center gap-2 bg-[#f7f8fa] border border-[#e7eaee] px-2.5 py-1 rounded text-xs">
                    <span className="font-semibold text-slate-700">{activeTrendPoint.semester}:</span>
                    <span className="font-bold text-[#f87941]">{activeTrendPoint.sgpa.toFixed(2)} SGPA</span>
                    <span className="text-slate-400">({activeTrendPoint.avgMarks.toFixed(1)} avg marks)</span>
                  </div>
                )}
              </div>

              {/* Native Crisp SVG Line Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 select-none"
                >
                  {/* Grid Lines */}
                  {[4.0, 6.0, 8.0, 10.0].map((val) => (
                    <g key={val}>
                      <line
                        x1={chartPadding.left}
                        y1={getPointY(val)}
                        x2={chartWidth - chartPadding.right}
                        y2={getPointY(val)}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x={chartPadding.left - 6}
                        y={getPointY(val) + 3}
                        fontSize="10"
                        textAnchor="end"
                        fill="#94a3b8"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  ))}

                  {/* Benchmark Cutoff Line (6.00 GPA cutoff) */}
                  <line
                    x1={chartPadding.left}
                    y1={getPointY(6.0)}
                    x2={chartWidth - chartPadding.right}
                    y2={getPointY(6.0)}
                    stroke="#fca5a5"
                    strokeDasharray="4 3"
                    strokeWidth="1.2"
                  />
                  <text
                    x={chartWidth - chartPadding.right}
                    y={getPointY(6.0) - 4}
                    fontSize="9"
                    textAnchor="end"
                    fill="#e11d48"
                    fontWeight="600"
                  >
                    6.00 Academic Threshold
                  </text>

                  {/* Line Connection */}
                  <path
                    d={pointsPath}
                    fill="none"
                    stroke="#f87941"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {semesterTrend.map((pt, idx) => {
                    const cx = getPointX(idx);
                    const cy = getPointY(pt.sgpa);
                    const isSelected = activePointIndex === idx;
                    const isCurrent = pt.isCurrent;

                    return (
                      <g
                        key={pt.semester}
                        className="cursor-pointer"
                        onMouseEnter={() => setActivePointIndex(idx)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 6 : 4}
                          fill={isCurrent ? '#f87941' : '#ffffff'}
                          stroke="#f87941"
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        {/* Semester Label */}
                        <text
                          x={cx}
                          y={chartHeight - 6}
                          fontSize="9.5"
                          textAnchor="middle"
                          fill={isSelected ? '#1e2238' : '#64748b'}
                          fontWeight={isSelected || isCurrent ? 'bold' : 'normal'}
                        >
                          {pt.semester.replace('Semester ', 'Sem ')}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Mathematically Justified Trend Insight */}
            <div className={`mt-4 rounded-md p-3 text-xs border flex items-start gap-2.5 ${
              trendInsight.direction === 'improved'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : trendInsight.direction === 'declined'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <div className="shrink-0 mt-0.5">
                {trendInsight.direction === 'improved' ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : trendInsight.direction === 'declined' ? (
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold">Trend Analysis: </span>
                <span>{trendInsight.summary}</span>
              </div>
            </div>
          </div>

          {/* Section G: Class/Batch Anonymous Benchmark Comparison */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Class Benchmark Comparison</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Privacy-safe anonymous cohort benchmark ({classComparison.departmentName})
                </p>
              </div>

              {/* SGPA Comparison */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">My SGPA vs Class Mean</span>
                    <span className={`font-bold font-mono ${
                      classComparison.gpaDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {classComparison.gpaDelta >= 0 ? `+${classComparison.gpaDelta.toFixed(2)}` : classComparison.gpaDelta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-[11px] text-slate-500">You ({kpis.currentSgpa.toFixed(2)})</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#f87941] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (kpis.currentSgpa / 10.0) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-[11px] text-slate-500">Class ({classComparison.classAvgGpa.toFixed(2)})</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (classComparison.classAvgGpa / 10.0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Attendance Comparison */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">My Attendance vs Class Mean</span>
                    <span className={`font-bold font-mono ${
                      classComparison.attendanceDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {classComparison.attendanceDelta >= 0 ? `+${classComparison.attendanceDelta.toFixed(1)}%` : `${classComparison.attendanceDelta.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-[11px] text-slate-500">You ({kpis.attendancePercentage.toFixed(1)}%)</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          kpis.attendancePercentage < 75.0 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, kpis.attendancePercentage)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-[11px] text-slate-500">Class ({classComparison.classAvgAttendance.toFixed(1)}%)</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-slate-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, classComparison.classAvgAttendance)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy notice disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Aggregate cohort statistics derived without exposing peer identities.</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION E & J — STRONGEST / WEAKEST SUBJECTS & GOAL IMPROVEMENT      */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Strongest Subject */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="uppercase tracking-wider">Strongest Performance Area</span>
              </div>
              {strongestSubject ? (
                <>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {strongestSubject.courseName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{strongestSubject.courseCode}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                      <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Score</span>
                      <span className="text-lg font-bold text-emerald-800">{strongestSubject.marks.toFixed(1)} / 100</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Grade Point</span>
                      <span className="text-lg font-bold text-slate-800">{strongestSubject.gradePoint.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {strongestSubject.explanation}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No completed evaluation records found.</p>
              )}
            </div>
          </div>

          {/* Weakest / Focus Subject */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="uppercase tracking-wider">Area Requiring Attention</span>
              </div>
              {weakestSubject ? (
                <>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {weakestSubject.courseName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{weakestSubject.courseCode}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
                      <span className="text-[10px] text-rose-700 block uppercase font-semibold">Score</span>
                      <span className="text-lg font-bold text-rose-800">{weakestSubject.marks.toFixed(1)} / 100</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Grade Point</span>
                      <span className="text-lg font-bold text-slate-800">{weakestSubject.gradePoint.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {weakestSubject.explanation}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No deficit subjects recorded.</p>
              )}
            </div>
          </div>

          {/* Section J: Goal / Improvement View */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-2">
                <Target className="h-4 w-4" />
                <span className="uppercase tracking-wider">Goal & Improvement Target</span>
              </div>
              {goalImprovement ? (
                <>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {goalImprovement.focusSubject}
                  </h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Current Evaluation:</span>
                      <span className="font-bold text-slate-800">{goalImprovement.currentMarks.toFixed(1)} marks</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Target Standard:</span>
                      <span className="font-bold text-indigo-700">{goalImprovement.targetMarks.toFixed(1)} marks</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Score Delta Needed:</span>
                      <span className="font-bold text-rose-600 font-mono">+{goalImprovement.difference.toFixed(1)} marks</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3.5 bg-indigo-50/60 border border-indigo-100 p-2.5 rounded leading-relaxed">
                    {goalImprovement.recommendedAction}
                  </p>
                </>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">All Coursework Meets Benchmark</p>
                  <p className="text-xs text-slate-500">
                    No active score deficits recorded in Semester VI.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION D — SUBJECT-WISE PERFORMANCE                                 */}
        {/* ==================================================================== */}
        <div id="subjects-section" className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#f87941]" />
                <span>Subject-Wise Performance · {profile.semester}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official marks, grade points, and biometric attendance records from Star Schema fact tables
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'Strong', 'Average', 'Needs Improvement', 'At Risk'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#1e2238] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
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

        {/* ==================================================================== */}
        {/* SECTION F & H — ATTENDANCE ANALYSIS & ACADEMIC RISK                  */}
        {/* ==================================================================== */}
        <div id="attendance-risk-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Section F: Attendance Analysis */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
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
                  attendance.isBelowThreshold
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {attendance.isBelowThreshold ? 'Attendance Warning' : 'Good Attendance'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Cumulative Attendance Rate</span>
                  <span className="font-mono font-bold text-slate-800">{attendance.overallRate.toFixed(1)}%</span>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      attendance.isBelowThreshold ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, attendance.overallRate)}%` }}
                  />
                  {/* 75% threshold marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                    style={{ left: '75%' }}
                    title="75% Mandatory Cutoff"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0%</span>
                  <span className="font-semibold text-slate-600">75% Mandatory Cutoff</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Subject Breakdown list */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Subject-Level Biometric Rates
                </span>
                <div className="space-y-1.5">
                  {subjects.map((sub) => (
                    <div key={sub.courseCode} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-700 truncate max-w-[240px]">{sub.courseName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-semibold ${
                          sub.attendanceRate < 75.0 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {sub.attendanceRate.toFixed(1)}%
                        </span>
                        {sub.attendanceRate < 75.0 && (
                          <span className="text-[9px] bg-rose-50 text-rose-700 px-1 rounded font-bold">Deficit</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Non-Causal Academic Relationship Insight */}
            <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2.5 rounded leading-relaxed">
              <span className="font-semibold text-slate-800">Analytical Observation: </span>
              <span>{attendance.summary}</span>
            </div>
          </div>

          {/* Section H: Academic Risk Status */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${academicRisk.isAtRisk ? 'text-rose-600' : 'text-slate-500'}`} />
                    <span>My Academic Risk Status</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supervised Decision Tree & FactStudentRiskStatus classification
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                  academicRisk.isAtRisk
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {academicRisk.isAtRisk ? `At-Risk (${academicRisk.riskLevel})` : 'Good Standing'}
                </span>
              </div>

              {/* Primary Risk Factor */}
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Primary Identified Factor</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {academicRisk.primaryRiskFactor}
                  </p>
                  {academicRisk.flaggedSubject && academicRisk.flaggedSubject !== 'None' && (
                    <p className="text-xs text-rose-700 mt-1 font-medium">
                      Flagged Coursework: {academicRisk.flaggedSubject}
                    </p>
                  )}
                </div>

                {/* Risk Indicators */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide mb-1.5">
                    Analytical Indicators
                  </span>
                  <ul className="space-y-2">
                    {academicRisk.indicators.map((ind, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f87941] shrink-0 mt-1.5" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-5 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Risk indicators represent conformed data warehouse metrics designed to assist personal academic planning and tutorial advisement.</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION I — PERSONALIZED SUGGESTIONS / RECOMMENDED ACTIONS          */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 sm:p-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#f87941]" />
              <span>Personalized Academic Recommendations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted action items generated strictly from your semester evaluation & attendance records
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      </div>
    </AppShell>
  );
}
