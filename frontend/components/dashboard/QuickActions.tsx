import React from 'react';
import Link from 'next/link';
import { TrendingUp, AlertTriangle, FileText, Database, ArrowRight, Zap } from 'lucide-react';

interface QuickActionsProps {
  totalStudents?: number;
  atRiskCount?: number;
  departmentCount?: number;
}

export default function QuickActions({
  totalStudents = 4820,
  atRiskCount = 108,
  departmentCount = 5,
}: QuickActionsProps) {
  const actionList = [
    {
      id: 'academic-performance',
      label: 'View Academic Performance',
      description: 'Explore department comparisons and 6-semester progression trends',
      href: '/analytics',
      icon: TrendingUp,
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'student-support',
      label: 'Review Students Requiring Support',
      description: `${atRiskCount} undergraduates flagged for academic advisory and attendance review`,
      href: '/at-risk',
      icon: AlertTriangle,
      iconColor: 'text-[#f87941] bg-[#fff4ed]',
    },
    {
      id: 'reports',
      label: 'Open Department Reports',
      description: 'Download official executive performance summaries and CSV rosters',
      href: '/reports',
      icon: FileText,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'data-management',
      label: 'Check Data Management',
      description: 'Monitor data update status, record conformance, and warehouse integrity',
      href: '/warehouse',
      icon: Database,
      iconColor: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-[#e7eaee] p-4 flex flex-col justify-between h-full shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f3f5]">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
            Quick Actions
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Key operational tasks and administrative workflows
          </p>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#f7f8fa] text-slate-600">
          <Zap className="h-3.5 w-3.5 text-[#f87941]" />
        </div>
      </div>

      {/* Actions Grid */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actionList.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.id}
              href={act.href}
              className="group flex flex-col justify-between p-3 rounded-lg border border-[#e7eaee] bg-[#fafbfd] hover:bg-white hover:border-[#f87941]/40 hover:shadow-2xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md ${act.iconColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#f87941] group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="text-xs font-semibold text-[#1e2238] group-hover:text-[#f87941] transition-colors leading-snug block">
                  {act.label}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-[#f1f3f5] pt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>University Analytics Portal</span>
        <span className="font-semibold text-slate-700">AY 2025–26 • Sem VI</span>
      </div>
    </div>
  );
}

