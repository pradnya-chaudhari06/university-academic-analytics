"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Automated Tests for Multiple Clustering Algorithms (Phase 5 Extension)
==============================================================================
Validates:
1. K-Means, Hierarchical Agglomerative, DBSCAN, and GMM execution.
2. Parameter bounds and strict input validation.
3. Edge cases (DBSCAN 1-cluster or all-noise handling, undefined metrics).
4. Multi-algorithm comparative benchmarking and explainable recommendation.
5. Role-Based Access Control (RBAC) security enforcement.
6. Backwards compatibility with existing single K-Means and experiment sweep.
==============================================================================
"""

import unittest
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score

from fastapi.testclient import TestClient
from backend.main import app
from backend.mining.clustering import clustering_engine
from backend.mining.feature_store import feature_store


class TestMultipleClusteringAlgorithms(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.auth_headers = {"X-User-Role": "Analytics"}
        cls.faculty_headers = {"X-User-Role": "Faculty"}
        cls.student_headers = {"X-User-Role": "Student"}

    # --------------------------------------------------------------------------
    # 1. K-Means Execution & Parameter Validation
    # --------------------------------------------------------------------------
    def test_kmeans_configured(self):
        res = clustering_engine.run_kmeans_configured(k=4, n_init=5, random_state=42)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["clustersCount"], 4)
        self.assertEqual(len(res["clusters"]), 4)
        self.assertIsNotNone(res["silhouetteScore"])
        self.assertIsNotNone(res["daviesBouldinIndex"])
        self.assertIsNotNone(res["calinskiHarabaszScore"])
        self.assertIsNotNone(res["inertia"])
        self.assertEqual(res["noiseCount"], 0)
        self.assertIn("projection", res)

    def test_kmeans_validation_errors(self):
        with self.assertRaises(ValueError):
            clustering_engine.run_kmeans_configured(k=1)
        with self.assertRaises(ValueError):
            clustering_engine.run_kmeans_configured(k=20)
        with self.assertRaises(ValueError):
            clustering_engine.run_kmeans_configured(k=4, n_init=0)

    # --------------------------------------------------------------------------
    # 2. Hierarchical Agglomerative Execution & Linkages
    # --------------------------------------------------------------------------
    def test_hierarchical_execution(self):
        res = clustering_engine.run_hierarchical(n_clusters=4, linkage="ward")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["clustersCount"], 4)
        self.assertEqual(len(res["clusters"]), 4)
        self.assertIsNotNone(res["silhouetteScore"])
        self.assertIsNotNone(res["daviesBouldinIndex"])
        self.assertIsNotNone(res["calinskiHarabaszScore"])
        self.assertIsNone(res["inertia"])  # Inertia is strictly K-Means specific!
        self.assertGreater(res["executionTimeMs"], 0)

    def test_hierarchical_linkage_validation(self):
        with self.assertRaises(ValueError):
            clustering_engine.run_hierarchical(n_clusters=4, linkage="invalid_linkage")
        with self.assertRaises(ValueError):
            clustering_engine.run_hierarchical(n_clusters=1)
        with self.assertRaises(ValueError):
            clustering_engine.run_hierarchical(n_clusters=25)

    # --------------------------------------------------------------------------
    # 3. DBSCAN Density-Based Execution & Noise Handling
    # --------------------------------------------------------------------------
    def test_dbscan_execution_with_noise(self):
        res = clustering_engine.run_dbscan(eps=0.8, min_samples=15)
        self.assertEqual(res["status"], "success")
        self.assertGreaterEqual(res["clustersCount"], 1)
        self.assertGreater(res["noiseCount"], 0)
        self.assertGreater(res["noisePercentage"], 0.0)
        self.assertIsNone(res["inertia"])
        self.assertIn("projection", res)

    def test_dbscan_edge_cases_undefined_metrics(self):
        # eps=3.0 produces 1 giant cluster across the normalized dataset
        res = clustering_engine.run_dbscan(eps=3.0, min_samples=5)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["clustersCount"], 1)
        # Silhouette is mathematically undefined for 1 cluster
        self.assertIsNone(res["silhouetteScore"])
        self.assertIsNone(res["daviesBouldinIndex"])
        self.assertIsNone(res["calinskiHarabaszScore"])
        self.assertTrue(len(res["warnings"]) > 0)
        self.assertIn("mathematically undefined", res["warnings"][0])

    def test_dbscan_validation_errors(self):
        with self.assertRaises(ValueError):
            clustering_engine.run_dbscan(eps=-0.5)
        with self.assertRaises(ValueError):
            clustering_engine.run_dbscan(eps=0.0)
        with self.assertRaises(ValueError):
            clustering_engine.run_dbscan(eps=0.8, min_samples=1)

    # --------------------------------------------------------------------------
    # 4. Gaussian Mixture Model (GMM) Execution & Covariance Types
    # --------------------------------------------------------------------------
    def test_gmm_execution(self):
        res = clustering_engine.run_gmm(n_components=4, covariance_type="full", random_state=42)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["clustersCount"], 4)
        self.assertEqual(len(res["clusters"]), 4)
        self.assertIsNotNone(res["silhouetteScore"])
        self.assertIsNotNone(res["daviesBouldinIndex"])
        self.assertIsNotNone(res["calinskiHarabaszScore"])
        self.assertIsNotNone(res["bic"])
        self.assertIsNotNone(res["aic"])
        self.assertIsNone(res["inertia"])

    def test_gmm_validation_errors(self):
        with self.assertRaises(ValueError):
            clustering_engine.run_gmm(n_components=1)
        with self.assertRaises(ValueError):
            clustering_engine.run_gmm(n_components=4, covariance_type="invalid_cov")

    # --------------------------------------------------------------------------
    # 5. Universal Dispatcher (run_algorithm)
    # --------------------------------------------------------------------------
    def test_run_algorithm_dispatcher(self):
        for algo in ["kmeans", "hierarchical", "dbscan", "gmm"]:
            res = clustering_engine.run_algorithm(algo)
            self.assertEqual(res["status"], "success")
            self.assertEqual(res["algorithmId"], algo)

        with self.assertRaises(ValueError):
            clustering_engine.run_algorithm("spectral_unsupported")

    # --------------------------------------------------------------------------
    # 6. Comparative Algorithm Benchmark & Explainable Recommendation
    # --------------------------------------------------------------------------
    def test_algorithm_benchmark(self):
        bm = clustering_engine.run_algorithm_benchmark()
        self.assertEqual(bm["status"], "success")
        self.assertEqual(len(bm["benchmarkRuns"]), 4)
        self.assertEqual(bm["eligibleRecords"], 4820)
        self.assertIn("recommendation", bm)

        rec = bm["recommendation"]
        self.assertIn("bestMathematicalAlgorithm", rec)
        self.assertIn("bestPedagogicalAlgorithm", rec)
        self.assertIn("outlierDetectionHighlights", rec)
        self.assertIn("tradeoffAnalysis", rec)
        self.assertIn("overallVerdict", rec)

        # Check each run has rank and suitability score
        for r in bm["benchmarkRuns"]:
            self.assertIn("suitabilityScore", r)
            self.assertIn("rank", r)
            self.assertIn("executionTimeMs", r)

    # --------------------------------------------------------------------------
    # 7. FastAPI API Endpoints (POST and GET)
    # --------------------------------------------------------------------------
    def test_api_clustering_run(self):
        # POST
        res_post = self.client.post(
            "/api/mining/clustering/run",
            json={"algorithm": "hierarchical", "params": {"n_clusters": 3, "linkage": "ward"}},
            headers=self.auth_headers
        )
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(res_post.json()["algorithmId"], "hierarchical")
        self.assertEqual(res_post.json()["clustersCount"], 3)

        # GET
        res_get = self.client.get(
            "/api/mining/clustering/run?algorithm=gmm&n_components=3&covariance_type=full",
            headers=self.faculty_headers
        )
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["algorithmId"], "gmm")
        self.assertEqual(res_get.json()["clustersCount"], 3)

    def test_api_clustering_benchmark(self):
        # POST
        res_post = self.client.post("/api/mining/clustering/benchmark", json={}, headers=self.auth_headers)
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(len(res_post.json()["benchmarkRuns"]), 4)

        # GET
        res_get = self.client.get("/api/mining/clustering/benchmark", headers=self.faculty_headers)
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(len(res_get.json()["benchmarkRuns"]), 4)

    # --------------------------------------------------------------------------
    # 8. Role-Based Access Control (RBAC) Security
    # --------------------------------------------------------------------------
    def test_rbac_student_blocked(self):
        res_run = self.client.post("/api/mining/clustering/run", json={"algorithm": "kmeans"}, headers=self.student_headers)
        self.assertEqual(res_run.status_code, 403)

        res_bm = self.client.post("/api/mining/clustering/benchmark", json={}, headers=self.student_headers)
        self.assertEqual(res_bm.status_code, 403)

    # --------------------------------------------------------------------------
    # 9. Backwards Compatibility with Legacy K-Means Endpoints
    # --------------------------------------------------------------------------
    def test_backwards_compatibility(self):
        res_legacy = self.client.get("/api/mining/clusters?k=3", headers=self.auth_headers)
        self.assertEqual(res_legacy.status_code, 200)
        self.assertEqual(res_legacy.json()["k"], 3)

        res_exp = self.client.post("/api/mining/kmeans/experiment", json={"min_k": 2, "max_k": 4}, headers=self.auth_headers)
        self.assertEqual(res_exp.status_code, 200)
        self.assertIn("recommendation", res_exp.json())

    # --------------------------------------------------------------------------
    # 10. Known Synthetic Datasets Validation
    # --------------------------------------------------------------------------
    def test_known_synthetic_dataset(self):
        """Validates all 4 clustering models on synthetic well-separated 3-cluster Gaussian blobs."""
        rng = np.random.RandomState(42)
        c1 = rng.normal(loc=[-5.0, -5.0, -5.0, -5.0, -5.0], scale=0.8, size=(100, 5))
        c2 = rng.normal(loc=[0.0, 0.0, 0.0, 0.0, 0.0], scale=0.8, size=(100, 5))
        c3 = rng.normal(loc=[5.0, 5.0, 5.0, 5.0, 5.0], scale=0.8, size=(100, 5))
        X_syn = np.vstack([c1, c2, c3])
        X_syn_scaled = StandardScaler().fit_transform(X_syn)

        # 1. K-Means
        km = KMeans(n_clusters=3, n_init=10, random_state=42).fit(X_syn_scaled)
        sil_km = silhouette_score(X_syn_scaled, km.labels_)
        self.assertGreater(sil_km, 0.50)
        self.assertEqual(len(np.unique(km.labels_)), 3)

        # 2. Hierarchical Agglomerative
        hc = AgglomerativeClustering(n_clusters=3, linkage="ward").fit(X_syn_scaled)
        sil_hc = silhouette_score(X_syn_scaled, hc.labels_)
        self.assertGreater(sil_hc, 0.50)
        self.assertEqual(len(np.unique(hc.labels_)), 3)

        # 3. DBSCAN
        db = DBSCAN(eps=1.2, min_samples=5).fit(X_syn_scaled)
        non_noise = (db.labels_ >= 0)
        self.assertTrue(np.sum(non_noise) > 250)
        unique_db = np.unique(db.labels_[non_noise])
        self.assertEqual(len(unique_db), 3)

        # 4. GMM
        gmm = GaussianMixture(n_components=3, covariance_type="full", random_state=42).fit(X_syn_scaled)
        gmm_labels = gmm.predict(X_syn_scaled)
        sil_gmm = silhouette_score(X_syn_scaled, gmm_labels)
        self.assertGreater(sil_gmm, 0.50)
        self.assertEqual(len(np.unique(gmm_labels)), 3)

    # --------------------------------------------------------------------------
    # 11. Feature Scaling, Data Cleaning & Target Leakage Prevention
    # --------------------------------------------------------------------------
    def test_feature_scaling_and_cleaning(self):
        """Verifies feature extraction, Z-score standardization, and absence of target leakage/identifiers."""
        X_scaled, X_raw, feature_names, student_ids, scaler = feature_store.get_clustering_features()
        df_raw = feature_store.load_data()

        # Record count
        self.assertEqual(len(df_raw), 4820)
        self.assertEqual(X_scaled.shape[0], 4820)
        self.assertEqual(X_scaled.shape[1], 5)

        # Check that student identifiers and targets are strictly excluded from clustering inputs
        forbidden_inputs = ["student_id", "student_name", "email", "student_key", "is_at_risk", "risk_level"]
        for forbidden in forbidden_inputs:
            self.assertNotIn(forbidden, feature_names, f"Target or identifier '{forbidden}' leaked into feature vector!")

        # Verify standardization (mean ~ 0, std ~ 1)
        means = np.mean(X_scaled, axis=0)
        stds = np.std(X_scaled, axis=0)
        self.assertTrue(np.allclose(means, 0.0, atol=1e-5), "Features must be centered at 0")
        self.assertTrue(np.allclose(stds, 1.0, atol=1e-5), "Features must have unit variance")

        # Zero NaNs or Infs
        self.assertFalse(np.isnan(X_scaled).any())
        self.assertFalse(np.isinf(X_scaled).any())

    # --------------------------------------------------------------------------
    # 12. Metric Validity & DBSCAN Noise Handling Protocol
    # --------------------------------------------------------------------------
    def test_metric_validity_and_noise_handling(self):
        """Verifies DBSCAN noise isolation and metric validity conditions."""
        res_db = clustering_engine.run_dbscan(eps=0.8, min_samples=15)
        self.assertEqual(res_db["noiseCount"], 5)
        self.assertEqual(res_db["noisePercentage"], 0.1)
        self.assertEqual(res_db["eligibleRecords"], 4820)
        self.assertEqual(res_db["evaluatedRecords"], 4815)
        self.assertIn("noiseHandlingPolicy", res_db)
        self.assertTrue(res_db["metricValidity"]["silhouette"])

        # When non-noise clusters < 2, metrics must be strictly None (never fabricated)
        res_db_giant = clustering_engine.run_dbscan(eps=3.0, min_samples=5)
        self.assertEqual(res_db_giant["clustersCount"], 1)
        self.assertIsNone(res_db_giant["silhouetteScore"])
        self.assertIsNone(res_db_giant["daviesBouldinIndex"])
        self.assertIsNone(res_db_giant["calinskiHarabaszScore"])
        self.assertFalse(res_db_giant["metricValidity"]["silhouette"])
        self.assertEqual(res_db_giant["evaluatedRecords"], 0)

    # --------------------------------------------------------------------------
    # 13. Cluster Size Totals and Student-to-Cluster Alignment
    # --------------------------------------------------------------------------
    def test_cluster_size_totals_and_student_mapping(self):
        """Verifies cluster sizes sum to exactly 4,820 and every sample student maps correctly."""
        df_raw = feature_store.load_data()

        for algo in ["kmeans", "hierarchical", "dbscan", "gmm"]:
            res = clustering_engine.run_algorithm(algo)
            # Sum of cluster sizes in profile breakdown
            total_students_in_profiles = sum(c["studentCount"] for c in res["clusters"])
            self.assertEqual(
                total_students_in_profiles, 4820,
                f"Cluster profile studentCount sum ({total_students_in_profiles}) != 4820 for {algo}"
            )

            # Sum of clusterSizes array + noiseCount == 4820
            sum_sizes = sum(res["clusterSizes"]) + res["noiseCount"]
            self.assertEqual(sum_sizes, 4820, f"Sizes array sum ({sum_sizes}) != 4820 for {algo}")

            # Verify exemplar students exist and match raw data
            for c in res["clusters"]:
                for s in c["sampleStudents"]:
                    sid = s["studentId"]
                    matching_rows = df_raw[df_raw["student_id"] == sid]
                    self.assertEqual(len(matching_rows), 1, f"Student {sid} not found in conformed dataset")
                    self.assertAlmostEqual(s["gpa"], float(matching_rows.iloc[0]["current_gpa"]), places=2)

    # --------------------------------------------------------------------------
    # 14. Screen Agreement & Persisted Cache Consistency
    # --------------------------------------------------------------------------
    def test_screen_agreement_and_persisted_cache(self):
        """Verifies 100% agreement between Benchmark, Explorer, and Sweep screens for identical configs."""
        # 1. Run Benchmark
        bm = clustering_engine.run_algorithm_benchmark()
        bm_km = next(r for r in bm["benchmarkRuns"] if r["algorithmId"] == "kmeans")
        bm_db = next(r for r in bm["benchmarkRuns"] if r["algorithmId"] == "dbscan")
        bm_hc = next(r for r in bm["benchmarkRuns"] if r["algorithmId"] == "hierarchical")
        bm_gmm = next(r for r in bm["benchmarkRuns"] if r["algorithmId"] == "gmm")

        # 2. Run Configured Individual Runs
        single_km = clustering_engine.run_kmeans_configured(k=4, n_init=10, random_state=42)
        single_db = clustering_engine.run_dbscan(eps=0.8, min_samples=15)
        single_hc = clustering_engine.run_hierarchical(n_clusters=4, linkage="ward")
        single_gmm = clustering_engine.run_gmm(n_components=4, covariance_type="full", random_state=42)

        # 3. Assert EXACT match between benchmark and individual explorer
        self.assertEqual(bm_km["silhouetteScore"], single_km["silhouetteScore"])
        self.assertEqual(bm_km["daviesBouldinIndex"], single_km["daviesBouldinIndex"])
        self.assertEqual(bm_km["calinskiHarabaszScore"], single_km["calinskiHarabaszScore"])
        self.assertEqual(bm_km["clusterSizes"], single_km["clusterSizes"])

        self.assertEqual(bm_db["silhouetteScore"], single_db["silhouetteScore"])
        self.assertEqual(bm_db["noiseCount"], single_db["noiseCount"])

        self.assertEqual(bm_hc["silhouetteScore"], single_hc["silhouetteScore"])
        self.assertEqual(bm_gmm["silhouetteScore"], single_gmm["silhouetteScore"])

        # 4. Assert K-Means Sweep at K=4 matches K-Means configured K=4
        exp = clustering_engine.run_experiment(min_k=2, max_k=5, n_init=10, random_state=42)
        exp_k4 = next(r for r in exp["experiments"] if r["k"] == 4)
        self.assertEqual(exp_k4["silhouetteScore"], single_km["silhouetteScore"])
        self.assertEqual(exp_k4["daviesBouldinIndex"], single_km["daviesBouldinIndex"])
        self.assertEqual(exp_k4["calinskiHarabaszScore"], single_km["calinskiHarabaszScore"])

    # --------------------------------------------------------------------------
    # 15. K-Means Sweep Reproducibility & K=4 Multi-Criteria Model Selection
    # --------------------------------------------------------------------------
    def test_kmeans_sweep_reproducibility_and_k4_selection(self):
        """Verifies deterministic sweep reproducibility and evidence supporting K=4 selection."""
        exp1 = clustering_engine.run_experiment(min_k=2, max_k=8, n_init=10, random_state=42)
        exp2 = clustering_engine.run_experiment(min_k=2, max_k=8, n_init=10, random_state=42)

        # Reproducibility
        for r1, r2 in zip(exp1["experiments"], exp2["experiments"]):
            self.assertEqual(r1["k"], r2["k"])
            self.assertEqual(r1["inertia"], r2["inertia"])
            self.assertEqual(r1["silhouetteScore"], r2["silhouetteScore"])
            self.assertEqual(r1["calinskiHarabaszScore"], r2["calinskiHarabaszScore"])

        # Recommendation validation
        rec = exp1["recommendation"]
        self.assertEqual(rec["recommendedK"], 4, "K=4 must be selected as the multi-criteria optimal model")
        self.assertEqual(rec["detectedElbowK"], 4, "Kneedle maximum chord distance elbow must occur at K=4")
        self.assertEqual(rec["bestCalinskiHarabaszK"], 4, "Calinski-Harabasz score must achieve global maximum at K=4")

        # Measured scores at K=4
        k4_run = next(r for r in exp1["experiments"] if r["k"] == 4)
        self.assertEqual(k4_run["silhouetteScore"], 0.5690)
        self.assertEqual(k4_run["calinskiHarabaszScore"], 10245.98)
        self.assertEqual(k4_run["daviesBouldinIndex"], 0.6680)

    # --------------------------------------------------------------------------
    # 16. API Metadata Fields Verification
    # --------------------------------------------------------------------------
    def test_api_metadata_fields(self):
        """Verifies API endpoints return eligibleRecords, evaluatedRecords, noiseHandlingPolicy, and metricValidity."""
        res_run = self.client.post("/api/mining/clustering/run", json={"algorithm": "dbscan"}, headers=self.auth_headers)
        self.assertEqual(res_run.status_code, 200)
        data_run = res_run.json()
        self.assertIn("eligibleRecords", data_run)
        self.assertIn("evaluatedRecords", data_run)
        self.assertIn("noiseHandlingPolicy", data_run)
        self.assertIn("metricValidity", data_run)
        self.assertEqual(data_run["eligibleRecords"], 4820)
        self.assertEqual(data_run["evaluatedRecords"], 4815)

        res_bm = self.client.get("/api/mining/clustering/benchmark", headers=self.auth_headers)
        self.assertEqual(res_bm.status_code, 200)
        data_bm = res_bm.json()
        self.assertEqual(data_bm["eligibleRecords"], 4820)
        for r in data_bm["benchmarkRuns"]:
            self.assertIn("eligibleRecords", r)
            self.assertIn("noiseHandlingPolicy", r)
            self.assertIn("metricValidity", r)


if __name__ == "__main__":
    unittest.main()
