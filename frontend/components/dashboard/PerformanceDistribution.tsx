'use client';

import React, { useState } from 'react';
import { ExternalLink, Award, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { PerformanceDistributionCategory } from '../../types/academic';
import Modal from '../common/Modal';
import { formatNumber, formatPercent } from '../../utils/format';

interface PerformanceDistributionProps {
  distribution: PerformanceDistributionCategory[];
  passRate?: number;
}

export default function PerformanceDistribution({
  distribution,
  passRate,
}: PerformanceDistributionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const totalStudents = distribution.reduce((sum, item) => sum + item.studentCount, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Excellent':
        return <Award className="h-3.5 w-3.5 text-indigo-600" />;
      case 'Good':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
      case 'Average':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
    }
  };

  // Radial progress calculations (Radius = 24, Circumference = 2 * PI * 24 ≈ 150.8)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;

  const excellence = distribution.find((d) => d.category === 'Excellent');
  const needsSupport = distribution.find((d) => d.category === 'Needs Support');

  const distinctionPercent = excellence?.percentage ?? 0;
  const distinctionOffset = circumference - (distinctionPercent / 100) * circumference;

  // Live pass rate from GET /api/kpis; nothing is shown when it is unavailable
  const livePassRate = passRate ?? 0;
  const passOffset = circumference - (livePassRate / 100) * circumference;

  // Students above the 6.00 GPA cutoff = cohort total minus the Needs Support band
  const studentsAboveCutoff = needsSupport
    ? totalStudents - needsSupport.studentCount
    : totalStudents;

  return (
    <>
      <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
                Student Performance Distribution
              </h3>
              <span className="rounded bg-[#f8f9fa] border border-[#e7eaee] px-1.5 py-0.2 text-[9px] font-mono text-slate-500">
                {formatNumber(totalStudents)} Undergraduates
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Standardized grade tiers derived from FactStudentRiskStatus.current_gpa
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span>View Distribution</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        {/* Dual Radial Progress Rings (Matching Reference Style) */}
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2.5 border-b border-slate-100">
          {/* Ring 1: Distinction Rate */}
          <div className="flex items-center gap-3 rounded border border-[#e7eaee] bg-[#f8f9fa]/50 p-2">
            <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
              <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#f87941"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={distinctionOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[9.5px] font-bold font-mono text-[#f87941]">
                {distinctionPercent}%
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] text-slate-500 font-medium block">Distinction Tier</span>
              <span className="text-sm sm:text-base font-bold text-[#1e2238] font-mono">
                {excellence ? formatNumber(excellence.studentCount) : '—'}
              </span>
              <span className="text-[9.5px] text-slate-400 block truncate">GPA ≥ 8.50 Honors</span>
            </div>
          </div>

          {/* Ring 2: Pass Rate */}
          <div className="flex items-center gap-3 rounded border border-[#e7eaee] bg-[#f8f9fa]/50 p-2">
            <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
              <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={passOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[9.5px] font-bold font-mono text-emerald-700">
                {passRate !== undefined ? `${livePassRate}%` : '—'}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] text-slate-500 font-medium block">Course Pass Rate</span>
              <span className="text-sm sm:text-base font-bold text-[#1e2238] font-mono">
                {formatNumber(studentsAboveCutoff)}
              </span>
              <span className="text-[9.5px] text-slate-400 block truncate">
                Students above 6.00 GPA
              </span>
            </div>
          </div>
        </div>

        {/* Compact Proportional Distribution Bar */}
        <div className="mt-3">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            {distribution.map((item) => (
              <div
                key={item.category}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.colorHex,
                }}
                title={`${item.category}: ${formatNumber(item.studentCount)} students (${item.percentage}%)`}
              />
            ))}
          </div>

          {/* Legend Row */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            {distribution.map((item) => (
              <div key={item.category} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="font-medium text-slate-800">{item.category}</span>
                <span className="font-mono text-slate-400">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Clean Analytical Tier Cards */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {distribution.map((item) => (
            <div
              key={item.category}
              className="flex flex-col justify-between rounded-md border border-[#e5e7eb] bg-[#f8f9fa]/60 p-2.5 hover:bg-white hover:border-slate-300 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    {item.category}
                  </span>
                  <div className="h-5 w-5 flex items-center justify-center rounded bg-white border border-[#e5e7eb]">
                    {getCategoryIcon(item.category)}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                  {item.gpaRange}
                </div>
              </div>

              <div className="mt-2 border-t border-slate-200/60 pt-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                    {formatNumber(item.studentCount)}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-500">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Student Performance Distribution Drill-Down"
        subtitle={`Evaluation of ${formatNumber(totalStudents)} enrolled undergraduates across institutional grade bands`}
        badge="Derived GPA Bands"
        maxWidth="md"
      >
        <div className="space-y-2.5">
          {distribution.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded border border-[#e5e7eb] p-2.5 bg-[#f8f9fa]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">
                    {item.category}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Criteria: {item.gpaRange} · {item.description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  {formatNumber(item.studentCount)} students
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {item.percentage}% of cohort
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
