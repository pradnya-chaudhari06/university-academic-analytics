'use client';

import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { FileText, Download, Printer, Filter, Calendar, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth';

export default function ReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reportTemplates = [
    {
      id: 'semester_executive',
      title: 'Semester VI Executive Performance Summary',
      code: 'REP-SEM-06',
      description: 'Comprehensive academic summary across 4,820 students with department-level GPA, attendance, and pass rates.',
      cadence: 'End of Semester',
      dataPoints: '67,480 FactAcademicPerformance records',
    },
    {
      id: 'department_comparison',
      title: 'Departmental Comparative Analytics Report',
      code: 'REP-DPT-01',
      description: 'Side-by-side comparative benchmarking for CE, IT, EXTC, MECH, and CIVIL faculties with risk concentrations.',
      cadence: 'Bi-Monthly',
      dataPoints: '5 conformed departments',
    },
    {
      id: 'at_risk_intervention',
      title: 'Student Risk & Academic Early Intervention Docket',
      code: 'REP-RSK-02',
      description: 'Individual roster of 108 flagged students with detailed SGPA, attendance deficits, and intervention pathways.',
      cadence: 'Weekly During Instruction',
      dataPoints: '108 flagged at-risk students',
    },
    {
      id: 'course_outcomes',
      title: 'Curriculum & Course Outcome Assessment',
      code: 'REP-CRS-03',
      description: 'Evaluation metrics for all 30 engineering courses including credit weights and pass/fail distributions.',
      cadence: 'Annual Curriculum Review',
      dataPoints: '30 conformed courses',
    },
    {
      id: 'warehouse_audit',
      title: 'Data Warehouse Star Schema & ETL Audit Record',
      code: 'REP-DWM-05',
      description: 'Technical audit trail from etl_audit_log verifying surrogate key conformance and extraction integrity.',
      cadence: 'Per ETL Batch Execution',
      dataPoints: '139,780 conformed fact records',
    },
  ];

  const handleDownload = async (rep: typeof reportTemplates[0]) => {
    setDownloadingId(rep.id);
    showToast(
      'Export In Progress',
      `Querying conformed star schema for ${rep.code} (${rep.title})...`,
      'info'
    );

    try {
      const res = await fetch(`/api/reports/export?report_id=${rep.id}&format=csv`, {
        headers: {
          'X-User-Role': user?.role || 'Academic Administrator',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rep.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        'Export Complete',
        `${rep.title} downloaded successfully as conformed CSV dossier.`,
        'success'
      );
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast('Export Failed', err.message || 'Unable to download report file.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell activeItem="reports">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Reporting</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Institutional Reports</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Academic Intelligence & Institutional Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live conformed warehouse reports queried directly from Star Schema facts with RFC-4180 CSV export
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Report Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((rep) => {
            const isThisDownloading = downloadingId === rep.id;
            return (
              <div
                key={rep.id}
                className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fff4ed] text-[#f87941] border border-[#fcd5bf]">
                      {rep.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {rep.cadence}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[#1e2238] mt-2">
                    {rep.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {rep.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {rep.dataPoints}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownload(rep)}
                    disabled={isThisDownloading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-[#1e2438] hover:text-white text-slate-700 font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isThisDownloading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
