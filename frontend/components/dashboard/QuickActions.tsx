'use client';

import React, { useState } from 'react';
import { Play, Users, BarChart3, AlertTriangle, Zap, FileText } from 'lucide-react';
import OlapModal from './OlapModal';
import DataMiningModal from './DataMiningModal';
import EtlModal from './EtlModal';
import ReportModal from './ReportModal';
import { useToast } from '../common/Toast';

interface QuickActionsProps {
  onViewStudents?: () => void;
  onViewAtRisk?: () => void;
  onOpenReport?: () => void;
  onOpenOlap?: () => void;
  totalStudents?: number;
  atRiskCount?: number;
  departmentCount?: number;
}

export default function QuickActions({
  onViewStudents,
  onViewAtRisk,
  onOpenReport,
  onOpenOlap,
  totalStudents,
  atRiskCount,
  departmentCount,
}: QuickActionsProps) {
  const [etlModalOpen, setEtlModalOpen] = useState(false);
  const [olapModalOpen, setOlapModalOpen] = useState(false);
  const [miningModalOpen, setMiningModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleAction = (id: string) => {
    switch (id) {
      case 'generate-report':
        if (onOpenReport) {
          onOpenReport();
        } else {
          setReportModalOpen(true);
        }
        break;
      case 'view-students':
        if (onViewStudents) {
          onViewStudents();
        } else {
          showToast(
            'Student Directory',
            'Scroll to the at-risk roster and warehouse rollups below.',
            'info'
          );
        }
        break;
      case 'run-analysis':
        if (onOpenOlap) {
          onOpenOlap();
        } else {
          setOlapModalOpen(true);
        }
        break;
      case 'view-at-risk':
        if (onViewAtRisk) {
          onViewAtRisk();
        } else {
          showToast(
            'At-Risk Students',
            'Scroll to the FactStudentRiskStatus roster below.',
            'warning'
          );
        }
        break;
      default:
        break;
    }
  };

  const actionList = [
    {
      id: 'generate-report',
      label: 'Generate Report',
      description: 'Export PDF / Excel audit summaries',
      icon: FileText,
      iconColor: 'text-[#f87941] bg-[#fff4ed]',
    },
    {
      id: 'view-students',
      label: 'View Students',
      description:
        totalStudents !== undefined
          ? `${totalStudents.toLocaleString('en-US')} across ${departmentCount ?? '—'} faculties`
          : 'Enrolled student dimension',
      icon: Users,
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'run-analysis',
      label: 'Run Analysis',
      description: 'Multi-dimensional OLAP slice & dice',
      icon: BarChart3,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'view-at-risk',
      label: 'View At-Risk Students',
      description: 'Warehouse risk roster',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <>
      <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
              Quick Actions
            </h3>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Direct operational triggers and analytical modules
            </p>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#f7f8fa] text-slate-600">
            <Zap className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Actions 2x2 Grid */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {actionList.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleAction(act.id)}
                className="group flex flex-col text-left p-2 rounded border border-[#e7eaee] bg-[#f7f8fa] hover:bg-white hover:border-[#f87941]/40 hover:shadow-2xs transition-all cursor-pointer"
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded ${act.iconColor} mb-1.5 transition-transform group-hover:scale-105`}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-[11.5px] font-semibold text-[#1e2238] group-hover:text-[#f87941] transition-colors leading-tight">
                  {act.label}
                </span>
                <span className="text-[9.5px] text-slate-400 mt-0.5 line-clamp-1">
                  {act.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footnote */}
        <div className="mt-2 border-t border-[#f1f3f5] pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Enterprise triggers enabled</span>
          <span className="font-medium text-slate-600">4 Operational Tasks</span>
        </div>
      </div>

      {/* Interactive Feature Modals */}
      <EtlModal isOpen={etlModalOpen} onClose={() => setEtlModalOpen(false)} />
      <OlapModal isOpen={olapModalOpen} onClose={() => setOlapModalOpen(false)} />
      <DataMiningModal isOpen={miningModalOpen} onClose={() => setMiningModalOpen(false)} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </>
  );
}

