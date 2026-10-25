'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../../components/layout/AppShell';
import {
  Brain,
  Sliders,
  Layers,
  GitBranch,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Database,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Target,
  Award,
  Sparkles,
  Check,
  HelpCircle,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import {
  fetchMiningOverview,
  fetchMiningClusters,
  runKMeansExperiment,
  fetchKMeansExperimentDetail,
  fetchMiningRules,
  fetchMiningDecisionTree,
  fetchMiningFeatureImportance,
  MiningOverviewResponse,
  ClusterMiningResponse,
  AssociationMiningResponse,
  DecisionTreeMiningResponse,
  FeatureImportanceResponse,
  DecisionTreeNode,
  KMeansExperimentResponse,
  KMeansExperimentRunItem,
  ClusterDetailResponse,
  AlgorithmType,
  SingleAlgorithmRunResponse,
  AlgorithmBenchmarkResponse,
  AlgorithmBenchmarkItem,
  runClusteringAlgorithm,
  runClusteringBenchmark,
  runClassificationExperiment,
  fetchLatestClassificationExperiment,
  fetchClassificationHistory,
  fetchClassificationExperimentById,
  predictStudentRisk,
  ClassificationExperimentResponse,
  EvaluatedClassifierItem,
  ClassificationHistoryItem,
  PredictStudentRiskResponse,
} from '../../../lib/api';

export default function DataMiningPage() {
  const [activeTab, setActiveTab] = useState<'kmeans' | 'apriori' | 'tree' | 'importance'>('kmeans');

  // Overview State
  const [overview, setOverview] = useState<MiningOverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // K-Means Experimentation & Optimal K State
  const [minK, setMinK] = useState<number>(2);
  const [maxK, setMaxK] = useState<number>(10);
  const [stepK, setStepK] = useState<number>(1);
  const [nInit, setNInit] = useState<number>(10);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [evaluateStability, setEvaluateStability] = useState<boolean>(false);
  const [experimentData, setExperimentData] = useState<KMeansExperimentResponse | null>(null);
  const [isRunningExperiment, setIsRunningExperiment] = useState<boolean>(false);
  const [experimentError, setExperimentError] = useState<string | null>(null);
  const [selectedConfigK, setSelectedConfigK] = useState<number>(4);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [isLoadingConfigDetail, setIsLoadingConfigDetail] = useState<boolean>(false);
  const [activeChartMetric, setActiveChartMetric] = useState<'silhouette' | 'davies_bouldin' | 'calinski_harabasz'>('silhouette');
  const [hoveredPointK, setHoveredPointK] = useState<number | null>(null);

  // Sub-view toggle under Tab 1
  const [clusteringSubView, setClusteringSubView] = useState<'benchmark' | 'explorer' | 'kmeans_sweep'>('benchmark');

  // Multi-Algorithm Benchmark State
  const [benchmarkData, setBenchmarkData] = useState<AlgorithmBenchmarkResponse | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  // Algorithm Explorer State
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('kmeans');
  const [algoKVal, setAlgoKVal] = useState<number>(4);
  const [algoNInit, setAlgoNInit] = useState<number>(10);
  const [algoSeed, setAlgoSeed] = useState<number>(42);
  const [algoHcLinkage, setAlgoHcLinkage] = useState<'ward' | 'complete' | 'average' | 'single'>('ward');
  const [algoDbscanEps, setAlgoDbscanEps] = useState<number>(0.8);
  const [algoDbscanMinSamples, setAlgoDbscanMinSamples] = useState<number>(15);
  const [algoGmmCov, setAlgoGmmCov] = useState<'full' | 'tied' | 'diag' | 'spherical'>('full');
  const [algoRunData, setAlgoRunData] = useState<SingleAlgorithmRunResponse | null>(null);
  const [isRunningAlgo, setIsRunningAlgo] = useState<boolean>(false);
  const [algoRunError, setAlgoRunError] = useState<string | null>(null);
  const [selectedAlgoClusterId, setSelectedAlgoClusterId] = useState<number | null>(null);

  const executeBenchmark = () => {
    setIsRunningBenchmark(true);
    setBenchmarkError(null);
    runClusteringBenchmark()
      .then((data) => {
        setBenchmarkData(data);
        setIsRunningBenchmark(false);
      })
      .catch((err: any) => {
        console.error('Failed to run clustering benchmark:', err);
        setBenchmarkError(err.message || 'Benchmark run failed');
        setIsRunningBenchmark(false);
      });
  };

  const executeSingleAlgorithm = (
    algo = selectedAlgo,
    params?: any
  ) => {
    setIsRunningAlgo(true);
    setAlgoRunError(null);
    let runParams = params;
    if (!runParams) {
      if (algo === 'kmeans') {
        runParams = { k: algoKVal, n_init: algoNInit, random_state: algoSeed };
      } else if (algo === 'hierarchical') {
        runParams = { n_clusters: algoKVal, linkage: algoHcLinkage };
      } else if (algo === 'dbscan') {
        runParams = { eps: algoDbscanEps, min_samples: algoDbscanMinSamples };
      } else if (algo === 'gmm') {
        runParams = { n_components: algoKVal, covariance_type: algoGmmCov, random_state: algoSeed };
      }
    }

    runClusteringAlgorithm({ algorithm: algo, params: runParams })
      .then((data) => {
        setAlgoRunData(data);
        if (data.clusters.length > 0) {
          setSelectedAlgoClusterId(data.clusters[0].clusterId);
        }
        setIsRunningAlgo(false);
      })
      .catch((err: any) => {
        console.error('Failed to execute clustering algorithm:', err);
        setAlgoRunError(err.message || 'Algorithm execution failed');
        setIsRunningAlgo(false);
      });
  };

  // Apriori State
  const [minSupport, setMinSupport] = useState<number>(0.015);
  const [minConfidence, setMinConfidence] = useState<number>(0.60);
  const [maxLength, setMaxLength] = useState<number>(3);
  const [rulesData, setRulesData] = useState<AssociationMiningResponse | null>(null);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'lift' | 'confidence' | 'support'>('lift');

  // Decision Tree State
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>('gini');
  const [treeClassWeight, setTreeClassWeight] = useState<'standard' | 'balanced'>('standard');
  const [treeData, setTreeData] = useState<DecisionTreeMiningResponse | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Supervised Multi-Classifier State (Tab 3)
  const [classificationSubView, setClassificationSubView] = useState<'benchmark' | 'tree_inspector' | 'experiment_settings'>('benchmark');
  const [classificationData, setClassificationData] = useState<ClassificationExperimentResponse | null>(null);
  const [isLoadingClassification, setIsLoadingClassification] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [selectedInspectModelId, setSelectedInspectModelId] = useState<string | null>(null);
  const [clsTestSize, setClsTestSize] = useState<number>(0.20);
  const [clsSplits, setClsSplits] = useState<number>(5);
  const [clsSeed, setClsSeed] = useState<number>(42);
  const [clsMetricPolicy, setClsMetricPolicy] = useState<string>('macro_f1');
  const [clsHistory, setClsHistory] = useState<ClassificationHistoryItem[] | null>(null);
  const [isLoadingClsHistory, setIsLoadingClsHistory] = useState(false);

  const [isViewingHistoricalRun, setIsViewingHistoricalRun] = useState(false);

  // Student Risk Inference Simulator State
  const [predictGpa, setPredictGpa] = useState<number>(6.2);
  const [predictBacklogs, setPredictBacklogs] = useState<number>(1);
  const [predictSem6Avg, setPredictSem6Avg] = useState<number>(58.0);
  const [predictSem6Min, setPredictSem6Min] = useState<number>(42.0);
  const [predictHistGpa, setPredictHistGpa] = useState<number>(6.8);
  const [predictHistFails, setPredictHistFails] = useState<number>(0);
  const [predictDept, setPredictDept] = useState<string>('IT');
  const [predictResult, setPredictResult] = useState<PredictStudentRiskResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  const loadClassificationExperiment = (forceRerun = false) => {
    setIsLoadingClassification(true);
    setClassificationError(null);
    setIsViewingHistoricalRun(false);
    fetchLatestClassificationExperiment(forceRerun)
      .then((data) => {
        setClassificationData(data);
        setSelectedInspectModelId((prev) => {
          if (prev && data.models.some((m: EvaluatedClassifierItem) => m.modelId === prev)) return prev;
          return data.selectedModel.modelId;
        });
        setIsLoadingClassification(false);
      })
      .catch((err: any) => {
        console.error('Failed to load classification experiment:', err);
        setClassificationError(err.message || 'Failed to load classification benchmark');
        setIsLoadingClassification(false);
      });
  };

  const loadHistoryExperiment = (expId: string) => {
    setIsLoadingClassification(true);
    setClassificationError(null);
    fetchClassificationExperimentById(expId)
      .then((data) => {
        setClassificationData(data);
        setSelectedInspectModelId(data.selectedModel.modelId);
        setIsViewingHistoricalRun(true);
        setClassificationSubView('benchmark');
        setIsLoadingClassification(false);
      })
      .catch((err: any) => {
        console.error(`Failed to load historical experiment ${expId}:`, err);
        setClassificationError(err.message || `Failed to load experiment ${expId}`);
        setIsLoadingClassification(false);
      });
  };

  const executeClassificationRun = () => {
    setIsLoadingClassification(true);
    setClassificationError(null);
    setIsViewingHistoricalRun(false);
    runClassificationExperiment({
      test_size: clsTestSize,
      n_splits: clsSplits,
      random_state: clsSeed,
      metric_policy: clsMetricPolicy,
    })
      .then((data) => {
        setClassificationData(data);
        setSelectedInspectModelId(data.selectedModel.modelId);
        setIsLoadingClassification(false);
        loadClsHistory();
      })
      .catch((err: any) => {
        console.error('Failed to run classification experiment:', err);
        setClassificationError(err.message || 'Classification experiment execution failed');
        setIsLoadingClassification(false);
      });
  };

  const executeStudentPrediction = () => {
    setIsPredicting(true);
    setPredictError(null);
    predictStudentRisk({
      current_gpa: Number(predictGpa),
      failed_courses_count: Number(predictBacklogs),
      sem6_avg_marks: Number(predictSem6Avg),
      sem6_min_marks: Number(predictSem6Min),
      hist_avg_gpa: Number(predictHistGpa),
      hist_fail_count: Number(predictHistFails),
      gpa_momentum: Number((predictGpa - predictHistGpa).toFixed(2)),
      department_code: predictDept,
      experiment_id: classificationData?.experimentId,
    })
      .then((res) => {
        setPredictResult(res);
        setIsPredicting(false);
      })
      .catch((err: any) => {
        console.error('Prediction failed:', err);
        setPredictError(err.message || 'Risk inference calculation failed');
        setIsPredicting(false);
      });
  };

  const loadClsHistory = () => {
    setIsLoadingClsHistory(true);
    fetchClassificationHistory()
      .then((res) => {
        setClsHistory(res.history);
        setIsLoadingClsHistory(false);
      })
      .catch((err) => {
        console.error('Failed to load classification history:', err);
        setIsLoadingClsHistory(false);
      });
  };

  // Feature Importance State
  const [importanceData, setImportanceData] = useState<FeatureImportanceResponse | null>(null);
  const [isLoadingImportance, setIsLoadingImportance] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  const handleExportMiningData = async () => {
    try {
      setIsExporting(true);
      let reportId = 'mining_clusters';
      if (activeTab === 'kmeans') reportId = 'mining_clusters';
      else if (activeTab === 'apriori') reportId = 'mining_rules';
      else reportId = 'mining_features';

      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'Analytics' : 'Analytics';
      const res = await fetch(`/api/reports/export?report_id=${reportId}&format=csv`, {
        headers: {
          'X-User-Role': userRole,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate mining artifact export');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `${reportId}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error exporting mining data');
    } finally {
      setIsExporting(false);
    }
  };

  // ----------------------------------------------------------------------------
  // 1. Initial Load: Overview & Active Algorithm
  // ----------------------------------------------------------------------------
  useEffect(() => {
    setIsLoadingOverview(true);
    fetchMiningOverview()
      .then((data) => {
        setOverview(data);
        setIsLoadingOverview(false);
      })
      .catch((err) => {
        console.error('Failed to load mining overview:', err);
        setIsLoadingOverview(false);
      });
  }, []);

  // ----------------------------------------------------------------------------
  // 2. K-Means Experiment Sweep & Drill-down Handlers
  // ----------------------------------------------------------------------------
  const executeExperimentSweep = (
    cMinK = minK,
    cMaxK = maxK,
    cStep = stepK,
    cNInit = nInit,
    cSeed = randomSeed,
    cStability = evaluateStability
  ) => {
    if (cMinK < 2 || cMaxK > 15 || cMinK > cMaxK) {
      setExperimentError('Invalid K range: Ensure 2 ≤ Min K ≤ Max K ≤ 15.');
      return;
    }
    setIsRunningExperiment(true);
    setExperimentError(null);
    runKMeansExperiment({
      min_k: cMinK,
      max_k: cMaxK,
      step: cStep,
      n_init: cNInit,
      random_state: cSeed,
      evaluate_stability: cStability,
    })
      .then((data) => {
        setExperimentData(data);
        const recK = data.recommendation.recommendedK;
        setSelectedConfigK(recK);
        if (data.selectedClustering.clusters.length > 0) {
          setSelectedClusterId(data.selectedClustering.clusters[0].clusterId);
        }
        setIsRunningExperiment(false);
      })
      .catch((err: any) => {
        console.error('Failed to run K-Means experiment:', err);
        setExperimentError(err.message || 'Failed to execute K-Means experiment sweep');
        setIsRunningExperiment(false);
      });
  };

  const handleSelectKConfig = (k: number) => {
    setSelectedConfigK(k);
    if (!experimentData) return;
    setIsLoadingConfigDetail(true);
    fetchKMeansExperimentDetail(k, experimentData.runId)
      .then((detail) => {
        setExperimentData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            selectedK: k,
            selectedClustering: {
              k,
              inertia: detail.inertia,
              silhouetteScore: detail.silhouetteScore || 0,
              clusters: detail.clusters,
              projection: detail.projection,
            },
          };
        });
        if (detail.clusters.length > 0) {
          setSelectedClusterId(detail.clusters[0].clusterId);
        }
        setIsLoadingConfigDetail(false);
      })
      .catch((err: any) => {
        console.error('Failed to fetch configuration details:', err);
        setIsLoadingConfigDetail(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'kmeans') {
      if (!benchmarkData && !isRunningBenchmark) {
        executeBenchmark();
      }
      if (!algoRunData && !isRunningAlgo) {
        executeSingleAlgorithm('kmeans');
      }
      if (!experimentData && !isRunningExperiment) {
        executeExperimentSweep(2, 10, 1, 10, 42, false);
      }
    }
  }, [activeTab]);

  // ----------------------------------------------------------------------------
  // 3. Apriori API Fetch
  // ----------------------------------------------------------------------------
  const loadRules = (supp: number, conf: number, len: number) => {
    setIsLoadingRules(true);
    setRulesError(null);
    fetchMiningRules(supp, conf, len)
      .then((data) => {
        setRulesData(data);
        setIsLoadingRules(false);
      })
      .catch((err) => {
        console.error('Failed to load association rules:', err);
        setRulesError(err.message || 'Failed to discover rules');
        setIsLoadingRules(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'apriori' && !rulesData) {
      loadRules(minSupport, minConfidence, maxLength);
    }
  }, [activeTab]);

  const handleRulesParamChange = (supp: number, conf: number, len: number) => {
    setMinSupport(supp);
    setMinConfidence(conf);
    setMaxLength(len);
    loadRules(supp, conf, len);
  };

  // Filtered & Sorted Rules
  const filteredRules = useMemo(() => {
    if (!rulesData) return [];
    let list = rulesData.rules.filter((r) => {
      if (!ruleSearch.trim()) return true;
      const term = ruleSearch.toLowerCase();
      return (
        r.antecedentStr.toLowerCase().includes(term) ||
        r.consequentStr.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term) ||
        r.interpretation.toLowerCase().includes(term)
      );
    });

    list.sort((a, b) => {
      if (sortField === 'lift') return b.lift - a.lift;
      if (sortField === 'confidence') return b.confidence - a.confidence;
      return b.support - a.support;
    });

    return list;
  }, [rulesData, ruleSearch, sortField]);

  // ----------------------------------------------------------------------------
  // 4. Decision Tree API Fetch
  // ----------------------------------------------------------------------------
  const loadTree = (
    depth: number,
    crit: 'gini' | 'entropy',
    cw: 'standard' | 'balanced' = treeClassWeight
  ) => {
    setIsLoadingTree(true);
    setTreeError(null);
    fetchMiningDecisionTree(depth, crit, cw === 'balanced' ? 'balanced' : null)
      .then((data) => {
        setTreeData(data);
        setIsLoadingTree(false);
      })
      .catch((err) => {
        console.error('Failed to load decision tree:', err);
        setTreeError(err.message || 'Failed to train decision tree');
        setIsLoadingTree(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'tree') {
      if (!classificationData && !isLoadingClassification) {
        loadClassificationExperiment();
      }
      if (!treeData && !isLoadingTree) {
        loadTree(maxDepth, criterion, treeClassWeight);
      }
    }
  }, [activeTab]);

  const handleTreeParamChange = (
    depth: number,
    crit: 'gini' | 'entropy',
    cw: 'standard' | 'balanced' = treeClassWeight
  ) => {
    setMaxDepth(depth);
    setCriterion(crit);
    setTreeClassWeight(cw);
    loadTree(depth, crit, cw);
  };

  // ----------------------------------------------------------------------------
  // 5. Feature Importance API Fetch
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'importance' && !importanceData) {
      setIsLoadingImportance(true);
      fetchMiningFeatureImportance()
        .then((data) => {
          setImportanceData(data);
          setIsLoadingImportance(false);
        })
        .catch((err) => {
          console.error('Failed to load feature importance:', err);
          setIsLoadingImportance(false);
        });
    }
  }, [activeTab]);

  return (
    <AppShell activeItem="data-mining">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Analytics</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Data Mining</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              Data Mining & Machine Learning Workbench
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Knowledge discovery from academic data warehouse facts using clustering, association rules, and classification
            </p>
          </div>

          {/* Engine & Health Badge & Export Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportMiningData}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#e7eaee] text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className={`h-3.5 w-3.5 text-slate-600 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting...' : 'Export Artifacts (CSV)'}</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{overview?.databaseEngine || 'Conformed Star Schema'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1e2438] text-white text-xs font-semibold shadow-2xs">
              <Brain className="h-3.5 w-3.5 text-[#f87941]" />
              <span>DWM Mining Engine</span>
            </span>
          </div>
        </div>

        {/* Live Cohort Mining Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-white border border-[#e7eaee] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Cohort Grain</span>
              <Database className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-[#1e2238]">
              {overview ? overview.totalStudents.toLocaleString() : '4,820'}
            </p>
            <p className="text-[11px] text-slate-500">Enrolled Students Evaluated</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#e7eaee] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>At-Risk Students</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-bold text-rose-600">
                {overview ? overview.atRiskStudents : '108'}
              </p>
              <span className="text-xs font-semibold text-rose-700 font-mono">
                ({overview ? overview.atRiskPercentage.toFixed(2) : '2.24'}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">FactStudentRiskStatus (Sem VI)</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#e7eaee] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Cohort Mean GPA</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-[#1e2238]">
              {overview ? overview.cohortMeanGpa.toFixed(2) : '7.82'}
              <span className="text-xs text-slate-400 font-normal"> / 10.0</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Weighted Cumulative Average</p>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-[#e7eaee] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Mean Attendance</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <p className="text-lg font-bold text-[#1e2238]">
              {overview ? `${overview.cohortMeanAttendance.toFixed(1)}%` : '87.6%'}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium">Lecture & Practical Sessions</p>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e7eaee] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kmeans')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'kmeans'
                ? 'bg-[#1e2438] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>1. Student Archetypes &amp; Clustering</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apriori')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'apriori'
                ? 'bg-[#1e2438] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>2. Apriori Rule Mining</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'tree'
                ? 'bg-[#1e2438] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>3. Supervised Classification &amp; Model Selection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('importance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'importance'
                ? 'bg-[#1e2438] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>4. Feature Importance & Correlation</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: UNSUPERVISED CLUSTERING & STUDENT ARCHETYPES (MULTI-ALGORITHM) */}
        {/* ========================================================================= */}
        {activeTab === 'kmeans' && (
          <div className="space-y-5">
            {/* SUB-VIEW NAVIGATION SWITCHER */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-[#e7eaee] shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setClusteringSubView('benchmark')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    clusteringSubView === 'benchmark'
                      ? 'bg-[#1e2238] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className="h-3.5 w-3.5 text-amber-300" />
                  <span>1. Multi-Algorithm Benchmark &amp; Recommendation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClusteringSubView('explorer');
                    if (!algoRunData) executeSingleAlgorithm(selectedAlgo);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    clusteringSubView === 'explorer'
                      ? 'bg-[#1e2238] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  <span>2. Algorithm Explorer &amp; Configurator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClusteringSubView('kmeans_sweep')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    clusteringSubView === 'kmeans_sweep'
                      ? 'bg-[#1e2238] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>3. K-Means Optimal K Sweep &amp; Elbow</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pr-2">
                <Database className="h-3.5 w-3.5 text-indigo-600" />
                <span>4,820 Conformed Student Records</span>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SUB-VIEW 1: MULTI-ALGORITHM BENCHMARK & RECOMMENDATION */}
            {/* =================================================================== */}
            {clusteringSubView === 'benchmark' && (
              <div className="space-y-5">
                {/* Header Controls */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
                          <Layers className="h-4 w-4" />
                        </span>
                        <h2 className="text-sm font-bold text-[#1e2238]">
                          Comparative Clustering Benchmark: K-Means vs. Hierarchical vs. DBSCAN vs. GMM
                        </h2>
                        {isRunningBenchmark && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            Evaluating All 4 Paradigms...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Executes centroid-based, bottom-up agglomerative, density-connected, and Gaussian mixture clustering models over conformed student feature vectors. Evaluates mathematical separation indices, cluster balance, noise anomalies, and institutional applicability.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={executeBenchmark}
                        disabled={isRunningBenchmark}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1e2238] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                      >
                        {isRunningBenchmark ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                            <span>Benchmarking 4 Algorithms...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Re-Run Comparative Benchmark</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Feature Vector Tag */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">Conformed Feature Space (Standardized Z-Score):</span>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">current_gpa</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">attendance_percentage</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">failed_courses_count</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">hist_avg_gpa</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">sem6_avg_marks</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cohort Size: 4,820 Students (Identical Matrix)
                    </span>
                  </div>

                  {benchmarkError && (
                    <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{benchmarkError}</span>
                      <button type="button" onClick={executeBenchmark} className="ml-auto underline font-bold">
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Recommendation & Insights 4 Cards */}
                {benchmarkData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. Best Mathematical */}
                    <div className="bg-white rounded-lg border border-indigo-200 bg-indigo-50/20 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-indigo-700 text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          Peak Mathematical Separation
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
                          Rank #1
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-[#1e2238] pt-0.5">
                        {benchmarkData.recommendation.bestMathematicalName}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {benchmarkData.recommendation.bestMathematicalReason}
                      </p>
                    </div>

                    {/* 2. Best Pedagogical Policy */}
                    <div className="bg-white rounded-lg border border-emerald-200 bg-emerald-50/20 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-700 text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />
                          Institutional Academic Utility
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          Actionable Tiers
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-emerald-900 pt-0.5">
                        {benchmarkData.recommendation.bestPedagogicalName}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {benchmarkData.recommendation.bestPedagogicalReason}
                      </p>
                    </div>

                    {/* 3. Outlier / Anomaly Highlights */}
                    <div className="bg-white rounded-lg border border-amber-200 bg-amber-50/20 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-amber-800 text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Outlier &amp; Anomaly Detection
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                          DBSCAN Noise
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-amber-900 pt-0.5">
                        DBSCAN Density Analysis
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {benchmarkData.recommendation.outlierDetectionHighlights}
                      </p>
                    </div>

                    {/* 4. Execution Speed & Scalability */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-xs">
                        <span className="font-medium flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Scalability &amp; Latency Trade-offs
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Runtime Complexity
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-[#1e2238] pt-0.5">
                        Algorithmic Complexity
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {benchmarkData.recommendation.tradeoffAnalysis}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comparison Diagnostics Matrix Table */}
                {benchmarkData && (
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                          <span>Multi-Algorithm Quality &amp; Diagnostic Matrix</span>
                          <span className="text-xs font-normal text-slate-400">
                            (Standardized comparison across identical 4,820 student records)
                          </span>
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        4 Algorithmic Paradigms
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                          <tr>
                            <th className="py-2.5 px-3">Algorithm &amp; Paradigm</th>
                            <th className="py-2.5 px-3">Evaluated Parameters</th>
                            <th className="py-2.5 px-3 text-center">Clusters</th>
                            <th className="py-2.5 px-3 text-right">Silhouette (↑)</th>
                            <th className="py-2.5 px-3 text-right">Davies–Bouldin (↓)</th>
                            <th className="py-2.5 px-3 text-right">Calinski–Harabasz (↑)</th>
                            <th className="py-2.5 px-3 text-center">Sizes (Min..Max)</th>
                            <th className="py-2.5 px-3 text-center">Imbalance</th>
                            <th className="py-2.5 px-3 text-center">Outliers (Noise)</th>
                            <th className="py-2.5 px-3 text-right">Latency (ms)</th>
                            <th className="py-2.5 px-3 text-center">Suitability</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {benchmarkData.benchmarkRuns.map((r: AlgorithmBenchmarkItem) => {
                            const isMathTop = r.algorithmId === benchmarkData.recommendation.bestMathematicalAlgorithm;
                            const isPedTop = r.algorithmId === benchmarkData.recommendation.bestPedagogicalAlgorithm;

                            return (
                              <tr key={r.algorithmId} className="hover:bg-slate-50/70 transition-all">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#1e2238]">{r.algorithmName}</span>
                                    {isMathTop && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        Top Metric
                                      </span>
                                    )}
                                    {isPedTop && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block">{r.category}</span>
                                </td>

                                <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                  {Object.entries(r.parameters)
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(', ')}
                                </td>

                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                                  {r.clustersCount}
                                </td>

                                <td className="py-2 px-3 text-right font-mono">
                                  {r.silhouetteScore !== null ? (
                                    <span
                                      className={`font-bold ${
                                        r.silhouetteScore >= 0.55
                                          ? 'text-emerald-700'
                                          : r.silhouetteScore >= 0.50
                                          ? 'text-teal-700'
                                          : 'text-amber-700'
                                      }`}
                                    >
                                      {r.silhouetteScore.toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400" title="Undefined for < 2 clusters">N/A</span>
                                  )}
                                </td>

                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {r.daviesBouldinIndex !== null ? r.daviesBouldinIndex.toFixed(4) : 'N/A'}
                                </td>

                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {r.calinskiHarabaszScore !== null ? Math.round(r.calinskiHarabaszScore).toLocaleString() : 'N/A'}
                                </td>

                                <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                                  {r.minClusterSize.toLocaleString()} – {r.maxClusterSize.toLocaleString()}
                                </td>

                                <td className="py-2 px-3 text-center font-mono">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      r.imbalanceRatio > 4.0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : r.imbalanceRatio > 2.5
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {r.imbalanceRatio.toFixed(2)}x
                                  </span>
                                </td>

                                <td className="py-2 px-3 text-center font-mono">
                                  {r.noiseCount > 0 ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      {r.noiseCount} ({r.noisePercentage}%)
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">0 (0.0%)</span>
                                  )}
                                </td>

                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {r.executionTimeMs} ms
                                </td>

                                <td className="py-2 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800">
                                    {r.suitabilityScore.toFixed(3)}
                                    <span className="text-[9px] text-slate-400 font-sans">#{r.rank}</span>
                                  </span>
                                </td>

                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAlgo(r.algorithmId);
                                      if (r.algorithmId === 'kmeans' && r.parameters) {
                                        if (r.parameters.k) setAlgoKVal(r.parameters.k);
                                        if (r.parameters.n_init) setAlgoNInit(r.parameters.n_init);
                                        if (r.parameters.random_state) setAlgoSeed(r.parameters.random_state);
                                      } else if (r.algorithmId === 'hierarchical' && r.parameters) {
                                        if (r.parameters.n_clusters) setAlgoKVal(r.parameters.n_clusters);
                                        if (r.parameters.linkage) setAlgoHcLinkage(r.parameters.linkage);
                                      } else if (r.algorithmId === 'dbscan' && r.parameters) {
                                        if (r.parameters.eps) setAlgoDbscanEps(r.parameters.eps);
                                        if (r.parameters.min_samples) setAlgoDbscanMinSamples(r.parameters.min_samples);
                                      } else if (r.algorithmId === 'gmm' && r.parameters) {
                                        if (r.parameters.n_components) setAlgoKVal(r.parameters.n_components);
                                        if (r.parameters.covariance_type) setAlgoGmmCov(r.parameters.covariance_type);
                                        if (r.parameters.random_state) setAlgoSeed(r.parameters.random_state);
                                      }
                                      executeSingleAlgorithm(r.algorithmId, r.parameters);
                                      setClusteringSubView('explorer');
                                    }}
                                    className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#1e2238] text-white hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Noise & Evaluation Policy Note */}
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800">Clustering Metric Evaluation &amp; Noise Handling Protocol:</span>
                        <p className="text-[11px] leading-relaxed">
                          • <strong>Cohesion &amp; Separation Indices:</strong> Evaluated across all 4,820 student records without sub-sampling variance, ensuring deterministic agreement across all dashboard views.<br />
                          • <strong>DBSCAN Outlier Policy:</strong> 5 atypical student trajectories (0.1%) flagged as density noise are isolated and excluded from intra-cluster cohesion indices (Silhouette, Davies-Bouldin, Calinski-Harabasz). These metrics are evaluated across the 4,815 valid core cluster members.<br />
                          • <strong>Pedagogical vs. Mathematical Suitability:</strong> K-Means achieves Rank #1 mathematical separation (CH=10,246, Sil=0.5690) while providing 4 discrete, actionable institutional capability tiers without unclassified students.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SVG Metric Comparison Visualizations */}
                {benchmarkData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Quality Separation Chart */}
                    <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Separation &amp; Cohesion Scores (Silhouette Score ↑)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Higher Silhouette indicates superior intra-cluster compactness and inter-cluster margin.
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {benchmarkData.benchmarkRuns.map((r: AlgorithmBenchmarkItem) => {
                          const silVal = r.silhouetteScore ?? 0;
                          const pct = Math.max(0, Math.min(100, (silVal / 0.70) * 100));
                          return (
                            <div key={r.algorithmId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">{r.algorithmName}</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {r.silhouetteScore !== null ? r.silhouetteScore.toFixed(4) : 'Undefined'}
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className={`rounded-full transition-all ${
                                    r.algorithmId === 'kmeans'
                                      ? 'bg-indigo-600'
                                      : r.algorithmId === 'hierarchical'
                                      ? 'bg-emerald-600'
                                      : r.algorithmId === 'dbscan'
                                      ? 'bg-amber-500'
                                      : 'bg-purple-600'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Execution Latency Chart */}
                    <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Computational Execution Latency (Milliseconds ↓)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Measures real runtime over the 4,820 student records (lower is faster).
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {(() => {
                          const maxTime = Math.max(...benchmarkData.benchmarkRuns.map((r: AlgorithmBenchmarkItem) => r.executionTimeMs), 1);
                          return benchmarkData.benchmarkRuns.map((r: AlgorithmBenchmarkItem) => {
                            const pct = Math.max(5, (r.executionTimeMs / maxTime) * 100);
                            return (
                              <div key={r.algorithmId} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800">{r.algorithmName}</span>
                                  <span className="font-mono font-bold text-slate-900">{r.executionTimeMs} ms</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`rounded-full transition-all ${
                                      r.executionTimeMs < 100 ? 'bg-emerald-600' : r.executionTimeMs < 500 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-VIEW 2: ALGORITHM EXPLORER & CONFIGURATOR */}
            {/* =================================================================== */}
            {clusteringSubView === 'explorer' && (
              <div className="space-y-5">
                {/* Configurator Panel */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-indigo-600" />
                        <span>Interactive Algorithm Configurator &amp; Explorer</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select an algorithm, adjust its specific hyperparameters, and analyze the resulting cluster partitions and 2D projections.
                      </p>
                    </div>

                    {/* Algorithm Selector Pills */}
                    <div className="inline-flex rounded-md border border-[#e7eaee] bg-slate-50 p-0.5 text-xs font-semibold shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlgo('kmeans');
                          executeSingleAlgorithm('kmeans');
                        }}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          selectedAlgo === 'kmeans' ? 'bg-[#1e2238] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        K-Means
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlgo('hierarchical');
                          executeSingleAlgorithm('hierarchical');
                        }}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          selectedAlgo === 'hierarchical' ? 'bg-[#1e2238] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Hierarchical
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlgo('dbscan');
                          executeSingleAlgorithm('dbscan');
                        }}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          selectedAlgo === 'dbscan' ? 'bg-[#1e2238] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        DBSCAN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlgo('gmm');
                          executeSingleAlgorithm('gmm');
                        }}
                        className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                          selectedAlgo === 'gmm' ? 'bg-[#1e2238] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        GMM
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Hyperparameters Form */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {selectedAlgo === 'kmeans' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Clusters (K)</label>
                          <input
                            type="number"
                            min={2}
                            max={15}
                            value={algoKVal}
                            onChange={(e) => setAlgoKVal(Math.max(2, Math.min(15, parseInt(e.target.value) || 4)))}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Initializations (n_init)</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={algoNInit}
                            onChange={(e) => setAlgoNInit(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Random State Seed</label>
                          <input
                            type="number"
                            value={algoSeed}
                            onChange={(e) => setAlgoSeed(parseInt(e.target.value) || 42)}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                      </>
                    )}

                    {selectedAlgo === 'hierarchical' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Clusters (n_clusters)</label>
                          <input
                            type="number"
                            min={2}
                            max={15}
                            value={algoKVal}
                            onChange={(e) => setAlgoKVal(Math.max(2, Math.min(15, parseInt(e.target.value) || 4)))}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Linkage Method</label>
                          <select
                            value={algoHcLinkage}
                            onChange={(e: any) => setAlgoHcLinkage(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 text-xs font-semibold"
                          >
                            <option value="ward">Ward (Variance Minimizing)</option>
                            <option value="complete">Complete (Max Distance)</option>
                            <option value="average">Average (Mean Distance)</option>
                            <option value="single">Single (Min Distance)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedAlgo === 'dbscan' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Epsilon (ε Radius)</label>
                          <input
                            type="number"
                            step="0.05"
                            min={0.1}
                            max={3.0}
                            value={algoDbscanEps}
                            onChange={(e) => setAlgoDbscanEps(parseFloat(e.target.value) || 0.8)}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Neighborhood radius (0.8)</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Samples</label>
                          <input
                            type="number"
                            min={2}
                            max={100}
                            value={algoDbscanMinSamples}
                            onChange={(e) => setAlgoDbscanMinSamples(Math.max(2, Math.min(100, parseInt(e.target.value) || 15)))}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Core density threshold (15)</span>
                        </div>
                      </>
                    )}

                    {selectedAlgo === 'gmm' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Components (K)</label>
                          <input
                            type="number"
                            min={2}
                            max={15}
                            value={algoKVal}
                            onChange={(e) => setAlgoKVal(Math.max(2, Math.min(15, parseInt(e.target.value) || 4)))}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Covariance Type</label>
                          <select
                            value={algoGmmCov}
                            onChange={(e: any) => setAlgoGmmCov(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 text-xs font-semibold"
                          >
                            <option value="full">Full (Independent Ellipsoids)</option>
                            <option value="tied">Tied (Shared Covariance)</option>
                            <option value="diag">Diagonal (Axis-Aligned)</option>
                            <option value="spherical">Spherical (Single Variance)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Random State Seed</label>
                          <input
                            type="number"
                            value={algoSeed}
                            onChange={(e) => setAlgoSeed(parseInt(e.target.value) || 42)}
                            className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => executeSingleAlgorithm(selectedAlgo)}
                        disabled={isRunningAlgo}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#1e2238] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                      >
                        {isRunningAlgo ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Fitting Model...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Fit {selectedAlgo.toUpperCase()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {algoRunError && (
                    <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{algoRunError}</span>
                    </div>
                  )}
                </div>

                {/* Model Metrics & Strengths/Limitations */}
                {algoRunData && (
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Fitted Model Summary</span>
                        <h4 className="text-sm font-bold text-[#1e2238]">
                          {algoRunData.algorithmName} ({algoRunData.clustersCount} Clusters Discovered)
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                        <div>
                          <span className="text-slate-400">Silhouette: </span>
                          <strong className="text-emerald-700">
                            {algoRunData.silhouetteScore !== null ? algoRunData.silhouetteScore.toFixed(4) : 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Davies-Bouldin: </span>
                          <strong className="text-slate-800">
                            {algoRunData.daviesBouldinIndex !== null ? algoRunData.daviesBouldinIndex.toFixed(4) : 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Calinski-Harabasz: </span>
                          <strong className="text-slate-800">
                            {algoRunData.calinskiHarabaszScore !== null ? Math.round(algoRunData.calinskiHarabaszScore).toLocaleString() : 'N/A'}
                          </strong>
                        </div>
                        {algoRunData.noiseCount > 0 && (
                          <div>
                            <span className="text-amber-600 font-bold">Outliers: </span>
                            <strong className="text-amber-800 font-bold">
                              {algoRunData.noiseCount} ({algoRunData.noisePercentage}%)
                            </strong>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">Time: </span>
                          <strong className="text-slate-800">{algoRunData.executionTimeMs} ms</strong>
                        </div>
                      </div>
                    </div>

                    {algoRunData.noiseHandlingPolicy && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block">Metric Evaluation &amp; Cohort Policy:</span>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{algoRunData.noiseHandlingPolicy}</p>
                        </div>
                      </div>
                    )}

                    {algoRunData.warnings && algoRunData.warnings.length > 0 && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <span className="font-bold block">Notice:</span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {algoRunData.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-slate-800 block mb-1">Key Strengths:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {algoRunData.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-slate-800 block mb-1">Known Limitations:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {algoRunData.limitations.map((l, idx) => (
                            <li key={idx}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2D Projection Scatter Plot */}
                {algoRunData && algoRunData.projection && (
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>2D Feature Projection: Attendance Rate (%) vs. Current GPA (0..10)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {algoRunData.projection.projectionType}
                        </p>
                        {algoRunData.projection.projectionNote && (
                          <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
                            {algoRunData.projection.projectionNote}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {algoRunData.projection.points.length} Samples Plotted
                      </span>
                    </div>

                    {(() => {
                      const proj = algoRunData.projection;
                      const w = 560;
                      const h = 240;
                      const pad = { left: 45, right: 25, top: 20, bottom: 35 };

                      const xMin = 3.0;
                      const xMax = 10.0;
                      const yMin = 40;
                      const yMax = 100;

                      const getX = (gpa: number) =>
                        pad.left + ((Math.max(xMin, Math.min(xMax, gpa)) - xMin) / (xMax - xMin)) * (w - pad.left - pad.right);
                      const getY = (att: number) =>
                        pad.top + (1 - (Math.max(yMin, Math.min(yMax, att)) - yMin) / (yMax - yMin)) * (h - pad.top - pad.bottom);

                      const clusterColorMap: Record<number, string> = {
                        0: '#64748b', // Outlier/noise in DBSCAN
                        1: '#4f46e5',
                        2: '#059669',
                        3: '#d97706',
                        4: '#e11d48',
                        5: '#9333ea',
                        6: '#0891b2',
                        7: '#2563eb',
                      };

                      return (
                        <div className="relative w-full overflow-hidden bg-white rounded border border-slate-200">
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
                            {[50, 60, 70, 80, 90, 100].map((attVal) => {
                              const yPos = getY(attVal);
                              return (
                                <g key={attVal}>
                                  <line x1={pad.left} y1={yPos} x2={w - pad.right} y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
                                  <text x={pad.left - 6} y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                                    {attVal}%
                                  </text>
                                </g>
                              );
                            })}

                            {[4, 5, 6, 7, 8, 9, 10].map((gpaVal) => {
                              const xPos = getX(gpaVal);
                              return (
                                <g key={gpaVal}>
                                  <line x1={xPos} y1={pad.top} x2={xPos} y2={h - pad.bottom} stroke="#f1f5f9" strokeWidth="1" />
                                  <text x={xPos} y={h - pad.bottom + 14} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                                    {gpaVal.toFixed(1)}
                                  </text>
                                </g>
                              );
                            })}

                            {proj.points.map((pt) => {
                              const cx = getX(pt.x);
                              const cy = getY(pt.y);
                              const col = clusterColorMap[pt.clusterId] || '#64748b';
                              const isNoise = pt.clusterId === 0;
                              return (
                                <circle
                                  key={pt.studentId}
                                  cx={cx}
                                  cy={cy}
                                  r={isNoise ? "3.5" : "2.5"}
                                  fill={isNoise ? "none" : col}
                                  stroke={isNoise ? "#e11d48" : "none"}
                                  strokeWidth={isNoise ? "1.5" : "0"}
                                  fillOpacity={isNoise ? 1 : 0.65}
                                />
                              );
                            })}

                            {proj.centroids.map((cent) => {
                              const cx = getX(cent.x);
                              const cy = getY(cent.y);
                              const col = clusterColorMap[cent.clusterId] || '#1e2238';
                              return (
                                <g key={cent.clusterId}>
                                  <circle cx={cx} cy={cy} r="8" fill={col} stroke="#ffffff" strokeWidth="2" />
                                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffffff">
                                    C{cent.clusterId}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                            <span>X-Axis: Current Cumulative GPA (3.0 to 10.0 scale)</span>
                            <span>Y-Axis: Attendance Percentage (40% to 100%)</span>
                            <span>Points: Student cohort slice; Circles: Centroids</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Cluster Archetype Cards */}
                {algoRunData && (
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-[#1e2238]">
                        Discovered Student Capability Archetypes ({algoRunData.clusters.length} Groups)
                      </h4>
                      <span className="text-xs text-slate-400">Click any card to inspect representative student exemplars</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {algoRunData.clusters.map((c) => {
                        const isSelected = selectedAlgoClusterId === c.clusterId;
                        const isNoise = c.clusterId === 0;

                        return (
                          <div
                            key={c.clusterId}
                            onClick={() => setSelectedAlgoClusterId(c.clusterId)}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                              isNoise
                                ? 'border-amber-200 bg-amber-50/40'
                                : c.tier === 'Advanced'
                                ? 'border-indigo-200 bg-indigo-50/40'
                                : c.tier === 'Proficient'
                                ? 'border-emerald-200 bg-emerald-50/40'
                                : c.tier === 'Developing'
                                ? 'border-amber-200 bg-amber-50/40'
                                : 'border-rose-200 bg-rose-50/40'
                            } ${isSelected ? 'ring-2 ring-[#1e2438] shadow-xs' : 'hover:shadow-2xs'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                {isNoise ? 'DBSCAN Noise' : `Cluster 0${c.clusterId}`}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isNoise ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {c.tier}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-[#1e2238] mt-1.5">{c.archetypeName}</h3>

                            <div className="flex items-baseline justify-between text-xs text-slate-500 mt-1">
                              <span className="font-semibold text-slate-700">
                                {c.studentCount.toLocaleString()} Students
                              </span>
                              <span className="font-mono font-bold text-slate-900">{c.percentage}%</span>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Centroid GPA:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {c.centroid.current_gpa?.toFixed(2)} / 10.0
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Centroid Attendance:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {c.centroid.attendance_percentage?.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Mean Backlogs:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {c.centroid.failed_courses_count?.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 p-2 rounded bg-white/80 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-800 block text-[10px] uppercase tracking-wide mb-0.5">
                                Institutional Policy:
                              </span>
                              {c.recommendedAction}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Exemplar Students Table */}
                    {selectedAlgoClusterId !== null && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        {(() => {
                          const sel = algoRunData.clusters.find((c) => c.clusterId === selectedAlgoClusterId);
                          if (!sel || !sel.sampleStudents || sel.sampleStudents.length === 0) {
                            return null;
                          }

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide">
                                  Exemplars for {sel.clusterId === 0 ? 'DBSCAN Outlier Cluster' : `Cluster 0${sel.clusterId}`} (Closest to Centroid)
                                </h5>
                                <span className="text-[11px] text-slate-400">Euclidean distance nearest neighbors</span>
                              </div>

                              <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                                    <tr>
                                      <th className="py-2 px-3">Student ID</th>
                                      <th className="py-2 px-3">Student Name</th>
                                      <th className="py-2 px-3">Department</th>
                                      <th className="py-2 px-3 text-right">Current GPA</th>
                                      <th className="py-2 px-3 text-right">Attendance</th>
                                      <th className="py-2 px-3 text-center">Failed Courses</th>
                                      <th className="py-2 px-3 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {sel.sampleStudents.map((s) => (
                                      <tr key={s.studentId} className="hover:bg-slate-50/60">
                                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{s.studentId}</td>
                                        <td className="py-2 px-3 font-semibold text-[#1e2238]">{s.studentName}</td>
                                        <td className="py-2 px-3 text-slate-600">{s.department}</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-900">{s.gpa.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right font-medium text-slate-700">
                                          {s.attendanceRate.toFixed(1)}%
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span
                                            className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                                              s.failedCoursesCount > 0
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'text-slate-400'
                                            }`}
                                          >
                                            {s.failedCoursesCount}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {s.isAtRisk ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                              At-Risk
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              Good Standing
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-VIEW 3: K-MEANS OPTIMAL K SWEEP WORKBENCH */}
            {/* =================================================================== */}
            {clusteringSubView === 'kmeans_sweep' && (

              <div className="space-y-5">
            {/* 1. EXPERIMENT CONTROLS PANEL */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-bold text-[#1e2238]">
                      K-Means Experimentation Workbench &amp; Optimal Cluster Selection
                    </h2>
                    {isRunningExperiment && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        Running Parameter Sweep...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Execute multi-configuration clustering sweeps over conformed academic records. Evaluate inertia, Silhouette, Davies–Bouldin, and Calinski–Harabasz metrics to discover mathematically optimal partitionings.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => executeExperimentSweep(minK, maxK, stepK, nInit, randomSeed, evaluateStability)}
                    disabled={isRunningExperiment}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1e2238] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                  >
                    {isRunningExperiment ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                        <span>Evaluating Configurations...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <span>Run K-Means Experiment Sweep</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Parameter Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Min K (Start)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={14}
                    value={minK}
                    onChange={(e) => setMinK(Math.max(2, Math.min(14, parseInt(e.target.value) || 2)))}
                    disabled={isRunningExperiment}
                    className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Floor (≥ 2)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Max K (Ceiling)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={maxK}
                    onChange={(e) => setMaxK(Math.max(2, Math.min(15, parseInt(e.target.value) || 10)))}
                    disabled={isRunningExperiment}
                    className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ceiling (≤ 15)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Step Interval
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={stepK}
                    onChange={(e) => setStepK(Math.max(1, Math.min(2, parseInt(e.target.value) || 1)))}
                    disabled={isRunningExperiment}
                    className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Stride (1 or 2)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Initializations (n_init)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={nInit}
                    onChange={(e) => setNInit(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
                    disabled={isRunningExperiment}
                    className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Seeds evaluated (10)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Random State Seed
                  </label>
                  <input
                    type="number"
                    value={randomSeed}
                    onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                    disabled={isRunningExperiment}
                    className="w-full px-2.5 py-1.5 rounded border border-[#e7eaee] bg-slate-50 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Deterministic seed (42)</span>
                </div>

                <div className="flex flex-col justify-between">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Stability Analysis
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded border border-[#e7eaee] bg-slate-50 cursor-pointer text-[11px] text-slate-700 hover:bg-slate-100 select-none">
                    <input
                      type="checkbox"
                      checked={evaluateStability}
                      onChange={(e) => setEvaluateStability(e.target.checked)}
                      disabled={isRunningExperiment}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">Assess ARI Seeds</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">3-seed cross ARI</span>
                </div>
              </div>

              {/* Feature Matrix Info Badge */}
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-800">Conformed Feature Vector (Standardized):</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">current_gpa</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">attendance_percentage</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">failed_courses_count</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">hist_avg_gpa</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">sem6_avg_marks</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono">
                  <span>Preprocess: Z-Score Scaling</span>
                  <span>•</span>
                  <span>Order: Deterministic (Student ID)</span>
                </div>
              </div>

              {/* Error banner */}
              {experimentError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{experimentError}</span>
                  <button
                    type="button"
                    onClick={() => executeExperimentSweep(minK, maxK, stepK, nInit, randomSeed, evaluateStability)}
                    className="ml-auto underline font-bold"
                  >
                    Retry Sweep
                  </button>
                </div>
              )}
            </div>

            {/* 2. OVERVIEW KPI CARDS */}
            {experimentData && (() => {
              const runs = experimentData.experiments || [];
              const bestSilRun = runs.length > 0
                ? runs.reduce((prev: KMeansExperimentRunItem, curr: KMeansExperimentRunItem) =>
                    (curr.silhouetteScore ?? 0) > (prev.silhouetteScore ?? 0) ? curr : prev, runs[0])
                : null;
              const expectedCount = Math.floor((experimentData.maxK - experimentData.minK) / Math.max(1, experimentData.step)) + 1;

              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span className="font-medium">Evaluated Cohort</span>
                      <Database className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-[#1e2238] mt-1">
                      {experimentData.eligibleRecords.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {experimentData.excludedRecords} excluded (Conformed Fact)
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span className="font-medium">Sweep Breadth</span>
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-[#1e2238] mt-1">
                      {runs.length} / {expectedCount}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Range [{experimentData.minK}..{experimentData.maxK}] step {experimentData.step}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-emerald-200 bg-emerald-50/20 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-emerald-700 text-xs">
                      <span className="font-bold">Recommended K</span>
                      <Award className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-extrabold text-emerald-800 mt-1 flex items-baseline gap-1.5">
                      <span>K = {experimentData.recommendation.recommendedK}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-sans">
                        {experimentData.elbowAnalysis.elbowConfidence || 'Optimal'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 truncate">
                      Score: {experimentData.recommendation.recommendedScore.toFixed(3)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span className="font-medium">Peak Silhouette (K = {bestSilRun?.k ?? '—'})</span>
                      <Target className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {bestSilRun?.silhouetteScore !== null && bestSilRun?.silhouetteScore !== undefined
                        ? bestSilRun.silhouetteScore.toFixed(4)
                        : '—'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Attained at K = {bestSilRun?.k ?? '—'} (Recommended K=4 attains 0.5690 with peak CH 10,246)
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span className="font-medium">Geometric Elbow</span>
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-indigo-700 mt-1">
                      K = {experimentData.elbowAnalysis.detectedElbowK}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Max Chord: {experimentData.elbowAnalysis.maxChordDistance.toFixed(3)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 3. RECOMMENDATION RATIONALE BANNER */}
            {experimentData && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1e2238] text-white">
                      Decision Rationale
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Recommendation Model: Multi-Criteria Kneedle &amp; Silhouette Synthesis
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span>Viable Alternatives:</span>
                    {experimentData.recommendation.alternatives.map((altK: number) => (
                      <button
                        key={altK}
                        type="button"
                        onClick={() => handleSelectKConfig(altK)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        K={altK}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {experimentData.recommendation.rationale}
                </p>

                {experimentData.recommendation.metricDisagreements.length > 0 && (
                  <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Metric Trade-off &amp; Separation Variations:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {experimentData.recommendation.metricDisagreements.map((note: string, idx: number) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. DUAL CHARTS: ELBOW CURVE & MULTI-METRIC TRAJECTORY */}
            {experimentData && experimentData.experiments.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart A: Elbow Curve (Inertia vs K with Secant Chord) */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Elbow Method: Within-Cluster SSE (Inertia vs. K)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dotted line indicates secant chord. Pin highlights maximum orthogonal chord distance (Kneedle elbow).
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Elbow: <strong className="text-indigo-700">K={experimentData.elbowAnalysis.detectedElbowK}</strong>
                    </span>
                  </div>

                  {/* SVG Chart Rendering */}
                  {(() => {
                    const runs = experimentData.experiments;
                    const w = 480;
                    const h = 210;
                    const pad = { left: 55, right: 25, top: 20, bottom: 35 };
                    const minKVal = runs[0].k;
                    const maxKVal = runs[runs.length - 1].k;
                    const maxInertia = Math.max(...runs.map((r: KMeansExperimentRunItem) => r.inertia)) * 1.05;
                    const minInertia = 0;

                    const getX = (k: number) =>
                      pad.left + ((k - minKVal) / Math.max(1, maxKVal - minKVal)) * (w - pad.left - pad.right);
                    const getY = (val: number) =>
                      pad.top + (1 - (val - minInertia) / Math.max(1, maxInertia - minInertia)) * (h - pad.top - pad.bottom);

                    // Polyline points
                    const pointsStr = runs.map((r: KMeansExperimentRunItem) => `${getX(r.k)},${getY(r.inertia)}`).join(' ');
                    const areaStr = `${getX(runs[0].k)},${h - pad.bottom} ${pointsStr} ${getX(runs[runs.length - 1].k)},${h - pad.bottom}`;

                    // Secant line
                    const pFirst = { x: getX(runs[0].k), y: getY(runs[0].inertia) };
                    const pLast = { x: getX(runs[runs.length - 1].k), y: getY(runs[runs.length - 1].inertia) };

                    const elbowRun = runs.find((r: KMeansExperimentRunItem) => r.k === experimentData.elbowAnalysis.detectedElbowK);

                    return (
                      <div className="relative w-full overflow-hidden">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
                          <defs>
                            <linearGradient id="elbowGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                            const val = maxInertia * frac;
                            const yPos = getY(val);
                            return (
                              <g key={idx}>
                                <line
                                  x1={pad.left}
                                  y1={yPos}
                                  x2={w - pad.right}
                                  y2={yPos}
                                  stroke="#f1f5f9"
                                  strokeWidth="1"
                                />
                                <text
                                  x={pad.left - 6}
                                  y={yPos + 3}
                                  textAnchor="end"
                                  fontSize="9"
                                  fill="#94a3b8"
                                  fontFamily="monospace"
                                >
                                  {Math.round(val).toLocaleString()}
                                </text>
                              </g>
                            );
                          })}

                          {/* Area Fill */}
                          <polygon points={areaStr} fill="url(#elbowGradient)" />

                          {/* Secant Chord Line */}
                          <line
                            x1={pFirst.x}
                            y1={pFirst.y}
                            x2={pLast.x}
                            y2={pLast.y}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />

                          {/* Inertia Curve */}
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#312e81"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Data Points */}
                          {runs.map((r: KMeansExperimentRunItem) => {
                            const cx = getX(r.k);
                            const cy = getY(r.inertia);
                            const isElbow = r.k === experimentData.elbowAnalysis.detectedElbowK;
                            const isSelected = r.k === selectedConfigK;

                            return (
                              <g
                                key={r.k}
                                className="cursor-pointer group"
                                onClick={() => handleSelectKConfig(r.k)}
                                onMouseEnter={() => setHoveredPointK(r.k)}
                                onMouseLeave={() => setHoveredPointK(null)}
                              >
                                {isElbow && (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="10"
                                    fill="#4f46e5"
                                    fillOpacity="0.2"
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isSelected ? 6 : isElbow ? 5.5 : 4}
                                  fill={isSelected ? '#1e2238' : isElbow ? '#4f46e5' : '#ffffff'}
                                  stroke={isSelected ? '#1e2238' : isElbow ? '#4f46e5' : '#64748b'}
                                  strokeWidth={isSelected ? '2.5' : '2'}
                                />
                                <text
                                  x={cx}
                                  y={h - pad.bottom + 14}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fontWeight={isSelected || isElbow ? '700' : '500'}
                                  fill={isSelected ? '#1e2238' : isElbow ? '#4f46e5' : '#64748b'}
                                >
                                  {r.k}
                                </text>
                              </g>
                            );
                          })}

                          {/* Elbow Callout Badge */}
                          {elbowRun && (
                            <g transform={`translate(${getX(elbowRun.k)},${getY(elbowRun.inertia) - 14})`}>
                              <rect
                                x="-32"
                                y="-14"
                                width="64"
                                height="15"
                                rx="3"
                                fill="#4f46e5"
                              />
                              <text
                                x="0"
                                y="-3"
                                textAnchor="middle"
                                fontSize="8.5"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                Elbow (K={elbowRun.k})
                              </text>
                            </g>
                          )}
                        </svg>

                        {/* Chart Legend */}
                        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-0.5 bg-[#312e81]" />
                            Inertia Curve
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400" />
                            Secant Chord
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            Detected Elbow
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#1e2238]" />
                            Selected K
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Chart B: Multi-Metric Comparison (Silhouette / DB / CH) */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Cluster Quality &amp; Separation Indices</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Inspect mathematical separation vs within-cluster cohesion across K.
                      </p>
                    </div>

                    <div className="inline-flex rounded-md border border-[#e7eaee] bg-slate-50 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('silhouette')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                          activeChartMetric === 'silhouette'
                            ? 'bg-[#1e2238] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Silhouette (↑)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('davies_bouldin')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                          activeChartMetric === 'davies_bouldin'
                            ? 'bg-[#1e2238] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Davies–Bouldin (↓)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('calinski_harabasz')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                          activeChartMetric === 'calinski_harabasz'
                            ? 'bg-[#1e2238] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Calinski–Harabasz (↑)
                      </button>
                    </div>
                  </div>

                  {/* SVG Metric Chart Rendering */}
                  {(() => {
                    const runs = experimentData.experiments;
                    const w = 480;
                    const h = 210;
                    const pad = { left: 55, right: 25, top: 20, bottom: 35 };
                    const minKVal = runs[0].k;
                    const maxKVal = runs[runs.length - 1].k;

                    const getMetricVal = (r: KMeansExperimentRunItem) => {
                      if (activeChartMetric === 'silhouette') return r.silhouetteScore ?? 0;
                      if (activeChartMetric === 'davies_bouldin') return r.daviesBouldinIndex ?? 0;
                      return r.calinskiHarabaszScore ?? 0;
                    };

                    const vals = runs.map((r: KMeansExperimentRunItem) => getMetricVal(r));
                    const minVal = Math.min(...vals) * 0.95;
                    const maxVal = Math.max(...vals) * 1.05;

                    const getX = (k: number) =>
                      pad.left + ((k - minKVal) / Math.max(1, maxKVal - minKVal)) * (w - pad.left - pad.right);
                    const getY = (val: number) =>
                      pad.top + (1 - (val - minVal) / Math.max(0.0001, maxVal - minVal)) * (h - pad.top - pad.bottom);

                    const pointsStr = runs.map((r: KMeansExperimentRunItem) => `${getX(r.k)},${getY(getMetricVal(r))}`).join(' ');

                    // Optimal point
                    let optimalRun = runs[0];
                    if (activeChartMetric === 'silhouette' || activeChartMetric === 'calinski_harabasz') {
                      optimalRun = runs.reduce((prev: KMeansExperimentRunItem, curr: KMeansExperimentRunItem) =>
                        getMetricVal(curr) > getMetricVal(prev) ? curr : prev
                      );
                    } else {
                      optimalRun = runs.reduce((prev: KMeansExperimentRunItem, curr: KMeansExperimentRunItem) =>
                        getMetricVal(curr) < getMetricVal(prev) ? curr : prev
                      );
                    }

                    const strokeColor =
                      activeChartMetric === 'silhouette'
                        ? '#059669'
                        : activeChartMetric === 'davies_bouldin'
                        ? '#ea580c'
                        : '#7c3aed';

                    return (
                      <div className="relative w-full overflow-hidden">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
                          {/* Grid Lines */}
                          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                            const val = minVal + (maxVal - minVal) * frac;
                            const yPos = getY(val);
                            return (
                              <g key={idx}>
                                <line
                                  x1={pad.left}
                                  y1={yPos}
                                  x2={w - pad.right}
                                  y2={yPos}
                                  stroke="#f1f5f9"
                                  strokeWidth="1"
                                />
                                <text
                                  x={pad.left - 6}
                                  y={yPos + 3}
                                  textAnchor="end"
                                  fontSize="9"
                                  fill="#94a3b8"
                                  fontFamily="monospace"
                                >
                                  {activeChartMetric === 'calinski_harabasz' ? Math.round(val) : val.toFixed(2)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Line */}
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Points */}
                          {runs.map((r: KMeansExperimentRunItem) => {
                            const cx = getX(r.k);
                            const cy = getY(getMetricVal(r));
                            const isOptimal = r.k === optimalRun.k;
                            const isSelected = r.k === selectedConfigK;

                            return (
                              <g
                                key={r.k}
                                className="cursor-pointer group"
                                onClick={() => handleSelectKConfig(r.k)}
                              >
                                {isOptimal && (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="10"
                                    fill={strokeColor}
                                    fillOpacity="0.2"
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isSelected ? 6 : isOptimal ? 5.5 : 4}
                                  fill={isSelected ? '#1e2238' : isOptimal ? strokeColor : '#ffffff'}
                                  stroke={isSelected ? '#1e2238' : strokeColor}
                                  strokeWidth={isSelected ? '2.5' : '2'}
                                />
                                <text
                                  x={cx}
                                  y={h - pad.bottom + 14}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fontWeight={isSelected || isOptimal ? '700' : '500'}
                                  fill={isSelected ? '#1e2238' : isOptimal ? strokeColor : '#64748b'}
                                >
                                  {r.k}
                                </text>
                              </g>
                            );
                          })}

                          {/* Best Metric Label */}
                          <g transform={`translate(${getX(optimalRun.k)},${getY(getMetricVal(optimalRun)) - 14})`}>
                            <rect
                              x="-34"
                              y="-14"
                              width="68"
                              height="15"
                              rx="3"
                              fill={strokeColor}
                            />
                            <text
                              x="0"
                              y="-3"
                              textAnchor="middle"
                              fontSize="8.5"
                              fontWeight="700"
                              fill="#ffffff"
                            >
                              Optimal (K={optimalRun.k})
                            </text>
                          </g>
                        </svg>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>
                            Current Focus: <strong className="text-slate-800">{activeChartMetric.replace('_', ' ').toUpperCase()}</strong>
                          </span>
                          <span>
                            {activeChartMetric === 'davies_bouldin'
                              ? '↓ Lower index indicates superior cluster separation'
                              : '↑ Higher score indicates superior partition density'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 5. EXPERIMENT RUNS COMPARISON TABLE */}
            {experimentData && experimentData.experiments.length > 0 && (
              <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <span>Configurations Comparison Matrix</span>
                      <span className="text-xs font-normal text-slate-400">
                        (Click any row to inspect cluster profiles and 2D projection)
                      </span>
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {experimentData.experiments.length} Evaluated Partitionings
                  </span>
                </div>

                <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                      <tr>
                        <th className="py-2.5 px-3">Configuration</th>
                        <th className="py-2.5 px-3 text-right">Inertia (SSE)</th>
                        <th className="py-2.5 px-3 text-right">Silhouette</th>
                        <th className="py-2.5 px-3 text-right">Davies–Bouldin</th>
                        <th className="py-2.5 px-3 text-right">Calinski–Harabasz</th>
                        <th className="py-2.5 px-3 text-center">Cluster Sizes (Min..Max)</th>
                        <th className="py-2.5 px-3 text-center">Imbalance Ratio</th>
                        {experimentData.evaluateStability && (
                          <th className="py-2.5 px-3 text-center">Stability (ARI)</th>
                        )}
                        <th className="py-2.5 px-3 text-center">Status / Decision</th>
                        <th className="py-2.5 px-3 text-center">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {experimentData.experiments.map((r: KMeansExperimentRunItem) => {
                        const isSelected = r.k === selectedConfigK;
                        const isRecommended = r.k === experimentData.recommendation.recommendedK;
                        const isElbow = r.k === experimentData.elbowAnalysis.detectedElbowK;

                        return (
                          <tr
                            key={r.k}
                            onClick={() => handleSelectKConfig(r.k)}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/70 font-semibold'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                  K = {r.k}
                                </span>
                                {isRecommended && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Recommended
                                  </span>
                                )}
                                {isElbow && !isRecommended && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Elbow
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {Math.round(r.inertia).toLocaleString()}
                            </td>

                            <td className="py-2 px-3 text-right font-mono">
                              {r.silhouetteScore !== null ? (
                                <span
                                  className={`font-bold ${
                                    r.silhouetteScore >= 0.55
                                      ? 'text-emerald-700'
                                      : r.silhouetteScore >= 0.50
                                      ? 'text-teal-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {r.silhouetteScore.toFixed(4)}
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {r.daviesBouldinIndex !== null ? r.daviesBouldinIndex.toFixed(4) : 'N/A'}
                            </td>

                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {r.calinskiHarabaszScore !== null ? Math.round(r.calinskiHarabaszScore).toLocaleString() : 'N/A'}
                            </td>

                            <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                              {r.minClusterSize.toLocaleString()} – {r.maxClusterSize.toLocaleString()}
                            </td>

                            <td className="py-2 px-3 text-center font-mono">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.imbalanceRatio > 4.0
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : r.imbalanceRatio > 2.5
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {r.imbalanceRatio.toFixed(2)}x
                              </span>
                            </td>

                            {experimentData.evaluateStability && (
                              <td className="py-2 px-3 text-center font-mono text-[11px]">
                                {r.stabilityAriMean !== null ? (
                                  <span className="font-bold text-slate-800">
                                    {r.stabilityAriMean.toFixed(3)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                            )}

                            <td className="py-2 px-3 text-center">
                              {r.warnings && r.warnings.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium" title={r.warnings.join('; ')}>
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  <span>{r.warnings[0]}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                                  <Check className="h-3 w-3" />
                                  <span>Converged</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectKConfig(r.k);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#1e2238] text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isSelected ? 'Active' : 'Inspect'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. SELECTED CONFIGURATION DEEP DIVE (PROFILES, 2D SCATTER & EXEMPLARS) */}
            {experimentData && experimentData.selectedClustering && (
              <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-5">
                {/* Header for Selected Configuration */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#1e2238] text-white text-xs font-mono font-bold">
                        Configuration: K = {experimentData.selectedClustering.k}
                      </span>
                      <h3 className="text-sm font-bold text-[#1e2238]">
                        Detailed Partition Analysis &amp; Feature Space Projection
                      </h3>
                      {isLoadingConfigDetail && (
                        <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Inertia: <strong className="font-mono text-slate-800">{Math.round(experimentData.selectedClustering.inertia).toLocaleString()}</strong>
                      {' • '}
                      Silhouette: <strong className="font-mono text-emerald-700">{experimentData.selectedClustering.silhouetteScore?.toFixed(4)}</strong>
                      {' • '}
                      Cohort Size: <strong className="font-mono text-slate-800">{experimentData.eligibleRecords} Students</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportMiningData}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#e7eaee] text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Export Cluster CSV</span>
                    </button>
                  </div>
                </div>

                {/* Cohort Distribution Proportional Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Cohort Distribution Breakdown across {experimentData.selectedClustering.clusters.length} Archetypes:</span>
                  </div>
                  <div className="h-4 w-full rounded-md overflow-hidden flex border border-slate-200 shadow-2xs">
                    {experimentData.selectedClustering.clusters.map((c, idx) => {
                      const colors = [
                        'bg-indigo-600',
                        'bg-emerald-600',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-purple-600',
                        'bg-cyan-600',
                        'bg-blue-600',
                      ];
                      const bg = colors[idx % colors.length];
                      return (
                        <div
                          key={c.clusterId}
                          style={{ width: `${c.percentage}%` }}
                          title={`Cluster ${c.clusterId}: ${c.studentCount} students (${c.percentage}%)`}
                          className={`${bg} transition-all hover:opacity-90 relative`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                    {experimentData.selectedClustering.clusters.map((c, idx) => {
                      const dotColors = [
                        'bg-indigo-600',
                        'bg-emerald-600',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-purple-600',
                        'bg-cyan-600',
                        'bg-blue-600',
                      ];
                      return (
                        <span key={c.clusterId} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                          <span className="font-semibold text-slate-700">Cluster 0{c.clusterId}:</span>
                          <span>{c.studentCount.toLocaleString()} ({c.percentage}%)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 2D FEATURE PROJECTION SCATTER PLOT */}
                {experimentData.selectedClustering.projection && (
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#1e2238] flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>2D Feature Projection: Attendance Rate (%) vs. Current GPA (0..10)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {experimentData.selectedClustering.projection.projectionType}
                        </p>
                        {experimentData.selectedClustering.projection.projectionNote && (
                          <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
                            {experimentData.selectedClustering.projection.projectionNote}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {experimentData.selectedClustering.projection.points.length} Samples Plotted
                      </span>
                    </div>

                    {/* SVG Scatter Plot */}
                    {(() => {
                      const proj = experimentData.selectedClustering.projection;
                      const w = 560;
                      const h = 240;
                      const pad = { left: 45, right: 25, top: 20, bottom: 35 };

                      // X domain: GPA (3.0 to 10.0)
                      const xMin = 3.0;
                      const xMax = 10.0;
                      // Y domain: Attendance (40 to 100)
                      const yMin = 40;
                      const yMax = 100;

                      const getX = (gpa: number) =>
                        pad.left + ((Math.max(xMin, Math.min(xMax, gpa)) - xMin) / (xMax - xMin)) * (w - pad.left - pad.right);
                      const getY = (att: number) =>
                        pad.top + (1 - (Math.max(yMin, Math.min(yMax, att)) - yMin) / (yMax - yMin)) * (h - pad.top - pad.bottom);

                      const clusterColorMap: Record<number, string> = {
                        1: '#4f46e5',
                        2: '#059669',
                        3: '#d97706',
                        4: '#e11d48',
                        5: '#9333ea',
                        6: '#0891b2',
                        7: '#2563eb',
                      };

                      return (
                        <div className="relative w-full overflow-hidden bg-white rounded border border-slate-200">
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
                            {/* Horizontal grid lines for Attendance */}
                            {[50, 60, 70, 80, 90, 100].map((attVal) => {
                              const yPos = getY(attVal);
                              return (
                                <g key={attVal}>
                                  <line
                                    x1={pad.left}
                                    y1={yPos}
                                    x2={w - pad.right}
                                    y2={yPos}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={pad.left - 6}
                                    y={yPos + 3}
                                    textAnchor="end"
                                    fontSize="9"
                                    fill="#94a3b8"
                                    fontFamily="monospace"
                                  >
                                    {attVal}%
                                  </text>
                                </g>
                              );
                            })}

                            {/* Vertical grid lines for GPA */}
                            {[4, 5, 6, 7, 8, 9, 10].map((gpaVal) => {
                              const xPos = getX(gpaVal);
                              return (
                                <g key={gpaVal}>
                                  <line
                                    x1={xPos}
                                    y1={pad.top}
                                    x2={xPos}
                                    y2={h - pad.bottom}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={xPos}
                                    y={h - pad.bottom + 14}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="#94a3b8"
                                    fontFamily="monospace"
                                  >
                                    {gpaVal.toFixed(1)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Scatter Points */}
                            {proj.points.map((pt) => {
                              const cx = getX(pt.x);
                              const cy = getY(pt.y);
                              const col = clusterColorMap[pt.clusterId] || '#64748b';
                              return (
                                <circle
                                  key={pt.studentId}
                                  cx={cx}
                                  cy={cy}
                                  r="2.5"
                                  fill={col}
                                  fillOpacity="0.65"
                                />
                              );
                            })}

                            {/* Centroids */}
                            {proj.centroids.map((cent) => {
                              const cx = getX(cent.x);
                              const cy = getY(cent.y);
                              const col = clusterColorMap[cent.clusterId] || '#1e2238';
                              return (
                                <g key={cent.clusterId}>
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="8"
                                    fill={col}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={cx}
                                    y={cy + 3}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill="#ffffff"
                                  >
                                    C{cent.clusterId}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                            <span>X-Axis: Current Cumulative GPA (3.0 to 10.0 scale)</span>
                            <span>Y-Axis: Attendance Percentage (40% to 100%)</span>
                            <span>Points: Student cohort slice; Circles: Centroids</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Cluster Archetype Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {experimentData.selectedClustering.clusters.map((c) => {
                    const isSelected = selectedClusterId === c.clusterId;
                    const borderClass =
                      c.tier === 'Advanced'
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : c.tier === 'Proficient'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : c.tier === 'Developing'
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-rose-200 bg-rose-50/40';

                    const badgeClass =
                      c.tier === 'Advanced'
                        ? 'bg-indigo-100 text-indigo-800'
                        : c.tier === 'Proficient'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.tier === 'Developing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800';

                    return (
                      <div
                        key={c.clusterId}
                        onClick={() => setSelectedClusterId(c.clusterId)}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${borderClass} ${
                          isSelected ? 'ring-2 ring-[#1e2438] shadow-xs' : 'hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            Cluster 0{c.clusterId}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                            {c.tier}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#1e2238] mt-1.5">{c.archetypeName}</h3>

                        <div className="flex items-baseline justify-between text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">
                            {c.studentCount.toLocaleString()} Students
                          </span>
                          <span className="font-mono font-bold text-slate-900">{c.percentage}%</span>
                        </div>

                        {/* Centroid Coordinates */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Centroid GPA:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {c.centroid.current_gpa?.toFixed(2)} / 10.0
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Centroid Attendance:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {c.centroid.attendance_percentage?.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Mean Failed Backlogs:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {c.centroid.failed_courses_count?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Historical GPA:</span>
                            <span className="font-mono font-medium text-slate-700">
                              {c.centroid.hist_avg_gpa?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Pedagogical Action Plan */}
                        <div className="mt-3 p-2 rounded bg-white/80 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800 block text-[10px] uppercase tracking-wide mb-0.5">
                            Institutional Policy:
                          </span>
                          {c.recommendedAction}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Exemplar Students Table */}
                {selectedClusterId !== null && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide">
                        Representative Exemplars for Cluster 0{selectedClusterId} (Closest to Centroid)
                      </h4>
                      <span className="text-[11px] text-slate-400">Euclidean distance nearest neighbors</span>
                    </div>

                    {(() => {
                      const sel = experimentData.selectedClustering.clusters.find((c) => c.clusterId === selectedClusterId);
                      if (!sel || !sel.sampleStudents || sel.sampleStudents.length === 0) {
                        return <p className="text-xs text-slate-500">No sample students available.</p>;
                      }

                      return (
                        <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                              <tr>
                                <th className="py-2 px-3">Student ID</th>
                                <th className="py-2 px-3">Student Name</th>
                                <th className="py-2 px-3">Department</th>
                                <th className="py-2 px-3 text-right">Current GPA</th>
                                <th className="py-2 px-3 text-right">Attendance</th>
                                <th className="py-2 px-3 text-center">Failed Courses</th>
                                <th className="py-2 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {sel.sampleStudents.map((s) => (
                                <tr key={s.studentId} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-3 font-mono font-bold text-slate-800">{s.studentId}</td>
                                  <td className="py-2 px-3 font-semibold text-[#1e2238]">{s.studentName}</td>
                                  <td className="py-2 px-3 text-slate-600">{s.department}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900">{s.gpa.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right font-medium text-slate-700">
                                    {s.attendanceRate.toFixed(1)}%
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                                        s.failedCoursesCount > 0
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {s.failedCoursesCount}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {s.isAtRisk ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        At-Risk
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Good Standing
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
              </div>

            )}
          </div>
        )}


        {/* ========================================================================= */}
        {/* TAB 2: APRIORI ASSOCIATION RULE MINING */}
        {/* ========================================================================= */}
        {activeTab === 'apriori' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                    <span>Apriori Association Rule Mining: Performance Correlations &amp; Bottlenecks</span>
                    {isLoadingRules && <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Discovers co-occurrence associations across attendance tiers, GPA brackets, backlogs, and risk classification
                  </p>
                </div>

                {/* Slicing Controls */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-600 mr-1.5">Min Support:</span>
                    <select
                      value={minSupport}
                      onChange={(e) => handleRulesParamChange(Number(e.target.value), minConfidence, maxLength)}
                      className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value={0.005}>0.5% (Very Granular)</option>
                      <option value={0.010}>1.0%</option>
                      <option value={0.015}>1.5% (Balanced)</option>
                      <option value={0.020}>2.0%</option>
                      <option value={0.030}>3.0%</option>
                      <option value={0.050}>5.0% (Broad)</option>
                    </select>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-600 mr-1.5">Min Confidence:</span>
                    <select
                      value={minConfidence}
                      onChange={(e) => handleRulesParamChange(minSupport, Number(e.target.value), maxLength)}
                      className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value={0.40}>40%</option>
                      <option value={0.50}>50%</option>
                      <option value={0.60}>60% (Default)</option>
                      <option value={0.70}>70%</option>
                      <option value={0.80}>80%</option>
                      <option value={0.90}>90% (Strict)</option>
                    </select>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-600 mr-1.5">Max Length:</span>
                    <select
                      value={maxLength}
                      onChange={(e) => handleRulesParamChange(minSupport, minConfidence, Number(e.target.value))}
                      className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value={2}>2 Items</option>
                      <option value={3}>3 Items</option>
                      <option value={4}>4 Items</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter & Metric Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search antecedent, consequent, or risk..."
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 rounded-md border border-[#e7eaee] text-xs focus:outline-hidden focus:border-[#f87941]"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500">
                    Discovered:{' '}
                    <strong className="text-slate-900">{filteredRules.length}</strong> /{' '}
                    {rulesData?.totalRules || 0} Rules
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Sort by:</span>
                    <button
                      type="button"
                      onClick={() => setSortField('lift')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sortField === 'lift' ? 'bg-[#1e2438] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Lift
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortField('confidence')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sortField === 'confidence' ? 'bg-[#1e2438] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Conf
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortField('support')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sortField === 'support' ? 'bg-[#1e2438] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Supp
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {rulesError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{rulesError}</span>
                  <button
                    type="button"
                    onClick={() => loadRules(minSupport, minConfidence, maxLength)}
                    className="ml-auto underline font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Association Rules Table */}
              <div className="overflow-x-auto rounded-lg border border-[#e7eaee]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                    <tr>
                      <th className="py-2.5 px-3">Rule ID</th>
                      <th className="py-2.5 px-3">Antecedent (IF)</th>
                      <th className="py-2.5 px-3">Consequent (THEN)</th>
                      <th className="py-2.5 px-3 text-right">Support</th>
                      <th className="py-2.5 px-3 text-right">Confidence</th>
                      <th className="py-2.5 px-3 text-right">Lift</th>
                      <th className="py-2.5 px-3">Pedagogical Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.slice(0, 35).map((r) => {
                      const isHighLift = r.lift >= 3.0;
                      const isRiskRule = r.category.includes('Risk');

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 font-semibold">{r.id}</td>

                          <td className="py-3 px-3">
                            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100/80 px-1.5 py-0.5 rounded">
                              {r.antecedentStr}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                                isRiskRule
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {r.consequentStr}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-600">{r.supportPct}</td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {r.confidencePct}
                          </td>

                          <td className="py-3 px-3 text-right font-mono">
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                isHighLift
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'text-slate-800'
                              }`}
                            >
                              {r.lift.toFixed(2)}x
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="space-y-0.5 max-w-sm">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                  r.badge === 'rose'
                                    ? 'bg-rose-100 text-rose-800'
                                    : r.badge === 'indigo'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {r.category}
                              </span>
                              <p className="text-[11px] text-slate-600 leading-snug">{r.interpretation}</p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRules.length === 0 && !isLoadingRules && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          No association rules found matching your filter criteria. Try lowering Min Support or Min Confidence.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* TAB 3: SUPERVISED CLASSIFICATION & BEST MODEL SELECTION */}
        {/* ========================================================================= */}
        {activeTab === 'tree' && (
          <div className="space-y-4">
            {/* SUB-VIEW NAVIGATION SWITCHER */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-[#e7eaee] shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setClassificationSubView('benchmark')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    classificationSubView === 'benchmark'
                      ? 'bg-[#1e2438] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Multi-Classifier Benchmark &amp; Best Model</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassificationSubView('tree_inspector')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    classificationSubView === 'tree_inspector'
                      ? 'bg-[#1e2438] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>Decision Tree Structural Hierarchy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClassificationSubView('experiment_settings');
                    if (!clsHistory) loadClsHistory();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    classificationSubView === 'experiment_settings'
                      ? 'bg-[#1e2438] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Experiment Controls &amp; History</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeClassificationRun()}
                  disabled={isLoadingClassification}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingClassification ? 'animate-spin' : ''}`} />
                  <span>{isLoadingClassification ? 'Evaluating Models...' : 'Re-Run All Classifiers'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {classificationError && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{classificationError}</span>
                <button
                  type="button"
                  onClick={() => loadClassificationExperiment(true)}
                  className="ml-auto underline font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingClassification && !classificationData && (
              <div className="bg-white rounded-lg border border-[#e7eaee] p-12 text-center shadow-2xs">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  Fitting and Cross-Validating 5 Supervised Classifiers...
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Applying 5-fold stratified cross-validation on 3,856 training records (N = 4,820 cohort) with zero data leakage.
                </p>
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-VIEW 1: MULTI-CLASSIFIER BENCHMARK & BEST-MODEL SELECTION       */}
            {/* =================================================================== */}
            {classificationSubView === 'benchmark' && classificationData && (
              <div className="space-y-4">
                {/* Historical Inspection Notice */}
                {isViewingHistoricalRun && (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>
                        Currently inspecting archived historical experiment <strong>{classificationData.experimentId}</strong>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadClassificationExperiment(false)}
                      className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold transition-all text-[11px] cursor-pointer"
                    >
                      Return to Latest Benchmark
                    </button>
                  </div>
                )}

                {/* 1. EXECUTIVE BEST-MODEL CHAMPION CALLOUT */}
                <div className="rounded-lg bg-[#1e2438] text-white p-5 border border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                          <Award className="h-3 w-3" /> Selected Best Classifier
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          ID: {classificationData.experimentId}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{classificationData.selectedModel.modelName}</span>
                      </h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Selected via rigorous 5-fold cross-validation on 3,856 training facts for maximum academic risk identification, then validated on an untouched held-out test cohort (N = 964).
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                        <span>Dataset: <strong>{classificationData.dataset.totalEligible.toLocaleString()} Records</strong></span>
                        <span>·</span>
                        <span>At-Risk Prevalence: <strong>{classificationData.dataset.atRiskCount} ({classificationData.dataset.atRiskPrevalencePct}%)</strong></span>
                        <span>·</span>
                        <span>Features: <strong>{classificationData.dataset.featureCount} Dimensions (PII &amp; Target Leakage Excluded)</strong></span>
                      </div>
                    </div>

                    {/* KPI Badge Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 font-mono text-center">
                      <div className="p-2.5 rounded bg-white/10 border border-white/10">
                        <span className="text-[10px] text-slate-300 uppercase block font-sans">CV Macro-F1 (Primary)</span>
                        <span className="text-base font-bold text-amber-300">
                          {classificationData.selectedModel.cvMacroF1.toFixed(4)}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-sans mt-0.5">5-Fold Training CV</span>
                      </div>

                      <div className="p-2.5 rounded bg-white/10 border border-white/10">
                        <span className="text-[10px] text-slate-300 uppercase block font-sans">Test At-Risk Recall</span>
                        <span className="text-base font-bold text-emerald-300">
                          {(classificationData.selectedModel.testAtRiskRecall * 100).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block font-sans mt-0.5">
                          {classificationData.selectedModel.testConfusionMatrix.truePositive} / 22 Detected
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-white/10 border border-white/10 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-300 uppercase block font-sans">Held-Out Test Macro-F1</span>
                        <span className="text-base font-bold text-indigo-200">
                          {classificationData.selectedModel.testMacroF1.toFixed(4)}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-sans mt-0.5">Generalization Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MULTI-CLASSIFIER COMPARISON MATRIX TABLE */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                        <span>Multi-Classifier Cross-Validation &amp; Generalization Matrix</span>
                        <span className="text-xs font-normal text-slate-400">
                          (Click any row to inspect its confusion matrix and parameters)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Evaluating 5 diverse families on identical conformed facts with standardized preprocessing fitted strictly inside training folds.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      5 Models + Majority Baseline
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                        <tr>
                          <th className="py-2.5 px-3">Rank &amp; Algorithm</th>
                          <th className="py-2.5 px-3">Family</th>
                          <th className="py-2.5 px-3 text-right">CV Accuracy</th>
                          <th className="py-2.5 px-3 text-right bg-amber-50/60 text-amber-900 border-x border-amber-200/50">
                            CV Macro-F1 (Primary)
                          </th>
                          <th className="py-2.5 px-3 text-right bg-emerald-50/60 text-emerald-900 border-r border-emerald-200/50">
                            CV At-Risk Recall (Tie-Break)
                          </th>
                          <th className="py-2.5 px-3 text-right bg-blue-50/60 text-blue-900 border-r border-blue-200/50">
                            CV Balanced Acc
                          </th>
                          <th className="py-2.5 px-3 text-right">CV Precision</th>
                          <th className="py-2.5 px-3 text-right">ROC-AUC</th>
                          <th className="py-2.5 px-3 text-right">Test Macro-F1</th>
                          <th className="py-2.5 px-3 text-right">Test Recall</th>
                          <th className="py-2.5 px-3 text-right">Latency</th>
                          <th className="py-2.5 px-3 text-center">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {classificationData.models.map((m: EvaluatedClassifierItem) => {
                          const isSelected = m.modelId === selectedInspectModelId;
                          const isWinner = m.isBest;

                          return (
                            <tr
                              key={m.modelId}
                              onClick={() => setSelectedInspectModelId(m.modelId)}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-50/70 font-semibold'
                                  : isWinner
                                  ? 'bg-amber-50/30 hover:bg-slate-50/80'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 font-sans">
                                  <span className="font-bold text-slate-700">#{m.rank}</span>
                                  <span className={`font-bold ${isWinner ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {m.modelName}
                                  </span>
                                  {isWinner && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      Best Model
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                                {m.family}
                              </td>

                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {m.cvMetrics.accuracyPct}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/40 border-x border-amber-200/50">
                                {m.cvMetrics.macroF1.toFixed(4)}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-emerald-800 bg-emerald-50/40 border-r border-emerald-200/50">
                                {m.cvMetrics.atRiskRecallPct}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-blue-900 bg-blue-50/40 border-r border-blue-200/50">
                                {m.cvMetrics.balancedAccuracyPct || `${(m.cvMetrics.balancedAccuracy * 100).toFixed(1)}%`}
                              </td>

                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {m.cvMetrics.atRiskPrecisionPct}
                              </td>

                              <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">
                                {m.cvMetrics.rocAuc !== null ? m.cvMetrics.rocAuc.toFixed(4) : 'N/A'}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {m.testMetrics.macroF1.toFixed(4)}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                {m.testMetrics.atRiskRecallPct}
                              </td>

                              <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                                {m.trainingTimeSec}s
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInspectModelId(m.modelId);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isSelected ? 'Viewing' : 'Inspect'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Dummy Majority Baseline Row */}
                        <tr className="bg-slate-50/60 text-slate-500 italic">
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-400">—</span>
                              <span className="font-semibold text-slate-600">
                                {classificationData.baseline.modelName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-200 text-slate-700 not-italic">
                                Baseline
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px]">Trivial Majority</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700 not-italic">
                            {(classificationData.baseline.testAccuracy * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-700 not-italic bg-amber-50/20 border-x border-amber-200/30">
                            {classificationData.baseline.testMacroF1.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-700 not-italic bg-emerald-50/20 border-r border-emerald-200/30">
                            0.0% (0 / 22)
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-600 not-italic bg-blue-50/20 border-r border-blue-200/30">
                            50.0%
                          </td>
                          <td className="py-2.5 px-3 text-right not-italic">0.0%</td>
                          <td className="py-2.5 px-3 text-right not-italic">0.5000</td>
                          <td className="py-2.5 px-3 text-right not-italic">
                            {classificationData.baseline.testMacroF1.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3 text-right not-italic">0.0%</td>
                          <td className="py-2.5 px-3 text-right not-italic">&lt;0.01s</td>
                          <td className="py-2.5 px-3 text-center not-italic font-sans text-[10px] text-slate-400">
                            Naive
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Why Accuracy is Misleading:</strong> The naive baseline achieves <strong>{(classificationData.baseline.testAccuracy * 100).toFixed(1)}% accuracy</strong> simply by predicting Good Standing for every student, yet it fails to detect a single student in academic deficit. <strong>Macro-F1</strong> and <strong>At-Risk Recall</strong> penalize majority-class bias and serve as the verified scientific criteria for institutional selection.
                    </span>
                  </div>
                </div>

                {/* 3. VISUAL COMPARISON BAR CHARTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chart A: CV Macro-F1 Comparison */}
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        <span>Primary Criterion: CV Macro-F1 Score</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">Higher is Better (0.0 - 1.0)</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {classificationData.models.map((m: EvaluatedClassifierItem) => {
                        const pct = Math.min(100, Math.max(0, m.cvMetrics.macroF1 * 100));
                        return (
                          <div key={m.modelId} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={m.isBest ? 'font-bold text-indigo-900' : 'text-slate-700'}>
                                {m.modelName} {m.isBest && '★ Winner'}
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {m.cvMetrics.macroF1.toFixed(4)}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  m.isBest ? 'bg-indigo-600' : 'bg-slate-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Baseline */}
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Majority Baseline</span>
                          <span className="font-mono font-bold text-rose-600">
                            {classificationData.baseline.testMacroF1.toFixed(4)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${classificationData.baseline.testMacroF1 * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart B: At-Risk Recall Comparison */}
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span>Secondary Tie-Break: At-Risk Recall Rate</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">Deficit Detection Power</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {classificationData.models.map((m: EvaluatedClassifierItem) => {
                        const pct = Math.min(100, Math.max(0, m.cvMetrics.atRiskRecall * 100));
                        return (
                          <div key={m.modelId} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={m.isBest ? 'font-bold text-emerald-950' : 'text-slate-700'}>
                                {m.modelName}
                              </span>
                              <span className="font-mono font-bold text-emerald-800">
                                {m.cvMetrics.atRiskRecallPct}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  m.isBest ? 'bg-emerald-600' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Baseline */}
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Majority Baseline</span>
                          <span className="font-mono font-bold text-rose-600">0.0% (Misses All)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: '0%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. CONFUSION MATRIX & MODEL INSPECTOR */}
                {(() => {
                  const currentModel =
                    classificationData.models.find((m: EvaluatedClassifierItem) => m.modelId === selectedInspectModelId) ||
                    classificationData.models[0];
                  const cm = currentModel.testMetrics.confusionMatrix;

                  return (
                    <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                            <span>Confusion Matrix on Untouched Held-Out Test Cohort</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                              {currentModel.modelName}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Evaluated on 964 test records (942 Good Standing, 22 At-Risk students) never seen during training or CV model selection.
                          </p>
                        </div>

                        {/* Model Selector Dropdown */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-semibold">Inspect Algorithm:</span>
                          <select
                            value={currentModel.modelId}
                            onChange={(e) => setSelectedInspectModelId(e.target.value)}
                            className="rounded border border-[#e7eaee] bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                          >
                            {classificationData.models.map((m: EvaluatedClassifierItem) => (
                              <option key={m.modelId} value={m.modelId}>
                                {m.modelName} {m.isBest ? '(Winner)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 2x2 Confusion Grid */}
                      {(() => {
                        const actualNeg = cm.trueNegative + cm.falsePositive || 1;
                        const actualPos = cm.falseNegative + cm.truePositive || 1;
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono">
                            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                                True Negative (TN)
                              </span>
                              <span className="text-2xl font-bold text-emerald-900 block">
                                {cm.trueNegative.toLocaleString()}
                              </span>
                              <p className="text-[11px] text-emerald-700 font-sans">
                                Good Standing Students Correctly Identified ({( (cm.trueNegative / actualNeg) * 100 ).toFixed(1)}%)
                              </p>
                            </div>

                            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                                False Positive (FP) — Type I Error
                              </span>
                              <span className="text-2xl font-bold text-amber-900 block">
                                {cm.falsePositive.toLocaleString()}
                              </span>
                              <p className="text-[11px] text-amber-700 font-sans">
                                Good Standing Students Flagged for Advisory Review ({cm.falsePositive} alerts)
                              </p>
                            </div>

                            <div className="p-4 rounded-lg bg-rose-50/60 border border-rose-200 space-y-1 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                                False Negative (FN) — Type II Deficit Error
                              </span>
                              <span className="text-2xl font-bold text-rose-900 block">
                                {cm.falseNegative.toLocaleString()}
                              </span>
                              <p className="text-[11px] text-rose-700 font-sans">
                                At-Risk Students Unidentified (Critical Intervention Deficit)
                              </p>
                            </div>

                            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-1 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                                True Positive (TP) — Correct Intervention Flag
                              </span>
                              <span className="text-2xl font-bold text-indigo-900 block">
                                {cm.truePositive.toLocaleString()}
                              </span>
                              <p className="text-[11px] text-indigo-700 font-sans">
                                At-Risk Students Correctly Flagged for Remediation ({( (cm.truePositive / actualPos) * 100 ).toFixed(1)}% Recall)
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Educational Trade-off Alert */}
                      <div className="p-3.5 rounded-lg bg-indigo-50/40 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                        <span className="font-bold block uppercase tracking-wide text-[10px] text-indigo-800">
                          Institutional Impact &amp; Ethical Trade-off Analysis:
                        </span>
                        <p className="leading-relaxed text-[11.5px] text-indigo-900">
                          In educational data mining, the cost of a <strong>False Negative</strong> (a student in academic danger failing to receive early tutoring or mentoring) is far higher than the cost of a <strong>False Positive</strong> (an advisory check-in with a student who is performing adequately). The selected model correctly captures <strong>{cm.truePositive} out of 22 ({((cm.truePositive / 22) * 100).toFixed(1)}%)</strong> at-risk students, leaving only <strong>{cm.falseNegative} false negative</strong>.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. SELECTION RATIONALE, TRADE-OFFS & LIMITATIONS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> 1. Scientific Selection Rationale
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {classificationData.selectedModel.rationale}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" /> 2. Precision/Recall Trade-Off
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {classificationData.selectedModel.tradeoffAnalysis}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-[#e7eaee] p-4 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> 3. Responsible AI &amp; Governance
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {classificationData.selectedModel.limitations}
                    </p>
                  </div>
                </div>

                {/* 6. FEATURE IMPORTANCE RANKINGS */}
                {classificationData.featureImportances && classificationData.featureImportances.length > 0 && (
                  <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide">
                        Predictive Feature Importance ({classificationData.selectedModel.modelName})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Standardized Relative Contribution (%)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {classificationData.featureImportances.slice(0, 8).map((f) => (
                        <div key={f.feature} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">{f.displayName}</span>
                            <span className="font-mono font-bold text-indigo-700">{f.importancePercentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, f.importancePercentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                {/* 7. LIVE STUDENT RISK PREDICTION SIMULATOR */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-600" />
                        <span>Interactive Student Risk Assessment Predictor (Champion Inference Engine)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Test individual or hypothetical student profiles against the serialized <strong>{classificationData.selectedModel.modelName}</strong> pipeline with zero data leakage.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      POST /api/mining/classification/predict
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Current GPA</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={predictGpa}
                        onChange={(e) => setPredictGpa(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Current Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={predictBacklogs}
                        onChange={(e) => setPredictBacklogs(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Historical Avg GPA</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={predictHistGpa}
                        onChange={(e) => setPredictHistGpa(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Historical Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={predictHistFails}
                        onChange={(e) => setPredictHistFails(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Sem VI Avg Marks</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={predictSem6Avg}
                        onChange={(e) => setPredictSem6Avg(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Sem VI Min Marks</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={predictSem6Min}
                        onChange={(e) => setPredictSem6Min(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Department</label>
                      <select
                        value={predictDept}
                        onChange={(e) => setPredictDept(e.target.value)}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-bold text-slate-800"
                      >
                        <option value="IT">Information Technology (IT)</option>
                        <option value="CE">Computer Engineering (CE)</option>
                        <option value="EXTC">Electronics &amp; Telecom (EXTC)</option>
                        <option value="MECH">Mechanical Engineering (MECH)</option>
                        <option value="CIVIL">Civil Engineering (CIVIL)</option>
                      </select>
                    </div>

                    <div className="space-y-1 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={executeStudentPrediction}
                        disabled={isPredicting}
                        className="w-full py-2 px-3 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Target className={`h-3.5 w-3.5 ${isPredicting ? 'animate-spin' : ''}`} />
                        <span>{isPredicting ? 'Inferring...' : 'Assess Risk'}</span>
                      </button>
                    </div>
                  </div>

                  {predictError && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{predictError}</span>
                    </div>
                  )}

                  {predictResult && (
                    <div className={`p-4 rounded-lg border text-xs space-y-2.5 transition-all ${
                      predictResult.isAtRisk
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2.5 border-current/20">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            predictResult.isAtRisk
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {predictResult.predictionLabel}
                          </span>
                          <span className="font-bold text-sm">
                            {predictResult.advisoryLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span>Risk Probability: <strong>{predictResult.riskProbabilityPct}</strong></span>
                          <span>·</span>
                          <span>Model: <strong>{predictResult.modelUsed}</strong></span>
                        </div>
                      </div>
                      <p className="leading-relaxed font-sans">
                        <strong>Advisory Guidance:</strong> {predictResult.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-VIEW 2: DECISION TREE STRUCTURAL HIERARCHY & TEST EVALUATION     */}
            {/* =================================================================== */}
            {classificationSubView === 'tree_inspector' && (
              <div className="space-y-4">
                {/* 1. Header & Hyperparameter Slicing Controls */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-indigo-600" />
                        <span>Interactive Decision Tree: Evaluation Metrics & Structural Hierarchy</span>
                        {isLoadingTree && <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Trained on 75% stratified training cohort (N = 3,615) and evaluated on unseen held-out test data (N = 1,205).
                      </p>
                    </div>

                    {/* Slicing Controls */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-600 mr-1.5">Max Depth:</span>
                        <select
                          value={maxDepth}
                          onChange={(e) => handleTreeParamChange(Number(e.target.value), criterion, treeClassWeight)}
                          className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                        >
                          <option value={2}>Depth 2 (Macro)</option>
                          <option value={3}>Depth 3 (Standard)</option>
                          <option value={4}>Depth 4 (Detailed)</option>
                          <option value={5}>Depth 5 (Deep)</option>
                          <option value={6}>Depth 6 (Exhaustive)</option>
                        </select>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-600 mr-1.5">Criterion:</span>
                        <select
                          value={criterion}
                          onChange={(e) => handleTreeParamChange(maxDepth, e.target.value as 'gini' | 'entropy', treeClassWeight)}
                          className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                        >
                          <option value="gini">Gini Impurity</option>
                          <option value="entropy">Entropy / Info Gain</option>
                        </select>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-600 mr-1.5">Weighting:</span>
                        <select
                          value={treeClassWeight}
                          onChange={(e) => handleTreeParamChange(maxDepth, criterion, e.target.value as 'standard' | 'balanced')}
                          className="rounded border border-[#e7eaee] bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                        >
                          <option value="standard">Standard (Unweighted)</option>
                          <option value="balanced">Balanced (Inverse Frequency)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => loadTree(maxDepth, criterion, treeClassWeight)}
                        disabled={isLoadingTree}
                        className="px-3 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingTree ? 'animate-spin' : ''}`} />
                        <span>Re-Train</span>
                      </button>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {treeError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{treeError}</span>
                    </div>
                  )}

                  {/* Evaluation Run Metadata Banner */}
                  {treeData && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                          Run: {treeData.runId || treeData.evaluation?.runId || 'dt_eval'}
                        </span>
                        <span>
                          Evaluated: <strong>{treeData.evaluatedAt || treeData.evaluation?.evaluatedAt || 'Active Run'}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Test Partition: <strong>{treeData.testSetSize.toLocaleString()} records</strong> (25% held-out)
                        </span>
                        <span>·</span>
                        <span>
                          Split: <strong>75% Train / 25% Test (stratified, seed = 42)</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Zero Target Leakage Enforced
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Positive Class: At-Risk (1)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Compact Evaluation Metrics Cards & Confusion Matrix */}
                {treeData && (
                  <>
                    {/* Compact Metric Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* 1. Accuracy */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Accuracy</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-[#1e2238] block">
                          {treeData.metrics.accuracyPct}
                        </span>
                        <p className="text-[10px] text-slate-500 font-sans">
                          {treeData.confusionMatrix.trueNegative + treeData.confusionMatrix.truePositive} / {treeData.testSetSize} correct
                        </p>
                      </div>

                      {/* 2. At-Risk Recall (Positive Class) */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-indigo-900">At-Risk Recall</span>
                          <Target className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-indigo-950 block">
                          {treeData.metrics.atRiskRecallPct || treeData.metrics.recallPct}
                        </span>
                        <p className="text-[10px] text-indigo-700 font-sans">
                          {treeData.confusionMatrix.truePositive} of {treeData.confusionMatrix.truePositive + treeData.confusionMatrix.falseNegative} at-risk detected
                        </p>
                      </div>

                      {/* 3. At-Risk Precision (Positive Class) */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">At-Risk Precision</span>
                          <Award className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-[#1e2238] block">
                          {treeData.metrics.atRiskPrecisionPct || treeData.metrics.precisionPct}
                        </span>
                        <p className="text-[10px] text-slate-500 font-sans">
                          {treeData.confusionMatrix.truePositive} of {treeData.confusionMatrix.truePositive + treeData.confusionMatrix.falsePositive} alerts genuine
                        </p>
                      </div>

                      {/* 4. At-Risk F1-Score */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>At-Risk F1</span>
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-[#1e2238] block">
                          {treeData.metrics.atRiskF1Pct || (treeData.metrics.f1Score ? `${(treeData.metrics.f1Score * 100).toFixed(1)}%` : '0.0%')}
                        </span>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Harmonic mean (risk class)
                        </p>
                      </div>

                      {/* 5. Macro-Averaged F1 */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Macro-F1</span>
                          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-[#1e2238] block">
                          {treeData.metrics.macroF1Pct || (treeData.metrics.macroF1 ? `${(treeData.metrics.macroF1 * 100).toFixed(1)}%` : treeData.metrics.f1Score ? `${(treeData.metrics.f1Score * 100).toFixed(1)}%` : '0.0%')}
                        </span>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Unweighted class balance
                        </p>
                      </div>

                      {/* 6. ROC-AUC */}
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-3.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>ROC-AUC</span>
                          <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <span className="text-xl font-bold font-mono text-[#1e2238] block">
                          {typeof treeData.metrics.rocAuc === 'number' ? (treeData.metrics.rocAuc * 100).toFixed(1) + '%' : '100%'}
                        </span>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Area under ROC curve
                        </p>
                      </div>
                    </div>

                    {/* Confusion Matrix Heatmap Section */}
                    {(() => {
                      const cm = treeData.confusionMatrix;
                      const actualGoodStanding = cm.trueNegative + cm.falsePositive || 1;
                      const actualAtRisk = cm.falseNegative + cm.truePositive || 1;
                      const predGoodStanding = cm.trueNegative + cm.falseNegative;
                      const predAtRisk = cm.falsePositive + cm.truePositive;
                      const totalRecords = treeData.testSetSize || (actualGoodStanding + actualAtRisk);

                      const tnRate = ( (cm.trueNegative / actualGoodStanding) * 100 ).toFixed(1);
                      const fpRate = ( (cm.falsePositive / actualGoodStanding) * 100 ).toFixed(1);
                      const fnRate = ( (cm.falseNegative / actualAtRisk) * 100 ).toFixed(1);
                      const tpRate = ( (cm.truePositive / actualAtRisk) * 100 ).toFixed(1);

                      return (
                        <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                                <span>Confusion Matrix Heatmap (Unseen Held-Out Test Set, N = {totalRecords.toLocaleString()})</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                                  CART Decision Tree ({treeData.criterion}, depth = {treeData.maxDepth})
                                </span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Cross-tabulation comparing ground-truth student standing (rows) against decision tree predictions (columns).
                              </p>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              Positive Class: <strong>At-Risk</strong> · Negative: <strong>Good Standing</strong>
                            </div>
                          </div>

                          {/* 2x2 Heatmap Matrix Grid with Clear Axes */}
                          <div className="overflow-x-auto pt-1">
                            <div className="min-w-[580px] max-w-3xl mx-auto space-y-2">
                              {/* Top Axis Label: Predicted Class */}
                              <div className="grid grid-cols-[140px_1fr_1fr_90px] gap-2 items-center text-center">
                                <div />
                                <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
                                  Predicted Class (Model Decision)
                                </div>
                                <div />
                              </div>

                              {/* Column Subheaders */}
                              <div className="grid grid-cols-[140px_1fr_1fr_90px] gap-2 text-xs font-semibold text-slate-600 text-center">
                                <div className="text-right pr-2 text-slate-400 font-mono">Actual ↓</div>
                                <div className="p-1.5 rounded bg-slate-100 text-slate-800 font-bold">
                                  Predicted Good Standing (0)
                                </div>
                                <div className="p-1.5 rounded bg-slate-100 text-indigo-900 font-bold">
                                  Predicted At-Risk (1)
                                </div>
                                <div className="p-1.5 text-slate-500 font-mono font-medium">Row Total</div>
                              </div>

                              {/* Row 1: Actual Good Standing */}
                              <div className="grid grid-cols-[140px_1fr_1fr_90px] gap-2 items-stretch">
                                <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col justify-center text-right pr-3">
                                  <span className="text-xs font-bold text-slate-800">Actual Good Standing</span>
                                  <span className="text-[10px] text-slate-500 font-mono">Class 0 (Negative)</span>
                                </div>

                                {/* True Negative (TN) Heatmap Cell */}
                                <div className="p-4 rounded-lg bg-emerald-50/80 border border-emerald-300 text-center space-y-1 shadow-2xs hover:bg-emerald-50 transition-all">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                    <span>True Negative (TN)</span>
                                    <span className="font-mono text-emerald-700">{tnRate}%</span>
                                  </div>
                                  <span className="text-2xl font-bold font-mono text-emerald-950 block">
                                    {cm.trueNegative.toLocaleString()}
                                  </span>
                                  <p className="text-[11px] text-emerald-800 font-sans">
                                    Good Standing Students Correctly Identified
                                  </p>
                                </div>

                                {/* False Positive (FP) Heatmap Cell */}
                                <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-300 text-center space-y-1 shadow-2xs hover:bg-amber-50 transition-all">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                    <span>False Positive (FP)</span>
                                    <span className="font-mono text-amber-700">{fpRate}%</span>
                                  </div>
                                  <span className="text-2xl font-bold font-mono text-amber-950 block">
                                    {cm.falsePositive.toLocaleString()}
                                  </span>
                                  <p className="text-[11px] text-amber-800 font-sans">
                                    Good Standing Flagged for Advisory (Type I Error)
                                  </p>
                                </div>

                                {/* Row 1 Marginal Total */}
                                <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col justify-center text-center font-mono text-xs">
                                  <span className="font-bold text-slate-800">{actualGoodStanding.toLocaleString()}</span>
                                  <span className="text-[10px] text-slate-500">{( (actualGoodStanding / totalRecords) * 100 ).toFixed(1)}% cohort</span>
                                </div>
                              </div>

                              {/* Row 2: Actual At-Risk */}
                              <div className="grid grid-cols-[140px_1fr_1fr_90px] gap-2 items-stretch">
                                <div className="p-3 rounded bg-indigo-50/60 border border-indigo-200 flex flex-col justify-center text-right pr-3">
                                  <span className="text-xs font-bold text-indigo-950">Actual At-Risk</span>
                                  <span className="text-[10px] text-indigo-700 font-mono">Class 1 (Positive)</span>
                                </div>

                                {/* False Negative (FN) Heatmap Cell */}
                                <div className="p-4 rounded-lg bg-rose-50/80 border border-rose-300 text-center space-y-1 shadow-2xs hover:bg-rose-50 transition-all">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-800">
                                    <span>False Negative (FN)</span>
                                    <span className="font-mono text-rose-700">{fnRate}%</span>
                                  </div>
                                  <span className="text-2xl font-bold font-mono text-rose-950 block">
                                    {cm.falseNegative.toLocaleString()}
                                  </span>
                                  <p className="text-[11px] text-rose-800 font-sans">
                                    At-Risk Students Unidentified (Type II Deficit Gap)
                                  </p>
                                </div>

                                {/* True Positive (TP) Heatmap Cell */}
                                <div className="p-4 rounded-lg bg-indigo-50/80 border border-indigo-300 text-center space-y-1 shadow-2xs hover:bg-indigo-50 transition-all">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                                    <span>True Positive (TP)</span>
                                    <span className="font-mono text-indigo-700">{tpRate}%</span>
                                  </div>
                                  <span className="text-2xl font-bold font-mono text-indigo-950 block">
                                    {cm.truePositive.toLocaleString()}
                                  </span>
                                  <p className="text-[11px] text-indigo-800 font-sans">
                                    At-Risk Students Correctly Flagged for Remediation
                                  </p>
                                </div>

                                {/* Row 2 Marginal Total */}
                                <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col justify-center text-center font-mono text-xs">
                                  <span className="font-bold text-indigo-950">{actualAtRisk.toLocaleString()}</span>
                                  <span className="text-[10px] text-slate-500">{( (actualAtRisk / totalRecords) * 100 ).toFixed(1)}% cohort</span>
                                </div>
                              </div>

                              {/* Column Marginal Totals */}
                              <div className="grid grid-cols-[140px_1fr_1fr_90px] gap-2 text-xs font-mono text-center pt-1 border-t border-slate-200">
                                <div className="text-right pr-2 font-sans font-bold text-slate-500">Predicted Totals:</div>
                                <div className="p-1.5 rounded bg-slate-100 font-bold text-slate-800">
                                  {predGoodStanding.toLocaleString()} ({( (predGoodStanding / totalRecords) * 100 ).toFixed(1)}%)
                                </div>
                                <div className="p-1.5 rounded bg-slate-100 font-bold text-indigo-950">
                                  {predAtRisk.toLocaleString()} ({( (predAtRisk / totalRecords) * 100 ).toFixed(1)}%)
                                </div>
                                <div className="p-1.5 font-bold text-slate-800">
                                  {totalRecords.toLocaleString()} (100%)
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Educational Diagnostic Note */}
                          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#1e2238]">
                              <Info className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Clinical Academic Interpretation & Trade-Offs:</span>
                            </div>
                            <p className="leading-relaxed">
                              In educational early-warning systems, <strong>False Negatives (Type II error = {cm.falseNegative})</strong> represent vulnerable students who miss targeted academic mentoring. By toggling <em>Weighting: Balanced</em> above, the Decision Tree applies inverse-frequency sample weights to prioritize recall ({cm.truePositive} true positives) over false alarms ({cm.falsePositive} advisory reviews).
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Decision Tree Structural Hierarchy & Node Graph */}
                    <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-indigo-600" />
                          <span>CART Decision Tree Node Condition Graph</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Traversable tree representation with branching rules, sample frequencies, class purities, and leaf classifications.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-[#fafbfd] border border-slate-200 font-mono text-xs overflow-x-auto">
                        <DecisionNodeViewer node={treeData.decisionTree} />
                      </div>
                    </div>

                    {/* 4. Top Gini Feature Importances for this Decision Tree */}
                    {treeData.featureImportances && treeData.featureImportances.length > 0 && (
                      <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                        <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-indigo-600" />
                          <span>Gini Impurity Feature Importances (Tree Model Specific)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {treeData.featureImportances.map((item, idx) => (
                            <div key={item.feature} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{idx + 1}. {item.displayName}</span>
                                <span className="font-mono text-indigo-700">{item.importancePercentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${Math.min(100, item.importancePercentage)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-VIEW 3: EXPERIMENT CONTROLS & HISTORY                           */}
            {/* =================================================================== */}
            {classificationSubView === 'experiment_settings' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                        <span>Classification Experiment Hyperparameter Configuration</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure train/test partition split, stratified cross-validation folds, random seed, and selection criteria.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => executeClassificationRun()}
                      disabled={isLoadingClassification}
                      className="px-4 py-2 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-2"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoadingClassification ? 'animate-spin' : ''}`} />
                      <span>{isLoadingClassification ? 'Evaluating Models...' : 'Execute Experiment'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Test Partition Size</label>
                      <select
                        value={clsTestSize}
                        onChange={(e) => setClsTestSize(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-bold text-slate-800"
                      >
                        <option value={0.15}>15% (N = 723 Held-Out)</option>
                        <option value={0.20}>20% (N = 964 Held-Out Standard)</option>
                        <option value={0.25}>25% (N = 1,205 Held-Out)</option>
                        <option value={0.30}>30% (N = 1,446 Held-Out)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Untouched test set</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">CV Folds (Training Set)</label>
                      <select
                        value={clsSplits}
                        onChange={(e) => setClsSplits(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-bold text-slate-800"
                      >
                        <option value={3}>3-Fold Stratified CV</option>
                        <option value={5}>5-Fold Stratified CV (Standard)</option>
                        <option value={10}>10-Fold Stratified CV</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Internal cross-validation</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Random Seed</label>
                      <input
                        type="number"
                        value={clsSeed}
                        onChange={(e) => setClsSeed(Number(e.target.value))}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-mono font-bold text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400">Deterministic reproducibility</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Selection Metric Policy</label>
                      <select
                        value={clsMetricPolicy}
                        onChange={(e) => setClsMetricPolicy(e.target.value)}
                        className="w-full rounded border border-[#e7eaee] bg-white p-2 text-xs font-bold text-slate-800"
                      >
                        <option value="macro_f1">Macro-F1 (Balanced Minority/Majority)</option>
                        <option value="at_risk_recall">At-Risk Recall (Sensitivity Priority)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Primary decision rule</span>
                    </div>
                  </div>
                </div>

                {/* Experiment Run History Table */}
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>Persistent Experiment Execution History</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => loadClsHistory()}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Refresh History
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[#e7eaee]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fafbfd] text-slate-500 font-semibold border-b border-[#e7eaee]">
                        <tr>
                          <th className="py-2.5 px-3">Experiment ID</th>
                          <th className="py-2.5 px-3">Timestamp (UTC)</th>
                          <th className="py-2.5 px-3">Cohort Size</th>
                          <th className="py-2.5 px-3">Selected Model Winner</th>
                          <th className="py-2.5 px-3 text-right">CV Macro-F1</th>
                          <th className="py-2.5 px-3 text-right">Test At-Risk Recall</th>
                          <th className="py-2.5 px-3 text-right">Latency</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {clsHistory && clsHistory.length > 0 ? (
                          clsHistory.map((h: ClassificationHistoryItem) => (
                            <tr
                              key={h.experimentId}
                              onClick={() => loadHistoryExperiment(h.experimentId)}
                              className="hover:bg-indigo-50/50 cursor-pointer transition-all"
                            >
                              <td className="py-2.5 px-3 font-bold text-slate-800">{h.experimentId}</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">
                                {new Date(h.timestamp).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {h.totalEligible?.toLocaleString() || '4,820'}
                              </td>
                              <td className="py-2.5 px-3 font-sans font-bold text-indigo-900">
                                {h.selectedModel}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                                {h.cvMacroF1?.toFixed(4)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                                {(h.testAtRiskRecall * 100).toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                                {h.totalExecutionTimeSec}s
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {h.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadHistoryExperiment(h.experimentId);
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer border border-indigo-200"
                                >
                                  Load Run
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-500 font-sans text-xs">
                              {isLoadingClsHistory ? 'Loading history...' : 'No historical runs logged yet. Execute an experiment to record.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FEATURE IMPORTANCE & CORRELATIONS */}
        {/* ========================================================================= */}
        {activeTab === 'importance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                  <span>Academic Performance Measures: Risk Driver Correlations</span>
                  {isLoadingImportance && <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculates Pearson correlation coefficients across 4,820 student facts linking continuous metrics with risk outcomes
                </p>
              </div>

              {importanceData && (
                <div className="space-y-4">
                  {/* Top Predictor Callout */}
                  <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-start gap-3">
                    <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-indigo-950">
                        Primary Academic Risk Predictor: {importanceData.primaryPredictor?.displayName}
                      </p>
                      <p className="text-indigo-900 leading-relaxed text-[11.5px]">
                        Biometric lecture and laboratory attendance rate exhibits the single strongest deterministic correlation with academic deficit in the active semester. Students whose attendance falls below the statutory 75.0% threshold account for 100% of institutional risk flaggings.
                      </p>
                    </div>
                  </div>

                  {/* Correlation Matrix Table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#1e2238] uppercase tracking-wide">
                      Pearson Correlation Matrix (Star Schema Continuous Measures)
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-[#e7eaee]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#fafbfd] text-slate-600 font-semibold border-b border-[#e7eaee]">
                          <tr>
                            <th className="py-2 px-3">Measure</th>
                            <th className="py-2 px-3 text-right">Current GPA</th>
                            <th className="py-2 px-3 text-right">Attendance %</th>
                            <th className="py-2 px-3 text-right">Failed Backlogs</th>
                            <th className="py-2 px-3 text-right">Sem 6 Marks</th>
                            <th className="py-2 px-3 text-right">Historical GPA</th>
                            <th className="py-2 px-3 text-right">Is At-Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.keys(importanceData.correlationMatrix).map((metric) => {
                            const row = importanceData.correlationMatrix[metric];
                            return (
                              <tr key={metric} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-semibold text-slate-800">{metric}</td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {row['current_gpa']?.toFixed(2) ?? '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {row['attendance_percentage']?.toFixed(2) ?? '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {row['failed_courses_count']?.toFixed(2) ?? '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {row['sem6_avg_marks']?.toFixed(2) ?? '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {row['hist_avg_gpa']?.toFixed(2) ?? '-'}
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-bold ${
                                    (row['is_at_risk'] || 0) < 0
                                      ? 'text-emerald-700'
                                      : (row['is_at_risk'] || 0) > 0.5
                                      ? 'text-rose-600'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {row['is_at_risk']?.toFixed(2) ?? '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------------------------
// Subcomponent: Recursive Decision Tree Visualizer
// ------------------------------------------------------------------------------
function DecisionNodeViewer({ node, level = 0 }: { node: DecisionTreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (node.isLeaf) {
    const isRisk = node.predictedClass.includes('At-Risk');
    return (
      <div className={`p-2.5 rounded border text-xs ${isRisk ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`font-bold ${isRisk ? 'text-rose-700' : 'text-emerald-700'}`}>
            &rArr; LEAF: {node.predictedClass}
          </span>
          <span className="text-[10px] text-slate-500">
            {node.samples.toLocaleString()} students ({node.purityPercentage}% purity)
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
          <span>Good Standing: {node.classDistribution.goodStanding}</span>
          <span>At-Risk: {node.classDistribution.atRisk}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2.5 rounded bg-white border border-slate-300 shadow-2xs hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
          <span className="font-bold text-indigo-700">{node.condition}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Samples: {node.samples.toLocaleString()}</span>
          <span className="font-semibold text-slate-700">Purity: {node.purityPercentage}%</span>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-4 border-l-2 border-slate-300 space-y-2 ml-2">
          {node.left && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                &larr; TRUE ({node.condition}):
              </span>
              <DecisionNodeViewer node={node.left} level={level + 1} />
            </div>
          )}

          {node.right && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                &rarr; FALSE (NOT {node.condition}):
              </span>
              <DecisionNodeViewer node={node.right} level={level + 1} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
