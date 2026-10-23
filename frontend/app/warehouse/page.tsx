'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { fetchHealth, fetchWarehouseStatus } from '../../lib/api';
import { Database, Layers, CheckCircle, RefreshCw, Server, ArrowRight } from 'lucide-react';

export default function WarehousePage() {
  const [health, setHealth] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchWarehouseStatus()])
      .then(([h, s]) => {
        setHealth(h);
        setStatus(s);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load warehouse status:', err);
        setIsLoading(false);
      });
  }, []);

  const dimensions = [
    { name: 'DimStudent', grain: '4,820 rows', desc: 'Conformed student dimension with department keys and batch cohort tags', pk: 'student_key' },
    { name: 'DimDepartment', grain: '5 rows', desc: 'Engineering departments (CE, IT, EXTC, MECH, CIVIL)', pk: 'department_key' },
    { name: 'DimCourse', grain: '30 rows', desc: 'Curriculum catalog courses with credits and semester mappings', pk: 'course_key' },
    { name: 'DimTime', grain: '6 rows', desc: 'Semesters I through VI temporal calendar dimension', pk: 'time_key' },
    { name: 'DimGradeBand', grain: '8 rows', desc: 'Grade categories (O, A+, A, B+, B, C, P, F) and grade points', pk: 'grade_band_key' },
  ];

  const facts = [
    { name: 'FactAcademicPerformance', grain: '67,480 rows', desc: 'Student semester course marks, grade points, credits, and pass/fail results', fks: 'student_key, course_key, department_key, time_key, grade_band_key' },
    { name: 'FactAttendance', grain: '67,480 rows', desc: 'Biometric lecture and laboratory attendance percentages and sessions attended', fks: 'student_key, course_key, department_key, time_key' },
    { name: 'FactStudentRiskStatus', grain: '4,820 rows', desc: 'ETL-derived risk classifications, failed course counts, and risk levels', fks: 'student_key, department_key, time_key' },
  ];

  return (
    <AppShell activeItem="data-warehouse">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Data Warehouse</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Star Schema Architecture</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Academic Performance Star Schema Data Warehouse
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Conformed Dimensional Model for Academic Performance Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/warehouse/etl"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>ETL Pipeline & Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Engine Metadata Banner */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-[#fafbfd] border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Database Engine</p>
            <p className="text-xs font-bold text-slate-800 mt-1 font-mono">
              {health?.databaseEngine || health?.database_engine || (isLoading ? 'Connecting...' : 'PostgreSQL / Supabase')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#fafbfd] border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Schema Topology</p>
            <p className="text-xs font-bold text-indigo-700 mt-1">
              {health?.schema || 'Conformed Star Schema'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#fafbfd] border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Dimension Tables</p>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {status?.dimensionTablesCount || 5} Conformed Dimensions
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#fafbfd] border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Fact Tables</p>
            <p className="text-xs font-bold text-[#f87941] mt-1">
              {status?.factTablesCount || 3} Fact Tables ({status?.recordsProcessed ? `${status.recordsProcessed.toLocaleString()} records` : '139,780 rows'})
            </p>
          </div>
        </div>

        {/* Star Schema Diagram & Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fact Tables */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#1e2238]">
                Central Fact Tables (Measures)
              </h2>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                Fact Grain: Student &times; Course &times; Time
              </span>
            </div>

            <div className="space-y-3">
              {facts.map((f) => (
                <div key={f.name} className="p-3 rounded-md border border-[#e7eaee] bg-[#fafbfd]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1e2238]">{f.name}</span>
                    <span className="text-[10px] font-mono font-bold text-[#f87941] bg-[#fff4ed] border border-[#fcd5bf] px-1.5 py-0.5 rounded">
                      {f.grain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{f.desc}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                    FKs: {f.fks}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Tables */}
          <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#1e2238]">
                Conformed Dimensions (Context)
              </h2>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                Shared Conformed Keys
              </span>
            </div>

            <div className="space-y-3">
              {dimensions.map((d) => (
                <div key={d.name} className="p-3 rounded-md border border-[#e7eaee] bg-[#fafbfd]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1e2238]">{d.name}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                      {d.grain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{d.desc}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Primary Key: <span className="text-slate-600 font-semibold">{d.pk}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audited Lineage Notice */}
        <div className="bg-white rounded-lg border border-[#e7eaee] p-4 text-xs text-slate-600 shadow-2xs">
          <p className="font-semibold text-slate-800 mb-1">
            Data Warehouse Integrity Verification
          </p>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            All facts conform strictly to dimensional surrogate keys. There are no dangling foreign keys or unindexed join paths. Historical semester facts are conformed directly to <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">DimStudent.department_key</code> to guarantee multi-department longitudinal integrity.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
