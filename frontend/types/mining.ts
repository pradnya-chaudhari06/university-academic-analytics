/**
 * ==============================================================================
 * UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
 * TypeScript Data Mining Interfaces (Phase 4)
 * ==============================================================================
 * Conformed type definitions matching the live FastAPI backend mining routes:
 * 1. GET /api/mining/overview
 * 2. GET /api/mining/clusters
 * 3. GET /api/mining/rules
 * 4. GET /api/mining/decision-tree
 * 5. GET /api/mining/feature-importance
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. Mining Overview Types
// ------------------------------------------------------------------------------

export interface MiningAlgorithmInfo {
  id: string;
  name: string;
  type: 'Unsupervised' | 'Pattern Discovery' | 'Supervised' | string;
  objective: string;
}

export interface MiningOverviewResponse {
  status: string;
  pipeline: string;
  databaseEngine: string;
  totalStudents: number;
  atRiskStudents: number;
  atRiskPercentage: number;
  cohortMeanGpa: number;
  cohortMeanAttendance: number;
  featureCount: number;
  departments: Record<string, number>;
  riskLevels: Record<string, number>;
  supportedAlgorithms: MiningAlgorithmInfo[];
}

// ------------------------------------------------------------------------------
// 2. K-Means Clustering Types
// ------------------------------------------------------------------------------

export interface ClusterCentroid {
  current_gpa?: number;
  attendance_percentage?: number;
  failed_courses_count?: number;
  hist_avg_gpa?: number;
  sem6_avg_marks?: number;
  [key: string]: number | undefined;
}

export interface ClusterSampleStudent {
  studentId: string;
  studentName: string;
  department: string;
  gpa: number;
  attendanceRate: number;
  failedCoursesCount: number;
  isAtRisk: boolean;
}

export interface ClusterProfile {
  clusterId: number;
  archetypeName: string;
  tier: 'Advanced' | 'Proficient' | 'Developing' | 'Critical' | string;
  colorHex: string;
  badgeVariant: 'indigo' | 'emerald' | 'amber' | 'rose' | string;
  studentCount: number;
  percentage: number;
  atRiskCount?: number;
  atRiskPercentage?: number;
  medianGpa?: number;
  medianAttendance?: number;
  centroid: ClusterCentroid;
  recommendedAction: string;
  sampleStudents: ClusterSampleStudent[];
  rank?: number;
}

export interface ElbowCurvePoint {
  k: number;
  inertia: number;
}

export interface ProjectionPoint {
  studentId: string;
  studentName: string;
  department: string;
  x: number;
  y: number;
  clusterId: number;
  isAtRisk: boolean;
}

export interface ProjectedCentroid {
  clusterId: number;
  x: number;
  y: number;
}

export interface ProjectionData {
  xAxisFeature: string;
  xAxisLabel: string;
  yAxisFeature: string;
  yAxisLabel: string;
  projectionType: string;
  projectionNote?: string;
  sampleCount: number;
  points: ProjectionPoint[];
  centroids: ProjectedCentroid[];
}

export interface ClusterMiningResponse {
  algorithm: string;
  k: number;
  totalStudents: number;
  inertia: number;
  silhouetteScore: number;
  featureVector: string[];
  clusters: ClusterProfile[];
  elbowCurve: ElbowCurvePoint[];
  projection?: ProjectionData;
}

export interface KMeansExperimentRunItem {
  k: number;
  inertia: number;
  silhouetteScore: number | null;
  daviesBouldinIndex: number | null;
  calinskiHarabaszScore: number | null;
  clusterSizes: number[];
  minClusterSize: number;
  maxClusterSize: number;
  imbalanceRatio: number;
  warnings: string[];
  stabilityAriMean: number | null;
  stabilityAriStd: number | null;
  isRecommended?: boolean;
  isAlternative?: boolean;
  compositeScore?: number;
  rank?: number;
}

export interface ChordDistancePoint {
  k: number;
  normalizedK: number;
  normalizedInertia: number;
  chordDistance: number;
}

export interface KMeansElbowAnalysis {
  detectedElbowK: number;
  maxChordDistance: number;
  elbowConfidence: 'High' | 'Moderate' | 'Low / Smooth Curve' | string;
  method: string;
  chordDistances: ChordDistancePoint[];
  inertiaDeltas: Record<string, number>;
  explanation: string;
}

export interface KMeansRecommendation {
  recommendedK: number;
  recommendedScore: number;
  bestSilhouetteK: number;
  bestDaviesBouldinK: number;
  bestCalinskiHarabaszK: number;
  detectedElbowK: number;
  alternatives: number[];
  metricDisagreements: string[];
  compositeScores: Record<number, number>;
  rankings: Record<number, number>;
  rationale: string;
}

export interface SelectedClusteringData {
  k: number;
  inertia: number;
  silhouetteScore: number;
  clusters: ClusterProfile[];
  projection?: ProjectionData;
}

export interface KMeansExperimentRequest {
  min_k?: number;
  max_k?: number;
  step?: number;
  n_init?: number;
  random_state?: number;
  evaluate_stability?: boolean;
  selected_k?: number;
  features?: string[];
}

export interface KMeansExperimentResponse {
  status: string;
  runId: string;
  eligibleRecords: number;
  excludedRecords: number;
  featuresUsed: string[];
  minK: number;
  maxK: number;
  step: number;
  nInit: number;
  randomState: number;
  evaluateStability: boolean;
  experiments: KMeansExperimentRunItem[];
  elbowAnalysis: KMeansElbowAnalysis;
  recommendation: KMeansRecommendation;
  selectedK: number;
  selectedClustering: SelectedClusteringData;
}

export interface ClusterDetailResponse {
  status: string;
  runId: string;
  k: number;
  inertia: number;
  silhouetteScore: number;
  daviesBouldinIndex?: number;
  calinskiHarabaszScore?: number;
  imbalanceRatio?: number;
  warnings?: string[];
  clusters: ClusterProfile[];
  projection?: ProjectionData;
  isCached: boolean;
}

// ------------------------------------------------------------------------------
// 2. Multi-Algorithm Suite & Benchmark Types
// ------------------------------------------------------------------------------

export type AlgorithmType = 'kmeans' | 'hierarchical' | 'dbscan' | 'gmm';

export interface SingleAlgorithmRunResponse {
  status: string;
  algorithmId: AlgorithmType;
  algorithmName: string;
  category: string;
  parameters: Record<string, any>;
  totalStudents: number;
  eligibleRecords?: number;
  evaluatedRecords?: number;
  noiseHandlingPolicy?: string;
  metricValidity?: { silhouette: boolean; daviesBouldin: boolean; calinskiHarabasz: boolean };
  clustersCount: number;
  silhouetteScore: number | null;
  daviesBouldinIndex: number | null;
  calinskiHarabaszScore: number | null;
  inertia?: number | null;
  bic?: number | null;
  aic?: number | null;
  clusterSizes: number[];
  minClusterSize: number;
  maxClusterSize: number;
  imbalanceRatio: number;
  noiseCount: number;
  noisePercentage: number;
  executionTimeMs: number;
  featureVector: string[];
  clusters: ClusterProfile[];
  projection: ProjectionData;
  warnings: string[];
  strengths: string[];
  limitations: string[];
}

export interface AlgorithmBenchmarkItem {
  algorithmId: AlgorithmType;
  algorithmName: string;
  category: string;
  parameters: Record<string, any>;
  clustersCount: number;
  eligibleRecords?: number;
  evaluatedRecords?: number;
  noiseHandlingPolicy?: string;
  metricValidity?: { silhouette: boolean; daviesBouldin: boolean; calinskiHarabasz: boolean };
  silhouetteScore: number | null;
  daviesBouldinIndex: number | null;
  calinskiHarabaszScore: number | null;
  clusterSizes: number[];
  minClusterSize: number;
  maxClusterSize: number;
  imbalanceRatio: number;
  noiseCount: number;
  noisePercentage: number;
  executionTimeMs: number;
  suitabilityScore: number;
  rank: number;
  warnings: string[];
  strengths: string[];
  limitations: string[];
}

export interface AlgorithmBenchmarkRecommendation {
  bestMathematicalAlgorithm: string;
  bestMathematicalName: string;
  bestMathematicalReason: string;
  bestPedagogicalAlgorithm: string;
  bestPedagogicalName: string;
  bestPedagogicalReason: string;
  outlierDetectionHighlights: string;
  tradeoffAnalysis: string;
  overallVerdict: string;
}

export interface AlgorithmBenchmarkResponse {
  status: string;
  eligibleRecords: number;
  excludedRecords: number;
  featureVector: string[];
  benchmarkRuns: AlgorithmBenchmarkItem[];
  recommendation: AlgorithmBenchmarkRecommendation;
}

export interface AlgorithmRunRequest {
  algorithm: AlgorithmType;
  params?: Record<string, any>;
  features?: string[];
}

export interface AlgorithmBenchmarkRequest {
  configs?: Record<string, Record<string, any>>;
  features?: string[];
}


// ------------------------------------------------------------------------------
// 3. Apriori Association Rule Types
// ------------------------------------------------------------------------------

export interface AssociationRuleItem {
  id: string;
  antecedent: string[];
  consequent: string[];
  antecedentStr: string;
  consequentStr: string;
  support: number;
  supportPct: string;
  confidence: number;
  confidencePct: string;
  lift: number;
  category: 'Critical Risk Driver' | 'Academic Excellence Pattern' | 'Departmental Trend' | 'Curricular Correlation' | string;
  badge: 'rose' | 'indigo' | 'slate' | 'amber' | string;
  interpretation: string;
}

export interface AssociationMiningResponse {
  algorithm: string;
  minSupport: number;
  minConfidence: number;
  totalTransactions: number;
  frequentItemsetsFound: number;
  totalRules: number;
  rules: AssociationRuleItem[];
}

// ------------------------------------------------------------------------------
// 4. Decision Tree Classification Types
// ------------------------------------------------------------------------------

export interface ClassificationMetrics {
  accuracy: number;
  accuracyPct: string;
  precision: number;
  precisionPct: string;
  recall: number;
  recallPct: string;
  f1Score: number;
  f1ScorePct?: string;
  rocAuc: number;
  atRiskPrecision?: number;
  atRiskPrecisionPct?: string;
  atRiskRecall?: number;
  atRiskRecallPct?: string;
  atRiskF1?: number;
  atRiskF1Pct?: string;
  goodStandingPrecision?: number;
  goodStandingPrecisionPct?: string;
  goodStandingRecall?: number;
  goodStandingRecallPct?: string;
  goodStandingF1?: number;
  goodStandingF1Pct?: string;
  macroPrecision?: number;
  macroPrecisionPct?: string;
  macroRecall?: number;
  macroRecallPct?: string;
  macroF1?: number;
  macroF1Pct?: string;
  weightedF1?: number;
  weightedF1Pct?: string;
  balancedAccuracy?: number;
  balancedAccuracyPct?: string;
}

export interface ConfusionMatrixGridCell {
  actual: string;
  predicted: string;
  count: number;
  type: 'TN' | 'FP' | 'FN' | 'TP';
  percentage: number;
}

export interface ConfusionMatrixData {
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  truePositive: number;
  trueNegativeRate?: number;
  falsePositiveRate?: number;
  falseNegativeRate?: number;
  truePositiveRate?: number;
  labels: [string, string];
  axisLabels?: {
    rows: string;
    columns: string;
  };
  matrixGrid?: ConfusionMatrixGridCell[][];
}

export interface DecisionTreeEvaluationMeta {
  runId: string;
  evaluatedAt: string;
  trainSetSize: number;
  testSetSize: number;
  trainSplitRatio: string;
  randomState: number;
  positiveClass: string;
  negativeClass: string;
  stratified: boolean;
  classDistribution: {
    totalGoodStanding: number;
    totalAtRisk: number;
    trainGoodStanding: number;
    trainAtRisk: number;
    testGoodStanding: number;
    testAtRisk: number;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  displayName: string;
  importance: number;
  importancePercentage: number;
}

export interface DecisionTreeNode {
  nodeId: number;
  depth: number;
  isLeaf: boolean;
  samples: number;
  classDistribution: {
    goodStanding: number;
    atRisk: number;
  };
  predictedClass: string;
  purityPercentage: number;
  feature?: string;
  featureDisplay?: string;
  threshold?: number;
  condition?: string;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
}

export interface DecisionTreeMiningResponse {
  algorithm: string;
  criterion: 'gini' | 'entropy' | string;
  maxDepth: number;
  classWeight?: string | null;
  totalCohortSize: number;
  trainingSetSize: number;
  testSetSize: number;
  runId?: string;
  evaluatedAt?: string;
  evaluation?: DecisionTreeEvaluationMeta;
  metrics: ClassificationMetrics;
  confusionMatrix: ConfusionMatrixData;
  featureImportances: FeatureImportanceItem[];
  decisionTree: DecisionTreeNode;
}

// ------------------------------------------------------------------------------
// 5. Feature Importance & Correlation Types
// ------------------------------------------------------------------------------

export interface FeatureImportanceResponse {
  primaryPredictor: FeatureImportanceItem | null;
  featureImportances: FeatureImportanceItem[];
  correlationMatrix: Record<string, Record<string, number>>;
  sampleSize: number;
}

// ------------------------------------------------------------------------------
// 6. Multi-Classifier Experimentation & Model Selection Types
// ------------------------------------------------------------------------------

export interface ClassifierCVMetrics {
  accuracy: number;
  accuracyPct: string;
  macroF1: number;
  weightedF1?: number;
  atRiskRecall: number;
  atRiskRecallPct: string;
  atRiskPrecision: number;
  atRiskPrecisionPct: string;
  atRiskF1: number;
  balancedAccuracy: number;
  balancedAccuracyPct?: string;
  rocAuc: number | null;
  prAuc: number | null;
  stdMacroF1: number;
  stdRecall: number;
  stdBalancedAccuracy?: number;
}

export interface ClassifierTestMetrics {
  accuracy: number;
  accuracyPct: string;
  macroF1: number;
  weightedF1?: number;
  atRiskRecall: number;
  atRiskRecallPct: string;
  atRiskPrecision: number;
  atRiskPrecisionPct: string;
  atRiskF1: number;
  balancedAccuracy: number;
  balancedAccuracyPct?: string;
  rocAuc: number | null;
  prAuc: number | null;
  confusionMatrix: ConfusionMatrixData;
  classificationReport?: Record<string, any>;
}

export interface EvaluatedClassifierItem {
  modelId: string;
  modelName: string;
  family: string;
  description: string;
  hyperparameters: Record<string, any>;
  trainingTimeSec: number;
  cvMetrics: ClassifierCVMetrics;
  testMetrics: ClassifierTestMetrics;
  status: string;
  rank: number;
  isBest: boolean;
}

export interface ClassificationBaselineInfo {
  modelName: string;
  testAccuracy: number;
  testMacroF1: number;
  testWeightedF1?: number;
  testRecall: number;
  testPrecision?: number;
  testF1?: number;
  testBalancedAccuracy?: number;
  interpretation: string;
}

export interface SelectedClassifierInfo {
  modelId: string;
  modelName: string;
  selectionCriterion: string;
  cvMacroF1: number;
  cvAtRiskRecall: number;
  cvAccuracy: number;
  cvBalancedAccuracy?: number;
  testMacroF1: number;
  testAtRiskRecall: number;
  testAtRiskPrecision: number;
  testAccuracy: number;
  testBalancedAccuracy?: number;
  testPrAuc?: number | null;
  testConfusionMatrix: ConfusionMatrixData;
  rationale: string;
  tradeoffAnalysis: string;
  limitations: string;
  artifactPath: string | null;
}

export interface ExcludedFeatureItem {
  name: string;
  reason: string;
}

export interface ClassificationDatasetMeta {
  targetColumn: string;
  targetLabel: string;
  recordGrain: string;
  totalEligible: number;
  goodStandingCount: number;
  atRiskCount: number;
  atRiskPrevalencePct: number;
  featureNames: string[];
  featureCount: number;
  excludedFeatures: ExcludedFeatureItem[];
  dataSplit: {
    strategy: string;
    trainSize: number;
    testSize: number;
    trainAtRisk: number;
    testAtRisk: number;
    cvStrategy: string;
    scalingStrategy: string;
    randomState: number;
  };
}

export interface ClassificationExperimentResponse {
  experimentId: string;
  status: string;
  timestamp: string;
  totalExecutionTimeSec: number;
  dataset: ClassificationDatasetMeta;
  models: EvaluatedClassifierItem[];
  baseline: ClassificationBaselineInfo;
  selectedModel: SelectedClassifierInfo;
  featureImportances: FeatureImportanceItem[];
}

export interface ClassificationHistoryItem {
  experimentId: string;
  timestamp: string;
  status: string;
  totalEligible: number;
  selectedModel: string;
  cvMacroF1: number;
  testAtRiskRecall: number;
  totalExecutionTimeSec: number;
}

export interface PredictStudentRiskRequest {
  current_gpa: number;
  failed_courses_count: number;
  sem6_avg_marks: number;
  sem6_min_marks: number;
  hist_avg_gpa: number;
  hist_fail_count: number;
  gpa_momentum?: number;
  department_code: string;
  experiment_id?: string;
}

export interface PredictStudentRiskResponse {
  prediction: number;
  predictionLabel: string;
  isAtRisk: boolean;
  riskProbability: number;
  riskProbabilityPct: string;
  goodStandingProbability: number;
  confidenceScore: number;
  modelUsed: string;
  modelId?: string;
  experimentId: string;
  advisoryLevel: 'Urgent Intervention' | 'Moderate Concern' | 'Good Standing' | string;
  recommendation: string;
  featuresEvaluated?: Record<string, any>;
}


