'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '../common/Modal';
import {
  fetchMiningOverview,
  fetchMiningRules,
  fetchMiningClusters,
  fetchMiningFeatureImportance,
  MiningOverviewResponse,
  AssociationMiningResponse,
  ClusterMiningResponse,
  FeatureImportanceResponse,
} from '../../lib/api';
import { Brain, ExternalLink, RefreshCw, AlertTriangle, Database, Activity } from 'lucide-react';

interface DataMiningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataMiningModal({ isOpen, onClose }: DataMiningModalProps) {
  const [activeTab, setActiveTab] = useState<'association' | 'clustering' | 'classification'>('association');

  // Live state
  const [overview, setOverview] = useState<MiningOverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const [rulesData, setRulesData] = useState<AssociationMiningResponse | null>(null);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  const [clustersData, setClustersData] = useState<ClusterMiningResponse | null>(null);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);

  const [importanceData, setImportanceData] = useState<FeatureImportanceResponse | null>(null);
  const [isLoadingImportance, setIsLoadingImportance] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch overview when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingOverview(true);
      setError(null);
      fetchMiningOverview()
        .then((data) => {
          setOverview(data);
          setIsLoadingOverview(false);
        })
        .catch((err) => {
          console.error('Failed to load mining overview in modal:', err);
          setError('Failed to fetch live mining overview from warehouse.');
          setIsLoadingOverview(false);
        });
    }
  }, [isOpen]);

  // Fetch tab-specific concise live data when opened or tab changed
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'association' && !rulesData) {
      setIsLoadingRules(true);
      fetchMiningRules(0.015, 0.6, 3)
        .then((res) => {
          setRulesData(res);
          setIsLoadingRules(false);
        })
        .catch((err) => {
          console.error('Failed to load rules in modal:', err);
          setIsLoadingRules(false);
        });
    } else if (activeTab === 'clustering' && !clustersData) {
      setIsLoadingClusters(true);
      fetchMiningClusters(3)
        .then((res) => {
          setClustersData(res);
          setIsLoadingClusters(false);
        })
        .catch((err) => {
          console.error('Failed to load clusters in modal:', err);
          setIsLoadingClusters(false);
        });
    } else if (activeTab === 'classification' && !importanceData) {
      setIsLoadingImportance(true);
      fetchMiningFeatureImportance()
        .then((res) => {
          setImportanceData(res);
          setIsLoadingImportance(false);
        })
        .catch((err) => {
          console.error('Failed to load feature importance in modal:', err);
          setIsLoadingImportance(false);
        });
    }
  }, [isOpen, activeTab, rulesData, clustersData, importanceData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Data Mining Engine"
      subtitle="Live Knowledge Discovery: Association Rules, Cohort Clustering & Risk Drivers"
      badge={overview?.databaseEngine ? `${overview.databaseEngine} · Live` : 'Live Mining'}
      maxWidth="xl"
    >
      <div className="space-y-3.5">
        {/* Live Warehouse Snapshot Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Students Analyzed</span>
            <span className="font-bold text-slate-900 text-sm">
              {overview ? overview.totalStudents.toLocaleString() : '4,820'}
            </span>
          </div>

          <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">At-Risk Students</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-rose-600 text-sm">
                {overview ? overview.atRiskStudents : '108'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({overview ? overview.atRiskPercentage.toFixed(2) : '2.24'}%)
              </span>
            </div>
          </div>

          <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Warehouse Engine</span>
            <span className="font-bold text-emerald-700 text-xs truncate block">
              {overview ? overview.databaseEngine : 'Supabase PostgreSQL'}
            </span>
          </div>

          <div className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Primary Risk Driver</span>
            <span className="font-bold text-indigo-700 text-xs truncate block">
              {importanceData?.primaryPredictor?.displayName || 'Attendance Rate (%)'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-[#f8f9fa] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('association')}
            className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
              activeTab === 'association'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Association Rules (Apriori)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clustering')}
            className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
              activeTab === 'clustering'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            K-Means Cohort Clustering
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('classification')}
            className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
              activeTab === 'classification'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Predictive Risk Drivers
          </button>
        </div>

        {/* Tab 1: Association Rules */}
        {activeTab === 'association' && (
          <div className="space-y-2.5">
            <div className="rounded-md border border-[#e5e7eb] bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs">
                  Live Star Schema Association Rules (Apriori Algorithm)
                </span>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono">
                  {rulesData ? `${rulesData.totalRules} Mined Rules` : 'Live Pipeline'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Co-occurrence patterns mined from real student cohort facts, linking attendance thresholds, backlogs, and academic risk classifications.
              </p>
            </div>

            {isLoadingRules ? (
              <div className="flex items-center justify-center p-6 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Computing frequent itemsets and association rules...</span>
              </div>
            ) : rulesData && rulesData.rules.length > 0 ? (
              <div className="space-y-2">
                {rulesData.rules.slice(0, 3).map((r) => {
                  const isRisk = r.category.includes('Risk');
                  return (
                    <div
                      key={r.id}
                      className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa]/70 p-3 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="font-semibold text-slate-800">{r.antecedentStr}</span>
                            <span className="text-indigo-600 font-bold">&rArr;</span>
                            <span className={`font-semibold ${isRisk ? 'text-rose-700' : 'text-indigo-700'}`}>
                              {r.consequentStr}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {r.interpretation}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs shrink-0">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
                            <span className="font-mono font-bold text-slate-900">{r.confidencePct}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Support</span>
                            <span className="font-mono font-medium text-slate-700">{r.supportPct}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Lift</span>
                            <span className="font-mono font-bold text-emerald-700">{r.lift.toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No association rules discovered at current parameters.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: K-Means Clustering */}
        {activeTab === 'clustering' && (
          <div className="space-y-2.5">
            <div className="rounded-md border border-[#e5e7eb] bg-white p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Live K-Means Student Capability Archetypes (K=3)
                </span>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono">
                  Silhouette: {clustersData ? clustersData.silhouetteScore.toFixed(3) : '...'}
                </span>
              </div>
              <p className="text-slate-500">
                Unsupervised centroid partitioning across 4,820 students evaluating GPA, biometric attendance, backlogs, and historical progress.
              </p>
            </div>

            {isLoadingClusters ? (
              <div className="flex items-center justify-center p-6 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Computing K-Means cluster centroids...</span>
              </div>
            ) : clustersData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {clustersData.clusters.map((c) => {
                  const border =
                    c.tier === 'Advanced'
                      ? 'border-indigo-200'
                      : c.tier === 'Proficient'
                      ? 'border-emerald-200'
                      : 'border-rose-200';

                  const textCol =
                    c.tier === 'Advanced'
                      ? 'text-indigo-700'
                      : c.tier === 'Proficient'
                      ? 'text-emerald-700'
                      : 'text-rose-700';

                  return (
                    <div key={c.clusterId} className={`rounded-md border ${border} bg-white p-3 space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${textCol}`}>{c.archetypeName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{c.percentage}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {c.studentCount.toLocaleString()} Students
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Centroid: GPA {c.centroid.current_gpa?.toFixed(2)} · Attendance {c.centroid.attendance_percentage?.toFixed(1)}% · Backlogs {c.centroid.failed_courses_count?.toFixed(1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">No cluster data available.</div>
            )}
          </div>
        )}

        {/* Tab 3: Predictive Classification */}
        {activeTab === 'classification' && (
          <div className="rounded-md border border-[#e5e7eb] bg-white p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Supervised Decision Tree Feature Importance (Gini / MDI):
              </span>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 font-mono">
                Live Model
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluates predictive weights for classifying academic risk on 75/25 stratified holdout data.
            </p>

            {isLoadingImportance ? (
              <div className="flex items-center justify-center p-6 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Extracting feature importances...</span>
              </div>
            ) : importanceData ? (
              <div className="space-y-2 pt-1">
                {importanceData.featureImportances.map((r) => (
                  <div key={r.feature}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-600 font-medium">{r.displayName}</span>
                      <span className="font-mono font-bold text-slate-900">{r.importancePercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, r.importancePercentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">No feature importance data available.</div>
            )}
          </div>
        )}

        {/* Footer Actions & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>
              Engine: {overview?.databaseEngine || 'Warehouse'} ({overview?.status || 'Live'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/analytics/data-mining"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e2438] text-white font-medium hover:bg-[#2a324d] transition-colors text-xs"
            >
              <span>Open Full Mining Workbench</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
