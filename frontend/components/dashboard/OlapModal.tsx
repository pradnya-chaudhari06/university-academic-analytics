'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '../common/Modal';
import { Layers, Filter, CheckCircle2, Clock, Info, ExternalLink, BarChart3, Grid3X3 } from 'lucide-react';
import { DepartmentPerformanceData } from '../../types/academic';
import { fetchOlapMatrix, OlapMatrixCell } from '../../lib/api';

export interface OlapModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: DepartmentPerformanceData[];
  isLive?: boolean;
}

const SEMESTERS = [
  { value: 'Sem I', label: 'Semester I' },
  { value: 'Sem II', label: 'Semester II' },
  { value: 'Sem III', label: 'Semester III' },
  { value: 'Sem IV', label: 'Semester IV' },
  { value: 'Sem V', label: 'Semester V' },
  { value: 'Sem VI', label: 'Semester VI' },
];

const DEPARTMENTS = [
  { code: 'CE', name: 'Computer Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'EXTC', name: 'Electronics & Telecommunication' },
  { code: 'MECH', name: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
];

export default function OlapModal({
  isOpen,
  onClose,
  departments = [],
  isLive = false,
}: OlapModalProps) {
  const [matrix, setMatrix] = useState<OlapMatrixCell[]>([]);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('Sem VI');
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'slice' | 'matrix'>('slice');
  const [selectedMetric, setSelectedMetric] = useState<'averageGpa' | 'passRate' | 'attendanceRate' | 'studentCount'>('averageGpa');

  // Load live /api/olap/matrix when modal is opened
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setIsLoadingMatrix(true);

      fetchOlapMatrix()
        .then((data) => {
          if (isMounted) {
            setMatrix(data);
            setIsLoadingMatrix(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to load live OLAP matrix from /api/olap/matrix, using fallback:', err);
          if (isMounted) setIsLoadingMatrix(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  const hasLiveMatrix = matrix.length > 0;

  // Filtered rows for Slice view
  const sliceRows = hasLiveMatrix
    ? matrix
        .filter((cell) => {
          const matchSem =
            selectedSemester === 'ALL' ||
            cell.semester === selectedSemester ||
            cell.semester.replace('Semester', 'Sem') === selectedSemester.replace('Semester', 'Sem');
          const matchDept = selectedDeptCode === 'ALL' || cell.departmentCode === selectedDeptCode;
          return matchSem && matchDept;
        })
        .map((cell) => {
          const deptMatch = departments.find((d) => d.code === cell.departmentCode);
          return {
            code: cell.departmentCode,
            name: cell.department,
            semester: cell.semester,
            totalStudents: cell.studentCount,
            averageGpa: cell.averageGpa,
            passRate: cell.passRate,
            attendanceRate: cell.attendanceRate,
            atRiskStudents: deptMatch ? deptMatch.atRiskStudents : 0,
          };
        })
    : (selectedDeptCode === 'ALL'
        ? departments
        : departments.filter((d) => d.code === selectedDeptCode)
      ).map((d) => ({
        ...d,
        semester: selectedSemester,
      }));

  // Dynamic OLAP Roll-up Summary across the active selection
  const totalStudents = sliceRows.reduce((sum, r) => sum + r.totalStudents, 0);
  const totalAtRisk = sliceRows.reduce((sum, r) => sum + r.atRiskStudents, 0);
  const weightedGpa =
    totalStudents > 0
      ? (
          sliceRows.reduce((sum, r) => sum + r.averageGpa * r.totalStudents, 0) /
          totalStudents
        ).toFixed(2)
      : '0.00';
  const weightedPass =
    totalStudents > 0
      ? (
          sliceRows.reduce((sum, r) => sum + r.passRate * r.totalStudents, 0) /
          totalStudents
        ).toFixed(1)
      : '0.0';
  const weightedAttendance =
    totalStudents > 0
      ? (
          sliceRows.reduce((sum, r) => sum + r.attendanceRate * r.totalStudents, 0) /
          totalStudents
        ).toFixed(1)
      : '0.0';

  const getMetricCellValue = (semValue: string, deptCode: string) => {
    const found = matrix.find(
      (c) =>
        (c.semester === semValue ||
          c.semester.replace('Semester', 'Sem') === semValue.replace('Semester', 'Sem')) &&
        c.departmentCode === deptCode
    );
    if (!found) return '-';
    if (selectedMetric === 'averageGpa') return found.averageGpa.toFixed(2);
    if (selectedMetric === 'passRate') return `${found.passRate.toFixed(1)}%`;
    if (selectedMetric === 'attendanceRate') return `${found.attendanceRate.toFixed(1)}%`;
    if (selectedMetric === 'studentCount') return found.studentCount.toLocaleString();
    return '-';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OLAP Multi-Dimensional Analytics"
      subtitle="Conformed Star Schema OLAP Operations on FactAcademicPerformance (/api/olap/matrix)"
      badge={hasLiveMatrix ? 'Live 30-Cell OLAP Cube' : 'OLAP Cube: Fallback'}
      maxWidth="2xl"
    >
      <div className="space-y-3.5">
        {/* Dimension Slicer & Dicer Control Bar */}
        <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2.5 text-xs space-y-2">
          {/* Slice Dimension (Time) & Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                Time Slice (DimTime):
              </span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 focus:outline-hidden cursor-pointer"
              >
                <option value="Sem VI">Semester VI (Active Semester)</option>
                <option value="ALL">All Semesters (I–VI Aggregate)</option>
                {SEMESTERS.filter((s) => s.value !== 'Sem VI').map((sem) => (
                  <option key={sem.value} value={sem.value}>{sem.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded border border-[#e5e7eb] bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('slice')}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    viewMode === 'slice'
                      ? 'bg-[#1e2438] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Slice View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                    viewMode === 'matrix'
                      ? 'bg-[#1e2438] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30-Cell Grid
                </button>
              </div>

              {hasLiveMatrix ? (
                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Live /api/olap/matrix
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 font-mono">
                  <Info className="h-3 w-3 text-amber-600" />
                  {isLoadingMatrix ? 'Loading Cube...' : 'Fallback Data'}
                </span>
              )}
            </div>
          </div>

          {/* Dice Dimension (Department Filter) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-600" />
                Dice Dimension (DimDept):
              </span>
              <div className="flex items-center rounded border border-[#e5e7eb] bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedDeptCode('ALL')}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                    selectedDeptCode === 'ALL'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All (5)
                </button>
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.code}
                    type="button"
                    onClick={() => setSelectedDeptCode(dept.code)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                      selectedDeptCode === dept.code
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {dept.code}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === 'matrix' ? (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-semibold text-slate-600">Measure:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="rounded border border-[#e5e7eb] bg-white px-2 py-0.5 text-[10.5px] font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="averageGpa">Avg GPA</option>
                  <option value="passRate">Pass %</option>
                  <option value="attendanceRate">Attendance %</option>
                  <option value="studentCount">Headcount</option>
                </select>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-slate-500">
                <span>Grain: DimDepartment × {selectedSemester}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Mode 1: Slice & Dice Table View */}
        {viewMode === 'slice' && (
          <div className="overflow-x-auto rounded-md border border-[#e5e7eb]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[10px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Department (DimDept)</th>
                  {selectedSemester === 'ALL' && <th className="py-2.5 px-3">Semester</th>}
                  <th className="py-2.5 px-3 text-right">Students</th>
                  <th className="py-2.5 px-3 text-right">Average GPA</th>
                  <th className="py-2.5 px-3 text-right">Pass Rate</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                  <th className="py-2.5 px-3 text-right">At-Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sliceRows.map((row, idx) => (
                  <tr key={`${row.code}-${row.semester || idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900">{row.name}</span>
                      <span className="ml-1.5 rounded border border-[#e5e7eb] bg-[#f8f9fa] px-1 py-0.2 font-mono text-[9px] text-slate-600">
                        {row.code}
                      </span>
                    </td>
                    {selectedSemester === 'ALL' && (
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{row.semester}</td>
                    )}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {row.totalStudents.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                      {row.averageGpa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                      {row.passRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.attendanceRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-700">
                      {row.atRiskStudents.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {sliceRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      {isLoadingMatrix ? 'Loading OLAP rows...' : 'No department records match criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#e7eaee] bg-[#f8f9fa] font-semibold text-slate-900">
                  <td className="py-2 px-3 text-[11px] uppercase">
                    Roll-up Summary ({selectedDeptCode === 'ALL' ? 'University Total' : selectedDeptCode})
                  </td>
                  {selectedSemester === 'ALL' && <td />}
                  <td className="py-2 px-3 text-right font-mono text-[11px]">
                    {totalStudents.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-indigo-700 font-bold">
                    {weightedGpa}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-emerald-700 font-bold">
                    {weightedPass}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-800">
                    {weightedAttendance}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-amber-700 font-bold">
                    {totalAtRisk.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* View Mode 2: 30-Cell Cross-Tab Matrix */}
        {viewMode === 'matrix' && (
          <div className="overflow-x-auto rounded-md border border-[#e5e7eb]">
            <table className="w-full text-center text-xs">
              <thead className="bg-[#fafbfd] text-slate-600 font-semibold border-b border-[#e7eaee]">
                <tr>
                  <th className="py-2 px-3 text-left">Semester (DimTime)</th>
                  {DEPARTMENTS.map((d) => (
                    <th key={d.code} className="py-2 px-3 font-bold text-slate-800">{d.code}</th>
                  ))}
                  <th className="py-2 px-3 font-bold text-indigo-700 bg-indigo-50/50">Roll-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {SEMESTERS.map((sem) => {
                  const semCells = matrix.filter(
                    (c) =>
                      c.semester === sem.value ||
                      c.semester.replace('Semester', 'Sem') === sem.value
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
                    <tr key={sem.value} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-slate-800">{sem.label}</td>
                      {DEPARTMENTS.map((d) => (
                        <td key={d.code} className="py-2.5 px-3 text-slate-700 font-semibold">
                          {getMetricCellValue(sem.value, d.code)}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 font-bold text-indigo-700 bg-indigo-50/40">
                        {semRollup}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* OLAP Controls Context & Full-screen Link */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
          <span>Target: DimTime × DimDepartment (30 cells conformed in FactAcademicPerformance)</span>
          <Link
            href="/analytics/olap"
            onClick={onClose}
            className="inline-flex items-center gap-1 font-semibold text-[#f87941] hover:underline"
          >
            <span>Full-Screen OLAP Explorer</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
