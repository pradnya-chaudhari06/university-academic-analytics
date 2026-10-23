'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import { fetchDepartmentByCode, fetchCourses, fetchTrends } from '../../../lib/api';
import { DepartmentPerformanceData, CourseItem, SemesterTrendPoint } from '../../../types/academic';
import { Building2, ArrowLeft, Users, Award, BookOpen, AlertTriangle } from 'lucide-react';

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = (params?.departmentId as string || '').toUpperCase();

  const [department, setDepartment] = useState<DepartmentPerformanceData | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trends, setTrends] = useState<SemesterTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentId) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchDepartmentByCode(departmentId),
      fetchCourses({ department: departmentId }),
      fetchTrends(departmentId),
    ])
      .then(([dept, courseList, trendList]) => {
        setDepartment(dept);
        setCourses(courseList);
        setTrends(trendList);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load department details:', err);
        setError(err.message || 'Department data could not be retrieved from the warehouse.');
        setIsLoading(false);
      });
  }, [departmentId]);

  const formatSemester = (sem: string) => {
    if (!sem) return '';
    if (sem.startsWith('Semester')) return sem.replace('Semester', 'Sem');
    if (sem.startsWith('Sem')) return sem;
    return `Sem ${sem}`;
  };

  return (
    <AppShell activeItem="departments">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/departments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#e7eaee] px-2.5 py-1.5 rounded-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Departments</span>
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-bold text-slate-800">{departmentId} Department</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-12 text-center shadow-2xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f87941] border-t-transparent" />
              <span className="text-xs font-medium text-slate-500">
                Loading conformed facts for {departmentId} Department...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && !department && (
          <div className="bg-white rounded-lg border border-rose-200 p-8 text-center bg-rose-50/40 shadow-2xs">
            <div className="inline-flex flex-col items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              <p className="font-semibold text-sm">{error}</p>
              <Link
                href="/departments"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#f87941] hover:underline"
              >
                &larr; Return to Departments
              </Link>
            </div>
          </div>
        )}

        {/* Content View */}
        {!isLoading && department && (
          <>
            {/* Header Banner */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4ed] text-[#f87941] font-bold text-base border border-[#fcd5bf]">
                    {department.code}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                      {department.name}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Conformed Star Schema Slice: Department Key &middot; {department.totalStudents.toLocaleString()} Enrolled Students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Department GPA</p>
                    <p className="text-xl font-bold text-[#1e2238]">{department.averageGpa.toFixed(2)}</p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Pass Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{department.passRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">At-Risk Count</p>
                    <p className="text-xl font-bold text-rose-600">{department.atRiskStudents}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Courses Drill-down */}
            <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#e7eaee] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1e2238]">
                    Department Curriculum Catalog
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Courses offered by {department.name} with live fact-table evaluations
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  {courses.length} Courses
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Course Name</th>
                      <th className="py-2.5 px-4 text-center">Semester</th>
                      <th className="py-2.5 px-4 text-center">Credits</th>
                      <th className="py-2.5 px-4 text-right">Evaluations</th>
                      <th className="py-2.5 px-4 text-right">Pass Rate</th>
                      <th className="py-2.5 px-4 text-right">Mean GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                        <td className="py-3 px-4 font-semibold text-[#1e2238]">{c.name}</td>
                        <td className="py-3 px-4 text-center text-slate-600">{formatSemester(c.semester)}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{c.credits}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{(c.evaluatedCount ?? c.enrolledStudents ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{(c.passRate || 0).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{(c.averageGpa || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Not Found State */}
        {!isLoading && !department && !error && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-10 text-center">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Department Not Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Could not find a conformed department matching code &quot;{departmentId}&quot;.
            </p>
            <Link
              href="/departments"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#f87941] hover:underline"
            >
              &larr; Return to Departments
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
