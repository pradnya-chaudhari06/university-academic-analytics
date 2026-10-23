'use client';

import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Settings, ShieldCheck, Database, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { useToast } from '../common/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpaThreshold?: number;
  attendanceThreshold?: number;
  onSaveSettings?: (settings: { gpaThreshold: number; attendanceThreshold: number }) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  gpaThreshold = 6.0,
  attendanceThreshold = 75,
  onSaveSettings,
}: SettingsModalProps) {
  const [gpa, setGpa] = useState(gpaThreshold);
  const [attendance, setAttendance] = useState(attendanceThreshold);
  const [syncSchedule, setSyncSchedule] = useState('Daily at 18:30 IST');
  const [enableAlerts, setEnableAlerts] = useState(true);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (onSaveSettings) {
      onSaveSettings({ gpaThreshold: gpa, attendanceThreshold: attendance });
    }
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Academic Administrator',
        },
        body: JSON.stringify({
          risk_alerts: enableAlerts ? 'enabled' : 'disabled',
        }),
      });
    } catch {
      // safe fallback
    }
    showToast(
      'Settings Updated',
      `Risk criteria set to GPA < ${gpa.toFixed(1)} or Attendance < ${attendance}%. Sync: ${syncSchedule}.`,
      'success'
    );
    onClose();
  };

  const handleReset = () => {
    setGpa(6.0);
    setAttendance(75);
    setSyncSchedule('Daily at 18:30 IST');
    setEnableAlerts(true);
    showToast('Defaults Restored', 'Institutional baseline criteria restored.', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Analytics & Warehouse Configuration"
      subtitle="Manage institutional risk thresholds, ETL sync schedules, and analytical parameters"
      badge="System Configuration"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Risk Thresholds Card */}
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-[#e5e7eb] pb-2">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span>Academic Risk Flagging Thresholds (FactStudentRiskStatus)</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700">CGPA Attention Cutoff:</span>
                <span className="font-mono font-bold text-indigo-700 bg-white border border-[#e5e7eb] px-2 py-0.5 rounded shadow-2xs">
                  GPA &lt; {gpa.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="5.0"
                max="7.5"
                step="0.1"
                value={gpa}
                onChange={(e) => setGpa(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Students below this cumulative GPA threshold are flagged for remedial faculty mentoring.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700">Attendance Attention Cutoff:</span>
                <span className="font-mono font-bold text-amber-700 bg-white border border-[#e5e7eb] px-2 py-0.5 rounded shadow-2xs">
                  Attendance &lt; {attendance}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="85"
                step="1"
                value={attendance}
                onChange={(e) => setAttendance(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Statutory regulatory minimum attendance benchmark across lectures & labs.
              </p>
            </div>
          </div>
        </div>

        {/* Warehouse Sync Preferences */}
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-[#e5e7eb] pb-2">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>Data Warehouse Pipeline Schedule (StarSchema_Academic)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Automated Sync Frequency
              </label>
              <select
                value={syncSchedule}
                onChange={(e) => setSyncSchedule(e.target.value)}
                className="w-full rounded border border-[#e5e7eb] bg-white py-1 px-2.5 text-xs text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="Daily at 18:30 IST">Daily at 18:30 IST (Default)</option>
                <option value="Every 6 Hours">Every 6 Hours</option>
                <option value="Real-time Webhook Sync">Real-time Webhook Sync</option>
                <option value="Manual Trigger Only">Manual Trigger Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Longitudinal Academic Period
              </label>
              <div className="rounded border border-[#e5e7eb] bg-[#f8f9fa] py-1 px-2.5 text-xs text-slate-600 font-mono">
                AY 2025–26 · Semester VI
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableAlerts"
                checked={enableAlerts}
                onChange={(e) => setEnableAlerts(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="enableAlerts" className="text-[11px] text-slate-700 cursor-pointer">
                Broadcast real-time high-risk notifications to department deans
              </label>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded border border-[#e5e7eb] px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#e5e7eb] px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
