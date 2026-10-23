'use client';

import React from 'react';
import { Play, CheckCircle2, ExternalLink } from 'lucide-react';
import { EtlJobRecord } from '../../types/academic';
import { useToast } from '../common/Toast';

interface ETLActivityProps {
  jobs: EtlJobRecord[];
  onRunEtl?: () => void;
}

export default function ETLActivity({ jobs, onRunEtl }: ETLActivityProps) {
  const { showToast } = useToast();

  const handleRunEtl = () => {
    if (onRunEtl) {
      onRunEtl();
    } else {
      showToast(
        'Run ETL Job',
        'ETL staging triggered for Campus SIS, Curriculum Catalog, and Exam results.',
        'info'
      );
    }
  };

  const handleViewPipeline = () => {
    showToast(
      'ETL Pipeline Architecture',
      'Visualizing staging-to-warehouse transformations across Fact and Dim tables.',
      'info'
    );
  };

  return (
    <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between h-full">
      {/* Header & Action Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-[#f1f3f5]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
              Recent ETL Activity
            </h3>
            <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
              {jobs.length > 0 ? `${jobs.filter((j) => j.status === 'Completed').length}/${jobs.length} Synchronized` : 'Synchronized'}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Operational pipeline extraction and staging into star schema tables
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleViewPipeline}
            className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>View Pipeline</span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleRunEtl}
            className="inline-flex items-center gap-1 rounded bg-[#1e2438] px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-[#2c334d] transition-colors cursor-pointer"
          >
            <Play className="h-2.5 w-2.5 fill-current" />
            <span>Run ETL</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#e7eaee] bg-[#f7f8fa] text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-1.5 px-2.5">Dataset</th>
              <th className="py-1.5 px-2.5">Target Warehouse Table</th>
              <th className="py-1.5 px-2.5 text-right">Records</th>
              <th className="py-1.5 px-2.5 text-center">Status</th>
              <th className="py-1.5 px-2.5 text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f5]">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-1.5 px-2.5">
                  <div className="font-semibold text-[#1e2238] text-[11.5px]">{job.datasetName}</div>
                  <div className="text-[9.5px] text-slate-400">{job.sourceSystem}</div>
                </td>

                <td className="py-1.5 px-2.5 font-mono text-[9.5px] text-slate-700">
                  <span className="rounded bg-[#f7f8fa] border border-[#e7eaee] px-1 py-0.2">
                    {job.targetTable}
                  </span>
                </td>

                <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#1e2238] tabular-nums text-[11.5px]">
                  {job.recordsProcessed.toLocaleString()}
                </td>

                <td className="py-1.5 px-2.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.2 text-[8.5px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {job.status}
                  </span>
                </td>

                <td className="py-1.5 px-2.5 text-right font-mono text-[9.5px] text-slate-500">
                  {job.lastUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-[#f1f3f5] pt-1.5 text-[10px] text-slate-400">
        <span>Load Mode: Full Batch Refresh (DELETE + reload)</span>
        <span className="font-mono text-slate-500">Warehouse: StarSchema_Academic</span>
      </div>
    </div>
  );
}

