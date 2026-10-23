'use client';

import React, { useState } from 'react';
import Modal from '../common/Modal';
import { BookOpen, Search, Filter, Award, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '../common/Toast';

export interface CourseItem {
  code: string;
  name: string;
  department: string;
  departmentCode: string;
  credits: number;
  semester: string;
  enrolledStudents: number;
  passRate: number;
  averageGpa: number;
}

export const sampleCourses: CourseItem[] = [
  {
    code: 'CS601',
    name: 'Data Warehousing & Mining',
    department: 'Computer Engineering',
    departmentCode: 'CE',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 1180,
    passRate: 91.2,
    averageGpa: 8.04,
  },
  {
    code: 'CS602',
    name: 'Cloud Computing & DevOps',
    department: 'Computer Engineering',
    departmentCode: 'CE',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 1180,
    passRate: 93.5,
    averageGpa: 8.12,
  },
  {
    code: 'IT601',
    name: 'Enterprise Systems & Analytics',
    department: 'Information Technology',
    departmentCode: 'IT',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 1120,
    passRate: 94.1,
    averageGpa: 8.22,
  },
  {
    code: 'IT602',
    name: 'Information Retrieval Systems',
    department: 'Information Technology',
    departmentCode: 'IT',
    credits: 3.0,
    semester: 'Semester VI',
    enrolledStudents: 1120,
    passRate: 92.8,
    averageGpa: 8.06,
  },
  {
    code: 'EC601',
    name: 'Signals & Systems',
    department: 'Electronics',
    departmentCode: 'EXTC',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 980,
    passRate: 88.6,
    averageGpa: 7.68,
  },
  {
    code: 'ME601',
    name: 'Applied Thermodynamics',
    department: 'Mechanical',
    departmentCode: 'MECH',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 920,
    passRate: 85.4,
    averageGpa: 7.52,
  },
  {
    code: 'CE601',
    name: 'Structural Analysis',
    department: 'Civil',
    departmentCode: 'CIVIL',
    credits: 4.0,
    semester: 'Semester VI',
    enrolledStudents: 620,
    passRate: 84.1,
    averageGpa: 7.42,
  },
];

export interface CoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses?: CourseItem[];
}

export default function CoursesModal({ isOpen, onClose, courses = sampleCourses }: CoursesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const { showToast } = useToast();

  const departments = ['All', 'CE', 'IT', 'EXTC', 'MECH', 'CIVIL'];

  const activeCourses = courses && courses.length > 0 ? courses : sampleCourses;

  const filteredCourses = activeCourses.filter((course) => {
    const matchesDept = selectedDept === 'All' || course.departmentCode === selectedDept;
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleSelectCourse = (course: CourseItem) => {
    showToast(
      `Course: ${course.code}`,
      `${course.name} · Pass Rate: ${course.passRate}% · Average GPA: ${course.averageGpa.toFixed(2)}`,
      'info'
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Course Catalog & Curriculum Analytics"
      subtitle="Curriculum evaluations, credit weights, and cohort pass rates from DimCourse × FactAcademicPerformance"
      badge="DimCourse Dimension"
      maxWidth="xl"
    >
      <div className="space-y-3.5">
        {/* Search & Department Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2 text-xs">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code, title, or department..."
              className="w-full rounded border border-[#e5e7eb] bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap pl-1">
              Dept:
            </span>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                  selectedDept === dept
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border border-[#e5e7eb] hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Table */}
        <div className="overflow-x-auto rounded-md border border-[#e5e7eb] max-h-80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[10px] font-semibold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3">Dept</th>
                <th className="py-2.5 px-3 text-center">Credits</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">Pass Rate</th>
                <th className="py-2.5 px-3 text-right">Avg GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((c) => (
                <tr
                  key={c.code}
                  onClick={() => handleSelectCourse(c)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                    {c.code}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">{c.name}</span>
                    <span className="text-[10px] text-slate-400">{c.semester}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="rounded border border-[#e5e7eb] bg-[#f8f9fa] px-1.5 py-0.2 font-mono text-[9.5px] font-medium text-slate-700">
                      {c.departmentCode}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">
                    {c.credits.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    {c.enrolledStudents.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                    {c.passRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {c.averageGpa.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
          <span>Curriculum Source: DimCourse (Star Schema Conformed)</span>
          <span>Showing {filteredCourses.length} active courses</span>
        </div>
      </div>
    </Modal>
  );
}
