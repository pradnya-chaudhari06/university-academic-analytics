'use client';

import React from 'react';
import { Database, CheckCircle2, HardDrive, RefreshCw } from 'lucide-react';
import { WarehouseStatusData } from '../../types/academic';
import { useToast } from '../common/Toast';
import { formatNumber } from '../../utils/format';

interface DwmWarehouseStatusProps {
  statusData: WarehouseStatusData;
  engineLabel?: string | null;
  onOpenEtl?: () => void;
  onOpenOlap?: () => void;
}

export default function DwmWarehouseStatus({
  statusData,
  engineLabel,
  onOpenEtl,
  onOpenOlap,
}: DwmWarehouseStatusProps) {
  const { showToast } = useToast();

  const engineDisplay = engineLabel || 'Warehouse engine unavailable';

  const handleInspect = () => {
    if (onOpenOlap) {
      onOpenOlap();
    } else {
      showToast(
        'Warehouse Architecture',
        `${statusData.factTablesCount} Fact Tables · ${statusData.dimensionTablesCount} Dimension Tables · ${engineDisplay}.`,
        'info'
      );
    }
  };

  const handleTriggerEtl = () => {
    if (onOpenEtl) {
      onOpenEtl();
    } else {
      handleInspect();
    }
  };

  return (
    <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
            Data Warehouse Status
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            {engineDisplay} · Star Schema &amp; ETL pipeline
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9.5px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Status: {statusData.status || 'Healthy'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div
          onClick={handleInspect}
          className="rounded border border-[#e7eaee] bg-[#f7f8fa] p-2 cursor-pointer hover:bg-white hover:border-slate-300 transition-colors"
        >
          <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
            Records Processed
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-[#1e2238] block mt-0.5">
            {formatNumber(statusData.recordsProcessed)}
          </span>
          <span className="text-[9.5px] text-slate-400">DimStudent + 3 Fact Tables</span>
        </div>

        <div
          onClick={handleInspect}
          className="rounded border border-[#e7eaee] bg-[#f7f8fa] p-2 cursor-pointer hover:bg-white hover:border-slate-300 transition-colors"
        >
          <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
            Records Rejected
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-[#1e2238] block mt-0.5">
            {formatNumber(statusData.lastRunRecordsRejected ?? 0)}
          </span>
          <span className="text-[9.5px] text-slate-400">Last ETL run · etl_audit_log</span>
        </div>

        <div
          onClick={handleTriggerEtl}
          title="Click to view/run ETL staging pipeline"
          className="rounded border border-[#e7eaee] bg-[#f7f8fa] p-2 cursor-pointer hover:bg-white hover:border-slate-300 transition-colors"
        >
          <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
            Last ETL Update
          </span>
          <span className="text-[11.5px] font-semibold font-mono text-slate-800 block mt-0.5">
            {statusData.lastEtlRun || 'Not recorded'}
          </span>
          <span className="text-[9.5px] text-slate-400">
            {statusData.lastRunDurationSeconds !== undefined
              ? `Completed in ${statusData.lastRunDurationSeconds}s (Run ETL)`
              : 'Run ETL'}
          </span>
        </div>

        <div
          onClick={handleInspect}
          className="rounded border border-[#e7eaee] bg-[#f7f8fa] p-2 cursor-pointer hover:bg-white hover:border-slate-300 transition-colors"
        >
          <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
            Architecture
          </span>
          <span className="text-[11.5px] font-semibold font-mono text-slate-800 block mt-0.5">
            {statusData.factTablesCount || 3} Facts · {statusData.dimensionTablesCount || 5} Dims
          </span>
          <span className="text-[9.5px] text-slate-400">{engineDisplay}</span>
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-2 border-t border-[#f1f3f5] pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Conformed Dimensional Pipeline</span>
        <span className="font-mono text-slate-500">{engineDisplay}</span>
      </div>
    </div>
  );
}

