'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { fetchDepartments } from '../../lib/api';
import { DepartmentPerformanceData } from '../../types/academic';
import { Building2, Users, Award, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchDepartments()
      .then((data) => {
        setDepartments(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load departments:', err);
        setError(err.message || 'Failed to load department metrics from warehouse.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEnrolled = departments.reduce((sum, d) => sum + (d.totalStudents || 0), 0);

  return (
    <AppShell activeItem="departments">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Academic</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Departments</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Department Academic Performance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Conformed rollups across all engineering departments from FactAcademicPerformance and FactAttendance
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#e7eaee] text-slate-600 font-medium shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-[#f87941]" />
              <span>{departments.length} Conformed Departments</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#e7eaee] text-slate-600 font-medium shadow-2xs">
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span>{totalEnrolled.toLocaleString()} Total Students</span>
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-12 text-center shadow-2xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f87941] border-t-transparent" />
              <span className="text-xs font-medium text-slate-500">
                Aggregating conformed department rollups from warehouse...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-lg border border-rose-200 p-8 text-center bg-rose-50/40 shadow-2xs">
            <div className="inline-flex flex-col items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              <p className="font-semibold text-sm">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 px-3 py-1.5 bg-white border border-rose-300 rounded-md text-rose-700 font-semibold hover:bg-rose-100/50 cursor-pointer transition-colors"
              >
                Retry Query
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && departments.length === 0 && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-10 text-center shadow-2xs">
            <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No department records found</p>
            <p className="text-xs text-slate-400 mt-1">Check that data warehouse ETL has completed successfully.</p>
          </div>
        )}

        {/* Content View */}
        {!isLoading && !error && departments.length > 0 && (
          <>
            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.code}
                  className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs hover:border-[#f87941]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4ed] text-[#f87941] font-bold text-xs border border-[#fcd5bf]">
                          {dept.code}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1e2238] leading-snug">
                            {dept.name}
                          </h3>
                          <p className="text-[11px] text-slate-500">{dept.totalStudents.toLocaleString()} Enrolled Students</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="p-2 rounded bg-[#fafbfd] border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium">Avg GPA</p>
                        <p className="text-sm font-bold text-[#1e2238] mt-0.5">{dept.averageGpa.toFixed(2)}</p>
                      </div>
                      <div className="p-2 rounded bg-[#fafbfd] border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium">Pass Rate</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{dept.passRate.toFixed(1)}%</p>
                      </div>
                      <div className="p-2 rounded bg-[#fafbfd] border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium">At-Risk</p>
                        <p className="text-sm font-bold text-rose-600 mt-0.5">{dept.atRiskStudents}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Attendance Rate:</span>
                      <span className="font-semibold text-slate-700">{dept.attendanceRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href={`/departments/${dept.code.toLowerCase()}`}
                      className="flex items-center justify-between text-xs font-semibold text-[#f87941] hover:text-[#e0632d] transition-colors"
                    >
                      <span>View Department Detail</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Department Rollup Table */}
            <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#e7eaee] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Department Performance Summary
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  OLAP Rollup: DimDepartment &times; FactAcademicPerformance
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Department Name</th>
                      <th className="py-2.5 px-4 text-right">Students</th>
                      <th className="py-2.5 px-4 text-right">Mean GPA</th>
                      <th className="py-2.5 px-4 text-right">Pass Rate</th>
                      <th className="py-2.5 px-4 text-right">Attendance</th>
                      <th className="py-2.5 px-4 text-right">At-Risk</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((d) => (
                      <tr key={d.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.code}</td>
                        <td className="py-3 px-4 font-semibold text-[#1e2238]">{d.name}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">{d.totalStudents.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{d.averageGpa.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{d.passRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">{d.attendanceRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {d.atRiskStudents}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/departments/${d.code.toLowerCase()}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f87941] hover:underline"
                          >
                            Detail &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
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
