'use client';

import React, { useState } from 'react';
import { Columns, ArrowUpRight } from 'lucide-react';
import { DepartmentPerformanceData } from '../../types/academic';
import Modal from '../common/Modal';

interface DepartmentPerformanceProps {
  departments: DepartmentPerformanceData[];
  selectedDepartment?: string;
  onSelectDepartment?: (deptName: string) => void;
}

export default function DepartmentPerformance({
  departments,
  selectedDepartment,
  onSelectDepartment,
}: DepartmentPerformanceProps) {
  const [selectedDept, setSelectedDept] = useState<DepartmentPerformanceData | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Chart dimensions
  const width = 640;
  const height = 195;
  const padding = { top: 15, right: 25, bottom: 28, left: 35 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Max scale for GPA is 10.0
  const maxScale = 10.0;
  const yTicks = [0, 2.5, 5.0, 7.5, 10.0];

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxScale) * innerHeight;
  };

  // Bar spacing
  const barCount = departments.length;
  const step = innerWidth / barCount;
  const barWidth = Math.min(30, step * 0.45);

  // Student-weighted cohort mean of the department bars currently plotted
  const cohortStudents = departments.reduce((sum, d) => sum + d.totalStudents, 0);
  const cohortGpa =
    cohortStudents > 0
      ? (
          departments.reduce((sum, d) => sum + d.averageGpa * d.totalStudents, 0) /
          cohortStudents
        ).toFixed(2)
      : '—';

  return (
    <>
      <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between">
        {/* Header matching StarAdmin Market Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-[#f1f3f5]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
              Department Performance
            </h3>
            <p className="text-[10.5px] text-slate-500 mt-0.5 font-normal">
              Academic performance across departments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Columns className="h-3 w-3 text-slate-400" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Prominent Stat & Legend */}
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1e2238] tabular-nums">
              {cohortGpa} <span className="text-xs font-semibold text-slate-500">Cohort CGPA</span>
            </span>
          </div>

          {/* Legend: Dark Navy & Orange */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e2438]" />
              <span className="text-[10.5px] font-medium text-slate-600">Benchmark (7.50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f87941]" />
              <span className="text-[10.5px] font-medium text-slate-600">Current Average</span>
            </div>
          </div>
        </div>

        {/* Clean Vertical Bar Chart SVG */}
        <div className="relative mt-1.5 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full overflow-visible select-none"
            style={{ maxHeight: '200px' }}
          >
            {/* Horizontal Gridlines */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#f4f5f7"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-400 text-[9.5px] font-sans font-medium"
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Bottom baseline */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#e7eaee"
              strokeWidth="1"
            />

            {/* Department Vertical Bars matching StarAdmin Market Overview */}
            {departments.map((dept, index) => {
              const centerX = padding.left + index * step + step / 2;
              const barX = centerX - barWidth / 2;

              // Benchmarking target / previous height
              const targetGpa = 7.5;
              const currentGpa = dept.averageGpa;

              const baseY = height - padding.bottom;
              const currentHeight = (currentGpa / maxScale) * innerHeight;
              const currentY = baseY - currentHeight;

              // Benchmark cap segment
              const targetHeight = (targetGpa / maxScale) * innerHeight;
              const targetY = baseY - targetHeight;

              const isHighlighted =
                selectedDepartment === dept.name ||
                selectedDepartment === dept.code ||
                (selectedDepartment === 'Electronics' && (dept.code === 'EXTC' || dept.name.includes('Electronics'))) ||
                (selectedDepartment === 'Mechanical' && (dept.code === 'MECH' || dept.name.includes('Mechanical'))) ||
                (selectedDepartment === 'Civil' && (dept.code === 'CIVIL' || dept.name.includes('Civil')));

              return (
                <g
                  key={dept.code}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedDept(dept);
                    if (onSelectDepartment) onSelectDepartment(dept.name);
                  }}
                >
                  {/* Hover background column */}
                  <rect
                    x={centerX - step * 0.4}
                    y={padding.top}
                    width={step * 0.8}
                    height={innerHeight}
                    fill={isHighlighted ? '#fff4ed' : 'transparent'}
                    className="group-hover:fill-slate-50/80 transition-colors rounded"
                  />

                  {/* Top segment / benchmark cap (Dark Navy) */}
                  <rect
                    x={barX}
                    y={Math.min(currentY, targetY) - 8}
                    width={barWidth}
                    height={8}
                    rx="3"
                    fill="#1e2438"
                    className="transition-all duration-300"
                  />

                  {/* Main Department Performance Bar (Orange Accent) */}
                  <rect
                    x={barX}
                    y={currentY}
                    width={barWidth}
                    height={currentHeight}
                    rx="2"
                    fill={isHighlighted ? '#ea580c' : '#f87941'}
                    className="group-hover:brightness-95 transition-all duration-300"
                  />

                  {/* Department Code Label */}
                  <text
                    x={centerX}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-semibold tracking-wider select-none transition-colors ${
                      isHighlighted ? 'fill-[#ea580c] font-bold' : 'fill-slate-500 group-hover:fill-[#1e2238]'
                    }`}
                  >
                    {dept.code}
                  </text>

                  {/* Small GPA tooltip on hover */}
                  <text
                    x={centerX}
                    y={currentY - 12}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-[#1e2238] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {dept.averageGpa.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer with scannable summary */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-[#f1f3f5] pt-2">
          <span>Click any bar to filter department cohort</span>
          <span className="font-medium text-slate-700">
            {departments.length} Engineering Departments
          </span>
        </div>
      </div>

      {/* 1. Department Overview Modal */}
      {selectedDept && (
        <Modal
          isOpen={!!selectedDept}
          onClose={() => setSelectedDept(null)}
          title={`${selectedDept.name} Overview`}
          subtitle="Departmental OLAP Slice & Academic Performance Profile"
          badge={`DEPT_${selectedDept.code}`}
          maxWidth="lg"
        >
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border border-[#e7eaee] bg-[#f7f8fa] p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Enrolled Students
                </span>
                <p className="mt-0.5 font-mono text-base font-bold text-slate-900">
                  {selectedDept.totalStudents.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-[#e7eaee] bg-[#f7f8fa] p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Average GPA
                </span>
                <p className="mt-0.5 font-mono text-base font-bold text-[#f87941]">
                  {selectedDept.averageGpa.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-[#e7eaee] bg-[#f7f8fa] p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Pass Rate
                </span>
                <p className="mt-0.5 font-mono text-base font-bold text-emerald-600">
                  {selectedDept.passRate}%
                </p>
              </div>

              <div className="rounded-lg border border-[#e7eaee] bg-[#f7f8fa] p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  At Risk
                </span>
                <p className="mt-0.5 font-mono text-base font-bold text-amber-600">
                  {selectedDept.atRiskStudents}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#e7eaee] bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Cohort Attendance Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedDept.attendanceRate}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${selectedDept.attendanceRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                <span>Faculty: {selectedDept.facultyCount} Professors</span>
                <span>Ratio: {(selectedDept.totalStudents / selectedDept.facultyCount).toFixed(1)}:1</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Compare Departments Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Department Comparison Matrix"
        subtitle={`Side-by-side performance indicators across ${departments.length} engineering departments`}
        badge="Comparative OLAP"
        maxWidth="xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e7eaee] bg-[#f7f8fa] text-[10px] font-semibold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Avg GPA</th>
                <th className="py-2.5 px-3 text-right">Pass Rate</th>
                <th className="py-2.5 px-3 text-right">Attendance</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">At-Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-800">{dept.name}</span>
                    <span className="ml-1 text-[10px] font-mono text-slate-400">({dept.code})</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#f87941]">
                    {dept.averageGpa.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">
                    {dept.passRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    {dept.attendanceRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    {dept.totalStudents.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-amber-600 font-semibold">
                    {dept.atRiskStudents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}

