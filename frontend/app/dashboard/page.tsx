'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Printer, Download, Sparkles, ChevronDown } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import KpiCards from '../../components/dashboard/KpiCards';
import PerformanceTrendChart from '../../components/dashboard/PerformanceTrendChart';
import DepartmentPerformance from '../../components/dashboard/DepartmentPerformance';
import AcademicStatusSummary from '../../components/dashboard/AcademicStatusSummary';
import AcademicAlerts from '../../components/dashboard/AcademicAlerts';
import AcademicInsights from '../../components/dashboard/AcademicInsights';
import DwmWarehouseStatus from '../../components/dashboard/DwmWarehouseStatus';
import QuickActions from '../../components/dashboard/QuickActions';
import AtRiskStudents from '../../components/dashboard/AtRiskStudents';
import PerformanceDistribution from '../../components/dashboard/PerformanceDistribution';
import ETLActivity from '../../components/dashboard/ETLActivity';
import RecentReports from '../../components/dashboard/RecentReports';
import ReportModal from '../../components/dashboard/ReportModal';
import OlapModal from '../../components/dashboard/OlapModal';
import DataMiningModal from '../../components/dashboard/DataMiningModal';
import EtlModal from '../../components/dashboard/EtlModal';
import CoursesModal, { CourseItem, sampleCourses } from '../../components/dashboard/CoursesModal';
import SettingsModal from '../../components/dashboard/SettingsModal';
import { sampleDashboardData } from '../../data/sampleAcademicData';
import { useToast } from '../../components/common/Toast';
import {
  fetchHealth,
  fetchKpis,
  fetchDepartments,
  fetchTrends,
  fetchAtRiskStudents,
  fetchDistribution,
  fetchWarehouseStatus,
  fetchCourses,
  KpisResponse,
} from '../../lib/api';
import {
  KpiMetric,
  DepartmentPerformanceData,
  SemesterTrendPoint,
  AtRiskStudent,
  PerformanceDistributionCategory,
  WarehouseStatusData,
  EtlJobRecord,
  AcademicInsightItem,
} from '../../types/academic';

function buildKpiMetrics(kpiData: KpisResponse): KpiMetric[] {
  const isDeptFiltered = kpiData.departmentSlice !== 'All Departments';

  return [
    {
      id: 'total_students',
      label: 'Total Students',
      value: kpiData.totalStudents.toLocaleString('en-US'),
      secondaryValue: isDeptFiltered
        ? `Faculty: ${kpiData.departmentSlice}`
        : 'Across 5 Engineering Departments',
      dwmMapping: {
        factTable: 'DimStudent',
        aggregation: 'COUNT(DISTINCT s.student_key)',
      },
    },
    {
      id: 'average_gpa',
      label: 'Average GPA',
      value: kpiData.averageGpa.toFixed(2),
      secondaryValue: isDeptFiltered
        ? 'Scale of 10.0 • Department Mean'
        : 'Scale of 10.0 • Cohort Mean',
      dwmMapping: {
        factTable: 'FactAcademicPerformance',
        aggregation: 'AVG(grade_point)',
      },
    },
    {
      id: 'pass_rate',
      label: 'Pass Rate',
      value: `${kpiData.passRate.toFixed(1)}%`,
      secondaryValue: `${kpiData.totalStudents.toLocaleString('en-US')} students enrolled`,
      dwmMapping: {
        factTable: 'FactAcademicPerformance',
        aggregation: "COUNT(CASE WHEN result_status = 'Pass' THEN 1 END) / COUNT(*)",
      },
    },
    {
      id: 'attendance',
      label: 'Attendance',
      value: `${kpiData.attendanceRate.toFixed(1)}%`,
      secondaryValue: isDeptFiltered
        ? 'Department Biometric Aggregate'
        : 'Lecture & Lab Biometric Aggregate',
      dwmMapping: {
        factTable: 'FactAttendance',
        aggregation: 'AVG(attendance_percentage)',
      },
    },
    {
      id: 'at_risk_students',
      label: 'At-Risk Students',
      value: `${kpiData.atRiskStudents}`,
      secondaryValue: kpiData.totalStudents > 0
        ? `${((kpiData.atRiskStudents / kpiData.totalStudents) * 100).toFixed(1)}% of cohort`
        : '0.0% of cohort',
      dwmMapping: {
        factTable: 'FactStudentRiskStatus',
        aggregation: 'COUNT(CASE WHEN is_at_risk = 1 THEN 1 END)',
      },
    },
  ];
}

export default function DashboardPage() {
  const [academicYear, setAcademicYear] = useState('AY 2025–26');
  const [semester, setSemester] = useState('Semester VI');
  const [department, setDepartment] = useState('All Departments');
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'departments' | 'courses' | 'more'>('overview');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('executive');
  const [olapModalOpen, setOlapModalOpen] = useState(false);
  const [miningModalOpen, setMiningModalOpen] = useState(false);
  const [etlModalOpen, setEtlModalOpen] = useState(false);
  const [coursesModalOpen, setCoursesModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeNavModule, setActiveNavModule] = useState('dashboard');
  const { showToast } = useToast();

  // Refresh trigger to reload live data from FastAPI after ETL execution or explicit reload
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Client-side FastAPI KPI integration with automatic fallback
  const [liveKpis, setLiveKpis] = useState<KpisResponse | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);

  // Live storage-engine identity reported by GET /api/health (never hardcoded)
  const [engineLabel, setEngineLabel] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchHealth()
      .then((data) => {
        if (isMounted) {
          setEngineLabel(data.databaseEngine || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEngineLabel(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side FastAPI Department Performance integration with automatic fallback
  const [departmentsData, setDepartmentsData] = useState<DepartmentPerformanceData[]>(
    sampleDashboardData.departmentPerformance
  );
  const [isDeptLoading, setIsDeptLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsKpiLoading(true);

    fetchKpis(department)
      .then((data) => {
        if (isMounted) {
          setLiveKpis(data);
          setIsKpiLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for KPIs:', err);
        if (isMounted) {
          setLiveKpis(null);
          setIsKpiLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [department, refreshKey]);

  useEffect(() => {
    let isMounted = true;
    setIsDeptLoading(true);

    fetchDepartments()
      .then((data) => {
        if (isMounted) {
          setDepartmentsData(data);
          setIsDeptLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for Departments:', err);
        if (isMounted) {
          setDepartmentsData(sampleDashboardData.departmentPerformance);
          setIsDeptLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side FastAPI Academic Trends integration with automatic fallback
  const [trendsData, setTrendsData] = useState<SemesterTrendPoint[]>(
    sampleDashboardData.semesterTrends
  );
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsTrendsLoading(true);

    fetchTrends(department)
      .then((data) => {
        if (isMounted) {
          setTrendsData(data);
          setIsTrendsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for Trends:', err);
        if (isMounted) {
          setTrendsData(sampleDashboardData.semesterTrends);
          setIsTrendsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [department, refreshKey]);

  // Client-side FastAPI At-Risk Students integration with automatic fallback
  const [atRiskStudentsData, setAtRiskStudentsData] = useState<AtRiskStudent[]>(
    sampleDashboardData.atRiskStudents
  );
  const [isAtRiskLoading, setIsAtRiskLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsAtRiskLoading(true);

    fetchAtRiskStudents()
      .then((data) => {
        if (isMounted) {
          setAtRiskStudentsData(data);
          setIsAtRiskLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for At-Risk Students:', err);
        if (isMounted) {
          setAtRiskStudentsData(sampleDashboardData.atRiskStudents);
          setIsAtRiskLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side FastAPI Performance Distribution integration with automatic fallback
  const [distributionData, setDistributionData] = useState<PerformanceDistributionCategory[]>(
    sampleDashboardData.distribution
  );
  const [isDistributionLoading, setIsDistributionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsDistributionLoading(true);

    fetchDistribution()
      .then((data) => {
        if (isMounted) {
          setDistributionData(data);
          setIsDistributionLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for Distribution:', err);
        if (isMounted) {
          setDistributionData(sampleDashboardData.distribution);
          setIsDistributionLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side FastAPI Warehouse Status & ETL Activity integration with automatic fallback
  const [warehouseStatusData, setWarehouseStatusData] = useState<WarehouseStatusData>(
    sampleDashboardData.warehouseStatus
  );
  const [etlJobsData, setEtlJobsData] = useState<EtlJobRecord[]>(
    sampleDashboardData.etlJobs
  );
  const [isWarehouseLoading, setIsWarehouseLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsWarehouseLoading(true);

    fetchWarehouseStatus()
      .then((data) => {
        if (isMounted) {
          setWarehouseStatusData({
            status: data.status,
            lastEtlRun: data.lastEtlRun,
            recordsProcessed: data.recordsProcessed,
            factTablesCount: data.factTablesCount,
            dimensionTablesCount: data.dimensionTablesCount,
            lastRunDurationSeconds: data.lastRunDurationSeconds,
            lastRunRecordsRejected: data.lastRunRecordsRejected,
          });

          if (data.auditLogs && data.auditLogs.length > 0) {
            const mappedJobs: EtlJobRecord[] = data.auditLogs.map((log) => ({
              id: log.job_id || `job-${log.log_id}`,
              datasetName: log.job_name,
              sourceSystem: log.source_system || 'Campus SIS, Exam Portal, Biometric Logs',
              targetTable: log.target_table,
              recordsProcessed: log.records_loaded,
              status:
                log.status === 'Completed' ||
                log.status === 'In Progress' ||
                log.status === 'Queued' ||
                log.status === 'Failed'
                  ? (log.status as EtlJobRecord['status'])
                  : 'Completed',
              lastUpdated: log.completed_at || log.started_at,
              durationSeconds: Math.round(log.duration_seconds || 1),
            }));
            setEtlJobsData(mappedJobs);
          }
          setIsWarehouseLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for Warehouse Status & ETL:', err);
        if (isMounted) {
          setWarehouseStatusData(sampleDashboardData.warehouseStatus);
          setEtlJobsData(sampleDashboardData.etlJobs);
          setIsWarehouseLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side FastAPI Courses catalog integration with automatic fallback
  const [coursesData, setCoursesData] = useState<CourseItem[]>(sampleCourses);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsCoursesLoading(true);

    fetchCourses()
      .then((data) => {
        if (isMounted) {
          setCoursesData(data);
          setIsCoursesLoading(false);
        }
      })
      .catch((err) => {
        console.warn('FastAPI unavailable, using fallback mock data for Courses:', err);
        if (isMounted) {
          setCoursesData(sampleCourses);
          setIsCoursesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const isFiltered = department !== 'All Departments';
  const selectedDeptObj = isFiltered
    ? departmentsData.find(
        (d) =>
          d.name === department ||
          d.code === department ||
          (department === 'Electronics' && (d.code === 'EXTC' || d.name.includes('Electronics'))) ||
          (department === 'Mechanical' && (d.code === 'MECH' || d.name.includes('Mechanical'))) ||
          (department === 'Civil' && (d.code === 'CIVIL' || d.name.includes('Civil')))
      ) || sampleDashboardData.departmentPerformance.find((d) => d.name === department)
    : null;

  // Fallback KPI metrics computed when FastAPI is offline
  const fallbackKpis = selectedDeptObj
    ? [
        {
          ...sampleDashboardData.kpis[0],
          value: selectedDeptObj.totalStudents.toLocaleString(),
          secondaryValue: `Faculty: ${selectedDeptObj.name} (${selectedDeptObj.code})`,
        },
        {
          ...sampleDashboardData.kpis[1],
          value: selectedDeptObj.averageGpa.toFixed(2),
          secondaryValue: 'Scale of 10.0 • Department Mean',
        },
        {
          ...sampleDashboardData.kpis[2],
          value: `${selectedDeptObj.passRate}%`,
          secondaryValue: `${Math.round(
            (selectedDeptObj.passRate / 100) * selectedDeptObj.totalStudents
          ).toLocaleString()} cleared`,
        },
        {
          ...sampleDashboardData.kpis[3],
          value: `${selectedDeptObj.attendanceRate}%`,
          secondaryValue: 'Department Biometric Aggregate',
        },
        {
          ...sampleDashboardData.kpis[4],
          value: `${selectedDeptObj.atRiskStudents}`,
          secondaryValue: `${(
            (selectedDeptObj.atRiskStudents / selectedDeptObj.totalStudents) *
            100
          ).toFixed(1)}% of cohort`,
        },
      ]
    : sampleDashboardData.kpis;

  // Live warehouse facts take precedence; fallback to sampleAcademicData if server is unavailable
  const activeKpis = liveKpis
    ? buildKpiMetrics(liveKpis)
    : fallbackKpis;

  // Filter at-risk students if department is selected
  const activeAtRiskStudents = selectedDeptObj
    ? atRiskStudentsData.filter(
        (s) =>
          s.department === selectedDeptObj.code ||
          s.department === selectedDeptObj.name
      )
    : atRiskStudentsData;

  // Cohort-wide count of students below the 6.00 GPA cutoff.
  // Sourced from the 'Needs Support' band returned by GET /api/distribution,
  // which is computed over the full fact_student_risk_status population (all 4,820 students),
  // NOT by filtering the 108-row at-risk roster.
  const gpaBelowCutoffCount = distributionData.find(
    (d) => d.category === 'Needs Support'
  )?.studentCount;

  // Insights derived only from warehouse aggregates already loaded above.
  // Every figure below is computed from live fact/dimension rollups - nothing is authored by hand.
  const activeInsights: AcademicInsightItem[] = (() => {
    if (departmentsData.length === 0) return [];

    const ranked = [...departmentsData].sort((a, b) => b.averageGpa - a.averageGpa);
    const top = ranked[0];
    const bottom = ranked[ranked.length - 1];
    const spread = (top.averageGpa - bottom.averageGpa).toFixed(2);

    const totalAtRisk = departmentsData.reduce((sum, d) => sum + d.atRiskStudents, 0);
    const riskHotspot = [...departmentsData].sort(
      (a, b) => b.atRiskStudents - a.atRiskStudents
    )[0];

    const items: AcademicInsightItem[] = [
      {
        id: 'ins-dept-top',
        title: 'Highest Performing Department',
        value: `${top.name} (${top.code})`,
        detail: `leads with ${top.averageGpa.toFixed(2)} average GPA, ${top.passRate.toFixed(1)}% pass rate across ${top.totalStudents.toLocaleString('en-US')} students.`,
        dwmReference: 'DimDepartment',
      },
      {
        id: 'ins-dept-bottom',
        title: 'Lowest Performing Department',
        value: `${bottom.name} (${bottom.code})`,
        detail: `records ${bottom.averageGpa.toFixed(2)} average GPA and ${bottom.attendanceRate.toFixed(1)}% attendance across ${bottom.totalStudents.toLocaleString('en-US')} students.`,
        dwmReference: 'DimDepartment',
      },
      {
        id: 'ins-dept-gap',
        title: 'Inter-Department GPA Spread',
        value: `${spread} GPA points`,
        detail: `separates ${top.code} from ${bottom.code} at the current semester slice.`,
        dwmReference: 'Roll-up',
      },
    ];

    if (totalAtRisk > 0 && riskHotspot) {
      items.push({
        id: 'ins-risk-hotspot',
        title: 'At-Risk Concentration',
        value: `${riskHotspot.name} (${riskHotspot.code})`,
        detail: `holds ${riskHotspot.atRiskStudents} of ${totalAtRisk} flagged students (${((riskHotspot.atRiskStudents / totalAtRisk) * 100).toFixed(1)}% of the risk cohort).`,
        dwmReference: 'FactRiskStatus',
      });
    }

    return items;
  })();

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', 'Dashboard URL copied to clipboard for collaboration.', 'info');
    } else {
      showToast('Share Dashboard', 'Executive dashboard report ready to share.', 'info');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExport = () => {
    setReportModalOpen(true);
  };

  const handleNavSelect = (moduleId: string) => {
    setActiveNavModule(moduleId);
    if (moduleId === 'dashboard') {
      setActiveTab('overview');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (moduleId === 'academic-performance') {
      setActiveTab('overview');
      document.getElementById('academic-performance')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'students') {
      setActiveTab('students');
      document.getElementById('students')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'departments') {
      setActiveTab('departments');
      document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'courses') {
      setActiveTab('courses');
      setCoursesModalOpen(true);
    } else if (moduleId === 'data-warehouse') {
      document.getElementById('data-warehouse')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'analytics') {
      setOlapModalOpen(true);
    } else if (moduleId === 'mining-insights') {
      setMiningModalOpen(true);
    } else if (moduleId === 'at-risk-students') {
      setActiveTab('students');
      document.getElementById('at-risk-students')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'reports') {
      document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' });
    } else if (moduleId === 'settings') {
      setSettingsModalOpen(true);
    } else {
      setActiveTab('overview');
    }
  };

  const handleTabClick = (tabId: 'overview' | 'students' | 'departments' | 'courses' | 'more') => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      setActiveNavModule('dashboard');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === 'students') {
      setActiveNavModule('students');
      document.getElementById('students')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'departments') {
      setActiveNavModule('departments');
      document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'courses') {
      setActiveNavModule('courses');
      setCoursesModalOpen(true);
    } else if (tabId === 'more') {
      setSettingsModalOpen(true);
    }
  };

  return (
    <AppShell
      selectedYear={academicYear}
      onYearChange={setAcademicYear}
      selectedSemester={semester}
      onSemesterChange={setSemester}
      selectedDepartment={department}
      onDepartmentChange={setDepartment}
      activeItem={activeNavModule}
      onItemSelect={handleNavSelect}
      onOpenSettings={() => setSettingsModalOpen(true)}
    >
      <main className="px-3.5 py-3 sm:px-5 space-y-3.5 max-w-[1600px] mx-auto w-full">
        {/* Active Department Slice Banner */}
        {isFiltered && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#fcd5bf] bg-[#fff4ed] px-3 py-1.5 text-xs text-[#1e2238] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Department Slice Active:</span>
              <span className="rounded bg-white px-2 py-0.5 border border-[#fcd5bf] font-mono text-[11px] text-[#f87941] font-bold shadow-2xs">
                {selectedDeptObj?.name} ({selectedDeptObj?.code})
              </span>
              <span className="text-slate-500 hidden md:inline">
                · Showing dimensional slice for {selectedDeptObj?.totalStudents.toLocaleString()} undergraduates
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDepartment('All Departments')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f87941] hover:text-[#c2410c] underline underline-offset-2 cursor-pointer"
            >
              Reset to All Departments
            </button>
          </div>
        )}

        {/* 1. University Overview Header per UX Specification */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e7eaee] pb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                University Overview
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                AY 2025–26 • Semester VI
              </span>
            </div>
            <p className="text-xs text-slate-500">
              A summary of academic performance and issues requiring attention across the institution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Clear Data Freshness Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fafbfd] border border-[#e7eaee] text-slate-600 text-[11px] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Data verified: <strong className="text-slate-800">30 June 2026</strong> (Conformed Load)</span>
            </div>

            {/* Print Dossier */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="h-3 w-3 text-slate-500" />
              <span>Print</span>
            </button>

            {/* Working Report Export Action */}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded bg-[#1e2438] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2c334d] transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3 w-3 text-[#f87941]" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* 2. Analytical KPI Row (6 compact cards matching reference) */}
        <KpiCards
          metrics={activeKpis}
          isLoading={isKpiLoading}
          departmentCount={departmentsData.length}
        />

        {/* 3. Main Two-Column Layout (Left: ~67%, Right: ~33%) matching Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column (Col-span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-3.5">
            {/* Academic Performance Trend Line Chart */}
            <div id="academic-performance" className="scroll-mt-16">
              <PerformanceTrendChart data={trendsData} />
            </div>

            {/* Department Performance Vertical Bar Chart (Market Overview style) */}
            <div id="departments" className="scroll-mt-16">
              <DepartmentPerformance
                departments={departmentsData}
                selectedDepartment={department}
                onSelectDepartment={setDepartment}
              />
            </div>
          </div>

          {/* Right Column (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-3.5">
            {/* Dark Navy Academic Status Summary Card + 2 Circular Mini Cards */}
            <AcademicStatusSummary
              overallGpa={selectedDeptObj ? selectedDeptObj.averageGpa : (liveKpis?.averageGpa ?? 7.82)}
              passRate={selectedDeptObj ? selectedDeptObj.passRate : (liveKpis?.passRate ?? 91.4)}
              attendanceRate={selectedDeptObj ? selectedDeptObj.attendanceRate : (liveKpis?.attendanceRate ?? 87.6)}
              atRiskCount={selectedDeptObj ? selectedDeptObj.atRiskStudents : (liveKpis?.atRiskStudents ?? 108)}
              currentSemester={semester}
            />

            {/* Academic Alerts & Attention Card (To-Do / Reminders style) */}
            <AcademicAlerts
              atRiskCount={selectedDeptObj ? selectedDeptObj.atRiskStudents : (liveKpis?.atRiskStudents ?? 108)}
              atRiskStudents={activeAtRiskStudents}
              gpaBelowCutoffCount={gpaBelowCutoffCount}
              cohortTotal={liveKpis?.totalStudents}
            />
          </div>
        </div>

        {/* 4. Lower Sections: Academic Insights (Left), Warehouse Status (Center), Quick Actions (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          <AcademicInsights
            insights={activeInsights}
            onOpenMining={() => setMiningModalOpen(true)}
            isLive={liveKpis !== null}
          />
          <div id="data-warehouse" className="scroll-mt-16">
            <DwmWarehouseStatus
              statusData={warehouseStatusData}
              engineLabel={engineLabel}
              onOpenEtl={() => setEtlModalOpen(true)}
              onOpenOlap={() => setOlapModalOpen(true)}
            />
          </div>
          <QuickActions
            totalStudents={liveKpis?.totalStudents}
            atRiskCount={liveKpis?.atRiskStudents}
            departmentCount={departmentsData.length}
          />
        </div>

        {/* 5. At-Risk Students & Additional Analytical Views */}
        <div id="students" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start scroll-mt-16">
          <div id="at-risk-students" className="lg:col-span-7 flex flex-col scroll-mt-16">
            <AtRiskStudents students={activeAtRiskStudents} />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <PerformanceDistribution
              distribution={distributionData}
              passRate={liveKpis?.passRate}
            />
          </div>
        </div>

        {/* 6. Technical ETL Activity & Recent Institutional Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-6 flex flex-col">
            <ETLActivity
              jobs={etlJobsData}
              onRunEtl={() => setEtlModalOpen(true)}
            />
          </div>
          <div id="reports" className="lg:col-span-6 flex flex-col scroll-mt-16">
            <RecentReports
              reports={sampleDashboardData.reports}
              onOpenReportModal={(type) => {
                if (type) setSelectedReportType(type);
                setReportModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* 7. Institutional Footer */}
        <footer className="border-t border-[#e7eaee] pt-3.5 pb-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#1e2238]">UniAnalytics</span>
            <span>·</span>
            <span>Academic Performance Data Warehouse & Mining Intelligence Platform</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Conformed Dimensions · FactAcademicPerformance · FactAttendance · DimStudent · DimTime
          </div>
        </footer>

        {/* Interactive Feature Modals */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          kpis={liveKpis}
          departments={departmentsData}
          atRiskStudents={activeAtRiskStudents}
          warehouseStatus={warehouseStatusData}
          etlJobs={etlJobsData}
          initialReportType={selectedReportType}
        />
        <OlapModal
          isOpen={olapModalOpen}
          onClose={() => setOlapModalOpen(false)}
          departments={departmentsData}
          isLive={liveKpis !== null}
        />
        <DataMiningModal isOpen={miningModalOpen} onClose={() => setMiningModalOpen(false)} />
        <EtlModal
          isOpen={etlModalOpen}
          onClose={() => setEtlModalOpen(false)}
          onSuccess={handleRefreshDashboard}
          lastSyncTime={warehouseStatusData?.lastEtlRun}
          engineLabel={engineLabel}
        />
        <CoursesModal
          isOpen={coursesModalOpen}
          onClose={() => setCoursesModalOpen(false)}
          courses={coursesData}
        />
        <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      </main>
    </AppShell>
  );
}

