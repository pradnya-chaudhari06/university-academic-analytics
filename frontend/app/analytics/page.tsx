'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import PerformanceTrendChart from '../../components/dashboard/PerformanceTrendChart';
import PerformanceDistribution from '../../components/dashboard/PerformanceDistribution';
import { fetchTrends, fetchDistribution, fetchDepartments } from '../../lib/api';
import { SemesterTrendPoint, PerformanceDistributionCategory, DepartmentPerformanceData } from '../../types/academic';
import { TrendingUp, BarChart3, Brain, ArrowRight } from 'lucide-react';

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<SemesterTrendPoint[]>([]);
  const [distribution, setDistribution] = useState<PerformanceDistributionCategory[]>([]);
  const [departments, setDepartments] = useState<DepartmentPerformanceData[]>([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        console.error('Failed to load analytics data:', err);
        setIsLoading(false);
      });
  }, [selectedDept]);

  return (
    <AppShell activeItem="academic-performance" selectedDepartment={selectedDept} onDepartmentChange={setSelectedDept}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Analytics</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Academic Performance</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Longitudinal Academic Trajectory & Distribution
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal progression across Semesters I through VI conformed to DimTime and DimDepartment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/analytics/olap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#f87941]" />
              <span>Multi-Dimensional OLAP Cube</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceTrendChart
              data={trends}
            />
          </div>

          <div>
            <PerformanceDistribution
              distribution={distribution}
            />
          </div>
        </div>

        {/* Department Benchmarks Summary */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-[#1e2238] mb-3">
            Department Performance Benchmarks (Semester VI)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            {departments.map((d) => (
              <div key={d.code} className="p-3 rounded-md bg-[#fafbfd] border border-slate-100">
                <span className="font-bold text-xs text-slate-700">{d.code}</span>
                <p className="text-base font-bold text-[#1e2238] mt-1">{d.averageGpa.toFixed(2)}</p>
                <p className="text-[10px] text-emerald-600 font-semibold">{d.passRate.toFixed(1)}% Pass</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.totalStudents} Students</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
