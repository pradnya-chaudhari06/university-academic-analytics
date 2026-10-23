'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import {
  Settings,
  Sliders,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lock,
  Brain,
  Layers,
  Bell,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { fetchHealth, HealthStatusResponse } from '../../lib/api';

interface SettingsData {
  default_academic_year: string;
  default_semester: string;
  default_department: string;
  default_analytics_measure: string;
  etl_batch_size: number;
  etl_validation_mode: string;
  auto_warehouse_refresh: string;
  kmeans_k: number;
  apriori_min_confidence: number;
  apriori_min_support: number;
  decision_tree_max_depth: number;
  session_timeout_minutes: number;
  system_notifications: string;
  risk_alerts: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin =
    user?.role === 'System Administrator' ||
    user?.role === 'Academic Administrator' ||
    user?.role === 'Administrator';

  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [academicYear, setAcademicYear] = useState('AY 2025–26');
  const [semester, setSemester] = useState('Semester VI');
  const [department, setDepartment] = useState('All Departments');
  const [measure, setMeasure] = useState('averageGpa');

  const [batchSize, setBatchSize] = useState(500);
  const [validationMode, setValidationMode] = useState('standard');
  const [autoRefresh, setAutoRefresh] = useState('enabled');

  const [kmeansK, setKmeansK] = useState(3);
  const [minConfidence, setMinConfidence] = useState(0.60);
  const [minSupport, setMinSupport] = useState(0.015);
  const [maxDepth, setMaxDepth] = useState(3);

  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [notifications, setNotifications] = useState('enabled');
  const [riskAlerts, setRiskAlerts] = useState('enabled');

  const loadSettings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [healthData, settingsRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetch('/api/settings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (healthData) setHealth(healthData);

      if (settingsRes?.settings) {
        const s: SettingsData = settingsRes.settings;
        if (s.default_academic_year) setAcademicYear(s.default_academic_year);
        if (s.default_semester) setSemester(s.default_semester);
        if (s.default_department) setDepartment(s.default_department);
        if (s.default_analytics_measure) setMeasure(s.default_analytics_measure);
        if (s.etl_batch_size) setBatchSize(Number(s.etl_batch_size));
        if (s.etl_validation_mode) setValidationMode(s.etl_validation_mode);
        if (s.auto_warehouse_refresh) setAutoRefresh(s.auto_warehouse_refresh);
        if (s.kmeans_k) setKmeansK(Number(s.kmeans_k));
        if (s.apriori_min_confidence) setMinConfidence(Number(s.apriori_min_confidence));
        if (s.apriori_min_support) setMinSupport(Number(s.apriori_min_support));
        if (s.decision_tree_max_depth) setMaxDepth(Number(s.decision_tree_max_depth));
        if (s.session_timeout_minutes) setTimeoutMinutes(Number(s.session_timeout_minutes));
        if (s.system_notifications) setNotifications(s.system_notifications);
        if (s.risk_alerts) setRiskAlerts(s.risk_alerts);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setErrorMessage(err.message || 'Unable to retrieve settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied', 'Only Administrators may modify institutional parameters.', 'error');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || 'Academic Administrator',
        },
        body: JSON.stringify({
          default_academic_year: academicYear,
          default_semester: semester,
          default_department: department,
          default_analytics_measure: measure,
          etl_batch_size: Number(batchSize),
          etl_validation_mode: validationMode,
          auto_warehouse_refresh: autoRefresh,
          kmeans_k: Number(kmeansK),
          apriori_min_confidence: Number(minConfidence),
          apriori_min_support: Number(minSupport),
          decision_tree_max_depth: Number(maxDepth),
          session_timeout_minutes: Number(timeoutMinutes),
          system_notifications: notifications,
          risk_alerts: riskAlerts,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to save settings (Status ${res.status})`);
      }

      setSaveSuccess(true);
      showToast('Settings Persisted', 'Institutional parameters have been updated and saved to database.', 'success');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMessage(err.message || 'Failed to persist settings.');
      showToast('Save Failed', err.message || 'Unable to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setAcademicYear('AY 2025–26');
    setSemester('Semester VI');
    setDepartment('All Departments');
    setMeasure('averageGpa');
    setBatchSize(500);
    setValidationMode('standard');
    setAutoRefresh('enabled');
    setKmeansK(3);
    setMinConfidence(0.60);
    setMinSupport(0.015);
    setMaxDepth(3);
    setTimeoutMinutes(60);
    setNotifications('enabled');
    setRiskAlerts('enabled');
    showToast('Defaults Restored', 'Form values reset to conformed defaults. Click Save to persist.', 'info');
  };

  return (
    <AppShell activeItem="settings">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>System</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Settings & Parameters</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Institutional System Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Governs conformed academic parameters, ETL batch ingestion behavior, and analytical algorithms
            </p>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#e7eaee] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#f87941] text-white text-xs font-semibold hover:bg-[#e06530] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Persisted</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
              <Lock className="h-3.5 w-3.5" />
              <span>Read-Only Policy (Admin Required)</span>
            </div>
          )}
        </div>

        {/* Status Banners */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Settings successfully persisted to warehouse database and active session!</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Academic & Dashboard Defaults */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="h-4 w-4 text-[#f87941]" />
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Academic & Dashboard Defaults
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="AY 2025–26">AY 2025–26 (Active Institutional Cycle)</option>
                    <option value="AY 2024–25">AY 2024–25 (Historical Audited)</option>
                    <option value="AY 2023–24">AY 2023–24 (Archival Baseline)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Sets the primary academic year window across all dashboards.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Semester Focus
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="Semester VI">Semester VI (Active Teaching Period)</option>
                    <option value="Semester V">Semester V</option>
                    <option value="Semester IV">Semester IV</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Department Slice
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="All Departments">All Departments (Consolidated University View)</option>
                    <option value="Computer Engineering">Computer Engineering (CE)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                    <option value="Electronics & Telecommunication">Electronics (EXTC)</option>
                    <option value="Mechanical Engineering">Mechanical (MECH)</option>
                    <option value="Civil Engineering">Civil (CIVIL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Analytics Primary Measure
                  </label>
                  <select
                    value={measure}
                    onChange={(e) => setMeasure(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="averageGpa">Average Grade Point (Scale 10.0)</option>
                    <option value="passRate">Cohort Pass Rate (%)</option>
                    <option value="attendanceRate">Biometric Attendance Percentage (%)</option>
                    <option value="studentCount">Enrolled Student Headcount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Data Warehouse & ETL Configuration */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Database className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Data Warehouse & ETL Ingestion
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ETL Extraction Batch Size (Chunking Grain)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    step={50}
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-mono text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Chunk size for streaming staging records into star schema facts.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Schema Validation Mode
                  </label>
                  <select
                    value={validationMode}
                    onChange={(e) => setValidationMode(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="standard">Standard (Strict Foreign Key & Surrogate Checks)</option>
                    <option value="strict">Strict (Fail Batch on Single Discrepancy)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Automatic Cube Aggregation Refresh
                  </label>
                  <select
                    value={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="enabled">Enabled (Rebuild Materialized Rollups Immediately)</option>
                    <option value="disabled">Disabled (On-Demand Refresh Only)</option>
                  </select>
                </div>

                <div className="pt-2 p-3 rounded-md bg-[#fafbfd] border border-slate-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Active Storage Engine:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {health?.databaseEngine || 'Conformed Star Schema'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Data Mining & Algorithmic Thresholds */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Brain className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-[#1e2238]">
                  Data Mining & Clustering Thresholds
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">
                      Default K-Means Cluster Count (K)
                    </label>
                    <span className="font-mono font-bold text-emerald-700">{kmeansK}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    value={kmeansK}
                    onChange={(e) => setKmeansK(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full accent-[#f87941] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>2 Clusters</span>
                    <span>3 (Default)</span>
                    <span>6 Clusters</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Apriori Min Confidence
                    </label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.1}
                      max={1.0}
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                      disabled={!isAdmin}
                      className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-mono text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Apriori Min Support
                    </label>
                    <input
                      type="number"
                      step={0.005}
                      min={0.005}
                      max={0.2}
                      value={minSupport}
                      onChange={(e) => setMinSupport(Number(e.target.value))}
                      disabled={!isAdmin}
                      className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-mono text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Decision Tree Maximum Depth
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-mono text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Prevents decision tree overfitting on academic student attributes.</p>
                </div>
              </div>
            </div>

            {/* 4. Security & System Parameters */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="h-4 w-4 text-slate-700" />
                <h2 className="text-sm font-bold text-[#1e2238]">
                  System & Notification Policies
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Session Inactivity Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-mono text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Automatic portal logout window for inactive authenticated sessions.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    System Event Notifications
                  </label>
                  <select
                    value={notifications}
                    onChange={(e) => setNotifications(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="enabled">Enabled (Broadcast ETL and System Events)</option>
                    <option value="disabled">Disabled (Silent Operation)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Real-Time Academic Risk Alerts
                  </label>
                  <select
                    value={riskAlerts}
                    onChange={(e) => setRiskAlerts(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] bg-white font-medium text-slate-800 focus:border-[#f87941] outline-hidden disabled:bg-slate-50"
                  >
                    <option value="enabled">Enabled (Flag Faculty when Attendance &lt; 75% or GPA &lt; 6.00)</option>
                    <option value="disabled">Disabled (Manual Audit Only)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>RBAC Enforcement:</span>
                  <span className="font-semibold text-emerald-700">Strict Role Validation (HTTP 403)</span>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e7eaee]">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 rounded-md border border-[#e7eaee] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#f87941] text-white text-xs font-semibold hover:bg-[#e06530] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Persisting...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Institutional Configuration</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </AppShell>
  );
}
