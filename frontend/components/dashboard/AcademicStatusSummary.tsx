'use client';

import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AcademicStatusSummaryProps {
  overallGpa?: number;
  passRate?: number;
  attendanceRate?: number;
  atRiskCount?: number;
  currentSemester?: string;
}

export default function AcademicStatusSummary({
  overallGpa = 7.82,
  passRate = 91.4,
  attendanceRate = 87.6,
  atRiskCount = 108,
  currentSemester = 'Semester VI',
}: AcademicStatusSummaryProps) {
  // SVG circular ring helper
  const renderCircleProgress = (percent: number, color: string) => {
    const size = 32;
    const strokeWidth = 3;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90 shrink-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#f1f3f5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Dark Navy "Status Summary" Card matching reference */}
      <div className="rounded-lg border border-[#232942] bg-[#161c2e] p-3 sm:p-3.5 text-white shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-slate-200 tracking-tight">
            Academic Status
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {currentSemester}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-medium text-slate-400 block">
              Cohort CGPA
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                {overallGpa.toFixed(2)}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 mt-0.5">
              Sem VI Pass Rate: {passRate}% · {atRiskCount} Flagged
            </p>
          </div>

          {/* Smooth Glowing Cyan Wave Sparkline matching reference */}
          <div className="w-28 h-10 shrink-0">
            <svg viewBox="0 0 130 50" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="waveGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06d6a0" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path
                d="M 5 35 C 30 45, 50 10, 75 32 C 95 48, 110 8, 125 18"
                fill="none"
                stroke="url(#waveGlow)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="125" cy="18" r="3" fill="#38bdf8" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Secondary Mini-Summary Cards (Two compact white cards with circular indicators) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Left Mini-Card: Attendance */}
        <div className="reference-card p-2.5 flex items-center gap-2.5">
          {renderCircleProgress(attendanceRate, '#0ea5e9')}
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium text-slate-500 block truncate">
              Overall Attendance
            </span>
            <span className="text-sm sm:text-base font-bold text-[#1e2238] tabular-nums block leading-tight">
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* Right Mini-Card: Pass Rate */}
        <div className="reference-card p-2.5 flex items-center gap-2.5">
          {renderCircleProgress(passRate, '#10b981')}
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium text-slate-500 block truncate">
              Cohort Pass Rate
            </span>
            <span className="text-sm sm:text-base font-bold text-[#1e2238] tabular-nums block leading-tight">
              {passRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
