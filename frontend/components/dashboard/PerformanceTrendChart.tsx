'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { SemesterTrendPoint, MetricTrendView } from '../../types/academic';
import Modal from '../common/Modal';

interface PerformanceTrendChartProps {
  data: SemesterTrendPoint[];
}

export default function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricTrendView>('gpa');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(data.length - 1);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // SVG Chart bounds
  const width = 640;
  const height = 195;
  const padding = { top: 18, right: 25, bottom: 28, left: 35 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Metric scaling and labels (calibrated across all 5 departments without clamping)
  const metricConfig = {
    gpa: {
      label: 'Semester CGPA',
      min: 6.0,
      max: 8.5,
      ticks: [6.0, 6.5, 7.0, 7.5, 8.0, 8.5],
      getValue: (d: SemesterTrendPoint) => d.averageGpa,
      format: (val: number) => val.toFixed(2),
    },
    passRate: {
      label: 'Semester Pass Rate',
      min: 75,
      max: 100,
      ticks: [75, 80, 85, 90, 95, 100],
      getValue: (d: SemesterTrendPoint) => d.passPercentage,
      format: (val: number) => `${val.toFixed(1)}%`,
    },
    attendance: {
      label: 'Semester Attendance',
      min: 75,
      max: 100,
      ticks: [75, 80, 85, 90, 95, 100],
      getValue: (d: SemesterTrendPoint) => d.attendanceRate,
      format: (val: number) => `${val.toFixed(1)}%`,
    },
  }[activeMetric];

  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.min(Math.max(val, metricConfig.min), metricConfig.max);
    const ratio = (clamped - metricConfig.min) / (metricConfig.max - metricConfig.min);
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Helper for smooth cubic bezier paths
  const getSmoothSvgPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const currentPoints = data.map((d, i) => ({
    x: getX(i),
    y: getY(metricConfig.getValue(d)),
  }));

  const currentLinePath = getSmoothSvgPath(currentPoints);

  const currentAreaPath = `${currentLinePath} L ${getX(data.length - 1)},${height - padding.bottom} L ${getX(
    0
  )},${height - padding.bottom} Z`;

  const currentSemesterPoint = data.find((d) => d.semester === 'Sem VI') || data[data.length - 1];
  const activePoint = (activePointIndex !== null && data[activePointIndex]) ? data[activePointIndex] : currentSemesterPoint;

  return (
    <>
      <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between">
        {/* Header matching StarAdmin Performance Line Chart */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-[#f1f3f5]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
              Academic Performance Trend
            </h3>
            <p className="text-[10.5px] text-slate-500 mt-0.5 font-normal">
              Semester-wise warehouse aggregates at DimTime grain (Sem I – VI)
            </p>
          </div>

          {/* Top Right Controls & Legend */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Legend matching reference: orange dot "This week/period", dark navy dot "Last week/period" */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87941]" />
                <span className="text-[10.5px] font-medium text-slate-600">
                  Semester Trajectory (Sem I – VI)
                </span>
              </div>
            </div>

            {/* Metric Switcher Pills */}
            <div className="hidden xl:flex items-center rounded border border-[#e7eaee] bg-[#f7f8fa] p-0.5">
              {(['gpa', 'passRate', 'attendance'] as MetricTrendView[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMetric(key)}
                  className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium capitalize transition-all cursor-pointer ${
                    activeMetric === key
                      ? 'bg-white text-[#1e2238] shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {key === 'gpa' ? 'CGPA' : key === 'passRate' ? 'Pass' : 'Attendance'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDetailsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="View Complete Matrix"
            >
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SVG Chart Area */}
        <div className="relative mt-1.5 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full overflow-visible select-none"
            style={{ maxHeight: '210px' }}
            onMouseLeave={() => setActivePointIndex(data.findIndex((d) => d.semester === 'Sem VI'))}
          >
            <defs>
              {/* Reference orange/peach soft gradient fill under current line */}
              <linearGradient id="peachGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87941" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f87941" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {metricConfig.ticks.map((tick) => {
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
                    {activeMetric === 'gpa' ? tick.toFixed(1) : `${tick}%`}
                  </text>
                </g>
              );
            })}

            {/* Subtle bottom baseline */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#e7eaee"
              strokeWidth="1"
            />

            {/* Peach Gradient Area under current period */}
            <path d={currentAreaPath} fill="url(#peachGradient)" />

            {/* Semester Trajectory Line (Orange / Peach Accent) */}
            <path
              d={currentLinePath}
              fill="none"
              stroke="#f87941"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current Period Interactive Points */}
            {data.map((point, index) => {
              const pt = currentPoints[index];
              const isSelected = activePointIndex === index;

              return (
                <g
                  key={point.semester}
                  className="cursor-pointer"
                  onMouseEnter={() => setActivePointIndex(index)}
                >
                  {/* Highlight vertical guide line */}
                  {isSelected && (
                    <line
                      x1={pt.x}
                      y1={padding.top}
                      x2={pt.x}
                      y2={height - padding.bottom}
                      stroke="#f87941"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.4"
                    />
                  )}

                  {/* Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5.5 : 4}
                    fill={isSelected ? '#f87941' : '#ffffff'}
                    stroke="#f87941"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />

                  {/* X-Axis labels */}
                  <text
                    x={pt.x}
                    y={height - padding.bottom + 18}
                    textAnchor="middle"
                    className={`text-[10px] font-medium tracking-wider uppercase select-none transition-colors ${
                      isSelected ? 'fill-[#1e2238] font-bold' : 'fill-slate-400'
                    }`}
                  >
                    {point.semester}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Data Point Hover Inspector Strip */}
        {activePoint && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e7eaee] bg-[#f7f8fa] px-3 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#1e2238]">
                {activePoint.semester} ({activePoint.academicYear}){activePoint.semester === 'Sem VI' ? ' · Current Semester' : ''}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[10.5px]">
                Enrolled: {activePoint.enrolledStudents.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87941]" />
                <span className="text-slate-400 text-[10.5px]">CGPA:</span>
                <span className="font-mono font-bold text-[#1e2238]">
                  {activePoint.averageGpa.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10.5px]">Pass:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {activePoint.passPercentage}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10.5px]">Attn:</span>
                <span className="font-mono font-semibold text-sky-600">
                  {activePoint.attendanceRate}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Semester Trajectory & Performance Matrix"
        subtitle="Complete multi-semester dimensional progression index (DimSemester)"
        badge="FactAcademicPerformance"
        maxWidth="xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e7eaee] bg-[#f7f8fa] text-[10px] font-semibold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3">Academic Year</th>
                <th className="py-2.5 px-3 text-right">Avg GPA</th>
                <th className="py-2.5 px-3 text-right">Pass Rate</th>
                <th className="py-2.5 px-3 text-right">Attendance</th>
                <th className="py-2.5 px-3 text-right">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.semester} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {item.semester}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">
                    {item.academicYear}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f87941]">
                    {item.averageGpa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                    {item.passPercentage}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-600">
                    {item.attendanceRate}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {item.enrolledStudents.toLocaleString()}
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

