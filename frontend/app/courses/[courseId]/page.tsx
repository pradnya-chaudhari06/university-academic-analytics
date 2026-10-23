'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import { fetchCourseByCode } from '../../../lib/api';
import { CourseItem } from '../../../types/academic';
import { BookOpen, ArrowLeft, Award, Users, CheckCircle, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = (params?.courseId as string || '').toUpperCase();

  const [course, setCourse] = useState<CourseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    fetchCourseByCode(courseId)
      .then((data) => {
        setCourse(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
        setError(err.message || 'Course data could not be retrieved from the warehouse.');
        setIsLoading(false);
      });
  }, [courseId]);

  const formatSemester = (sem?: string) => {
    if (!sem) return '';
    if (sem.startsWith('Semester')) return sem;
    if (sem.startsWith('Sem')) return sem.replace('Sem', 'Semester');
    return `Semester ${sem}`;
  };

  return (
    <AppShell activeItem="courses">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#e7eaee] px-2.5 py-1.5 rounded-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Courses</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-800">{courseId}</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-12 text-center shadow-2xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f87941] border-t-transparent" />
              <span className="text-xs font-medium text-slate-500">
                Retrieving conformed course evaluations for {courseId}...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && !course && (
          <div className="bg-white rounded-lg border border-rose-200 p-8 text-center bg-rose-50/40 shadow-2xs">
            <div className="inline-flex flex-col items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              <p className="font-semibold text-sm">{error}</p>
              <Link
                href="/courses"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#f87941] hover:underline"
              >
                &larr; Return to Courses
              </Link>
            </div>
          </div>
        )}

        {/* Course Details Content */}
        {!isLoading && course && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200">
                    {course.code.slice(0, 4)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                      {course.name}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Course Code: <span className="font-mono font-semibold text-slate-700">{course.code}</span> &middot; {course.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Pass Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{(course.passRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Course GPA</p>
                    <p className="text-xl font-bold text-[#1e2238]">{(course.averageGpa || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-[#e7eaee] p-4 text-center shadow-2xs">
                <p className="text-xs text-slate-500 font-medium">Academic Credits</p>
                <p className="text-lg font-bold text-[#1e2238] mt-1 font-mono">{course.credits}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e7eaee] p-4 text-center shadow-2xs">
                <p className="text-xs text-slate-500 font-medium">Curricular Semester</p>
                <p className="text-lg font-bold text-[#1e2238] mt-1">{formatSemester(course.semester)}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e7eaee] p-4 text-center shadow-2xs">
                <p className="text-xs text-slate-500 font-medium">Total Evaluations</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{(course.evaluatedCount ?? course.enrolledStudents ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e7eaee] p-4 text-center shadow-2xs">
                <p className="text-xs text-slate-500 font-medium">Department Code</p>
                <p className="text-lg font-bold text-indigo-700 mt-1 font-mono">{course.departmentCode}</p>
              </div>
            </div>

            {/* Live Fact Breakdown Card */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#f87941]" />
                  <h2 className="text-sm font-bold text-[#1e2238]">
                    Conformed Fact Performance Breakdown
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  FactAcademicPerformance &times; FactAttendance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-800 font-medium">Passed Students</p>
                    <p className="text-xl font-bold text-emerald-700 mt-0.5">
                      {(course.passCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-500 opacity-80" />
                </div>

                <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-rose-800 font-medium">Failed / Backlogs</p>
                    <p className="text-xl font-bold text-rose-700 mt-0.5">
                      {(course.failCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <XCircle className="h-6 w-6 text-rose-500 opacity-80" />
                </div>

                <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-800 font-medium">Attendance Rate</p>
                    <p className="text-xl font-bold text-indigo-700 mt-0.5">
                      {(course.attendanceRate ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-indigo-500 opacity-80" />
                </div>
              </div>

              {course.averageMarks !== undefined && course.averageMarks > 0 && (
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-md border border-slate-100">
                  <span>Cohort Mean Marks (out of 100):</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{course.averageMarks.toFixed(1)} / 100.0</span>
                </div>
              )}
            </div>

            {/* Star Schema Lineage Card */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-[#1e2238] mb-2">
                Conformed Star Schema Lineage
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This course is registered in dimension table <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">DimCourse</code> and conformed across <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">FactAcademicPerformance</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">FactAttendance</code> on conformed foreign key <code className="font-mono text-indigo-700">course_key</code>.
              </p>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!isLoading && !course && !error && (
          <div className="bg-white rounded-lg border border-[#e7eaee] p-10 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Course Not Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Could not find a conformed course matching code &quot;{courseId}&quot;.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#f87941] hover:underline"
            >
              &larr; Return to Courses
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
