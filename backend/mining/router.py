"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
FastAPI Data Mining Router (Phase 4)
==============================================================================
Exposes live machine learning and knowledge discovery endpoints derived directly
from conformed Star Schema facts in the academic warehouse:
1. GET /api/mining/overview
2. GET /api/mining/clusters?k={2..6}
3. GET /api/mining/rules?min_support={s}&min_confidence={c}
4. GET /api/mining/decision-tree?max_depth={2..6}
5. GET /api/mining/feature-importance
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from backend.mining.feature_store import feature_store
from backend.mining.clustering import clustering_engine
from backend.mining.association import association_engine
from backend.mining.classification import classification_engine
from backend.database import is_remote_postgres

mining_router = APIRouter(
    prefix="/api/mining",
    tags=["Data Mining & Academic Risk"]
)

class KMeansExperimentRequest(BaseModel):
    min_k: int = Field(2, ge=2, le=14, description="Minimum number of clusters (2 to 14)")
    max_k: int = Field(10, ge=2, le=15, description="Maximum number of clusters (2 to 15)")
    step: int = Field(1, ge=1, le=5, description="Step increment across K range")
    n_init: int = Field(10, ge=1, le=50, description="Number of K-Means initializations")
    random_state: int = Field(42, description="Random seed for reproducible initializations")
    evaluate_stability: bool = Field(False, description="Evaluate Adjusted Rand Index across seeds")
    selected_k: Optional[int] = Field(None, description="Optional specific K configuration to detail")
    features: Optional[List[str]] = Field(None, description="Optional custom feature names")

class AlgorithmRunRequest(BaseModel):
    algorithm: str = Field("kmeans", description="One of: kmeans, hierarchical, dbscan, gmm")
    params: Dict[str, Any] = Field(default_factory=dict, description="Algorithm-specific parameters")
    features: Optional[List[str]] = Field(None, description="Optional custom feature names")

class AlgorithmBenchmarkRequest(BaseModel):
    configs: Optional[Dict[str, Dict[str, Any]]] = Field(None, description="Custom parameters for algorithms")
    features: Optional[List[str]] = Field(None, description="Optional custom feature names")

class ClassificationExperimentRequest(BaseModel):
    test_size: float = Field(0.20, ge=0.10, le=0.40, description="Test partition ratio (0.10 to 0.40)")
    n_splits: int = Field(5, ge=2, le=10, description="Cross-validation folds (2 to 10)")
    random_state: int = Field(42, description="Random seed for reproducibility")
    metric_policy: str = Field("macro_f1", description="Primary model selection metric policy")

class ClassificationPredictRequest(BaseModel):
    current_gpa: float = Field(..., ge=0.0, le=10.0, description="Current semester GPA (0.0 to 10.0)")
    failed_courses_count: int = Field(..., ge=0, le=20, description="Current failed course backlogs")
    sem6_avg_marks: float = Field(..., ge=0.0, le=100.0, description="Semester VI average subject marks")
    sem6_min_marks: float = Field(..., ge=0.0, le=100.0, description="Semester VI lowest subject mark")
    hist_avg_gpa: float = Field(..., ge=0.0, le=10.0, description="Historical average GPA (Semesters I-V)")
    hist_fail_count: int = Field(..., ge=0, le=30, description="Historical backlog count (Semesters I-V)")
    gpa_momentum: Optional[float] = Field(None, description="GPA progression drift (current_gpa - hist_avg_gpa)")
    department_code: str = Field("IT", description="Department code: CE, IT, EXTC, MECH, CIVIL")
    experiment_id: Optional[str] = Field(None, description="Optional specific experiment artifact to use")


def _assert_not_student(x_user_role: Optional[str]):
    role = x_user_role.strip() if isinstance(x_user_role, str) and x_user_role.strip() else None
    if role == "Student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Students are strictly restricted from accessing administrative data mining operations."
        )

@mining_router.get("/overview")
def get_mining_overview(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Overview of the academic feature store, sample size, feature availability,
    and mining pipeline readiness.
    """
    _assert_not_student(x_user_role)
    try:
        summary = feature_store.get_summary()
        return {
            "status": "Ready",
            "pipeline": "Academic DWM Mining Engine",
            "databaseEngine": summary["engine"],
            "totalStudents": summary["total_students"],
            "atRiskStudents": summary["at_risk_count"],
            "atRiskPercentage": summary["at_risk_percentage"],
            "cohortMeanGpa": summary["mean_gpa"],
            "cohortMeanAttendance": summary["mean_attendance"],
            "featureCount": len(summary["features_extracted"]),
            "departments": summary["departments"],
            "riskLevels": summary["risk_levels"],
            "supportedAlgorithms": [
                {
                    "id": "kmeans",
                    "name": "K-Means Clustering & Sweep Experimenter",
                    "type": "Unsupervised",
                    "objective": "Identify student capability archetypes and evaluate optimal cluster configurations"
                },
                {
                    "id": "apriori",
                    "name": "Apriori Association Rule Mining",
                    "type": "Pattern Discovery",
                    "objective": "Discover frequent co-occurrence patterns, bottlenecks, and risk drivers"
                },
                {
                    "id": "decision_tree",
                    "name": "Decision Tree Classification",
                    "type": "Supervised",
                    "objective": "Predict student risk status and explain classification decision paths"
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FeatureStore overview error: {str(e)}")

@mining_router.get("/clusters")
def get_clusters(
    k: int = Query(3, ge=2, le=6, description="Number of clusters K (2 to 6)"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes K-Means clustering on the conformed student feature matrix.
    Returns cluster centroids, member counts, archetypes, silhouette score, and elbow curve.
    Maintained for backwards compatibility.
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.run_kmeans(k=k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering execution error: {str(e)}")

@mining_router.post("/kmeans/experiment")
def run_kmeans_experiment_post(
    body: KMeansExperimentRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes a comprehensive multi-K K-Means experiment sweep over warehouse records.
    Calculates Inertia, Silhouette Score, Davies-Bouldin Index, Calinski-Harabasz Score,
    size imbalance diagnostics, geometric chord elbow curvature, and multi-evidence recommendation.
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.run_experiment(
            min_k=body.min_k,
            max_k=body.max_k,
            step=body.step,
            n_init=body.n_init,
            random_state=body.random_state,
            evaluate_stability=body.evaluate_stability,
            selected_k=body.selected_k,
            features=body.features
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"K-Means experiment sweep failed: {str(e)}")

@mining_router.get("/kmeans/experiment")
def run_kmeans_experiment_get(
    min_k: int = Query(2, ge=2, le=14, description="Minimum K"),
    max_k: int = Query(10, ge=2, le=15, description="Maximum K"),
    step: int = Query(1, ge=1, le=5, description="Step across K"),
    n_init: int = Query(10, ge=1, le=50, description="K-Means initializations"),
    random_state: int = Query(42, description="Random seed"),
    evaluate_stability: bool = Query(False, description="Evaluate Adjusted Rand Index"),
    selected_k: Optional[int] = Query(None, description="Selected K to inspect"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    GET variant for running K-Means experiment sweeps.
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.run_experiment(
            min_k=min_k,
            max_k=max_k,
            step=step,
            n_init=n_init,
            random_state=random_state,
            evaluate_stability=evaluate_stability,
            selected_k=selected_k
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"K-Means experiment sweep failed: {str(e)}")

@mining_router.get("/kmeans/experiment/config")
def get_kmeans_experiment_config(
    k: int = Query(..., ge=2, le=15, description="Cluster count K to inspect"),
    run_id: str = Query(..., description="Unique run ID of the experiment"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Retrieves detailed cluster profiles, distributions, exemplar students,
    and 2D projection scatter coordinates for a specific K from an experiment run.
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.get_experiment_cluster_detail(run_id=run_id, k=k)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch clustering configuration: {str(e)}")

@mining_router.post("/clustering/run")
def run_clustering_algorithm_post(
    body: AlgorithmRunRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes a specific unsupervised clustering algorithm:
    K-Means, Hierarchical Agglomerative, DBSCAN, or Gaussian Mixture Model (GMM).
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.run_algorithm(
            algorithm=body.algorithm,
            params=body.params,
            features=body.features
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering execution failed: {str(e)}")

@mining_router.get("/clustering/run")
def run_clustering_algorithm_get(
    algorithm: str = Query("kmeans", description="Algorithm: kmeans, hierarchical, dbscan, gmm"),
    k: int = Query(4, ge=2, le=15, description="K or number of clusters/components"),
    n_init: int = Query(10, ge=1, le=50, description="K-Means initialization runs"),
    linkage: str = Query("ward", description="Hierarchical linkage: ward, complete, average, single"),
    eps: float = Query(0.8, gt=0, le=10.0, description="DBSCAN epsilon radius"),
    min_samples: int = Query(15, ge=2, le=200, description="DBSCAN minimum neighborhood points"),
    n_components: int = Query(4, ge=2, le=15, description="GMM number of mixture components"),
    covariance_type: str = Query("full", description="GMM covariance type: full, tied, diag, spherical"),
    random_state: int = Query(42, description="Random state seed"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Query-param variant for running any of the 4 clustering algorithms.
    """
    _assert_not_student(x_user_role)
    algo_lower = algorithm.lower().strip()
    if algo_lower == "kmeans":
        params = {"k": k, "n_init": n_init, "random_state": random_state}
    elif algo_lower == "hierarchical":
        params = {"n_clusters": k, "linkage": linkage}
    elif algo_lower == "dbscan":
        params = {"eps": eps, "min_samples": min_samples}
    elif algo_lower == "gmm":
        params = {"n_components": n_components, "covariance_type": covariance_type, "random_state": random_state}
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported algorithm '{algorithm}'. Must be one of ['kmeans', 'hierarchical', 'dbscan', 'gmm'].")

    try:
        return clustering_engine.run_algorithm(algorithm=algo_lower, params=params)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering execution failed: {str(e)}")

@mining_router.post("/clustering/benchmark")
def run_clustering_benchmark_post(
    body: Optional[AlgorithmBenchmarkRequest] = None,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Runs multi-algorithm comparative benchmark evaluating K-Means, Hierarchical, DBSCAN, and GMM.
    Returns side-by-side quality metrics, cluster size distributions, outlier counts,
    execution latency, and explainable multi-criteria recommendations.
    """
    _assert_not_student(x_user_role)
    try:
        configs = body.configs if body else None
        features = body.features if body else None
        return clustering_engine.run_algorithm_benchmark(configs=configs, features=features)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering benchmark failed: {str(e)}")

@mining_router.get("/clustering/benchmark")
def run_clustering_benchmark_get(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    GET variant of the multi-algorithm benchmark running default conformed parameters.
    """
    _assert_not_student(x_user_role)
    try:
        return clustering_engine.run_algorithm_benchmark()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering benchmark failed: {str(e)}")

@mining_router.get("/rules")
def get_association_rules(
    min_support: float = Query(0.015, ge=0.005, le=0.50, description="Minimum support threshold (0.005 to 0.50)"),
    min_confidence: float = Query(0.60, ge=0.10, le=1.00, description="Minimum confidence threshold (0.10 to 1.00)"),
    max_length: int = Query(3, ge=2, le=4, description="Maximum itemset length (2 to 4)"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes Apriori association rule mining across 4,820 student transaction itemsets.
    Returns discovered rules with support, confidence, lift, and pedagogical interpretations.
    """
    _assert_not_student(x_user_role)
    try:
        return association_engine.run_apriori(
            min_support=min_support,
            min_confidence=min_confidence,
            max_length=max_length
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Association rule mining error: {str(e)}")

@mining_router.get("/decision-tree")
def get_decision_tree(
    max_depth: int = Query(3, ge=2, le=6, description="Maximum tree depth (2 to 6)"),
    criterion: str = Query("gini", pattern="^(gini|entropy)$", description="Split criterion ('gini' or 'entropy')"),
    class_weight: Optional[str] = Query(None, description="Optional class weighting: 'balanced' or null"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Trains and evaluates a Decision Tree Classifier predicting academic risk standing.
    Returns confusion matrix, precision/recall/F1 metrics, feature importances, and tree node graph.
    """
    _assert_not_student(x_user_role)
    try:
        return classification_engine.train_decision_tree(
            max_depth=max_depth,
            criterion=criterion,
            class_weight=class_weight
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision tree training error: {str(e)}")

@mining_router.get("/feature-importance")
def get_feature_importance(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Returns Gini feature importance ranking and Pearson correlation matrix
    between academic performance measures and student risk status.
    """
    _assert_not_student(x_user_role)
    try:
        tree_res = classification_engine.train_decision_tree(max_depth=3)
        df = feature_store.load_data()

        corr_features = [
            "current_gpa",
            "attendance_percentage",
            "failed_courses_count",
            "sem6_avg_marks",
            "sem6_min_marks",
            "hist_avg_gpa",
            "gpa_momentum",
            "is_at_risk"
        ]
        corr_matrix = df[corr_features].corr().round(3).to_dict()

        return {
            "primaryPredictor": tree_res["featureImportances"][0] if tree_res["featureImportances"] else None,
            "featureImportances": tree_res["featureImportances"],
            "correlationMatrix": corr_matrix,
            "sampleSize": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature importance error: {str(e)}")

@mining_router.post("/classification/experiment")
def run_classification_experiment_post(
    body: ClassificationExperimentRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes a multi-classifier benchmark across 5 algorithms:
    Logistic Regression, Decision Tree, Random Forest, SVM (RBF), and Gradient Boosting.
    Applies 5-fold stratified CV on the training partition and evaluates the selected best model
    on the untouched held-out test set.
    """
    _assert_not_student(x_user_role)
    try:
        return classification_engine.run_classification_experiment(
            test_size=body.test_size,
            n_splits=body.n_splits,
            random_state=body.random_state,
            metric_policy=body.metric_policy
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification experiment failed: {str(e)}")


@mining_router.get("/classification/experiment")
def get_classification_experiment_get(
    test_size: float = Query(0.20, ge=0.10, le=0.40, description="Test partition ratio"),
    n_splits: int = Query(5, ge=2, le=10, description="Cross-validation folds"),
    random_state: int = Query(42, description="Random state seed"),
    force_rerun: bool = Query(False, description="Force re-running new experiment"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Retrieves the latest classification experiment result, or executes a fresh benchmark if requested/none exists.
    """
    _assert_not_student(x_user_role)
    try:
        if force_rerun:
            return classification_engine.run_classification_experiment(
                test_size=test_size,
                n_splits=n_splits,
                random_state=random_state
            )
        return classification_engine.get_latest_experiment()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve classification experiment: {str(e)}")


@mining_router.get("/classification/experiment/{experiment_id}")
def get_classification_experiment_by_id(
    experiment_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Retrieves a specific classification experiment by its unique ID.
    """
    _assert_not_student(x_user_role)
    exp = classification_engine.get_experiment_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return exp


@mining_router.get("/classification/history")
def get_classification_history(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Retrieves execution history of past classification experiment runs.
    """
    _assert_not_student(x_user_role)
    try:
        return {
            "totalExperiments": len(classification_engine._experiments),
            "history": classification_engine.get_experiment_history()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve classification history: {str(e)}")


@mining_router.post("/classification/predict")
def predict_student_risk_post(
    body: ClassificationPredictRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> Dict[str, Any]:
    """
    Executes live academic risk inference for a student record using the selected champion model artifact.
    Restricted to authorized faculty, advisor, and analytics roles (Students blocked).
    """
    _assert_not_student(x_user_role)
    try:
        return classification_engine.predict_student_risk(
            features=body.model_dump(),
            experiment_id=body.experiment_id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction inference failed: {str(e)}")


