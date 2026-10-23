'use client';

import React from 'react';
import { FileText, Download, Eye, Clock } from 'lucide-react';
import { AcademicReport } from '../../types/academic';
import { useToast } from '../common/Toast';

export interface RecentReportsProps {
  reports: AcademicReport[];
  onOpenReportModal?: (reportType?: string) => void;
}

export default function RecentReports({ reports, onOpenReportModal }: RecentReportsProps) {
  const { showToast } = useToast();

  const handleViewReport = (report: AcademicReport) => {
    showToast(
      `Viewing ${report.reportName}`,
      `Archived ${report.type} template (${report.size}). Live star schema facts are displayed in the dashboard and exportable as CSV.`,
      'info'
    );
  };

  const handleExportReport = (report: AcademicReport) => {
    if (onOpenReportModal) {
      const typeKey =
        report.type === 'Executive Summary'
          ? 'executive'
          : report.type === 'OLAP Comparative'
          ? 'departmental'
          : 'atRisk';
      onOpenReportModal(typeKey);
    } else {
      showToast(
        `Report: ${report.reportName}`,
        'Archived template metadata (Storage: DataMart_Reports). Use Generate Report to export verified live data.',
        'info'
      );
    }
  };

  return (
    <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
              Recent Reports
            </h3>
            <span className="rounded bg-[#fff4ed] border border-[#fcd5bf] px-1.5 py-0.2 text-[9px] font-semibold text-[#f87941]">
              Generated Docs
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Published institutional performance summaries and drill-down audit logs
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5 text-[#f87941]" />
          <span className="text-[10.5px] font-medium text-slate-500">3 Reports Available</span>
        </div>
      </div>

      {/* Reports List */}
      <div className="mt-2.5 space-y-1.5">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border border-[#e7eaee] bg-[#f7f8fa] p-2 hover:bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-[#e7eaee] bg-white text-slate-600 shrink-0">
                <FileText className="h-3 w-3 text-[#f87941]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11.5px] font-semibold text-[#1e2238] truncate">
                  {report.reportName}
                </h4>
                <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {report.generatedDate}
                  </span>
                  <span>•</span>
                  <span>{report.type}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{report.size}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleViewReport(report)}
                className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-2 py-0.5 text-[10.5px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Eye className="h-2.5 w-2.5 text-slate-400" />
                <span>View</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportReport(report)}
                className="inline-flex items-center gap-1 rounded bg-[#1e2438] px-2 py-0.5 text-[10.5px] font-medium text-white hover:bg-[#2c334d] transition-colors cursor-pointer"
              >
                <Download className="h-2.5 w-2.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-[#f1f3f5] pt-1.5 text-[10px] text-slate-400">
        <span>Format: Standard Academic PDF / XLSX</span>
        <span className="font-mono text-slate-500">Storage: DataMart_Reports</span>
      </div>
    </div>
  );
}

