'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import { fetchWarehouseStatus, triggerEtlRun } from '../../../lib/api';
import { Layers, RefreshCw, CheckCircle, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { useAuth } from '../../../lib/auth';

export default function EtlPage() {
  const [warehouseStatus, setWarehouseStatus] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();

  const loadStatus = () => {
    fetchWarehouseStatus()
      .then((data) => {
        setWarehouseStatus(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load ETL status:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunEtl = async () => {
    if (user?.role !== 'System Administrator' && user?.role !== 'Administrator') {
      showToast(
        'Action Restricted',
        'Only users with the System Administrator role can execute the warehouse ETL pipeline.',
        'warning'
      );
      return;
    }

    setIsRunning(true);
    try {
      const res = await triggerEtlRun();
      if (res.success) {
        showToast('ETL Completed', 'Warehouse batch ETL pipeline executed and tables conformed.', 'success');
        loadStatus();
      } else {
        showToast('ETL Execution Failed', res.message || 'Error executing ETL pipeline.', 'warning');
      }
    } catch (err: any) {
      showToast('ETL Error', err?.message || 'Server error during batch ETL run.', 'warning');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AppShell activeItem="etl-pipeline">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/warehouse"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#e7eaee] px-2.5 py-1.5 rounded-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Warehouse Architecture</span>
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-bold text-slate-800">ETL Pipeline</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunEtl}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                isRunning
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1e2438] text-white hover:bg-slate-800'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Executing Batch ETL...' : 'Execute Batch ETL Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stages Card */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1e2238]">
            ETL Pipeline Execution Architecture
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-md bg-[#fafbfd] border border-slate-200">
              <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 01</span>
              <p className="font-bold text-slate-800 mt-0.5">Extract</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Reads student rosters, course catalogs, grade registries, and biometric logs.
              </p>
            </div>
            <div className="p-3 rounded-md bg-[#fafbfd] border border-slate-200">
              <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 02</span>
              <p className="font-bold text-slate-800 mt-0.5">Transform</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Cleanses records, conforms surrogate keys, computes longitudinal progressions.
              </p>
            </div>
            <div className="p-3 rounded-md bg-[#fafbfd] border border-slate-200">
              <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 03</span>
              <p className="font-bold text-slate-800 mt-0.5">Load</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Bulk loads conformed fact records and updates dimension tables atomically.
              </p>
            </div>
            <div className="p-3 rounded-md bg-[#fafbfd] border border-slate-200">
              <span className="font-mono text-[10px] font-bold text-slate-400">STAGE 04</span>
              <p className="font-bold text-slate-800 mt-0.5">Validate & Audit</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Performs foreign key integrity assertions and logs metrics to etl_audit_log.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e7eaee] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#f87941]" />
              <h2 className="text-sm font-bold text-[#1e2238]">
                Audit Trail (etl_audit_log)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Last Run: {warehouseStatus?.lastEtlRun || warehouseStatus?.last_etl_run || 'Recent'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                <tr>
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-4">Job Name</th>
                  <th className="py-2.5 px-4">Target Table</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Extracted</th>
                  <th className="py-2.5 px-4 text-right">Loaded</th>
                  <th className="py-2.5 px-4 text-right">Duration</th>
                  <th className="py-2.5 px-4">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(warehouseStatus?.auditLogs || warehouseStatus?.audit_logs)?.map((log: any) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700">{log.job_id}</td>
                    <td className="py-3 px-4 font-semibold text-[#1e2238]">{log.job_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.target_table}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{log.records_extracted?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{log.records_loaded?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{log.duration_seconds}s</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{log.completed_at || log.started_at}</td>
                  </tr>
                ))}
                {((warehouseStatus?.auditLogs || warehouseStatus?.audit_logs)?.length === 0 || !(warehouseStatus?.auditLogs || warehouseStatus?.audit_logs)) && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      {isLoading ? 'Loading audit trail from database...' : 'No audit records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
