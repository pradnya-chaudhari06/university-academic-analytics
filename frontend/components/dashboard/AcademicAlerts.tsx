'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Flag } from 'lucide-react';
import { AtRiskStudent } from '../../types/academic';
import { useToast } from '../common/Toast';

export interface AcademicAlertsProps {
  atRiskCount?: number;
  atRiskStudents?: AtRiskStudent[];
  gpaBelowCutoffCount?: number;
  cohortTotal?: number;
}

export default function AcademicAlerts({
  atRiskCount,
  atRiskStudents,
  gpaBelowCutoffCount,
  cohortTotal,
}: AcademicAlertsProps) {
  const { showToast } = useToast();
  const [completedAlertIds, setCompletedAlertIds] = useState<string[]>([]);

  // Every count below is derived from warehouse aggregates:
  //  - atRiskCount / atRiskStudents  -> GET /api/kpis, GET /api/students/at-risk
  //  - gpaBelowCutoffCount           -> GET /api/distribution (Needs Support band = GPA < 6.00)
  const roster = atRiskStudents ?? [];
  const liveAtRisk = atRiskCount ?? roster.length;
  const multiFailCount = roster.filter((s) => (s.failedCoursesCount ?? 0) >= 2).length;
  const maxFailedCourses = roster.reduce(
    (max, s) => Math.max(max, s.failedCoursesCount ?? 0),
    0
  );

  const toggleAlertStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedAlertIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    showToast(
      'Alert Status',
      'Intervention checklist status updated (session only — not persisted).',
      'info'
    );
  };

  const handleAlertClick = (title: string) => {
    showToast(
      title,
      'Evaluated against FactStudentRiskStatus and FactAcademicPerformance at the current DimTime slice.',
      'warning'
    );
  };

  const gpaShare =
    gpaBelowCutoffCount !== undefined && cohortTotal && cohortTotal > 0
      ? ((gpaBelowCutoffCount / cohortTotal) * 100).toFixed(1)
      : null;

  const alertItems = [
    {
      id: 'alert-1',
      title:
        gpaBelowCutoffCount !== undefined
          ? `${gpaBelowCutoffCount} students below the 6.00 GPA cutoff`
          : `${liveAtRisk} students flagged at risk`,
      subtitle:
        gpaShare !== null
          ? `${gpaShare}% of the cohort · derived GPA band (GPA < 6.00)`
          : 'Stored FactStudentRiskStatus.is_at_risk records',
      dwmSource: 'FactStudentRiskStatus / FactAcademicPerformance',
      date: '24 June 2026',
      badge: 'Due tomorrow',
      badgeClass: 'bg-[#fffbeb] text-[#b45309] border-[#fef3c7]',
      completed: completedAlertIds.includes('alert-1'),
    },
    {
      id: 'alert-2',
      title: `${liveAtRisk} students carry a warehouse at-risk flag`,
      subtitle: 'FactStudentRiskStatus.is_at_risk · rule-based ETL classification',
      dwmSource: 'FactStudentRiskStatus',
      date: '23 June 2026',
      badge: 'Done',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-[#d1fae5]',
      completed: true,
    },
    {
      id: 'alert-3',
      title:
        multiFailCount > 0
          ? `${multiFailCount} flagged students failed 2+ courses`
          : `No flagged student failed more than one course`,
      subtitle: `Deepest failure count in the roster: ${maxFailedCourses} course${
        maxFailedCourses === 1 ? '' : 's'
      }`,
      dwmSource: 'FactStudentRiskStatus.failed_courses_count',
      date: '23 June 2026',
      badge: 'Done',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-[#d1fae5]',
      completed: true,
    },
    {
      id: 'alert-4',
      title: 'Quarterly Appraisal for Faculty Cohort',
      subtitle: 'Departmental pass rate audit and moderation (qualitative review item)',
      dwmSource: 'Reference content',
      date: '28 June 2026',
      badge: 'Review',
      badgeClass: 'bg-[#f0f9ff] text-[#0369a1] border-[#e0f2fe]',
      completed: completedAlertIds.includes('alert-4'),
    },
  ];

  return (
    <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
            Academic Alerts & Attention
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Threshold alerts computed from warehouse fact tables
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            showToast(
              'New Academic Alert',
              'Custom alert authoring requires a persistence backend and is not available in this build.',
              'info'
            )
          }
          className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#1e2438] text-white hover:bg-[#2c334d] transition-colors shadow-2xs cursor-pointer"
          title="Add Action Item"
        >
          <Plus className="h-3 w-3 stroke-[2.5]" />
        </button>
      </div>

      {/* Alert Items List */}
      <div className="mt-2 space-y-1.5">
        {alertItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleAlertClick(item.title)}
            className="group flex items-start justify-between gap-2.5 p-1 hover:bg-[#f7f8fa] rounded-md transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => toggleAlertStatus(item.id, e)}
                className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-50" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500" />
                )}
              </button>

              <div className="min-w-0">
                <p
                  className={`text-[11.5px] font-semibold leading-snug transition-colors ${
                    item.completed
                      ? 'text-slate-600'
                      : 'text-[#1e2238] group-hover:text-[#f87941]'
                  }`}
                >
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-normal">
                    {item.date}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[130px] sm:max-w-none">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Pill Badge */}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <span
                className={`rounded border px-1.5 py-0.2 text-[9px] font-medium ${item.badgeClass}`}
              >
                {item.badge}
              </span>
              {item.badge === 'Due tomorrow' && (
                <Flag className="h-2.5 w-2.5 text-amber-500 fill-amber-100 hidden sm:inline-block" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div className="mt-2.5 border-t border-[#f1f3f5] pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Computed from FactStudentRiskStatus &amp; FactAcademicPerformance</span>
        <span className="font-medium text-slate-600">4 Alert Items</span>
      </div>
    </div>
  );
}