'use client';

import React, { useState } from 'react';
import { AttendanceVsGpaPoint } from '../../types/academic';
import { formatNumber, formatGpa, formatPercent } from '../../utils/format';
import { Compass, TrendingUp, Filter } from 'lucide-react';

interface AttendanceVsPerformanceProps {
  data: AttendanceVsGpaPoint[];
  selectedDepartment?: string;
}

export default function AttendanceVsPerformance({
  data,
  selectedDepartment = 'All Departments',
}: AttendanceVsPerformanceProps) {
  const [activePoint, setActivePoint] = useState<AttendanceVsGpaPoint | null>(null);

  const filteredData =
    selectedDepartment && selectedDepartment !== 'All Departments'
      ? data.filter((d) => {
          const deptMap: Record<string, string> = {
            'Computer Engineering': 'CE',
            'Information Technology': 'IT',
            Electronics: 'EXTC',
            Mechanical: 'MECH',
            Civil: 'CIVIL',
          };
          return d.department === deptMap[selectedDepartment];
        })
      : data;

  // SVG Chart Dimensions
  const width = 580;
  const height = 230;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Domain Scales
  const minX = 60;
  const maxX = 100;
  const minY = 5.0;
  const maxY = 10.0;

  const getX = (val: number) => {
    return padding.left + ((val - minX) / (maxX - minX)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;
  };

  const xTicks = [60, 70, 80, 90, 100];
  const yTicks = [5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

  // Regression trend line endpoints (fit roughly y = 0.105 * x - 1.1)
  const lineStart = { x: getX(62), y: getY(5.4) };
  const lineEnd = { x: getX(98), y: getY(9.4) };

  const getColor = (category: AttendanceVsGpaPoint['category']) => {
    switch (category) {
      case 'High Performer':
        return '#4f46e5'; // Indigo
      case 'Average':
        return '#059669'; // Emerald
      default:
        return '#dc2626'; // Muted Red
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">
              Attendance vs Academic Performance
            </h3>
            <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-mono text-indigo-700 font-semibold">
              r = +0.78
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Biometric attendance % plotted against cumulative GPA (FactAttendance × FactAcademicPerformance)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 self-start sm:self-auto">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#4f46e5]" />
            <span>GPA ≥ 8.0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            <span>6.0–7.9</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
            <span>&lt; 6.0 (At-Risk)</span>
          </div>
        </div>
      </div>

      {/* SVG Scatter Plot */}
      <div className="relative mt-2 w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" style={{ maxHeight: '230px' }}>
          {/* Horizontal Gridlines & Y-Axis */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f2f4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono select-none"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Vertical Gridlines & X-Axis */}
          {xTicks.map((tick) => {
            const x = getX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#f1f2f4"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono select-none"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Linear Trend Regression Line */}
          <line
            x1={lineStart.x}
            y1={lineStart.y}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Scatter Data Points */}
          {filteredData.map((pt) => {
            const cx = getX(pt.attendance);
            const cy = getY(pt.gpa);
            const isHovered = activePoint?.id === pt.id;
            const color = getColor(pt.category);

            return (
              <g
                key={pt.id}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActivePoint(pt)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="fill-slate-400 text-[10px] font-sans select-none"
          >
            Attendance Rate (%)
          </text>
          <text
            x={14}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${height / 2})`}
            className="fill-slate-400 text-[10px] font-sans select-none"
          >
            Grade Point Average (GPA)
          </text>
        </svg>
      </div>

      {/* Selected Point Inspector or Summary Banner */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-1.5 text-xs shadow-2xs">
        {activePoint ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              Student {activePoint.studentId} ({activePoint.department})
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              Attendance: <span className="font-mono font-bold text-slate-900">{activePoint.attendance}%</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              GPA: <span className="font-mono font-bold text-indigo-700">{formatGpa(activePoint.gpa)}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-500">{activePoint.category}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            <span>
              <strong>DWM Correlation Pattern:</strong> Students above 85% attendance exhibit a{' '}
              <strong className="text-indigo-700">+0.84 GPA</strong> higher cohort mean.
            </span>
          </div>
        )}

        <span className="text-[10px] font-mono text-slate-400">Sample: 24 Plotted Coordinates</span>
      </div>
    </div>
  );
}
