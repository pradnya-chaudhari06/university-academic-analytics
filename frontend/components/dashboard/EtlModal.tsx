'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Play, CheckCircle2, RefreshCw, GitBranch, Database, AlertCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import { triggerEtlRun } from '../../lib/api';

export interface EtlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lastSyncTime?: string;
  engineLabel?: string | null;
}

export default function EtlModal({ isOpen, onClose, onSuccess, lastSyncTime, engineLabel }: EtlModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (!isRunning) {
        setProgress(0);
        setActiveStep(0);
      }
    }
  }, [isOpen, isRunning]);

  const steps = [
    { title: '1. Source Extraction', detail: 'Extracting student, course, examination and biometric records from Campus SIS, Exam Portal and Biometric Logs' },
    { title: '2. Staging & Cleaning', detail: 'Validating surrogate keys, removing anomalies, conforming DimStudent & DimCourse' },
    { title: '3. Warehouse Load', detail: 'Upserting into FactAcademicPerformance, FactAttendance and FactStudentRiskStatus' },
    { title: '4. Cube Aggregation', detail: 'Rebuilding Star Schema analytical views and OLAP roll-ups' },
  ];

  const handleStartEtl = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setProgress(15);
    setActiveStep(0);

    const stepTimer1 = setTimeout(() => {
      setProgress(45);
      setActiveStep(1);
    }, 400);

    const stepTimer2 = setTimeout(() => {
      setProgress(75);
      setActiveStep(2);
    }, 900);

    try {
      const response = await triggerEtlRun();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (response && response.success) {
        setProgress(100);
        setActiveStep(3);
        setIsRunning(false);

        const syncTime =
          (response.data?.timestamp as string) ||
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' IST';
        setLastSyncDisplay(syncTime);

        showToast(
          'ETL Completed',
          response.message || 'Warehouse batch refresh finished. Check etl_audit_log for row counts.',
          'success'
        );

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'ETL execution returned an unsuccessful status.');
      }
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsRunning(false);
      const message =
        err instanceof Error ? err.message : 'Failed to execute institutional ETL pipeline.';
      setErrorMessage(message);
      showToast('ETL Execution Failed', message, 'warning');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ETL Pipeline Orchestration"
      subtitle="Manual execution and staging pipeline monitor for StarSchema_Academic"
      badge="Orchestrator: Live"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status Banner */}
        <div className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">
              Target Warehouse: {engineLabel || 'StarSchema_Academic'}
            </span>
          </div>
          <span className="font-mono text-slate-500">Full Batch Refresh</span>
        </div>

        {/* Error Notification if pipeline fails */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-semibold">Pipeline Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Step Progress Track */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = progress === 100 || (isRunning && activeStep > idx);
            const isCurrent = isRunning && activeStep === idx;

            return (
              <div
                key={step.title}
                className={`flex items-start gap-3 rounded-md border p-2.5 transition-colors text-xs ${
                  isCurrent
                    ? 'border-indigo-300 bg-indigo-50/50'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-[#e5e7eb] bg-white'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{step.title}</span>
                    {isCurrent && (
                      <span className="font-mono text-[10px] text-indigo-700 animate-pulse font-semibold">
                        In Progress...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] font-mono text-slate-400">
            Last successful sync: {lastSyncDisplay || lastSyncTime || 'Not recorded in etl_audit_log'}
          </span>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleStartEtl}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer ${
              isRunning ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Execute ETL Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
