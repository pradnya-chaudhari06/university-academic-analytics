'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { KpiMetric } from '../../types/academic';

interface KpiCardsProps {
  metrics: KpiMetric[];
  extraMetrics?: {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
  }[];
  isLoading?: boolean;
  departmentCount?: number;
}

export default function KpiCards({
  metrics,
  isLoading = false,
  departmentCount,
}: KpiCardsProps) {
  const findMetric = (id: string) => metrics.find((m) => m.id === id);

  // KPI values are calculated from the warehouse via GET /api/kpis.
  // No period-over-period delta is rendered because the warehouse holds no
  // trustworthy previous-period comparison; the warehouse source table is shown instead.
  const kpiItems = [
    {
      id: 'avg_cgpa',
      label: 'Cohort CGPA',
      metric: findMetric('average_gpa'),
      fallbackValue: '—',
      staticSource: 'FactAcademicPerformance',
    },
    {
      id: 'attendance_rate',
      label: 'Attendance Rate',
      metric: findMetric('attendance'),
      fallbackValue: '—',
      staticSource: 'FactAttendance',
    },
    {
      id: 'students_enrolled',
      label: 'Students Enrolled',
      metric: findMetric('total_students'),
      fallbackValue: '—',
      staticSource: 'DimStudent',
    },
    {
      id: 'pass_rate',
      label: 'Pass Percentage',
      metric: findMetric('pass_rate'),
      fallbackValue: '—',
      staticSource: 'FactAcademicPerformance',
    },
    {
      id: 'at_risk_students',
      label: 'At-Risk Students',
      metric: findMetric('at_risk_students'),
      fallbackValue: '—',
      staticSource: 'FactStudentRiskStatus',
    },
    {
      id: 'active_departments',
      label: 'Active Departments',
      metric: undefined,
      fallbackValue: departmentCount !== undefined ? String(departmentCount) : '—',
      staticSource: 'DimDepartment',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {kpiItems.map((item) => {
        const value = item.metric?.value ?? item.fallbackValue;
        const trend = item.metric?.trend;
        const sourceTable = item.staticSource;

        return (
          <div
            key={item.id}
            className={`reference-card px-3 py-2.5 sm:px-3.5 sm:py-2.5 flex flex-col justify-between hover:border-slate-300 transition-all ${
              isLoading ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {/* Label */}
            <span className="text-[10.5px] font-medium text-slate-500 truncate" title={item.label}>
              {item.label}
            </span>

            {/* Metric Value */}
            <div className="my-1">
              <span className="text-lg sm:text-[20px] font-bold tracking-tight text-[#1e2238] tabular-nums leading-none">
                {value}
              </span>
            </div>

            {/* Measured delta when available, otherwise the warehouse source table */}
            <div className="flex items-center gap-1 text-[10px] min-h-[13px]">
              {trend ? (
                <>
                  <span
                    className={`inline-flex items-center font-medium ${
                      trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {trend.direction === 'down' ? (
                      <ArrowDown className="h-2.5 w-2.5 mr-0.5 stroke-[2]" />
                    ) : (
                      <ArrowUp className="h-2.5 w-2.5 mr-0.5 stroke-[2]" />
                    )}
                    {trend.percentage}
                  </span>
                  <span className="text-[9.5px] text-slate-400 truncate hidden sm:inline" title={trend.description}>
                    {trend.description}
                  </span>
                </>
              ) : (
                <span className="text-[9.5px] font-mono text-slate-400 truncate" title={`Data source: ${sourceTable}`}>
                  src: {sourceTable}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}