'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import {
  fetchFacultyDashboard,
  fetchStudents,
  FacultyDashboardData,
  StudentDirectoryItem,
} from '../../lib/api';
import {
  Users,
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
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
  Search,
  Filter,
  Brain,
  FileText,
  Activity,
  UserCheck,
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<FacultyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester VI');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Computer Engineering');

  // Student Table State
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [isStudentsLoading, setIsStudentsLoading] = useState<boolean>(false);

  // Active trend hover
  const [activeTrendIndex, setActiveTrendIndex] = useState<number | null>(null);

  const loadDashboard = () => {
    setIsLoading(true);
    setError(null);
    fetchFacultyDashboard(selectedDepartment, selectedSemester)
      .then((data) => {
        setDashboardData(data);
        if (data.performanceTrend && data.performanceTrend.length > 0) {
          setActiveTrendIndex(data.performanceTrend.length - 1);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load faculty dashboard:', err);
        setError(err.message || 'Failed to load faculty academic analytics from warehouse.');
        setIsLoading(false);
      });
  };

  const loadStudentTable = (page: number, search: string, risk: string) => {
    setIsStudentsLoading(true);
    fetchStudents({
      department: selectedDepartment,
      semester: selectedSemester,
      page,
      limit: 8,
      search: search.trim() || undefined,
      risk: risk !== 'ALL' ? risk : undefined,
    })
      .then((res) => {
        setStudents(res.students);
        setTotalStudentsCount(res.total);
        setTotalPages(res.totalPages);
        setIsStudentsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load students roster:', err);
        setIsStudentsLoading(false);
      });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      if (user.role === 'Student') {
        router.replace('/student');
        return;
      }
      loadDashboard();
      loadStudentTable(currentPage, searchQuery, riskFilter);
    }
  }, [user, authLoading, router, selectedDepartment, selectedSemester]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadStudentTable(1, searchQuery, riskFilter);
  };

  const handleRiskFilterChange = (val: string) => {
    setRiskFilter(val);
    setCurrentPage(1);
    loadStudentTable(1, searchQuery, val);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadStudentTable(newPage, searchQuery, riskFilter);
    }
  };

  // Loading Skeleton State
  if (authLoading || isLoading) {
    return (
      <AppShell activeItem="faculty-dashboard">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          <div className="h-28 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
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
      <AppShell activeItem="faculty-dashboard">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Faculty Analytics Unavailable</h1>
            <p className="text-sm text-slate-600">{error || 'Unable to connect to warehouse engine.'}</p>
            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1e2438] hover:bg-[#2c334d] rounded-md transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Warehouse Query</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { kpis, performanceTrend, gradeDistribution, courses, correlation, atRiskStudents, topPerformers, insights } = dashboardData;
  const activeTrendPoint = activeTrendIndex !== null && performanceTrend[activeTrendIndex]
    ? performanceTrend[activeTrendIndex]
    : performanceTrend[performanceTrend.length - 1];

  return (
    <AppShell activeItem="faculty-dashboard">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* ========================================================================= */}
        {/* HERO BANNER: Faculty Identity, Department Context, Controls */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-[#e7eaee] bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1e2438] text-white font-bold text-base shadow-2xs">
                {user?.avatarInitials || 'FA'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1e2238]">
                    Faculty Academic Analytics
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    Teaching Cockpit
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {user?.name || 'Prof. Rajesh Sharma'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Department: <strong className="text-slate-800">{kpis.departmentName}</strong> · Cohort: <strong className="text-slate-800">{kpis.activeSemester}</strong> (AY 2025–26) · Star Schema Facts
                </p>
              </div>
            </div>

            {/* Department & Semester Filter Pills */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="flex items-center rounded-md border border-[#e7eaee] bg-[#f8f9fa] px-2.5 py-1 text-xs">
                <span className="text-[11px] text-slate-400 mr-2 font-medium">Dept:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="Computer Engineering">Computer Engineering (CE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics & Telecommunication">Electronics (EXTC)</option>
                  <option value="Mechanical Engineering">Mechanical (MECH)</option>
                  <option value="Civil Engineering">Civil (CIVIL)</option>
                </select>
              </div>

              <div className="flex items-center rounded-md border border-[#e7eaee] bg-[#f8f9fa] px-2.5 py-1 text-xs">
                <span className="text-[11px] text-slate-400 mr-2 font-medium">Cycle:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="Semester VI">Semester VI (Active)</option>
                  <option value="Semester V">Semester V</option>
                  <option value="Semester IV">Semester IV</option>
                </select>
              </div>

              <button
                type="button"
                onClick={loadDashboard}
                title="Refresh Analytics"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e7eaee] bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: KPI CARDS (Live Conformed Facts) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Total Students */}
          <div className="rounded-lg border border-[#e7eaee] bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Students</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1e2238]">
              {kpis.totalStudents.toLocaleString()}
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Active enrolled teaching cohort
            </p>
          </div>

          {/* Card 2: Class Average GPA */}
          <div className="rounded-lg border border-[#e7eaee] bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Class Average GPA</span>
              <Award className="h-4 w-4 text-[#f87941]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1e2238]">
              {kpis.classAverageGpa.toFixed(2)}
            </div>
            <p className="text-[10.5px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              Scale 10.0 · Benchmark 7.50
            </p>
          </div>

          {/* Card 3: Pass Percentage */}
          <div className="rounded-lg border border-[#e7eaee] bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pass Percentage</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1e2238]">
              {kpis.passPercentage.toFixed(1)}%
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Evaluated course evaluations
            </p>
          </div>

          {/* Card 4: Average Attendance */}
          <div className="rounded-lg border border-[#e7eaee] bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Attendance</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1e2238]">
              {kpis.averageAttendance.toFixed(1)}%
            </div>
            <p className="text-[10.5px] text-emerald-600 mt-1 font-medium">
              Above 75.0% threshold
            </p>
          </div>

          {/* Card 5: At-Risk Students */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 shadow-2xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">At-Risk Students</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-900">
              {kpis.atRiskStudentsCount}
            </div>
            <p className="text-[10.5px] text-amber-700 mt-1 font-medium">
              Requires academic intervention
            </p>
          </div>

          {/* Card 6: Top Performers */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 shadow-2xs hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between text-indigo-800 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Distinction Tier</span>
              <GraduationCap className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-indigo-900">
              {kpis.topPerformersCount}
            </div>
            <p className="text-[10.5px] text-indigo-700 mt-1 font-medium">
              GPA ≥ 8.50 · Dean&apos;s List
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 9: ACTIONABLE CLASS INSIGHTS (Priority Banner) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#fff4ed] text-[#f87941] border border-[#fcd5bf]">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1e2238]">Data-Backed Class Insights</h2>
                <p className="text-[11px] text-slate-500">
                  Automated pedagogical observations derived from conformed warehouse facts
                </p>
              </div>
            </div>
            <Link
              href="/faculty/insights"
              className="text-xs font-semibold text-[#f87941] hover:text-[#e06530] flex items-center gap-1 transition-colors"
            >
              <span>Explore Advanced Mining</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-colors ${
                  ins.type === 'warning'
                    ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                    : ins.type === 'alert'
                    ? 'border-rose-200 bg-rose-50/40 text-rose-900'
                    : 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {ins.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                    {ins.type === 'alert' && <Clock className="h-3.5 w-3.5 text-rose-600" />}
                    {ins.type === 'positive' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    {ins.title}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-current">
                    {ins.metric}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ins.explanation}
                </p>
                <div className="pt-1 text-[10.5px] font-medium text-slate-800 flex items-start gap-1">
                  <span className="font-bold text-[#f87941]">Action:</span>
                  <span>{ins.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 & SECTION 3: PERFORMANCE TREND & GRADE DISTRIBUTION */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 2: Class Performance Trend (2 Cols) */}
          <div className="lg:col-span-2 rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#f87941]" />
                  <h2 className="text-sm font-bold text-[#1e2238]">Class Performance Trend</h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {activeTrendPoint ? `${activeTrendPoint.semester}: ${activeTrendPoint.averageGpa.toFixed(2)} GPA (${activeTrendPoint.passPercentage}% Pass)` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Academic performance progression across available semesters (Sem I – Sem VI)
              </p>

              {/* Trend SVG Visualizer */}
              <div className="h-48 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 45, 90, 135].map((y, idx) => (
                    <line
                      key={idx}
                      x1="0"
                      y1={y}
                      x2="600"
                      y2={y}
                      stroke="#f1f3f5"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Benchmark 7.50 line */}
                  <line
                    x1="0"
                    y1="60"
                    x2="600"
                    y2="60"
                    stroke="#fcd5bf"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text x="590" y="55" textAnchor="end" className="text-[9px] fill-[#f87941] font-mono font-bold">
                    Benchmark 7.50
                  </text>

                  {/* Polyline Trajectory */}
                  {performanceTrend.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f87941"
                      strokeWidth="2.5"
                      points={performanceTrend
                        .map((pt, idx) => {
                          const x = (idx / (performanceTrend.length - 1)) * 560 + 20;
                          // Scale GPA from 6.00 to 9.00 -> 160 to 20
                          const y = 160 - ((pt.averageGpa - 6.0) / 3.0) * 140;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Data Points */}
                  {performanceTrend.map((pt, idx) => {
                    const x = (idx / (performanceTrend.length - 1)) * 560 + 20;
                    const y = 160 - ((pt.averageGpa - 6.0) / 3.0) * 140;
                    const isSelected = activeTrendIndex === idx;

                    return (
                      <g key={pt.semester} className="cursor-pointer" onClick={() => setActiveTrendIndex(idx)}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 6 : 4}
                          fill={isSelected ? '#f87941' : '#ffffff'}
                          stroke="#f87941"
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all"
                        />
                        <text
                          x={x}
                          y="178"
                          textAnchor="middle"
                          className={`text-[10px] font-mono ${
                            isSelected ? 'fill-[#1e2238] font-bold' : 'fill-slate-400'
                          }`}
                        >
                          {pt.semester.replace('Semester ', 'Sem ')}
                        </text>
                        {isSelected && (
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            className="text-[10.5px] fill-[#1e2238] font-mono font-bold"
                          >
                            {pt.averageGpa.toFixed(2)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bottom Longitudinal Insight */}
            <div className="mt-4 pt-3 border-t border-[#f1f3f5] flex items-center justify-between text-xs text-slate-500">
              <span>
                Trajectory Momentum: <strong className="text-slate-800">
                  {performanceTrend.length >= 2 && performanceTrend[performanceTrend.length - 1].averageGpa >= performanceTrend[performanceTrend.length - 2].averageGpa ? 'Positive' : 'Consistent'}
                </strong>
              </span>
              <span className="font-mono text-[11px] text-slate-600">
                Active Grain: DimTime × DimDepartment
              </span>
            </div>
          </div>

          {/* Section 3: Grade Distribution (1 Col) */}
          <div className="rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#f87941]" />
                  <h2 className="text-sm font-bold text-[#1e2238]">Grade Distribution</h2>
                </div>
                <span className="text-[10.5px] font-mono text-slate-400">DimGradeBand</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Semester VI cohort evaluated across conformed grade bands
              </p>

              <div className="space-y-2.5">
                {gradeDistribution.map((gb) => (
                  <div key={gb.grade} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 font-mono w-6">{gb.grade}</span>
                        <span className="text-[10.5px] text-slate-500">({gb.gradeCategory})</span>
                      </div>
                      <div className="font-mono text-xs text-slate-700">
                        <strong className="text-slate-900">{gb.studentCount}</strong> ({gb.percentage}%)
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          gb.grade === 'O' || gb.grade === 'A+'
                            ? 'bg-indigo-600'
                            : gb.grade === 'A' || gb.grade === 'B+'
                            ? 'bg-emerald-500'
                            : gb.grade === 'B' || gb.grade === 'C'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, gb.percentage * 2.2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f3f5] text-[11px] text-slate-400">
              *Evaluations derived directly from FactAcademicPerformance
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: ATTENDANCE VS PERFORMANCE (Correlation Analysis) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#f87941]" />
                <h2 className="text-sm font-bold text-[#1e2238]">Attendance vs. Academic Performance</h2>
              </div>
              <p className="text-xs text-slate-500">
                Observed relationship between biometric attendance and semester grade point average
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-md bg-[#fff5ee] border border-[#fcd5bf] px-3 py-1 text-xs">
              <span className="text-slate-600 font-medium">Pearson Correlation:</span>
              <strong className="text-[#f87941] font-mono text-sm">r = {correlation.coefficient}</strong>
              <span className="text-[10px] text-slate-400">(Positive Association)</span>
            </div>
          </div>

          {/* Attendance Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {correlation.attendanceBands.map((band) => (
              <div
                key={band.tier}
                className="p-3 rounded-lg border border-[#e7eaee] bg-[#fafbfd] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{band.tier}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      band.status === 'Critical Intervention'
                        ? 'bg-rose-100 text-rose-700'
                        : band.status === 'Honors'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {band.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-slate-500 text-[11px]">Average GPA:</span>
                  <span className="text-base font-bold text-[#1e2238] font-mono">{band.averageGpa.toFixed(2)}</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                  <span>Enrolled:</span>
                  <span className="font-mono text-slate-700">{band.studentCount} students</span>
                </div>
              </div>
            ))}
          </div>

          {/* Scatter Plot Visualizer */}
          <div className="rounded-lg border border-[#f1f3f5] bg-[#fcfdfe] p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
              <span>Scatter Sample (50 Representative Students)</span>
              <span>Y: Current GPA (0.0 – 10.0) | X: Attendance (60% – 100%)</span>
            </div>
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
                {/* 75% cutoff vertical line */}
                <line x1="225" y1="0" x2="225" y2="150" stroke="#fca5a5" strokeWidth="1" strokeDasharray="3 3" />
                <text x="228" y="14" className="text-[9px] fill-rose-600 font-mono font-bold">
                  75% Attendance Cutoff
                </text>

                {/* 6.00 GPA cutoff horizontal line */}
                <line x1="0" y1="64" x2="600" y2="64" stroke="#fcd34d" strokeWidth="1" strokeDasharray="3 3" />
                <text x="590" y="60" textAnchor="end" className="text-[9px] fill-amber-700 font-mono font-bold">
                  6.00 GPA Monitoring Cutoff
                </text>

                {/* Scatter Dots */}
                {correlation.scatterSample.map((pt) => {
                  // Map Attendance 60% - 100% to x 20 - 580
                  const x = Math.max(10, Math.min(590, ((pt.attendance - 60) / 40) * 560 + 20));
                  // Map GPA 0.0 - 10.0 to y 150 - 10
                  const y = Math.max(10, Math.min(150, 150 - (pt.gpa / 10.0) * 140));

                  return (
                    <circle
                      key={pt.studentId}
                      cx={x}
                      cy={y}
                      r={pt.isAtRisk ? 4.5 : 3.5}
                      fill={pt.isAtRisk ? '#e11d48' : '#3b82f6'}
                      stroke={pt.isAtRisk ? '#881337' : '#1d4ed8'}
                      strokeWidth="1"
                      opacity="0.8"
                    >
                      <title>{`${pt.studentName} (${pt.studentId}): ${pt.attendance}% Attendance, ${pt.gpa} GPA`}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-2 text-center">
              *Observed relationship indicating correlation. Attendance regularity correlates positively with examination performance.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: SUBJECT / COURSE PERFORMANCE TABLE */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#f87941]" />
                <h2 className="text-sm font-bold text-[#1e2238]">Course Performance</h2>
              </div>
              <p className="text-xs text-slate-500">
                Department curriculum evaluation statistics for {kpis.activeSemester}
              </p>
            </div>

            <Link
              href="/courses"
              className="text-xs font-semibold text-[#f87941] hover:text-[#e06530] flex items-center gap-1 transition-colors"
            >
              <span>Full Curriculum View</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7eaee] bg-[#f8f9fa] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Name</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3 text-right">Students</th>
                  <th className="py-2.5 px-3 text-right">Mean GPA</th>
                  <th className="py-2.5 px-3 text-right">Pass Rate</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {courses.map((c) => (
                  <tr key={c.courseCode} className="hover:bg-[#fafbfd] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1e2238]">{c.courseCode}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{c.courseName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{c.credits}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{c.enrolledCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{c.averageGpa.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={`font-semibold ${c.passRate >= 94 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {c.passRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{c.attendanceRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.performanceStatus === 'Optimal'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.performanceStatus === 'Satisfactory'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.performanceStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Link
                        href={`/courses/${c.courseCode}`}
                        className="text-[11px] font-semibold text-[#f87941] hover:underline"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7 & SECTION 8: AT-RISK STUDENTS & TOP PERFORMERS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 7: At-Risk Students Intervention Roster */}
          <div className="rounded-lg border border-amber-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">At-Risk Students Requiring Intervention</h2>
              </div>
              <Link
                href="/at-risk"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Full Roster</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Flagged in FactStudentRiskStatus with actionable pedagogical recommendations
            </p>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 space-y-2">
              {atRiskStudents.map((stu) => (
                <div key={stu.studentId} className="pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/faculty/student/${stu.studentId}`}
                      className="font-bold text-[#1e2238] hover:text-[#f87941] transition-colors"
                    >
                      {stu.studentName} <span className="font-mono text-slate-400 font-normal">({stu.studentId})</span>
                    </Link>
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                        stu.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {stu.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                    <span>GPA: <strong className="text-slate-900">{stu.gpa.toFixed(2)}</strong></span>
                    <span>Attendance: <strong className="text-slate-900">{stu.attendanceRate.toFixed(1)}%</strong></span>
                    <span>Backlogs: <strong className="text-rose-600">{stu.failedCoursesCount}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">Factor: </span>{stu.primaryRiskFactor} ({stu.flaggedSubject})
                  </div>

                  <div className="text-[10.5px] text-slate-700 bg-amber-50/60 border border-amber-100 p-1.5 rounded">
                    <strong className="text-amber-800 font-semibold">Faculty Action:</strong> {stu.recommendedIntervention}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Top Performers Recognition Roster */}
          <div className="rounded-lg border border-indigo-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Top Performing Students</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                Distinction Tier
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Exemplary academic achievement suitable for research electives & peer mentoring
            </p>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 space-y-2">
              {topPerformers.map((stu) => (
                <div key={stu.studentId} className="pt-2 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Link
                      href={`/faculty/student/${stu.studentId}`}
                      className="font-bold text-[#1e2238] hover:text-indigo-600 transition-colors"
                    >
                      {stu.studentName}
                    </Link>
                    <span className="block font-mono text-[10.5px] text-slate-400">
                      ID: {stu.studentId} · {stu.standing}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="font-mono text-sm font-bold text-indigo-700">
                      {stu.gpa.toFixed(2)} GPA
                    </div>
                    <div className="text-[10.5px] font-mono text-emerald-600">
                      {stu.attendanceRate.toFixed(1)}% Attn
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: STUDENT PERFORMANCE TABLE (Interactive Search & Filter) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-[#e7eaee] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#f87941]" />
                <h2 className="text-sm font-bold text-[#1e2238]">Student Teaching Roster</h2>
              </div>
              <p className="text-xs text-slate-500">
                Total {totalStudentsCount.toLocaleString()} enrolled students in {kpis.departmentName}
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or ID..."
                  className="rounded-md border border-[#e7eaee] bg-[#f8f9fa] py-1 pl-8 pr-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#f87941] focus:bg-white w-48 transition-colors"
                />
              </form>

              <select
                value={riskFilter}
                onChange={(e) => handleRiskFilterChange(e.target.value)}
                className="rounded-md border border-[#e7eaee] bg-[#f8f9fa] py-1 px-2.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Risk Statuses</option>
                <option value="RISK">At-Risk Only</option>
                <option value="GOOD">Good Standing</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7eaee] bg-[#f8f9fa] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3 text-right">GPA</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Risk Standing</th>
                  <th className="py-2.5 px-3 text-center">Performance Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {isStudentsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Loading students from conformed star schema...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No students found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((stu) => {
                    const gpaVal = stu.currentGpa ?? stu.gpa ?? 0;
                    const perfTier =
                      gpaVal >= 8.5
                        ? 'Excellent'
                        : gpaVal >= 7.0
                        ? 'Good'
                        : gpaVal >= 6.0
                        ? 'Average'
                        : 'Needs Attention';

                    return (
                      <tr key={stu.studentId} className="hover:bg-[#fafbfd] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{stu.studentName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{stu.studentId}</td>
                        <td className="py-2.5 px-3 text-slate-600">{stu.department}</td>
                        <td className="py-2.5 px-3 text-slate-600">{stu.semester}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {gpaVal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={stu.attendanceRate < 75 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {stu.attendanceRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              stu.isAtRisk
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {stu.isAtRisk ? 'At-Risk' : 'Good Standing'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                              perfTier === 'Excellent'
                                ? 'bg-indigo-50 text-indigo-700'
                                : perfTier === 'Good'
                                ? 'bg-emerald-50 text-emerald-700'
                                : perfTier === 'Average'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {perfTier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Link
                            href={`/faculty/student/${stu.studentId}`}
                            className="text-[11px] font-semibold text-[#f87941] hover:underline"
                          >
                            View Record →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 pt-3 border-t border-[#f1f3f5] flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalStudentsCount} records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded border border-[#e7eaee] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded border border-[#e7eaee] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
