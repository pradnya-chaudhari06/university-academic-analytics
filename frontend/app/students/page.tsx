'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { fetchStudents } from '../../lib/api';
import { StudentDirectoryItem } from '../../types/academic';
import { Users, Search, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch paginated students from conformed star schema warehouse
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchStudents({
      page,
      limit: 50,
      search: debouncedSearch,
      department: selectedDept,
      risk: selectedRisk,
    })
      .then((data) => {
        if (isMounted) {
          setStudents(data.students);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load students directory:', err);
          setError(err.message || 'Failed to load students from warehouse.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, debouncedSearch, selectedDept, selectedRisk]);

  const handleDeptChange = (val: string) => {
    setSelectedDept(val);
    setPage(1);
  };

  const handleRiskChange = (val: string) => {
    setSelectedRisk(val);
    setPage(1);
  };

  return (
    <AppShell activeItem="students">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Academic</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Students Directory</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Student Academic Directory & Performance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Conformed student records from DimStudent, FactAcademicPerformance, and FactStudentRiskStatus
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 shadow-2xs">
              <Users className="h-3.5 w-3.5 text-[#f87941]" />
              <span>{total.toLocaleString()} Enrolled Students</span>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student ID or full name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[#e7eaee] text-xs focus:outline-hidden focus:border-[#f87941]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
            <span className="font-medium text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="CE">Computer Engineering (CE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="EXTC">Electronics (EXTC)</option>
              <option value="MECH">Mechanical (MECH)</option>
              <option value="CIVIL">Civil (CIVIL)</option>
            </select>

            <span className="font-medium text-slate-500 ml-2">Risk Status:</span>
            <select
              value={selectedRisk}
              onChange={(e) => handleRiskChange(e.target.value)}
              className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Cohort</option>
              <option value="RISK">Flagged At-Risk (Failed &ge; 1)</option>
              <option value="WARNING">GPA &lt; 6.00</option>
              <option value="GOOD">In Good Standing</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                <tr>
                  <th className="py-2.5 px-4">Student ID</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 text-right">Current GPA</th>
                  <th className="py-2.5 px-4 text-right">Attendance</th>
                  <th className="py-2.5 px-4 text-center">Risk Status</th>
                  <th className="py-2.5 px-4 text-center">Failed Courses</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f87941] border-t-transparent" />
                        <span className="text-xs font-medium text-slate-500">Querying conformed student facts from warehouse...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <div className="inline-flex flex-col items-center gap-2 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                        <p className="font-semibold">{error}</p>
                        <button
                          onClick={() => setPage(1)}
                          className="px-3 py-1 bg-white border border-rose-300 rounded text-rose-700 font-semibold hover:bg-rose-100/50 cursor-pointer"
                        >
                          Retry Query
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1 text-xs">
                        <Users className="h-6 w-6 text-slate-300" />
                        <p className="font-medium text-slate-600">No student records found</p>
                        <p className="text-slate-400">Try adjusting your search criteria or resetting filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.studentId}</td>
                      <td className="py-3 px-4 font-semibold text-[#1e2238]">{s.studentName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{s.currentGpa.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{s.attendanceRate.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">
                        {s.isAtRisk || (s.failedCoursesCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-2.5 w-2.5" /> At-Risk
                          </span>
                        ) : s.currentGpa < 6.0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-2.5 w-2.5" /> Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-2.5 w-2.5" /> In Good Standing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {s.failedCoursesCount}
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {!isLoading && !error && total > 0 && (
            <div className="border-t border-[#e7eaee] px-4 py-3 bg-[#fafbfd] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(page - 1) * 50 + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">{Math.min(page * 50, total)}</span> of{' '}
                <span className="font-semibold text-slate-900">{total.toLocaleString()}</span> students
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="px-2.5 py-1 text-xs font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
