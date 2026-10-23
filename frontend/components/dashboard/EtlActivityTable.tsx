'use client';

import React from 'react';
import { GitBranch, CheckCircle2, Clock, RefreshCw, Database } from 'lucide-react';
import { EtlJobRecord } from '../../types/academic';

interface EtlActivityTableProps {
  jobs: EtlJobRecord[];
}

export default function EtlActivityTable({ jobs }: EtlActivityTableProps) {
  const getStatusBadge = (status: EtlJobRecord['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-800/40 bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-800/40 bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            <RefreshCw className="h-3 w-3 animate-spin" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#1e2333] bg-[#11141d] p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Recent ETL Activity
            </h3>
            <span className="rounded bg-[#181c2b] border border-[#262c40] px-2 py-0.5 text-[10px] font-mono text-slate-400">
              Pipeline Monitor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational status of data extraction, transformation, and warehouse loading jobs
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <GitBranch className="h-4 w-4 text-violet-400" />
          <span>4 Jobs Monitored</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e2333] bg-[#0e1119] text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3">Dataset / Pipeline</th>
              <th className="py-2.5 px-3">Target Table</th>
              <th className="py-2.5 px-3 text-right">Records</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d2a]">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="transition-colors hover:bg-[#141824]"
              >
                {/* Dataset Name & Source */}
                <td className="py-3 px-3">
                  <div className="font-medium text-slate-200">{job.datasetName}</div>
                  <div className="text-[10px] text-slate-400">{job.sourceSystem}</div>
                </td>

                {/* Target Table */}
                <td className="py-3 px-3 font-mono text-slate-300">
                  <span className="rounded border border-[#23283b] bg-[#161925] px-1.5 py-0.5 text-[11px] text-violet-300">
                    {job.targetTable}
                  </span>
                </td>

                {/* Records Processed */}
                <td className="py-3 px-3 text-right font-mono font-medium text-white tabular-nums">
                  {job.recordsProcessed.toLocaleString()}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-3">
                  {getStatusBadge(job.status)}
                </td>

                {/* Last Updated */}
                <td className="py-3 px-3 text-right font-mono text-slate-400">
                  {job.lastUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer DWM Information */}
      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#181d2a] pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-violet-400" />
          <span>Warehouse staging batch: Nightly incremental + Realtime attendance queue</span>
        </div>
        <span className="font-mono text-slate-400">Target Schema: DWM_ACADEMIC_DW</span>
      </div>
    </div>
  );
}
