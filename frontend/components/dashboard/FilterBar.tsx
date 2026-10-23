'use client';

import React, { useState } from 'react';
import { Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import { AcademicFilterState } from '../../types/academic';
import { useToast } from '../common/Toast';

interface FilterBarProps {
  onApplyFilters?: (filters: AcademicFilterState) => void;
}

export default function FilterBar({ onApplyFilters }: FilterBarProps) {
  const initialFilters: AcademicFilterState = {
    academicYear: '2025–26',
    semester: 'All Semesters',
    department: 'All Departments',
    course: 'All Courses',
  };

  const [filters, setFilters] = useState<AcademicFilterState>(initialFilters);
  const [isFiltered, setIsFiltered] = useState(false);
  const { showToast } = useToast();

  const handleApply = () => {
    setIsFiltered(true);
    if (onApplyFilters) onApplyFilters(filters);
    showToast(
      'Filters Applied (Frontend Mock)',
      `Aggregating metrics for ${filters.department}, ${filters.semester} in AY ${filters.academicYear}. Real DWM OLAP slice/dice will be executed in next stage.`,
      'info'
    );
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setIsFiltered(false);
    if (onApplyFilters) onApplyFilters(initialFilters);
    showToast('Filters Reset', 'Reset view to university aggregate baseline.', 'info');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Title & Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-800">
              Dimensional Slicing
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] text-slate-400">
              Filter warehouse cube by dimension attributes
            </span>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 lg:max-w-3xl lg:mx-4">
          {/* Academic Year */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 hover:bg-white hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <option value="2025–26">2025–26</option>
              <option value="2024–25">2024–25</option>
              <option value="2023–24">2023–24</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={filters.semester}
              onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 hover:bg-white hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <option value="All Semesters">All Semesters</option>
              <option value="Semester VI">Semester VI</option>
              <option value="Semester V">Semester V</option>
              <option value="Semester IV">Semester IV</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 hover:bg-white hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <option value="All Departments">All Departments</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Electronics & Telecommunication">Electronics & Telecom</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Course / Subject
            </label>
            <select
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 hover:bg-white hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <option value="All Courses">All Courses</option>
              <option value="Core Computing">Core Computing</option>
              <option value="Applied Mathematics">Applied Mathematics</option>
              <option value="Database Systems">Database Systems</option>
              <option value="Thermodynamics">Thermodynamics</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <Check className="h-3.5 w-3.5" />
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isFiltered}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isFiltered
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
