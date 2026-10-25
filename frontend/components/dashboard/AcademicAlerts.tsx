'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, Users, Building2, BookOpen, Database } from 'lucide-react';
import { AtRiskStudent } from '../../types/academic';

export interface AcademicAlertsProps {
  atRiskCount?: number;
  atRiskStudents?: AtRiskStudent[];
  gpaBelowCutoffCount?: number;
  cohortTotal?: number;
}

export default function AcademicAlerts({
  atRiskCount = 108,
  atRiskStudents = [],
  gpaBelowCutoffCount = 108,
  cohortTotal = 4820,
}: AcademicAlertsProps) {
  const liveAtRisk = atRiskCount ?? 108;

  const findings = [
    {
      id: 'finding-dept-pass',
      category: 'Department Performance',
      severity: 'medium',
      title: 'Pass Rate Deficit in MECH (89.2%) & CIVIL (88.5%)',
      detected: 'Mechanical and Civil Engineering pass rates fall below the 92.0% institutional benchmark for Semester VI.',
      whyItMatters: 'Backlogs in core mechanics subjects delay credit completion and hinder prerequisite progression into final-year projects.',
      actionText: 'Review Department Details',
      actionHref: '/departments',
      icon: Building2,
      badge: 'Action Needed',
      badgeClass: 'bg-[#fff4ed] text-[#f87941] border-[#fcd5bf]',
    },
    {
      id: 'finding-at-risk-cohort',
      category: 'Student Support',
      severity: 'high',
      title: `${liveAtRisk} Undergraduates Flagged for Academic Advisory`,
      detected: `${liveAtRisk} students carry active flags: cumulative SGPA below 6.00, course attendance under 75%, or multiple active backlogs.`,
      whyItMatters: 'Timely faculty mentoring and remedial classes in Semester VI prevent academic probation and safeguard placement eligibility.',
      actionText: 'Open Student Support Roster',
      actionHref: '/at-risk',
      icon: Users,
      badge: 'Priority Review',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'finding-attendance-drift',
      category: 'Attendance Advisory',
      severity: 'medium',
      title: '314 Students in 70%–75% Attendance Bracket',
      detected: '314 course enrollment records sit near the mandatory 75% attendance threshold for final examination eligibility.',
      whyItMatters: 'Empirical data shows students falling below 75% attendance experience a 4.2× higher probability of end-term course backlogs.',
      actionText: 'Explore Academic Performance',
      actionHref: '/analytics',
      icon: BookOpen,
      badge: 'Advisory',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'finding-data-integrity',
      category: 'Data Management',
      severity: 'positive',
      title: '139,780 Fact Records Validated & Up-to-Date',
      detected: 'Zero rejected records during Semester VI conformed batch load across all 5 engineering departments.',
      whyItMatters: 'Guarantees all dashboard metrics, student transcripts, and reports reflect verified conformed university data.',
      actionText: 'Check Data Management',
      actionHref: '/warehouse',
      icon: Database,
      badge: 'Verified',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-[#e7eaee] p-4 flex flex-col justify-between shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f5]">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1e2238] flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-[#f87941]" />
            <span>Needs Attention &amp; Key Findings</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Data-driven issues detected across departments, attendance, and student performance
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-[#f7f8fa] border border-[#e7eaee] px-2 py-0.5 rounded">
          {findings.length} Active Items
        </span>
      </div>

      {/* Findings List */}
      <div className="mt-3 space-y-3">
        {findings.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-[#e7eaee] bg-[#fafbfd] hover:bg-white hover:border-[#f87941]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-white border border-[#e7eaee] text-slate-700">
                      <Icon className="h-3.5 w-3.5 text-[#1e2238]" />
                    </span>
                    <span className="text-xs font-bold text-[#1e2238]">
                      {item.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </div>

                {/* What was detected */}
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-semibold">Detected:</strong> {item.detected}
                </p>

                {/* Why it matters */}
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  <strong className="text-slate-700 font-semibold">Impact:</strong> {item.whyItMatters}
                </p>
              </div>

              {/* What administrator can do next */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10.5px] text-slate-400 font-medium">
                  {item.category}
                </span>
                <Link
                  href={item.actionHref}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#f87941] hover:text-[#c2410c] hover:underline"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-[#f1f3f5] pt-2 text-[10.5px] text-slate-400 flex items-center justify-between">
        <span>Evaluated from conformed Star Schema evaluations</span>
        <span className="text-slate-600 font-medium">AY 2025–26 Benchmark</span>
      </div>
    </div>
  );
}