'use client';

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { AcademicInsightItem } from '../../types/academic';

interface AcademicInsightsProps {
  insights?: AcademicInsightItem[];
  onOpenMining?: () => void;
  isLive?: boolean;
}

export default function AcademicInsights({
  insights = [],
  onOpenMining,
  isLive = false,
}: AcademicInsightsProps) {
  return (
    <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
            Academic Insights
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Key analytical findings aggregated across dimensions
          </p>
        </div>
        {onOpenMining ? (
          <button
            type="button"
            onClick={onOpenMining}
            title="Open Data Mining Engine"
            className="flex h-6 w-6 items-center justify-center rounded bg-[#fff4ed] text-[#f87941] hover:bg-[#ffe7db] transition-colors cursor-pointer"
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#fff4ed] text-[#f87941]">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="mt-2 space-y-2 divide-y divide-[#f1f3f5]">
        {insights.map((item) => (
          <div key={item.id} className="pt-1.5 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-[#1e2238] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87941]" />
                {item.title}
              </span>
              <span className="text-[8.5px] font-mono text-slate-400 bg-[#f7f8fa] border border-[#e7eaee] px-1 py-0.2 rounded shrink-0">
                {item.dwmReference}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5 pl-3 leading-normal">
              <span className="font-semibold text-slate-700">{item.value}</span>{' '}
              {item.detail}
            </p>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-[10.5px] text-slate-500 py-2">
            No insights available — warehouse aggregates could not be loaded.
          </p>
        )}
      </div>

      {/* Footnote */}
      <div className="mt-2 border-t border-[#f1f3f5] pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          {isLive
            ? 'Computed from live Star Schema department rollups'
            : 'Fallback reference values (API offline)'}
        </span>
        <span className="font-medium text-slate-600">
          {isLive ? 'Warehouse Derived' : 'Reference Only'}
        </span>
      </div>
    </div>
  );
}