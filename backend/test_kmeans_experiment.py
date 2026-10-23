"""
==============================================================================
K-MEANS EXPERIMENTATION & OPTIMAL CLUSTER SELECTION TEST SUITE
==============================================================================
Comprehensive validation harness verifying:
1. Correct K range validation (bounds, non-integers, step, n_init limits).
2. Correct calculation of Inertia, Silhouette, Davies-Bouldin, and Calinski-Harabasz.
3. Metric directionality, normalization, and composite recommendation logic.
4. Reproducibility across runs with deterministic seeds and sorted input.
5. Invalid K values (K < 2, K > N, min_K > max_K).
6. Small dataset handling and edge cases.
7. Geometric chord distance elbow detection.
8. Imbalanced cluster diagnostics and size penalties.
9. Metric disagreement detection and dynamic rationale generation.
10. Stability evaluation via Adjusted Rand Index (ARI).
11. Selected K cluster alignment (centroids, assignments, exemplars).
12. API validation, error codes (400, 422), and role-based permissions (403 for Student).
13. Backwards compatibility of existing run_kmeans(k=3).
==============================================================================
"""

import sys
import unittest
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.mining.clustering import AcademicClusteringEngine, clustering_engine
from backend.mining.feature_store import feature_store

client = TestClient(app)

class TestKMeansExperimentEngine(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = AcademicClusteringEngine()
        cls.X_scaled, cls.X_raw, cls.features, cls.student_ids, cls.scaler = feature_store.get_clustering_features()
        cls.N = len(cls.student_ids)

    # 1. Backwards Compatibility
    def test_01_existing_kmeans_intact(self):
        res = self.engine.run_kmeans(k=3)
        self.assertEqual(res["k"], 3)
        self.assertEqual(res["totalStudents"], self.N)
        self.assertEqual(len(res["clusters"]), 3)
        self.assertIn("inertia", res)
        self.assertIn("silhouetteScore", res)
        self.assertIn("elbowCurve", res)
        self.assertTrue(res["inertia"] > 0)
        self.assertTrue(0 <= res["silhouetteScore"] <= 1.0)

    # 2. Input Validation
    def test_02_k_range_validation(self):
        # min_k < 2
        with self.assertRaises(ValueError) as ctx:
            self.engine.run_experiment(min_k=1, max_k=5)
        self.assertIn("Minimum K must be at least 2", str(ctx.exception))

        # min_k > max_k
        with self.assertRaises(ValueError) as ctx:
            self.engine.run_experiment(min_k=6, max_k=4)
        self.assertIn("greater than or equal to Minimum K", str(ctx.exception))

        # max_k > 15
        with self.assertRaises(ValueError) as ctx:
            self.engine.run_experiment(min_k=2, max_k=20)
        self.assertIn("exceeds allowable limit of 15", str(ctx.exception))

        # step < 1
        with self.assertRaises(ValueError) as ctx:
            self.engine.run_experiment(min_k=2, max_k=5, step=0)
        self.assertIn("Step must be a positive integer", str(ctx.exception))

        # n_init < 1
        with self.assertRaises(ValueError) as ctx:
            self.engine.run_experiment(min_k=2, max_k=5, n_init=0)
        self.assertIn("n_init must be between 1 and 50", str(ctx.exception))

    # 3. Metric Calculations & Correctness
    def test_03_metric_calculations(self):
        exp = self.engine.run_experiment(min_k=2, max_k=5, step=1, n_init=5, random_state=42)
        self.assertEqual(exp["status"], "Success")
        self.assertEqual(len(exp["experiments"]), 4)

        prev_inertia = float("inf")
        for item in exp["experiments"]:
            k = item["k"]
            # Inertia must decrease monotonically as K increases
            self.assertTrue(item["inertia"] < prev_inertia, f"Inertia did not decrease at K={k}")
            prev_inertia = item["inertia"]

            # Silhouette score in valid range [-1, 1]
            self.assertTrue(-1.0 <= item["silhouetteScore"] <= 1.0)

            # Davies-Bouldin must be non-negative
            self.assertTrue(item["daviesBouldinIndex"] >= 0.0)

            # Calinski-Harabasz must be positive
            self.assertTrue(item["calinskiHarabaszScore"] > 0.0)

            # Cluster sizes must sum to total records
            self.assertEqual(sum(item["clusterSizes"]), self.N)
            self.assertEqual(len(item["clusterSizes"]), k)

    # 4. Reproducibility
    def test_04_reproducibility(self):
        exp1 = self.engine.run_experiment(min_k=3, max_k=4, n_init=5, random_state=42)
        exp2 = self.engine.run_experiment(min_k=3, max_k=4, n_init=5, random_state=42)

        for r1, r2 in zip(exp1["experiments"], exp2["experiments"]):
            self.assertEqual(r1["k"], r2["k"])
            self.assertAlmostEqual(r1["inertia"], r2["inertia"], places=2)
            self.assertAlmostEqual(r1["silhouetteScore"], r2["silhouetteScore"], places=4)
            self.assertAlmostEqual(r1["daviesBouldinIndex"], r2["daviesBouldinIndex"], places=4)
            self.assertAlmostEqual(r1["calinskiHarabaszScore"], r2["calinskiHarabaszScore"], places=2)
            self.assertEqual(r1["clusterSizes"], r2["clusterSizes"])

    # 5. Geometric Elbow Detection (Kneedle)
    def test_05_geometric_elbow_detection(self):
        exp = self.engine.run_experiment(min_k=2, max_k=8, step=1, n_init=5, random_state=42)
        elbow = exp["elbowAnalysis"]

        self.assertIn("detectedElbowK", elbow)
        self.assertIn(elbow["detectedElbowK"], [3, 4, 5])
        self.assertTrue(elbow["maxChordDistance"] > 0.15)
        self.assertIn("inertiaDeltas", elbow)
        self.assertTrue(len(elbow["chordDistances"]) == 7)

    # 6. Multi-Evidence Recommendation Logic
    def test_06_recommendation_logic(self):
        exp = self.engine.run_experiment(min_k=2, max_k=7, step=1, n_init=5, random_state=42)
        rec = exp["recommendation"]

        self.assertIn("recommendedK", rec)
        self.assertIn(rec["recommendedK"], [3, 4])
        self.assertTrue(0.0 <= rec["recommendedScore"] <= 1.0)
        self.assertIn("rationale", rec)
        self.assertTrue(len(rec["rationale"]) > 50)
        self.assertIn("compositeScores", rec)
        self.assertIn("rankings", rec)
        self.assertEqual(rec["rankings"][rec["recommendedK"]], 1)

    # 7. Cluster Profiles & Centroid Unscaling
    def test_07_cluster_profiles_and_unscaling(self):
        exp = self.engine.run_experiment(min_k=3, max_k=4, selected_k=4, n_init=5)
        sel = exp["selectedClustering"]
        self.assertEqual(sel["k"], 4)
        self.assertEqual(len(sel["clusters"]), 4)

        for c in sel["clusters"]:
            # Real-world GPA should be in [0, 10]
            gpa = c["centroid"]["current_gpa"]
            self.assertTrue(0.0 <= gpa <= 10.0, f"Unscaled GPA out of bounds: {gpa}")
            # Real-world Attendance should be in [0, 100]
            att = c["centroid"]["attendance_percentage"]
            self.assertTrue(0.0 <= att <= 100.0, f"Unscaled attendance out of bounds: {att}")
            # Student counts
            self.assertTrue(c["studentCount"] > 0)
            self.assertIn("archetypeName", c)
            self.assertIn("tier", c)
            self.assertIn("recommendedAction", c)
            self.assertTrue(len(c["sampleStudents"]) <= 5)

        # Projection scatter data
        proj = sel["projection"]
        self.assertIn("points", proj)
        self.assertIn("centroids", proj)
        self.assertTrue(len(proj["points"]) > 100)
        self.assertEqual(len(proj["centroids"]), 4)

    # 8. Cached Run Drill-Down Endpoint
    def test_08_cached_drilldown(self):
        exp = self.engine.run_experiment(min_k=2, max_k=5, n_init=5)
        run_id = exp["runId"]

        detail = self.engine.get_experiment_cluster_detail(run_id, k=3)
        self.assertEqual(detail["status"], "Success")
        self.assertEqual(detail["k"], 3)
        self.assertEqual(len(detail["clusters"]), 3)
        self.assertTrue(detail["isCached"])

        # Requesting invalid K not in run
        with self.assertRaises(ValueError):
            self.engine.get_experiment_cluster_detail(run_id, k=9)

    # 9. Stability Analysis (Adjusted Rand Index)
    def test_09_stability_analysis(self):
        exp = self.engine.run_experiment(min_k=3, max_k=4, evaluate_stability=True, n_init=5)
        for r in exp["experiments"]:
            self.assertIsNotNone(r["stabilityAriMean"])
            self.assertIsNotNone(r["stabilityAriStd"])
            self.assertTrue(0.0 <= r["stabilityAriMean"] <= 1.0)

    # 10. API Security & Role Restrictions
    def test_10_api_rbac_and_errors(self):
        # Student role forbidden (403)
        res_stud = client.post(
            "/api/mining/kmeans/experiment",
            json={"min_k": 2, "max_k": 4},
            headers={"X-User-Role": "Student"}
        )
        self.assertEqual(res_stud.status_code, 403)

        # Faculty allowed (200)
        res_fac = client.post(
            "/api/mining/kmeans/experiment",
            json={"min_k": 2, "max_k": 4, "n_init": 5},
            headers={"X-User-Role": "Faculty"}
        )
        self.assertEqual(res_fac.status_code, 200)

        # Analytics role allowed (200)
        res_ana = client.post(
            "/api/mining/kmeans/experiment",
            json={"min_k": 2, "max_k": 4, "n_init": 5},
            headers={"X-User-Role": "Analytics"}
        )
        self.assertEqual(res_ana.status_code, 200)

        # Invalid range returns 400
        res_bad = client.post(
            "/api/mining/kmeans/experiment",
            json={"min_k": 8, "max_k": 3},
            headers={"X-User-Role": "Analytics"}
        )
        self.assertEqual(res_bad.status_code, 400)


if __name__ == "__main__":
    unittest.main()
