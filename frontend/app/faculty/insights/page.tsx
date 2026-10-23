'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { useAuth } from '../../../lib/auth';
import {
  fetchFacultyInsights,
  FacultyPedagogicalInsightsData,
} from '../../../lib/api';
import {
  Brain,
  Sparkles,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Info,
  GitBranch,
  Layers,
  Award,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function FacultyInsightsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [insightsData, setInsightsData] = useState<FacultyPedagogicalInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Computer Engineering');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'Faculty' && user.role !== 'Administrator') {
      router.replace('/student');
      return;
    }

    setIsLoading(true);
    setError(null);
    fetchFacultyInsights(selectedDepartment)
      .then((data) => {
        setInsightsData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load pedagogical insights:', err);
        setError(err.message || 'Failed to retrieve class data mining insights.');
        setIsLoading(false);
      });
  }, [user, authLoading, router, selectedDepartment]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchFacultyInsights(selectedDepartment)
      .then((data) => {
        setInsightsData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to refresh insights.');
        setIsLoading(false);
      });
  };

  return (
    <AppShell activeItem="class-insights">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/faculty" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Faculty Dashboard</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">Class Insights &amp; Pedagogical Mining</span>
        </div>

        {/* Header Banner */}
        <div className="bg-[#1e2238] rounded-xl text-white p-6 border border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/30 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Pedagogical Data Mining Layer</span>
              </span>
              <span className="text-xs text-slate-400">Department of {selectedDepartment}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#f87941]" />
              <span>Class Insights &amp; Teaching Interventions</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Translating data mining models (K-Means Clustering, Apriori Association Rules, and Decision Tree Classifications) into actionable teaching interventions without raw algorithmic jargon.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="Computer Engineering" className="bg-slate-900 text-white">Computer Engineering</option>
                <option value="Information Technology" className="bg-slate-900 text-white">Information Technology</option>
                <option value="Electronics & Telecommunication" className="bg-slate-900 text-white">Electronics &amp; Telecom</option>
                <option value="Mechanical Engineering" className="bg-slate-900 text-white">Mechanical Engineering</option>
                <option value="Civil Engineering" className="bg-slate-900 text-white">Civil Engineering</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh ML Insights"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-white rounded-xl border border-slate-200 animate-pulse p-4"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Failed to Load Class Insights</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loaded Insights Content */}
        {!isLoading && !error && insightsData && (
          <>
            {/* SECTION 1: Student Capability Archetypes (K-Means Clustering) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#f87941]" />
                    <span>Student Capability Archetypes (Cohort Profiles)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    K-Means clustering translated into actionable learner cohorts with customized teaching strategies
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  K = 3 Centroid Model
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insightsData.studentArchetypes.map((arch) => {
                  const isDistinction = arch.meanGpa >= 8.0;
                  const isRisk = arch.meanGpa < 6.5;

                  return (
                    <div
                      key={arch.clusterId}
                      className={`p-4 rounded-xl border space-y-3 ${
                        isDistinction
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isRisk
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDistinction
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRisk
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          Cohort {arch.clusterId + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {arch.studentCount.toLocaleString()} Students ({arch.percentage}%)
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{arch.archetype}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Centroid profile of learners exhibiting similar performance patterns.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                        <div className="p-2 bg-white/80 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Mean GPA</div>
                          <div className="text-xs font-bold text-slate-900">{arch.meanGpa.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-white/80 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Attendance</div>
                          <div className="text-xs font-bold text-slate-900">{arch.meanAttendance.toFixed(1)}%</div>
                        </div>
                        <div className="p-2 bg-white/80 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Avg Backlogs</div>
                          <div className="text-xs font-bold text-slate-900">{arch.meanFailedCourses.toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Target className="h-3 w-3 text-[#f87941]" />
                          <span>Recommended Teaching Strategy</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {arch.teachingStrategy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Curriculum Bottleneck & Course Co-occurrence Patterns (Apriori Rules) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-[#f87941]" />
                    <span>Curriculum Bottleneck &amp; Course Co-occurrence Patterns</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Association rules (Apriori) translated into prerequisite co-dependencies and common failure nodes
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Association Rule Mining (Lift &gt; 1.0)
                </span>
              </div>

              <div className="space-y-3">
                {insightsData.curriculumBottleneckRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rule.pattern}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-rose-700">{rule.outcome}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">Faculty Action:</span> {rule.pedagogicalAdvice}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="px-2.5 py-1 bg-white rounded border border-slate-200 text-center">
                        <div className="text-[10px] text-slate-500">Confidence</div>
                        <div className="text-xs font-bold text-slate-900">{rule.confidence}</div>
                      </div>
                      <div className="px-2.5 py-1 bg-white rounded border border-slate-200 text-center">
                        <div className="text-[10px] text-slate-500">Lift Factor</div>
                        <div className="text-xs font-bold text-[#f87941]">{rule.lift.toFixed(2)}x</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: Key Risk Indicators (Decision Tree Feature Importance) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#f87941]" />
                    <span>Early Warning Risk Predictors</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Feature importances derived from audited Decision Tree classifier predicting academic vulnerability
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Supervised Classification Model
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsData.keyRiskIndicators.map((kri, idx) => {
                  const scorePercent = Math.min(100, Math.round(kri.importanceScore * 100));

                  return (
                    <div key={idx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#f87941]"></span>
                          {kri.indicator}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{scorePercent}% Weight</span>
                      </div>

                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f87941] rounded-full transition-all duration-500"
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                        <span className="font-semibold text-slate-800">Faculty Takeaway:</span> {kri.facultyTakeaway}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: Tiered Academic Intervention Playbook */}
            <div className="bg-[#1e2238] rounded-xl text-white p-6 border border-slate-700 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#f87941]" />
                  <span>Faculty Academic Intervention Playbook</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Standard institutional operating procedures for student support based on risk diagnostics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Tier 1 · Immediate</div>
                  <h4 className="text-sm font-bold text-white">Biometric Deficit (&lt;75%)</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Issue attendance regularization warning notice, mandate biometric log verification, and notify student advisor for parent-mentor conference.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Tier 2 · Remedial</div>
                  <h4 className="text-sm font-bold text-white">Academic Risk (GPA &lt; 6.0)</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Assign dedicated peer tutor in deficit subject and conduct practice problem review sessions before internal term examinations.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Tier 3 · Core</div>
                  <h4 className="text-sm font-bold text-white">Core Cohort (6.5 – 8.0)</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Maintain continuous formative assessments, provide modular feedback on laboratory work, and encourage collaborative project work.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Tier 4 · Honors</div>
                  <h4 className="text-sm font-bold text-white">Distinction (GPA &ge; 8.5)</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Nominate for department research assistantships, competitive programming teams, conference publications, and peer-mentoring roles.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                href="/faculty"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Faculty Dashboard</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/at-risk"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>View At-Risk Roster</span>
                </Link>
                <Link
                  href="/faculty/performance"
                  className="px-4 py-2 bg-[#f87941] hover:bg-[#e06530] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Inspect Course Matrix</span>
                </Link>
              </div>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
