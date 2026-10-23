'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { useAuth } from '../../../lib/auth';
import {
  fetchFacultyAttendance,
  FacultyAttendanceData,
} from '../../../lib/api';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  BarChart2,
  Users,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Target,
} from 'lucide-react';

export default function FacultyAttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [attData, setAttData] = useState<FacultyAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester VI');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Computer Engineering');

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
    fetchFacultyAttendance(selectedDepartment, selectedSemester)
      .then((data) => {
        setAttData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load attendance analysis:', err);
        setError(err.message || 'Failed to retrieve attendance analytics.');
        setIsLoading(false);
      });
  }, [user, authLoading, router, selectedDepartment, selectedSemester]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchFacultyAttendance(selectedDepartment, selectedSemester)
      .then((data) => {
        setAttData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to refresh data.');
        setIsLoading(false);
      });
  };

  return (
    <AppShell activeItem="attendance-analysis">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/faculty" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Faculty Dashboard</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">Attendance &amp; Engagement Analysis</span>
        </div>

        {/* Header Banner */}
        <div className="bg-[#1e2238] rounded-xl text-white p-6 border border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/30 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Biometric Engagement Audit</span>
              </span>
              <span className="text-xs text-slate-400">Department of {attData?.summary.department || selectedDepartment}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-[#f87941]" />
              <span>Cohort Attendance &amp; Performance Correlation</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Real biometric attendance aggregations, statutory threshold monitoring (&lt;75%), and empirical correlation with cumulative grade point averages.
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
              title="Refresh Attendance Analytics"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
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
            <h3 className="text-base font-bold text-rose-900">Failed to Load Attendance Analysis</h3>
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
        {!isLoading && !error && attData && (
          <>
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Cohort Average Attendance</span>
                  <Clock className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {attData.summary.averageAttendance}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Evaluated across {attData.summary.totalStudents.toLocaleString()} students
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Below 75% Statutory Limit</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {attData.summary.deficitCount} <span className="text-xs font-semibold text-amber-700">({attData.summary.deficitPercentage}%)</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Mandated for regularization notice
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Critical Deficit (&lt;65%)</span>
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-600">
                  {attData.summary.criticalCount} <span className="text-xs font-normal text-slate-500">Students</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Exam debarment risk tier
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Observed Pearson Correlation</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  r = {attData.summary.correlationCoefficient}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Strong positive observed relationship
                </div>
              </div>
            </div>

            {/* Attendance Tiers & Empirical Performance Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-[#f87941]" />
                    <span>Attendance Tiers vs. Mean Academic Performance</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Conformed attendance groupings and corresponding average semester GPAs
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  FactAttendance × FactStudentRiskStatus
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {attData.attendanceTiers.map((tier) => {
                  const isHigh = tier.tier.includes('≥90%');
                  const isLow = tier.tier.includes('<75%');
                  return (
                    <div
                      key={tier.tier}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isHigh
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isLow
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{tier.tier}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {tier.status}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {tier.averageGpa.toFixed(2)} <span className="text-xs font-normal text-slate-500">GPA</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {tier.studentCount.toLocaleString()} Students Enrolled
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance vs Performance Scatter Visualization */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#f87941]" />
                    <span>Attendance Rate vs. GPA Scatter Sample</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Representative student sample showing distribution across biometric attendance (x-axis) and GPA (y-axis)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    <span>Regular Standing</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    <span>Flagged At-Risk</span>
                  </span>
                </div>
              </div>

              {/* Scatter Plot SVG */}
              <div className="h-56 w-full relative bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[30, 75, 120, 165].map((y, idx) => (
                    <line key={idx} x1="30" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  ))}
                  {/* 75% Cutoff Vertical Line */}
                  <line x1="240" y1="10" x2="240" y2="165" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="245" y="25" className="text-[10px] fill-rose-600 font-bold">75% Statutory Attendance Threshold</text>

                  {/* Scatter Sample Points */}
                  {attData.scatterSample.map((pt) => {
                    // Map attendance 50% - 100% to x 30 - 580
                    const x = Math.max(30, Math.min(580, ((pt.attendance - 50) / 50) * 550 + 30));
                    // Map GPA 0.0 - 10.0 to y 165 - 15
                    const y = Math.max(15, Math.min(165, 165 - (pt.gpa / 10.0) * 150));
                    return (
                      <circle
                        key={pt.studentId}
                        cx={x}
                        cy={y}
                        r={pt.isAtRisk ? 4.5 : 3.5}
                        fill={pt.isAtRisk ? '#f43f5e' : '#3b82f6'}
                        opacity="0.85"
                      >
                        <title>{`${pt.studentName} (${pt.studentId}): ${pt.attendance}% Attendance, ${pt.gpa} GPA`}</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                *Observed empirical relationship. Regular lecture and lab attendance correlates strongly with higher GPA and lower backlog incidence.
              </p>
            </div>

            {/* Attendance Deficit Students Roster (<75%) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>Attendance Deficit Roster (&lt;75% Attendance)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Students subject to attendance counseling and academic monitoring in {selectedSemester}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {attData.deficitStudents.length} Students Flagged
                </span>
              </div>

              {attData.deficitStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No students in {selectedDepartment} fall below the 75% attendance threshold for {selectedSemester}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-3 py-3 text-center">Semester</th>
                        <th className="px-3 py-3 text-center">Attendance %</th>
                        <th className="px-3 py-3 text-center">Current GPA</th>
                        <th className="px-3 py-3 text-center">Risk Level</th>
                        <th className="px-4 py-3">Primary Factor</th>
                        <th className="px-3 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {attData.deficitStudents.map((stu) => (
                        <tr key={stu.studentId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {stu.studentId}
                          </td>
                          <td className="px-4 py-3 text-slate-800">
                            {stu.studentName}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600">
                            {stu.semester}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="font-bold text-rose-600">
                              {stu.attendance}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-800">
                            {stu.gpa.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              {stu.riskLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[11px]">
                            {stu.primaryFactor}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Link
                              href={`/faculty/student/${stu.studentId}`}
                              className="text-[11px] font-semibold text-[#f87941] hover:underline"
                            >
                              Inspect →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Action Navigation Links */}
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
                  href="/at-risk"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>View All At-Risk Students</span>
                </Link>
                <Link
                  href="/faculty/performance"
                  className="px-4 py-2 bg-[#f87941] hover:bg-[#e06530] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Inspect Class Performance</span>
                </Link>
              </div>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
