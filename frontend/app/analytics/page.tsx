'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import PerformanceTrendChart from '../../components/dashboard/PerformanceTrendChart';
import PerformanceDistribution from '../../components/dashboard/PerformanceDistribution';
import {
  fetchTrends,
  fetchDistribution,
  fetchDepartments,
  fetchCourses,
  DepartmentPerformanceData,
  SemesterTrendPoint,
  PerformanceDistributionCategory,
  CourseItem,
} from '../../lib/api';
import {
  TrendingUp,
  BarChart3,
  Building2,
  Calendar,
  BookOpen,
  Filter,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function AcademicPerformancePage() {
  const { user } = useAuth();

  // Filters
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [activeTab, setActiveTab] = useState<'trends' | 'departments' | 'courses' | 'distribution'>('trends');

  // Data states
  const [trends, setTrends] = useState<SemesterTrendPoint[]>([]);
  const [distribution, setDistribution] = useState<PerformanceDistributionCategory[]>([]);
  const [departments, setDepartments] = useState<DepartmentPerformanceData[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);

  // Load trends, distribution, departments
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchTrends(selectedDept),
      fetchDistribution(),
      fetchDepartments(),
    ])
      .then(([t, d, depts]) => {
        setTrends(t);
        setDistribution(d);
        setDepartments(depts);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load academic performance data:', err);
        setIsLoading(false);
      });
  }, [selectedDept]);

  // Load courses when course tab or department changes
  useEffect(() => {
    if (activeTab === 'courses') {
      setIsCoursesLoading(true);
      fetchCourses({
        department: selectedDept !== 'All Departments' ? selectedDept : undefined,
      })
        .then((data) => {
          setCourses(data);
          setIsCoursesLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load courses:', err);
          setIsCoursesLoading(false);
        });
    }
  }, [selectedDept, activeTab]);

  // Filtered metrics calculation
  const activeDeptObj = departments.find(
    (d) => d.name === selectedDept || d.code === selectedDept
  );

  const displayGpa = activeDeptObj
    ? activeDeptObj.averageGpa.toFixed(2)
    : (departments.length > 0
        ? (departments.reduce((sum, d) => sum + d.averageGpa, 0) / departments.length).toFixed(2)
        : '7.82');

  const displayPassRate = activeDeptObj
    ? `${activeDeptObj.passRate.toFixed(1)}%`
    : (departments.length > 0
        ? `${(departments.reduce((sum, d) => sum + d.passRate, 0) / departments.length).toFixed(1)}%`
        : '91.4%');

  const displayAttendance = activeDeptObj
    ? `${activeDeptObj.attendanceRate.toFixed(1)}%`
    : (departments.length > 0
        ? `${(departments.reduce((sum, d) => sum + d.attendanceRate, 0) / departments.length).toFixed(1)}%`
        : '87.6%');

  const displayStudents = activeDeptObj
    ? activeDeptObj.totalStudents.toLocaleString()
    : '4,820';

  const handleResetFilters = () => {
    setSelectedDept('All Departments');
    setSelectedSemester('All Semesters');
  };

  const isFiltered = selectedDept !== 'All Departments' || selectedSemester !== 'All Semesters';

  return (
    <AppShell activeItem="academic-performance" selectedDepartment={selectedDept} onDepartmentChange={setSelectedDept}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Academic Management</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Academic Performance</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Academic Performance Explorer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore longitudinal student outcomes, compare department standards, and review curriculum progression
            </p>
          </div>

          {/* Quick link for Analyst or Advanced Users */}
          <div className="flex items-center gap-2">
            <Link
              href="/analytics/olap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#f87941]" />
              <span>Advanced OLAP Cube Matrix</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* User-Friendly Filter & Exploration Controls */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department Filter (Replaces "Slice by Department") */}
              <div className="flex items-center gap-1.5 bg-[#fafbfd] border border-[#e7eaee] rounded-md px-2.5 py-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-slate-600">Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All Departments">All Departments (University-Wide)</option>
                  <option value="Computer Engineering">Computer Engineering (CE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics">Electronics &amp; Telecom (EXTC)</option>
                  <option value="Mechanical">Mechanical Engineering (MECH)</option>
                  <option value="Civil">Civil Engineering (CIVIL)</option>
                </select>
              </div>

              {/* Semester Filter (Replaces "Slice by Time") */}
              <div className="flex items-center gap-1.5 bg-[#fafbfd] border border-[#e7eaee] rounded-md px-2.5 py-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-slate-600">Evaluation Term:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All Semesters">All Semesters (6-Term Progression)</option>
                  <option value="Semester VI">Semester VI (Active Cohort)</option>
                  <option value="Semester V">Semester V</option>
                  <option value="Semester IV">Semester IV</option>
                  <option value="Semester III">Semester III</option>
                  <option value="Semester II">Semester II</option>
                  <option value="Semester I">Semester I</option>
                </select>
              </div>

              {/* Reset Action */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#f87941] bg-[#fff4ed] border border-[#fcd5bf] hover:bg-[#ffe7db] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset to Overall University Summary</span>
                </button>
              )}
            </div>

            <div className="text-right text-[11px] text-slate-500 hidden md:block">
              <span>Scope: </span>
              <strong className="text-slate-700">
                {selectedDept === 'All Departments' ? 'All 5 Engineering Departments' : selectedDept}
              </strong>
            </div>
          </div>

          {/* Scope Indicator Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div className="p-2.5 rounded-md bg-[#fafbfd] border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Average CGPA</span>
              <span className="text-lg font-bold text-[#1e2238] mt-0.5 block">{isLoading ? '...' : displayGpa}</span>
              <span className="text-[10px] text-slate-400">Scale of 10.0</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafbfd] border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Pass Percentage</span>
              <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{isLoading ? '...' : displayPassRate}</span>
              <span className="text-[10px] text-slate-400">Evaluations Cleared</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafbfd] border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Average Attendance</span>
              <span className="text-lg font-bold text-[#1e2238] mt-0.5 block">{isLoading ? '...' : displayAttendance}</span>
              <span className="text-[10px] text-slate-400">Lecture &amp; Lab Sessions</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafbfd] border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Students in Scope</span>
              <span className="text-lg font-bold text-indigo-700 mt-0.5 block">{isLoading ? '...' : displayStudents}</span>
              <span className="text-[10px] text-slate-400">Enrolled Undergraduates</span>
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e7eaee]">
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'trends'
                ? 'border-[#f87941] text-[#1e2238]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Progression Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'departments'
                ? 'border-[#f87941] text-[#1e2238]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Department Comparisons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'courses'
                ? 'border-[#f87941] text-[#1e2238]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Course Curriculum Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'distribution'
                ? 'border-[#f87941] text-[#1e2238]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Grade Distribution
          </button>
        </div>

        {/* Tab 1: Progression Trends */}
        {activeTab === 'trends' && (
          <div className="space-y-5">
            <PerformanceTrendChart data={trends} />

            {/* Department Benchmarks Summary */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Department Performance Benchmarks (Semester VI)
                </h2>
                <span className="text-[11px] text-slate-500">Click a department to focus filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                {departments.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setSelectedDept(d.name)}
                    className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                      selectedDept === d.name || selectedDept === d.code
                        ? 'bg-[#fff4ed] border-[#f87941] ring-1 ring-[#f87941]'
                        : 'bg-[#fafbfd] border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-700">{d.code}</span>
                      <span className="text-[10px] text-slate-400">{d.totalStudents} stus</span>
                    </div>
                    <p className="text-base font-bold text-[#1e2238] mt-1">{d.averageGpa.toFixed(2)} CGPA</p>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-emerald-600 font-semibold">{d.passRate.toFixed(1)}% Pass</span>
                      <span className="text-slate-500">{d.attendanceRate.toFixed(0)}% Att</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Department Comparisons Table */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e7eaee] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Cross-Departmental Academic Evaluation Table
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conformed aggregations across all 5 engineering faculties
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                5 Departments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f8fa] text-slate-500 uppercase tracking-wider font-semibold border-b border-[#e7eaee]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4 text-right">Students</th>
                    <th className="py-3 px-4 text-right">Average CGPA</th>
                    <th className="py-3 px-4 text-right">Pass Rate</th>
                    <th className="py-3 px-4 text-right">Attendance</th>
                    <th className="py-3 px-4 text-right">At-Risk Count</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7eaee] text-slate-700">
                  {departments.map((d) => (
                    <tr key={d.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.code}</td>
                      <td className="py-3 px-4 font-medium text-[#1e2238]">{d.name}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{d.totalStudents.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">{d.averageGpa.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums text-emerald-600">{d.passRate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right tabular-nums">{d.attendanceRate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#f87941]">{d.atRiskStudents}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDept(d.name);
                            setActiveTab('courses');
                          }}
                          className="text-xs font-semibold text-[#f87941] hover:underline cursor-pointer"
                        >
                          View Courses &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Course Curriculum Details (Drill-Down in Human Language) */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e7eaee] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Curriculum Course Performance ({selectedDept})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed outcomes for individual accredited courses in the curriculum catalog
                </p>
              </div>
              <div className="text-xs text-slate-500">
                <span>Showing {courses.length} courses</span>
              </div>
            </div>

            {isCoursesLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading course evaluations from warehouse...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No courses found for the selected department filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f8fa] text-slate-500 uppercase tracking-wider font-semibold border-b border-[#e7eaee]">
                    <tr>
                      <th className="py-3 px-4">Course Code</th>
                      <th className="py-3 px-4">Course Name</th>
                      <th className="py-3 px-4">Dept</th>
                      <th className="py-3 px-4 text-center">Credits</th>
                      <th className="py-3 px-4 text-center">Semester</th>
                      <th className="py-3 px-4 text-right">Avg Marks</th>
                      <th className="py-3 px-4 text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eaee] text-slate-700">
                    {courses.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                        <td className="py-3 px-4 font-medium text-[#1e2238]">{c.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{c.departmentCode || c.department}</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800">{c.credits}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-600">{c.semester}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-800">
                          {c.averageMarks ? `${c.averageMarks.toFixed(1)}/100` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-emerald-600">
                          {c.passRate ? `${c.passRate.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Grade Distribution */}
        {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <PerformanceDistribution distribution={distribution} />
            </div>
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1e2238]">
                Institutional Grading Policy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Academic evaluations are graded on a 10-point Scale conformed to DimGradeBand:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#fafbfd] border border-slate-100">
                  <span className="font-semibold text-emerald-700">O / A+ (Distinction)</span>
                  <span className="font-mono text-slate-600">GPA 9.0–10.0</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#fafbfd] border border-slate-100">
                  <span className="font-semibold text-blue-700">A / B+ (First Class)</span>
                  <span className="font-mono text-slate-600">GPA 7.5–8.9</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#fafbfd] border border-slate-100">
                  <span className="font-semibold text-slate-700">B / C (Second Class)</span>
                  <span className="font-mono text-slate-600">GPA 6.0–7.4</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#fff4ed] border border-[#fcd5bf]">
                  <span className="font-semibold text-[#f87941]">Needs Support / At-Risk</span>
                  <span className="font-mono text-[#f87941] font-bold">GPA &lt; 6.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Analyst Link */}
        <div className="p-3.5 rounded-lg border border-[#e7eaee] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              Need technical multi-dimensional cube slicing, coordinate matrices, or SQL drill queries?
            </span>
          </div>
          <Link
            href="/analytics/olap"
            className="inline-flex items-center gap-1 font-semibold text-[#f87941] hover:text-[#c2410c] hover:underline"
          >
            <span>Switch to Advanced OLAP Cube Matrix</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
