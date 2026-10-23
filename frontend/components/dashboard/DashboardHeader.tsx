'use client';

import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  academicYear: string;
  semester: string;
  lastSync: string;
}

export default function DashboardHeader({
  academicYear,
  semester,
  lastSync,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
      {/* Title & Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Good morning, Administrator
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Here&apos;s an overview of university academic performance.
        </p>
      </div>

      {/* Right Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Context badge */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
          <span className="font-medium">{academicYear}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">{semester}</span>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-500">Last sync:</span>
          <span className="font-mono text-slate-800 font-medium">{lastSync}</span>
        </div>
      </div>
    </div>
  );
}
