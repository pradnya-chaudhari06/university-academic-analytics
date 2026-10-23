'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../../components/layout/AppShell';
import {
  fetchOlapMatrix,
  fetchCourses,
  CoursePerformanceData
} from '../../../lib/api';
import {
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  X,
  RotateCcw,
  Download,
  RefreshCw,
  Sliders,
  Check,
  Building2,
  Calendar
} from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { useAuth } from '../../../lib/auth';

interface OlapMatrixCell {
  semester: string;
  academicYear: string;
  departmentCode: string;
  department: string;
  averageGpa: number;
  passRate: number;
  attendanceRate: number;
  studentCount: number;
}

type OlapOperation = 'NONE' | 'SLICE' | 'DICE' | 'ROLLUP' | 'DRILLDOWN';

export default function OlapPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [matrix, setMatrix] = useState<OlapMatrixCell[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'averageGpa' | 'passRate' | 'attendanceRate' | 'studentCount'>('averageGpa');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Active OLAP Operation
  const [activeOperation, setActiveOperation] = useState<OlapOperation>('NONE');

  // SLICE State
  const [sliceDimension, setSliceDimension] = useState<'time' | 'department'>('time');
  const [sliceTimeVal, setSliceTimeVal] = useState('Semester VI');
  const [sliceDeptVal, setSliceDeptVal] = useState('CE');
  const [sliceResult, setSliceResult] = useState<any | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);

  // DICE State
  const [diceSemesters, setDiceSemesters] = useState<string[]>(['Semester V', 'Semester VI']);
  const [diceDepartments, setDiceDepartments] = useState<string[]>(['CE', 'IT', 'EXTC']);
  const [diceResult, setDiceResult] = useState<any | null>(null);
  const [isLoadingDice, setIsLoadingDice] = useState(false);

  // ROLL-UP State
  const [rollupLevel, setRollupLevel] = useState<'institution' | 'department'>('institution');
  const [rollupResult, setRollupResult] = useState<any[] | null>(null);
  const [isLoadingRollup, setIsLoadingRollup] = useState(false);

  // DRILL-DOWN State
  const [drillTarget, setDrillTarget] = useState<{ semester: string; deptCode: string } | null>(null);
  const [drillCourses, setDrillCourses] = useState<CoursePerformanceData[]>([]);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  const semesters = ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI'];
  const departments = ['CE', 'IT', 'EXTC', 'MECH', 'CIVIL'];

  useEffect(() => {
    fetchOlapMatrix()
      .then((data) => {
        setMatrix(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load OLAP matrix:', err);
        setIsLoading(false);
      });
  }, []);

  // 1. SLICE Execution
  const executeSlice = async (dim: 'time' | 'department', val: string) => {
    setIsLoadingSlice(true);
    try {
      const res = await fetch(`/api/olap/slice?dimension=${dim}&value=${encodeURIComponent(val)}`, {
        headers: { 'X-User-Role': user?.role || 'Academic Administrator' }
      });
      if (!res.ok) throw new Error(`Slice failed with status ${res.status}`);
      const data = await res.json();
      setSliceResult(data);
      showToast('Slice Applied', `Fixed dimension ${data.dimension} = ${data.sliceValue}.`, 'success');
    } catch (err: any) {
      showToast('Slice Failed', err.message || 'Unable to execute slice operation.', 'error');
    } finally {
      setIsLoadingSlice(false);
    }
  };

  // 2. DICE Execution
  const executeDice = async (sems: string[], depts: string[], measure: string) => {
    if (sems.length === 0 || depts.length === 0) {
      showToast('Selection Required', 'Select at least one semester and one department to dice.', 'warning');
      return;
    }
    setIsLoadingDice(true);
    try {
      const semsParam = sems.join(',');
      const deptsParam = depts.join(',');
      const res = await fetch(`/api/olap/dice?semesters=${encodeURIComponent(semsParam)}&departments=${encodeURIComponent(deptsParam)}&measure=${measure}`, {
        headers: { 'X-User-Role': user?.role || 'Academic Administrator' }
      });
      if (!res.ok) throw new Error(`Dice failed with status ${res.status}`);
      const data = await res.json();
      setDiceResult(data);
      showToast('Dice Applied', `Extracted ${data.cellCount}-cell subcube across ${sems.length} semesters × ${depts.length} departments.`, 'success');
    } catch (err: any) {
      showToast('Dice Failed', err.message || 'Unable to execute dice operation.', 'error');
    } finally {
      setIsLoadingDice(false);
    }
  };

  // 3. ROLL-UP Execution
  const executeRollup = async (lvl: 'institution' | 'department') => {
    setIsLoadingRollup(true);
    try {
      const res = await fetch(`/api/olap/rollup?level=${lvl}`, {
        headers: { 'X-User-Role': user?.role || 'Academic Administrator' }
      });
      if (!res.ok) throw new Error(`Rollup failed with status ${res.status}`);
      const data = await res.json();
      setRollupResult(data.data || []);
      showToast('Roll-Up Computed', `Aggregated facts up the hierarchy to ${lvl.toUpperCase()} level.`, 'success');
    } catch (err: any) {
      showToast('Roll-Up Failed', err.message || 'Unable to execute rollup operation.', 'error');
    } finally {
      setIsLoadingRollup(false);
    }
  };

  // 4. DRILL-DOWN Execution
  const loadDrillDownData = async (sem: string, dept: string) => {
    setIsLoadingDrill(true);
    setDrillError(null);
    try {
      const courses = await fetchCourses({ department: dept, semester: sem });
      if (Array.isArray(courses) && courses.length > 0) {
        setDrillCourses(courses);
        setDrillError(null);
      } else {
        setDrillCourses([]);
        setDrillError(`No course evaluations found for ${sem} → ${dept}.`);
      }
    } catch (err: any) {
      console.error(`Failed to load drill-down courses for ${sem} → ${dept}:`, err);
      setDrillCourses([]);
      setDrillError(err?.message || `Failed to fetch course evaluations for ${sem} → ${dept}.`);
    } finally {
      setIsLoadingDrill(false);
    }
  };

  useEffect(() => {
    if (drillTarget) {
      loadDrillDownData(drillTarget.semester, drillTarget.deptCode);
    } else {
      setDrillCourses([]);
    }
  }, [drillTarget]);

  // Handle Operation Selection
  const handleSelectOperation = (op: OlapOperation) => {
    if (activeOperation === op) {
      // Toggle off to default
      setActiveOperation('NONE');
      return;
    }
    setActiveOperation(op);
    if (op === 'SLICE') {
      const val = sliceDimension === 'time' ? sliceTimeVal : sliceDeptVal;
      executeSlice(sliceDimension, val);
    } else if (op === 'DICE') {
      executeDice(diceSemesters, diceDepartments, selectedMetric);
    } else if (op === 'ROLLUP') {
      executeRollup(rollupLevel);
    } else if (op === 'DRILLDOWN') {
      if (!drillTarget) {
        setDrillTarget({ semester: 'Semester VI', deptCode: 'CE' });
      }
    }
  };

  const handleResetCube = () => {
    setActiveOperation('NONE');
    setSliceResult(null);
    setDiceResult(null);
    setRollupResult(null);
    setDrillTarget(null);
    setDrillCourses([]);
    showToast('Cube Reset', 'Restored complete 30-cell conformed OLAP cube.', 'info');
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/reports/export?report_id=olap_cube&format=csv', {
        headers: { 'X-User-Role': user?.role || 'Academic Administrator' }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OLAP_Conformed_Cube_Matrix.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Export Complete', 'OLAP cube downloaded as conformed CSV dossier.', 'success');
    } catch {
      showToast('Export Failed', 'Unable to download OLAP cube data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCellClick = (sem: string, dept: string) => {
    setActiveOperation('DRILLDOWN');
    setDrillTarget({ semester: sem, deptCode: dept });
  };

  const getMetricValue = (sem: string, dept: string) => {
    const found = matrix.find(
      (c) =>
        (c.semester === sem ||
          c.semester.replace('Semester', 'Sem') === sem.replace('Semester', 'Sem')) &&
        (c.departmentCode === dept || c.departmentCode === dept.toUpperCase())
    );
    if (!found) return '-';
    if (selectedMetric === 'averageGpa') return found.averageGpa.toFixed(2);
    if (selectedMetric === 'passRate') return `${found.passRate.toFixed(1)}%`;
    if (selectedMetric === 'attendanceRate') return `${found.attendanceRate.toFixed(1)}%`;
    if (selectedMetric === 'studentCount') return found.studentCount.toLocaleString();
    return '-';
  };

  return (
    <AppShell activeItem="olap-analysis">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Analytics</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">OLAP Cube Engine</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Multi-Dimensional OLAP Analysis (30-Cell Cube)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-dimensional rollups across DimTime &times; DimDepartment &times; FactAcademicPerformance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCube}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#e7eaee] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset to Full Cube</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>Export Cube CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE OLAP OPERATIONS BANNER (All 4 Selectable & Functional)         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. SLICE */}
          <div
            onClick={() => handleSelectOperation('SLICE')}
            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
              activeOperation === 'SLICE'
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/40 shadow-xs'
                : 'bg-white border-[#e7eaee] hover:border-indigo-300 hover:bg-indigo-50/20 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-indigo-700 font-bold mb-1">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>1. SLICE</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                activeOperation === 'SLICE' ? 'bg-indigo-200 text-indigo-900' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {activeOperation === 'SLICE' ? 'Active' : 'Interactive'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug">
              Fixes a single dimension coordinate (Time or Department) and projects conformed facts.
            </p>
          </div>

          {/* 2. DICE */}
          <div
            onClick={() => handleSelectOperation('DICE')}
            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
              activeOperation === 'DICE'
                ? 'bg-orange-50 border-[#f87941] ring-2 ring-[#f87941]/40 shadow-xs'
                : 'bg-white border-[#e7eaee] hover:border-[#f87941] hover:bg-orange-50/20 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-[#f87941] font-bold mb-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>2. DICE</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                activeOperation === 'DICE' ? 'bg-[#fcd5bf] text-[#c2410c]' : 'bg-[#fff4ed] text-[#f87941]'
              }`}>
                {activeOperation === 'DICE' ? 'Active' : 'Interactive'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug">
              Selects a sub-cube by specifying sets across multiple dimensions simultaneously.
            </p>
          </div>

          {/* 3. ROLL-UP */}
          <div
            onClick={() => handleSelectOperation('ROLLUP')}
            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
              activeOperation === 'ROLLUP'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                : 'bg-white border-[#e7eaee] hover:border-emerald-300 hover:bg-emerald-50/20 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 font-bold mb-1">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                <span>3. ROLL-UP</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                activeOperation === 'ROLLUP' ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeOperation === 'ROLLUP' ? 'Active' : 'Interactive'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug">
              Aggregates facts up the hierarchy from Department grain to Institutional totals.
            </p>
          </div>

          {/* 4. DRILL-DOWN */}
          <div
            onClick={() => handleSelectOperation('DRILLDOWN')}
            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
              activeOperation === 'DRILLDOWN'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-white border-[#e7eaee] hover:border-amber-300 hover:bg-amber-50/20 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 font-bold mb-1">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4" />
                <span>4. DRILL-DOWN</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                activeOperation === 'DRILLDOWN' ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeOperation === 'DRILLDOWN' ? 'Active' : 'Interactive'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug">
              De-aggregates high-level metrics into finer course-level evaluations and student grain.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPERATION DEDICATED CONTROLS PANEL                                        */}
        {/* ========================================================================= */}

        {/* SLICE CONTROLS */}
        {activeOperation === 'SLICE' && (
          <div className="bg-white rounded-lg border border-indigo-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span>OLAP SLICE Parameter Controls</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                Fix 1 Dimension Coordinate
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Target Dimension:</span>
                <select
                  value={sliceDimension}
                  onChange={(e) => {
                    const dim = e.target.value as 'time' | 'department';
                    setSliceDimension(dim);
                    executeSlice(dim, dim === 'time' ? sliceTimeVal : sliceDeptVal);
                  }}
                  className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="time">Time Dimension (Semester)</option>
                  <option value="department">Department Dimension (Faculty)</option>
                </select>
              </div>

              {sliceDimension === 'time' ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Fixed Semester:</span>
                  <select
                    value={sliceTimeVal}
                    onChange={(e) => {
                      setSliceTimeVal(e.target.value);
                      executeSlice('time', e.target.value);
                    }}
                    className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {semesters.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Fixed Department:</span>
                  <select
                    value={sliceDeptVal}
                    onChange={(e) => {
                      setSliceDeptVal(e.target.value);
                      executeSlice('department', e.target.value);
                    }}
                    className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => executeSlice(sliceDimension, sliceDimension === 'time' ? sliceTimeVal : sliceDeptVal)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isLoadingSlice ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                <span>Execute Slice</span>
              </button>
            </div>

            {sliceResult?.summary && (
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Slice Mean GPA</span>
                  <span className="text-base font-bold text-indigo-950 font-mono">{sliceResult.summary.averageGpa.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Slice Pass Rate</span>
                  <span className="text-base font-bold text-indigo-950 font-mono">{sliceResult.summary.passRate.toFixed(1)}%</span>
                </div>
                <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Attendance</span>
                  <span className="text-base font-bold text-indigo-950 font-mono">{sliceResult.summary.attendanceRate.toFixed(1)}%</span>
                </div>
                <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Enrolled Students</span>
                  <span className="text-base font-bold text-indigo-950 font-mono">{sliceResult.summary.totalStudents.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DICE CONTROLS */}
        {activeOperation === 'DICE' && (
          <div className="bg-white rounded-lg border border-[#fcd5bf] p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#fcd5bf]/60">
              <div className="flex items-center gap-2 text-[#c2410c] font-bold text-xs">
                <Layers className="h-4 w-4 text-[#f87941]" />
                <span>OLAP DICE Sub-Cube Controls</span>
              </div>
              <span className="text-[11px] text-[#f87941] font-medium bg-[#fff4ed] px-2 py-0.5 rounded border border-[#fcd5bf]">
                Multi-Dimensional Subcube Extraction
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Select Semesters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {semesters.map((s) => {
                    const isSelected = diceSemesters.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const updated = isSelected ? diceSemesters.filter((x) => x !== s) : [...diceSemesters, s];
                          setDiceSemesters(updated);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#f87941] text-white border-[#f87941]'
                            : 'bg-white text-slate-700 border-[#e7eaee] hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Select Departments:</span>
                <div className="flex flex-wrap gap-1.5">
                  {departments.map((d) => {
                    const isSelected = diceDepartments.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const updated = isSelected ? diceDepartments.filter((x) => x !== d) : [...diceDepartments, d];
                          setDiceDepartments(updated);
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1e2438] text-white border-[#1e2438]'
                            : 'bg-white text-slate-700 border-[#e7eaee] hover:bg-slate-50'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#fcd5bf]/40">
                <span className="text-slate-500">
                  Sub-cube grain: <strong>{diceSemesters.length}</strong> Semesters &times; <strong>{diceDepartments.length}</strong> Departments = <strong>{diceSemesters.length * diceDepartments.length}</strong> Cells
                </span>
                <button
                  type="button"
                  onClick={() => executeDice(diceSemesters, diceDepartments, selectedMetric)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#f87941] text-white font-semibold hover:bg-[#e06530] transition-colors shadow-2xs cursor-pointer"
                >
                  {isLoadingDice ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span>Execute Dice</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROLL-UP CONTROLS */}
        {activeOperation === 'ROLLUP' && (
          <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <span>OLAP ROLL-UP Hierarchy Aggregation</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                Aggregates Facts Up the Grain
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-700">Hierarchy Roll-Up Target:</span>
              <div className="inline-flex rounded-md border border-[#e7eaee] p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setRollupLevel('institution');
                    executeRollup('institution');
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    rollupLevel === 'institution'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Institution-Wide (Across 5 Departments)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRollupLevel('department');
                    executeRollup('department');
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    rollupLevel === 'department'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Department Cumulative (Across 6 Semesters)
                </button>
              </div>

              <button
                type="button"
                onClick={() => executeRollup(rollupLevel)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
              >
                {isLoadingRollup ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                <span>Refresh Roll-Up</span>
              </button>
            </div>
          </div>
        )}

        {/* DRILL-DOWN CONTROLS */}
        {activeOperation === 'DRILLDOWN' && (
          <div className="bg-white rounded-lg border border-amber-300 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ArrowDownRight className="h-4 w-4 text-amber-600" />
                <span>OLAP DRILL-DOWN Granular Navigation</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                De-aggregates to Course & Student Grain
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Target Semester:</span>
                <select
                  value={drillTarget?.semester || 'Semester VI'}
                  onChange={(e) => setDrillTarget({ semester: e.target.value, deptCode: drillTarget?.deptCode || 'CE' })}
                  className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {semesters.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Target Department:</span>
                <select
                  value={drillTarget?.deptCode || 'CE'}
                  onChange={(e) => setDrillTarget({ semester: drillTarget?.semester || 'Semester VI', deptCode: e.target.value })}
                  className="rounded-md border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Tip: Click any cell directly in the matrix below to instantly drill into that department & semester coordinate.
              </p>
            </div>
          </div>
        )}

        {/* Measure Switcher Toolbar */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#1e2238]">Active Measure Projection:</span>
            <div className="inline-flex rounded-md border border-[#e7eaee] p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedMetric('averageGpa')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'averageGpa' ? 'bg-[#1e2438] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Avg GPA
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('passRate')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'passRate' ? 'bg-[#1e2438] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pass %
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('attendanceRate')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'attendanceRate' ? 'bg-[#1e2438] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attendance %
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('studentCount')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedMetric === 'studentCount' ? 'bg-[#1e2438] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Headcount
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-mono">
              Cube Coordinates: 6 Time &times; 5 Departments = 30 Conformed Cells
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONDITIONAL RENDER: ROLL-UP TABLE VIEW                                   */}
        {/* ========================================================================= */}
        {activeOperation === 'ROLLUP' && rollupResult && (
          <div className="bg-white rounded-lg border border-emerald-300 shadow-2xs overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                  <span>OLAP Roll-Up Aggregation: {rollupLevel === 'institution' ? 'Institutional Cohort Rollup' : 'Departmental Cumulative Rollup'}</span>
                </h2>
                <p className="text-[11.5px] text-emerald-800 mt-0.5">
                  Aggregated across conformed facts with weighted mathematical consolidation
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {rollupResult.length} Consolidated Rows
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fafbfd] text-slate-600 font-semibold border-b border-[#e7eaee]">
                  <tr>
                    <th className="py-2.5 px-4">{rollupLevel === 'institution' ? 'Semester (DimTime)' : 'Department'}</th>
                    <th className="py-2.5 px-4">{rollupLevel === 'institution' ? 'Consolidated Facets' : 'Consolidated Semesters'}</th>
                    <th className="py-2.5 px-4 text-right">Average GPA</th>
                    <th className="py-2.5 px-4 text-right">Pass Percentage</th>
                    <th className="py-2.5 px-4 text-right">Attendance Rate</th>
                    <th className="py-2.5 px-4 text-right">Students Represented</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {rollupResult.map((r, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-[#1e2238]">
                        {r.semester || `${r.department} (${r.departmentCode})`}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {r.departmentsConsolidated ? `${r.departmentsConsolidated} Engineering Departments` : `${r.semestersConsolidated} Semesters (I–VI)`}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700">
                        {Number(r.averageGpa).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {Number(r.passRate).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {Number(r.attendanceRate).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1e2238]">
                        {(r.totalEnrolledStudents || r.cohortStudents || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRIMARY OLAP MATRIX GRID (30-Cell Conformed Cube)                         */}
        {/* ========================================================================= */}
        {activeOperation !== 'ROLLUP' && (
          <div className="bg-white rounded-lg border border-[#e7eaee] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e7eaee] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1e2238]">
                  OLAP Matrix Grid: DimTime &times; DimDepartment
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  (Measure: {selectedMetric})
                </span>
                {activeOperation === 'DICE' && (
                  <span className="text-[10px] font-bold text-[#f87941] bg-[#fff4ed] px-2 py-0.5 rounded border border-[#fcd5bf]">
                    DICE Filter Active
                  </span>
                )}
                {activeOperation === 'SLICE' && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    SLICE Filter Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                  <ArrowDownRight className="h-3 w-3 text-amber-600" />
                  <span>Click cell to Drill-Down</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table id="olap-matrix-table" className="w-full text-center text-xs">
                <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Academic Semester (DimTime)</th>
                    {departments.map((dept) => {
                      const isDiceDept = activeOperation === 'DICE' && diceDepartments.includes(dept);
                      const isSliceDept = activeOperation === 'SLICE' && sliceDimension === 'department' && sliceDeptVal === dept;
                      return (
                        <th
                          key={dept}
                          className={`py-2.5 px-4 font-bold transition-colors ${
                            isSliceDept
                              ? 'bg-indigo-100 text-indigo-950 font-extrabold border-b-2 border-indigo-500'
                              : isDiceDept
                              ? 'bg-[#fff4ed] text-[#c2410c] font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          {dept}
                        </th>
                      );
                    })}
                    <th className="py-2.5 px-4 font-bold text-indigo-700 bg-indigo-50/50">Cohort Roll-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {semesters.map((sem) => {
                    const isSliceSem = activeOperation === 'SLICE' && sliceDimension === 'time' && sliceTimeVal === sem;
                    const isDiceSem = activeOperation === 'DICE' && diceSemesters.includes(sem);

                    const semCells = matrix.filter(
                      (c) =>
                        c.semester === sem ||
                        c.semester.replace('Semester', 'Sem') === sem.replace('Semester', 'Sem')
                    );
                    const semRollup =
                      semCells.length > 0
                        ? selectedMetric === 'averageGpa'
                          ? (semCells.reduce((sum, c) => sum + c.averageGpa, 0) / semCells.length).toFixed(2)
                          : selectedMetric === 'passRate'
                          ? `${(semCells.reduce((sum, c) => sum + c.passRate, 0) / semCells.length).toFixed(1)}%`
                          : selectedMetric === 'attendanceRate'
                          ? `${(semCells.reduce((sum, c) => sum + c.attendanceRate, 0) / semCells.length).toFixed(1)}%`
                          : semCells.reduce((sum, c) => sum + c.studentCount, 0).toLocaleString()
                        : '-';

                    return (
                      <tr
                        key={sem}
                        className={`transition-colors ${
                          isSliceSem
                            ? 'bg-indigo-50/50'
                            : isDiceSem
                            ? 'bg-orange-50/20'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td
                          className={`py-3 px-4 text-left font-sans transition-colors ${
                            isSliceSem
                              ? 'bg-indigo-100/60 text-indigo-950 font-bold border-l-2 border-indigo-500 pl-3.5'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {sem}
                        </td>
                        {departments.map((dept) => {
                          const isDrillCell =
                            drillTarget?.semester === sem && drillTarget?.deptCode === dept;
                          const inDiceScope =
                            activeOperation === 'DICE' && diceSemesters.includes(sem) && diceDepartments.includes(dept);

                          let cellStyle = 'text-slate-700 hover:bg-amber-50/80 hover:text-amber-900';
                          if (isDrillCell) {
                            cellStyle = 'bg-amber-100 text-amber-950 font-bold ring-2 ring-amber-500 ring-inset shadow-xs';
                          } else if (inDiceScope) {
                            cellStyle = 'bg-[#fff4ed] text-[#c2410c] font-bold ring-1 ring-[#fcd5bf]';
                          }

                          return (
                            <td
                              key={dept}
                              onClick={() => handleCellClick(sem, dept)}
                              className={`py-3 px-4 font-semibold cursor-pointer transition-all select-none ${cellStyle}`}
                              title={`Click to drill down into ${dept} courses for ${sem}`}
                            >
                              <span className="inline-flex items-center justify-center gap-1">
                                {getMetricValue(sem, dept)}
                                {isDrillCell && (
                                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-700 inline" />
                                )}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 font-bold text-indigo-700 bg-indigo-50/40">
                          {semRollup}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COURSE-LEVEL DRILL-DOWN BREAKDOWN PANEL                                    */}
        {/* ========================================================================= */}
        {drillTarget && (
          <div id="drill-down-panel" className="bg-white rounded-lg border border-amber-300 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="text-slate-600">Institution</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">Department: {drillTarget.deptCode}</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">Semester: {drillTarget.semester}</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">Course Level Grain</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-amber-200 text-amber-800 shadow-2xs">
                    <ArrowDownRight className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-[#1e2238]">
                    Drill-Down: {drillTarget.semester} &rarr; {drillTarget.deptCode}
                  </h3>
                  {!isLoadingDrill && drillCourses.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-amber-200 text-amber-800 font-mono">
                      {drillCourses.length} {drillCourses.length === 1 ? 'Course' : 'Courses'}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrillTarget(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 bg-white text-xs font-semibold text-slate-700 hover:bg-amber-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <span>Close Drill-Down</span>
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>

            {isLoadingDrill ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="inline-block animate-spin h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full mb-2" />
                <p className="font-medium text-slate-700">Loading course-level evaluations from warehouse...</p>
              </div>
            ) : drillError ? (
              <div className="p-6 text-center text-xs text-rose-600 font-medium bg-rose-50/50 m-4 rounded-lg border border-rose-200">
                <p className="font-semibold text-rose-700 mb-1">Unable to Load Course Breakdown</p>
                <p>{drillError}</p>
              </div>
            ) : drillCourses.length === 0 ? (
              <div className="p-6 text-center text-xs text-amber-700 font-medium bg-amber-50/50 m-4 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-800 mb-1">No Course Records Found</p>
                <p>No conformed course evaluations were returned for {drillTarget.semester} &rarr; {drillTarget.deptCode}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Course Code</th>
                      <th className="py-2.5 px-4 text-left">Course Name</th>
                      <th className="py-2.5 px-4 text-center">Credits</th>
                      <th className="py-2.5 px-4 text-right">Evaluated Students</th>
                      <th className="py-2.5 px-4 text-right">Average GPA</th>
                      <th className="py-2.5 px-4 text-right">Pass Rate</th>
                      <th className="py-2.5 px-4 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drillCourses.map((c) => {
                      const evalStudents = Number(c.evaluatedCount ?? c.enrolledStudents ?? 0);
                      const gpaVal = c.averageGpa != null && !isNaN(Number(c.averageGpa))
                        ? Number(c.averageGpa).toFixed(2)
                        : '-';
                      const passVal = c.passRate != null && !isNaN(Number(c.passRate))
                        ? `${Number(c.passRate).toFixed(1)}%`
                        : '-';
                      const attVal = c.attendanceRate != null && !isNaN(Number(c.attendanceRate))
                        ? `${Number(c.attendanceRate).toFixed(1)}%`
                        : '-';
                      const creditsVal = c.credits != null && !isNaN(Number(c.credits))
                        ? Number(c.credits).toFixed(1)
                        : '4.0';

                      return (
                        <tr key={c.code} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {c.code}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {c.name}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {creditsVal}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-800 font-semibold">
                            {evalStudents.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-700 font-bold">
                            {gpaVal}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                            {passVal}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">
                            {attVal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
