'use client';

import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { AtRiskStudent } from '../../types/academic';
import Modal from '../common/Modal';

interface AtRiskStudentsProps {
  students: AtRiskStudent[];
}

export default function AtRiskStudents({ students }: AtRiskStudentsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getRiskBadge = (level: AtRiskStudent['riskLevel']) => {
    switch (level) {
      case 'High':
        return (
          <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.2 text-[9px] font-semibold text-red-700">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
            Low
          </span>
        );
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="reference-card p-3.5 sm:p-4 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f5]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#1e2238]">
                At-Risk Students Requiring Attention
              </h3>
              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                {students.length} Flagged
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Warehouse-flagged risk roster from FactStudentRiskStatus.is_at_risk
              (stored ETL risk classification · Semester VI)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-[#e7eaee] bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span>View All</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        {/* Compact Table */}
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e7eaee] bg-[#f7f8fa] text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-1.5 px-2.5">Student</th>
                <th className="py-1.5 px-2.5">Department</th>
                <th className="py-1.5 px-2.5 text-right">CGPA</th>
                <th className="py-1.5 px-2.5 text-right">Attendance</th>
                <th className="py-1.5 px-2.5 text-center">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f5]">
              {students.slice(0, 5).map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-1.5 px-2.5">
                    <span className="font-semibold text-[#1e2238] block leading-tight text-[11.5px]">
                      {student.studentName}
                    </span>
                    <span className="font-mono text-slate-400 text-[9.5px]">
                      {student.studentId}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5">
                    <span className="rounded border border-[#e7eaee] bg-[#f7f8fa] px-1 py-0.2 font-mono text-[9.5px] font-medium text-slate-700">
                      {student.department}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#1e2238] text-[11.5px]">
                    {student.gpa.toFixed(1)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-600 text-[11px]">
                    {student.attendanceRate}%
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    {getRiskBadge(student.riskLevel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-[#f1f3f5] pt-1.5 text-[10px] text-slate-400">
          <span>Early alert intervention triggers active</span>
          <span className="font-medium text-slate-600">{students.length} Cases Monitored</span>
        </div>
      </div>

      {/* View All Students Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Students Requiring Academic Attention"
        subtitle="Complete flagged roster derived from FactStudentRiskStatus (Warehouse Star Schema)"
        badge="DimStudent × FactRisk"
        maxWidth="xl"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, ID, or department..."
              className="w-full rounded border border-[#e5e7eb] py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[10px] font-semibold text-slate-600 uppercase">
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Name</th>
                  <th className="py-2 px-2.5">Dept</th>
                  <th className="py-2 px-2.5 text-right">GPA</th>
                  <th className="py-2 px-2.5 text-right">Attendance</th>
                  <th className="py-2 px-2.5">Flagged Subject</th>
                  <th className="py-2 px-2.5 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 font-mono text-slate-500 text-[11px]">
                      {s.studentId}
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                      {s.studentName}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span className="rounded border border-[#e5e7eb] bg-[#f8f9fa] px-1 py-0.2 font-mono text-[9px] text-slate-600">
                        {s.department}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                      {s.gpa.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono text-slate-600">
                      {s.attendanceRate}%
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[130px]">
                      {s.flaggedSubject}
                    </td>
                    <td className="py-1.5 px-2.5 text-center">{getRiskBadge(s.riskLevel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}
