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
  departmentCount = 5,
}: KpiCardsProps) {
  const findMetric = (id: string) => metrics.find((m) => m.id === id);

  const kpiItems = [
    {
      id: 'total_students',
      label: 'Total Students',
      value: findMetric('total_students')?.value ?? '4,820',
      description: 'Enrolled across 5 engineering departments',
    },
    {
      id: 'avg_cgpa',
      label: 'Average CGPA',
      value: findMetric('average_gpa')?.value ?? '7.82',
      description: 'Scale of 10.0 • Cohort Mean',
    },
    {
      id: 'pass_rate',
      label: 'Pass Percentage',
      value: findMetric('pass_rate')?.value ?? '91.4%',
      description: 'Course evaluations cleared in active term',
    },
    {
      id: 'attendance',
      label: 'Average Attendance',
      value: findMetric('attendance')?.value ?? '87.6%',
      description: 'Lecture & lab biometric aggregate',
    },
    {
      id: 'at_risk_students',
      label: 'Students Requiring Support',
      value: findMetric('at_risk_students')?.value ?? '108',
      description: 'Flagged for academic advisory review',
      isWarning: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpiItems.map((item) => {
        return (
          <div
            key={item.id}
            className={`bg-white rounded-lg border border-[#e7eaee] p-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all ${
              isLoading ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {/* Metric Label */}
            <span className="text-xs font-semibold text-slate-500 truncate" title={item.label}>
              {item.label}
            </span>

            {/* Metric Value */}
            <div className="my-1.5">
              <span
                className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums leading-none ${
                  item.isWarning ? 'text-[#f87941]' : 'text-[#1e2238]'
                }`}
              >
                {isLoading ? '...' : item.value}
              </span>
            </div>

            {/* Plain-Language Explanation */}
            <p className="text-[11px] text-slate-500 leading-snug">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}